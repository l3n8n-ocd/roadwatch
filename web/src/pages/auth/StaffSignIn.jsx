import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Icon, PasswordField, TextField, Toast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { APK_URL, ROLES, homePathFor } from '../../lib/constants';
import AuthShell, { BackLink } from './AuthShell';
import { FORMS } from './staffForms';

// W1 Staff sign-in (#52). /staff/sign-in asks for the role first (Figma 465:17813, 390: 465:17862);
// /staff/sign-in/admin (121:5) and /staff/sign-in/officer (465:17927) show that role's form.
// The client sends platform "web". After a correct password the client compares the account's role with
// the chosen one; a mismatch shows the "Wrong role" state (465:17972) and keeps the user signed out.
// A Reporter account gets 403 WRONG_PLATFORM from the API, shown as "Mobile-only account" (321:15655).
// This page only routes: the API enforces roles and platforms on every request.
// "Forgot password?" opens the reset flow (#37, Figma 403:16262); after a reset the form shows the
// "Password changed" toast (403:16404).

// The role card to pick instead, when the account signed in on the other role's form (Figma 465:17972).
const OTHER_ROLE = {
  [ROLES.ADMIN]: { title: 'This is an Administrator account', pick: 'Administrator' },
  [ROLES.OFFICER]: { title: 'This is a Traffic Officer account', pick: 'Traffic Officer' },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StaffSignIn() {
  const { role } = useParams();
  const { user } = useAuth();

  // Already signed in: go straight to that account's home.
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  if (!role) return <ChooseRole />;
  if (!FORMS[role]) return <Navigate to="/staff/sign-in" replace />;
  // key: a fresh form (empty errors) when switching between the two roles.
  return <RoleForm key={role} formKey={role} form={FORMS[role]} />;
}

function ChooseRole() {
  const location = useLocation();
  return (
    <AuthShell
      title="Review, verify and close accident reports everywhere."
      mobileTitle="Review, verify and close accident reports."
      subtitle="Staff sign-in for administrators and traffic officers."
    >
      <BackLink to="/">Back to home</BackLink>
      <h1 className="type-h1 text-text-primary">Sign in to RoadWatch</h1>
      <p className="type-body text-text-muted">
        Choose your role first.<span className="max-sm:hidden"> You will only see the sign-in form for that role.</span>
      </p>

      <div role="group" aria-labelledby="staff-roles" className="flex flex-col gap-3">
        <p id="staff-roles" className="type-overline text-text-muted uppercase">
          Staff
        </p>
        <RoleOption
          to="/staff/sign-in/admin"
          state={location.state}
          icon="shield-check"
          title="Administrator"
          description="Manage accounts, review and verify reports, assign officers and export summaries."
          short="Accounts, verification, assignment, exports."
        />
        <RoleOption
          to="/staff/sign-in/officer"
          state={location.state}
          icon="car"
          title="Traffic Officer"
          description="See reports assigned to you, update the investigation status and add official remarks."
          short="Your assigned reports, status and remarks."
        />
      </div>

      <p className="type-body-sm text-text-muted">Reporters use the RoadWatch Android app.</p>
    </AuthShell>
  );
}

// One role card in the chooser: the whole card is a link to that role's form.
function RoleOption({ to, state, icon, title, description, short }) {
  return (
    <Link
      to={to}
      state={state}
      className="flex items-center gap-4 rounded-rw-md border border-border-control bg-surface-white p-4 text-text-primary no-underline transition-colors hover:bg-surface-light-gray"
    >
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-text-inverse">
        <Icon name={icon} size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="type-h3 max-sm:type-label">{title}</span>
        <span className="type-body-sm text-text-muted max-sm:hidden">{description}</span>
        <span className="type-body-sm text-text-muted sm:hidden">{short}</span>
      </span>
      <Icon name="chevron-right" size={20} />
    </Link>
  );
}

function RoleForm({ formKey, form }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // field messages
  const [banner, setBanner] = useState(null); // { title, body }
  const [changed, setChanged] = useState(Boolean(location.state?.passwordChanged)); // back from Forgot password
  const [mobileOnly, setMobileOnly] = useState(false); // a Reporter account
  const [wrongRole, setWrongRole] = useState(null); // role of a staff account that used the other form
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
    setChanged(false);
    setMobileOnly(false);
    setWrongRole(null);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.email ? 'staff-email' : 'staff-password')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const signedIn = await login(email.trim(), password, [form.role]);
      // Back to the page that asked for sign-in, when it belongs to this role's area.
      const from = location.state?.from?.pathname;
      const home = homePathFor(signedIn.role);
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.message === 'wrong-role') {
        setWrongRole(err.actualRole);
        return;
      }
      if (err.details?.code === 'WRONG_PLATFORM') {
        setMobileOnly(true);
        return;
      }
      // 403 ACCOUNT_DEACTIVATED comes only after the right password (issue #40); 401 is a wrong email or password.
      if (err.details?.code === 'ACCOUNT_DEACTIVATED') {
        setBanner({ title: 'Account deactivated', body: 'This account can no longer sign in. Contact a RoadWatch administrator.' });
      } else if (err.status === 401) {
        setErrors({ password: 'Check your password and try again.' });
        setBanner({ title: "Couldn't log in", body: 'Email or password is incorrect. Check both and try again.' });
      } else {
        setBanner({ title: "Couldn't log in", body: err.message });
      }
    }
  };

  const other = wrongRole && OTHER_ROLE[wrongRole];

  return (
    <AuthShell title={form.title} mobileTitle={form.mobileTitle} subtitle={form.subtitle}>
      <BackLink to="/staff/sign-in">Choose a different role</BackLink>
      <h1 className="type-h1 text-text-primary">{form.heading}</h1>
      <p className="type-body text-text-muted max-sm:hidden">{form.intro}</p>

      {changed && (
        <Toast type="success" title="Password changed" onClose={() => setChanged(false)} className="max-w-none!">
          Sign in with your new password.
        </Toast>
      )}

      {banner && (
        <Toast type="error" title={banner.title} onClose={() => setBanner(null)} className="max-w-none!">
          {banner.body}
        </Toast>
      )}

      {other && (
        <Toast type="error" title={other.title} onClose={() => setWrongRole(null)} className="max-w-none!">
          Go back with &quot;Choose a different role&quot; and pick {other.pick}.
        </Toast>
      )}

      {mobileOnly && (
        <>
          <Toast type="error" title="This account uses the mobile app" onClose={() => setMobileOnly(false)} className="max-w-none!">
            Reporter accounts sign in on the RoadWatch Android app.
          </Toast>
          <Button href={APK_URL} variant="secondary" icon="download" fullWidth>
            Get the Android app
          </Button>
        </>
      )}

      <form noValidate onSubmit={handleSubmit} aria-label={form.heading} className="flex flex-col gap-4 sm:gap-5">
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
        <PasswordField
          id="staff-password"
          label="Password"
          autoComplete="current-password"
          placeholder="At least 8 characters"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="-mt-2 flex justify-end">
          <Link
            to="/staff/forgot-password"
            state={{ email: email.trim(), role: formKey }}
            className="inline-flex min-h-11 items-center rounded-rw-sm type-label text-text-blue underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth disabled={submitting} className="max-sm:h-12">
          {submitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="type-body-sm text-text-muted">Reporters use the RoadWatch Android app.</p>
    </AuthShell>
  );
}
