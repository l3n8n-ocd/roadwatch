import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextField, Toast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ROLES, homePathFor } from '../../lib/constants';
import AuthShell, { BackLink, TextLink } from './AuthShell';

// R0b Reporter register (Figma 229:5922; messages from M0/Register/Validation 109:323).
// POST /auth/register always creates a Reporter (the API ignores any role). No email verification.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_IDS = { full_name: 'reg-name', contact_email: 'reg-email', contact_phone: 'reg-phone', password: 'reg-password' };

// The page that sent the reporter here (e.g. /report), never a sign-in page.
function returnPath(location) {
  const from = location.state?.from;
  if (!from?.pathname || ['/sign-in', '/register'].includes(from.pathname)) return '/my-reports';
  return `${from.pathname}${from.search || ''}`;
}

// Same rules as the API (api/src/routes/schemas.js), with friendlier messages.
function validate(values) {
  const errors = {};
  const name = values.full_name.trim();
  if (!name) errors.full_name = 'Enter your full name.';
  else if (name.length < 2) errors.full_name = 'Enter at least 2 characters.';
  else if (name.length > 100) errors.full_name = 'Use 100 characters or fewer.';

  const email = values.contact_email.trim();
  if (!email) errors.contact_email = 'Enter your email.';
  else if (!EMAIL_PATTERN.test(email) || email.length > 120) errors.contact_email = 'Enter a valid email, like juan@example.com.';

  if (values.contact_phone.trim().length > 20) errors.contact_phone = 'Use 20 characters or fewer.';

  if (!values.password) errors.password = 'Create a password of at least 8 characters.';
  else if (values.password.length < 8) errors.password = `Use at least 8 characters (${values.password.length} so far).`;
  return errors;
}

export default function ReporterRegister() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ full_name: '', contact_email: '', contact_phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === ROLES.REPORTER ? returnPath(location) : homePathFor(user.role)} replace />;
  }

  const change = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const found = validate(values);
    setErrors(found);
    setBanner('');
    const first = Object.keys(FIELD_IDS).find((field) => found[field]);
    if (first) {
      document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await register({
        full_name: values.full_name.trim(),
        contact_email: values.contact_email.trim(),
        contact_phone: values.contact_phone.trim() || undefined,
        password: values.password,
      });
      navigate(returnPath(location), { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err.status === 409) {
        setErrors({ contact_email: 'An account with this email already exists. Log in instead.' });
        document.getElementById(FIELD_IDS.contact_email)?.focus();
      } else {
        setBanner(err.message);
      }
    }
  };

  return (
    <AuthShell
      title="Saw a road accident? Report it in about 2 minutes."
      subtitle="Track every report until it is closed."
    >
      <BackLink to="/staff/sign-in">Choose a different role</BackLink>
      <h1 className="type-h1 text-text-primary">Create a reporter account</h1>
      <p className="type-body text-text-muted">
        For members of the public. Staff accounts are created by an administrator.
      </p>

      {banner && (
        <Toast type="error" title="Couldn't create your account" onClose={() => setBanner('')} className="max-w-none!">
          {banner}
        </Toast>
      )}

      <form noValidate onSubmit={handleSubmit} aria-label="Create a reporter account" className="flex flex-col gap-4 sm:gap-5">
        <TextField
          id={FIELD_IDS.full_name}
          label="Full name"
          icon="user"
          autoComplete="name"
          placeholder="e.g. Juan Dela Cruz"
          required
          maxLength={100}
          value={values.full_name}
          onChange={change('full_name')}
          error={errors.full_name}
        />
        <TextField
          id={FIELD_IDS.contact_email}
          label="Email"
          type="email"
          icon="mail"
          autoComplete="email"
          placeholder="juan.reporter@example.com"
          required
          value={values.contact_email}
          onChange={change('contact_email')}
          error={errors.contact_email}
        />
        <TextField
          id={FIELD_IDS.contact_phone}
          label="Mobile number"
          type="tel"
          icon="phone"
          autoComplete="tel"
          placeholder="09XX XXX XXXX"
          optional
          maxLength={20}
          value={values.contact_phone}
          onChange={change('contact_phone')}
          error={errors.contact_phone}
        />
        <TextField
          id={FIELD_IDS.password}
          label="Password"
          type="password"
          icon="lock"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={change('password')}
          helper="At least 8 characters."
          error={errors.password}
        />
        <Button type="submit" fullWidth disabled={submitting} className="max-sm:h-12">
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="flex flex-wrap items-baseline gap-x-1.5 type-body text-text-primary">
        Already have an account?
        <TextLink to="/sign-in" state={location.state}>
          Sign in
        </TextLink>
      </p>
      <p className="type-body-sm text-text-muted">No email verification. Your account is created as a Reporter.</p>
    </AuthShell>
  );
}
