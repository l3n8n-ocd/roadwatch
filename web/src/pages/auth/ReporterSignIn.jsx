import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextField, Toast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ROLES, homePathFor } from '../../lib/constants';
import AuthShell, { BackLink, TextLink } from './AuthShell';

// R0 Reporter sign-in (Figma 229:5883, #29). Public reporters only: a staff account is sent to
// the staff sign-in instead. After login the reporter returns to the page that asked for it
// (RequireRole passes it as location.state.from), otherwise to My reports.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The page that sent the reporter here (e.g. /report), never a sign-in page.
function returnPath(location) {
  const from = location.state?.from;
  if (!from?.pathname || ['/sign-in', '/register'].includes(from.pathname)) return '/my-reports';
  return `${from.pathname}${from.search || ''}`;
}

const STAFF_FORM = {
  [ROLES.ADMIN]: { to: '/staff/sign-in/admin', title: 'This is an Administrator account', page: 'Administrator sign-in' },
  [ROLES.OFFICER]: { to: '/staff/sign-in/officer', title: 'This is a Traffic Officer account', page: 'Traffic Officer sign-in' },
};

export default function ReporterSignIn() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [staffRole, setStaffRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === ROLES.REPORTER ? returnPath(location) : homePathFor(user.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = {};
    if (!email.trim()) found.email = 'Enter your email.';
    else if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Enter a valid email, like juan@example.com.';
    if (!password) found.password = 'Enter your password.';
    setErrors(found);
    setBanner(null);
    setStaffRole(null);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.email ? 'reporter-email' : 'reporter-password')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password, [ROLES.REPORTER]);
      navigate(returnPath(location), { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.message === 'wrong-role') {
        setStaffRole(err.actualRole);
        return;
      }
      if (err.status === 401) {
        setErrors({ password: 'Check your password and try again.' });
        setBanner({
          title: "Couldn't log in",
          body: `${err.message}. Deactivated accounts also can't log in; contact the RoadWatch administrator.`,
        });
      } else {
        setBanner({ title: "Couldn't log in", body: err.message });
      }
    }
  };

  const staff = staffRole && STAFF_FORM[staffRole];

  return (
    <AuthShell
      title="Saw a road accident? Report it in about 2 minutes."
      subtitle="Track every report until it is closed."
    >
      <BackLink to="/staff/sign-in">Choose a different role</BackLink>
      <h1 className="type-h1 text-text-primary">Reporter sign-in</h1>
      <p className="type-body text-text-muted">Sign in to report an accident and follow its status.</p>

      {banner && (
        <Toast type="error" title={banner.title} onClose={() => setBanner(null)} className="max-w-none!">
          {banner.body}
        </Toast>
      )}

      {staff && (
        <>
          <Toast type="error" title={staff.title} onClose={() => setStaffRole(null)} className="max-w-none!">
            Your email and password are correct, but this page is for members of the public. Use {staff.page}{' '}
            instead.
          </Toast>
          <Button to={staff.to} state={{ email }} variant="secondary" fullWidth>
            Go to {staff.page}
          </Button>
        </>
      )}

      <form noValidate onSubmit={handleSubmit} aria-label="Reporter sign-in" className="flex flex-col gap-4 sm:gap-5">
        <TextField
          id="reporter-email"
          label="Email"
          type="email"
          icon="mail"
          autoComplete="username"
          placeholder="juan.reporter@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          id="reporter-password"
          label="Password"
          type="password"
          icon="lock"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" fullWidth disabled={submitting} className="max-sm:h-12">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="flex flex-wrap items-baseline gap-x-1.5 type-body text-text-primary">
        New to RoadWatch?
        <TextLink to="/register" state={location.state}>
          Create an account
        </TextLink>
      </p>
      <p className="type-body-sm text-text-muted">
        Forgot your password? Contact the RoadWatch administrator from the About page.
      </p>
    </AuthShell>
  );
}
