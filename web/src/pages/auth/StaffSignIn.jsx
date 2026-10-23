import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextField, Toast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { APK_URL, homePathFor } from '../../lib/constants';
import AuthShell, { BackLink } from './AuthShell';

// W1 Administrator sign-in (Figma 121:5, error 121:57, 390: 121:126; #36). The web is for
// Administrators only. The client sends platform "web"; the API answers 403 WRONG_PLATFORM for a
// Reporter or Traffic Officer account, shown as the "Mobile-only account" state (321:15655).
// This page only routes: the API enforces roles and platforms on every request.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StaffSignIn() {
  const { user } = useAuth();
  // Already signed in: go straight to the dashboard.
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return <AdminForm />;
}

function AdminForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // field messages
  const [banner, setBanner] = useState(null); // { title, body }
  const [mobileOnly, setMobileOnly] = useState(false); // a Reporter or Traffic Officer account
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Enter your email.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email, like name@example.com.';
    if (!password) next.password = 'Enter your password.';
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    setBanner(null);
    setMobileOnly(false);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.email ? 'staff-email' : 'staff-password')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const signedIn = await login(email.trim(), password);
      navigate(location.state?.from?.pathname || homePathFor(signedIn.role), { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.details?.code === 'WRONG_PLATFORM') {
        setMobileOnly(true);
        return;
      }
      // 403 ACCOUNT_DEACTIVATED comes only after the right password (issue #40); 401 is a wrong email or password.
      if (err.details?.code === 'ACCOUNT_DEACTIVATED') {
        setBanner({ title: 'Account deactivated', body: 'This account can no longer sign in. Contact another RoadWatch administrator.' });
      } else if (err.status === 401) {
        setErrors({ password: 'Check your password and try again.' });
        setBanner({ title: "Couldn't log in", body: 'Email or password is incorrect. Check both and try again.' });
      } else {
        setBanner({ title: "Couldn't log in", body: err.message });
      }
    }
  };

  return (
    <AuthShell
      title="Review, verify and assign accident reports everywhere."
      mobileTitle="Review, verify and assign accident reports."
      subtitle="Administrator console"
    >
      <BackLink to="/">Back to home</BackLink>
      <h1 className="type-h1 text-text-primary">Administrator sign-in</h1>
      <p className="type-body text-text-muted max-sm:hidden">Use the email registered for your administrator account.</p>

      {banner && (
        <Toast type="error" title={banner.title} onClose={() => setBanner(null)} className="max-w-none!">
          {banner.body}
        </Toast>
      )}

      {mobileOnly && (
        <>
          <Toast type="error" title="This account uses the mobile app" onClose={() => setMobileOnly(false)} className="max-w-none!">
            Reporter and Traffic Officer accounts sign in on the RoadWatch Android app.
          </Toast>
          <Button href={APK_URL} variant="secondary" icon="download" fullWidth>
            Get the Android app
          </Button>
        </>
      )}

      <form noValidate onSubmit={handleSubmit} aria-label="Administrator sign-in" className="flex flex-col gap-4 sm:gap-5">
        <TextField
          id="staff-email"
          label="Email"
          type="email"
          icon="user"
          autoComplete="username"
          placeholder="you@roadwatch.example"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          id="staff-password"
          label="Password"
          type="password"
          icon="lock"
          autoComplete="current-password"
          placeholder="At least 8 characters"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" fullWidth disabled={submitting} className="max-sm:h-12">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="type-body-sm text-text-muted">Forgot your password? Ask the RoadWatch administrator to reset it.</p>
      <p className="type-body-sm text-text-muted">
        Reporters and Traffic Officers sign in on the RoadWatch Android app. This website is for administrators only.
      </p>
    </AuthShell>
  );
}
