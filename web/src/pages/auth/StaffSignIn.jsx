import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Icon, TextField, Toast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ROLES, homePathFor } from '../../lib/constants';
import AuthShell, { BackLink } from './AuthShell';

// W1 Staff sign-in (#28). /staff/sign-in shows the role chooser (Figma 225:5910, 390: 226:5877);
// /staff/sign-in/admin and /staff/sign-in/officer show that role's form (121:5, 225:5796).
// After login the client checks the role; a mismatch shows the "Wrong role" state (225:5832).
// This is only a routing aid: the API enforces roles on every endpoint.

const FORMS = {
  admin: {
    role: ROLES.ADMIN,
    heading: 'Administrator sign-in',
    intro: 'Use the email registered for your administrator account.',
    title: 'Review, verify and assign accident reports everywhere.',
    mobileTitle: 'Review, verify and assign accident reports.',
    subtitle: 'Administrator console',
    audience: 'administrators',
  },
  officer: {
    role: ROLES.OFFICER,
    heading: 'Traffic Officer sign-in',
    intro: 'Use the email your administrator registered for you.',
    title: 'See the reports assigned to you and record what you find on site.',
    mobileTitle: 'See your assigned reports and record what you find.',
    subtitle: 'Traffic Officer console',
    audience: 'traffic officers',
  },
};

// Where to send an account that signed in on the wrong form (Figma 225:5832).
const RIGHT_FORM = {
  [ROLES.ADMIN]: { to: '/staff/sign-in/admin', title: 'This is an Administrator account', page: 'Administrator sign-in' },
  [ROLES.OFFICER]: { to: '/staff/sign-in/officer', title: 'This is a Traffic Officer account', page: 'Traffic Officer sign-in' },
  [ROLES.REPORTER]: { to: '/sign-in', title: 'This is a Reporter account', page: 'Reporter sign-in' },
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
  return <RoleForm key={role} form={FORMS[role]} />;
}

function ChooseRole() {
  return (
    <AuthShell
      title="Report, verify and close accident reports everywhere."
      mobileTitle="Report, verify and close accident reports."
      subtitle="One sign-in page for every RoadWatch account."
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
          icon="shield-check"
          title="Administrator"
          description="Manage accounts, review and verify reports, assign officers and export summaries."
          short="Accounts, verification, assignment, exports."
        />
        <RoleOption
          to="/staff/sign-in/officer"
          icon="car"
          title="Traffic Officer"
          description="See reports assigned to you, update the investigation status and add official remarks."
          short="Your assigned reports, status and remarks."
        />
      </div>

      <hr className="border-border-subtle" />

      <div className="flex flex-col gap-2">
        <p className="type-label text-text-primary">Reporting an accident?</p>
        <p className="type-body-sm text-text-muted max-sm:hidden">
          Members of the public sign in or create an account here.
        </p>
        <Button to="/sign-in" variant="secondary" icon="user" fullWidth className="max-sm:h-12">
          Reporter sign-in or register
        </Button>
      </div>
    </AuthShell>
  );
}

// One role card in the chooser: the whole card is a link to that role's form.
function RoleOption({ to, icon, title, description, short }) {
  return (
    <Link
      to={to}
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

function RoleForm({ form }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // field messages
  const [banner, setBanner] = useState(null); // { title, body } from the API
  const [wrongRole, setWrongRole] = useState(null); // role of the account that signed in
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
    setWrongRole(null);
    if (Object.keys(found).length > 0) {
      document.getElementById(found.email ? 'staff-email' : 'staff-password')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const signedIn = await login(email.trim(), password, [form.role]);
      navigate(homePathFor(signedIn.role), { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.message === 'wrong-role') {
        setWrongRole(err.actualRole);
        return;
      }
      // 401 covers a wrong email or password and a deactivated account (same message on purpose).
      if (err.status === 401) {
        setErrors({ password: 'Check your password and try again.' });
        setBanner({
          title: "Couldn't log in",
          body: `${err.message}. Deactivated accounts also can't log in; contact your administrator.`,
        });
      } else {
        setBanner({ title: "Couldn't log in", body: err.message });
      }
    }
  };

  const right = wrongRole && RIGHT_FORM[wrongRole];

  return (
    <AuthShell title={form.title} mobileTitle={form.mobileTitle} subtitle={form.subtitle}>
      <BackLink to="/staff/sign-in">Choose a different role</BackLink>
      <h1 className="type-h1 text-text-primary">{form.heading}</h1>
      <p className="type-body text-text-muted max-sm:hidden">{form.intro}</p>

      {banner && (
        <Toast type="error" title={banner.title} onClose={() => setBanner(null)} className="max-w-none!">
          {banner.body}
        </Toast>
      )}

      {right && (
        <>
          <Toast type="error" title={right.title} onClose={() => setWrongRole(null)} className="max-w-none!">
            Your email and password are correct, but this page is for {form.audience}. Use {right.page} instead.
          </Toast>
          <Button to={right.to} state={{ email }} variant="secondary" fullWidth>
            Go to {right.page}
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
    </AuthShell>
  );
}
