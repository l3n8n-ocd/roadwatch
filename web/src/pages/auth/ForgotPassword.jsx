import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, PasswordField, TextField, Toast } from '../../components/ui';
import { auth } from '../../api/endpoints';
import AuthShell from './AuthShell';
import { NOT_STRONG, isStrong } from '../../lib/passwordStrength';

// W1 Forgot password (#37, DECISIONS #43): 1 Enter email (Figma 403:16262), 2 Enter code
// (403:16316, 390: 403:16479), then back on sign-in with "Password changed" (403:16404).
// The API answers step 1 the same way whether or not the email has an account, so this page never
// says whether an account exists. Reporters and Traffic Officers reset in the Android app.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const firstError = (value) => (Array.isArray(value) ? value[0] : value);

export default function ForgotPassword() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [step, setStep] = useState('email'); // 'email' | 'code'

  return (
    <AuthShell
      title="Review, verify and assign accident reports everywhere."
      mobileTitle="Review, verify and assign accident reports."
      subtitle="Administrator console"
    >
      {step === 'email' ? (
        <EmailStep email={email} setEmail={setEmail} onSent={() => setStep('code')} />
      ) : (
        <CodeStep email={email} />
      )}
    </AuthShell>
  );
}

function EmailStep({ email, setEmail, onSent }) {
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError(value ? 'Enter a valid email, like name@example.com.' : 'Enter your email.');
      document.getElementById('forgot-email')?.focus();
      return;
    }
    setError('');
    setBanner('');
    setBusy(true);
    try {
      await auth.forgotPassword(value);
      onSent();
    } catch (err) {
      setBusy(false);
      if (err.details?.contact_email) setError(firstError(err.details.contact_email));
      else setBanner(err.message);
    }
  };

  return (
    <>
      <h1 className="type-h1 text-text-primary">Reset your password</h1>
      <p className="type-body text-text-muted">
        Enter the email of your administrator account. We'll email you an 8-character code that works for 15 minutes.
      </p>
      {banner && (
        <Toast type="error" title="Couldn't send the code" onClose={() => setBanner('')} className="max-w-none!">
          {banner}
        </Toast>
      )}
      <form noValidate onSubmit={submit} aria-label="Reset your password" className="flex flex-col gap-4 sm:gap-5">
        <TextField
          id="forgot-email"
          label="Email"
          type="email"
          icon="user"
          autoComplete="username"
          placeholder="you@roadwatch.example"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <Button type="submit" fullWidth disabled={busy} className="max-sm:h-12">
          {busy ? 'Sending…' : 'Send code'}
        </Button>
      </form>
      <Link to="/staff/sign-in" className="inline-flex min-h-11 items-center self-start rounded-rw-sm type-label text-text-blue underline underline-offset-2">
        Back to sign-in
      </Link>
      <p className="type-body-sm text-text-muted">
        For your privacy, RoadWatch shows the same message whether or not this email has an account. Reporters and
        Traffic Officers reset their password in the Android app.
      </p>
    </>
  );
}

function CodeStep({ email }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ code: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type, title, body }
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!form.code.trim()) found.code = 'Enter the code from the email.';
    // #44: the new password must be Strong (the API refuses anything else).
    if (!isStrong(form.password, { email })) found.password = NOT_STRONG;
    if (form.confirm !== form.password) found.confirm = "Passwords don't match.";
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const found = validate();
    setErrors(found);
    setBanner(null);
    if (Object.keys(found).length) {
      document.getElementById(`reset-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await auth.resetPassword({ contact_email: email.trim(), reset_code: form.code, new_password: form.password });
      navigate('/staff/sign-in', { replace: true, state: { email: email.trim(), passwordChanged: true } });
    } catch (err) {
      setBusy(false);
      const d = err.details || {};
      if (d.reset_code || d.new_password) {
        setErrors({ code: firstError(d.reset_code), password: firstError(d.new_password) });
        document.getElementById(d.reset_code ? 'reset-code' : 'reset-password')?.focus();
      } else {
        setBanner({ type: 'error', title: "Couldn't change the password", body: err.message });
      }
    }
  };

  const resend = async () => {
    if (resending) return;
    setResending(true);
    setBanner(null);
    try {
      await auth.forgotPassword(email.trim());
      // Figma W1/Forgot password/2 New code sent (419:40475): the code field is empty for the new code.
      setForm((f) => ({ ...f, code: '' }));
      setErrors((e) => ({ ...e, code: undefined }));
      setBanner({ type: 'success', title: 'New code sent', body: 'Use the newest code. It works for 15 minutes.' });
    } catch (err) {
      setBanner({ type: 'error', title: "Couldn't send the code", body: err.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <h1 className="type-h1 text-text-primary">Enter the code</h1>
      <p className="type-body text-text-muted">
        If {email.trim()} has an account, we sent it a code. Check your inbox and spam folder.
      </p>
      {banner && (
        <Toast type={banner.type} title={banner.title} onClose={() => setBanner(null)} className="max-w-none!">
          {banner.body}
        </Toast>
      )}
      <form noValidate onSubmit={submit} aria-label="Enter the code" className="flex flex-col gap-4 sm:gap-5">
        <TextField
          id="reset-code"
          label="Code"
          icon="shield-check"
          required
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          placeholder="8 letters and digits"
          value={form.code}
          onChange={set('code')}
          helper="8 letters and digits, from the email."
          error={errors.code}
        />
        <PasswordField
          id="reset-password"
          label="New password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          showStrength
          person={{ email }}
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        <Button type="submit" fullWidth disabled={busy} className="max-sm:h-12">
          {busy ? 'Saving…' : 'Change password'}
        </Button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="inline-flex min-h-11 items-center self-start rounded-rw-sm type-label text-text-blue underline underline-offset-2 disabled:text-text-muted"
      >
        {resending ? 'Sending a new code…' : "Didn't get the code? Send a new one"}
      </button>
    </>
  );
}
