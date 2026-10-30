import { useState } from 'react';
import { Button, Dialog, PasswordField, TextField } from '../components/ui';
import { auth } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { HOTLINES } from '../lib/constants';
import { NOT_STRONG, isStrong } from '../lib/passwordStrength';

// Dialogs opened from the user menu. Edit profile (PATCH /auth/me) and Change password
// (PATCH /auth/me/password), DECISIONS #25: any API error is shown inline so the user knows
// nothing was saved.

function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-rw-sm bg-surface-danger-subtle px-4 py-3 type-body-sm text-text-danger">
      {children}
    </p>
  );
}

function apiErrorText(err) {
  if (err?.status === 404) return 'This feature is not available on the server yet. Nothing was saved.';
  return err?.message || 'Something went wrong. Please try again.';
}

// A 400 from the API puts the message for each field in err.details ({ current_password: ['...'] }).
// Returns them under the form's own field names, e.g. { current: 'Your current password is incorrect.' } (issue #43).
function fieldErrorsFrom(err, fieldsByApiName) {
  const found = {};
  Object.entries(fieldsByApiName).forEach(([apiName, field]) => {
    const message = err?.details?.[apiName];
    if (Array.isArray(message) && message[0]) found[field] = message[0];
  });
  return found;
}

export function EditProfileDialog({ open, onClose, onSaved }) {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.contact_phone || '');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setFullName(user?.full_name || '');
    setPhone(user?.contact_phone || '');
    setNameError('');
    setPhoneError('');
    setApiError('');
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setNameError('Enter your full name.');
      return;
    }
    setNameError('');
    setPhoneError('');
    setApiError('');
    setBusy(true);
    try {
      const body = { full_name: fullName.trim(), contact_phone: phone.trim() || null };
      const updated = await auth.updateMe(body);
      setUser((current) => ({ ...current, ...body, ...(updated?.user || updated || {}) }));
      onSaved?.('Profile updated.');
      onClose();
    } catch (err) {
      const found = fieldErrorsFrom(err, { full_name: 'name', contact_phone: 'phone' });
      if (found.name || found.phone) {
        setNameError(found.name || '');
        setPhoneError(found.phone || '');
      } else {
        setApiError(apiErrorText(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Edit profile"
      actions={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Full name"
          icon="user"
          required
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={nameError}
        />
        <TextField
          label="Email"
          required
          disabled
          value={user?.contact_email || ''}
          helper="Your login email can't be changed here. Ask the administrator."
        />
        <TextField
          label="Mobile number"
          optional
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          helper="Only admins and your assigned officer can see it."
          error={phoneError}
        />
        <ErrorMessage>{apiError}</ErrorMessage>
      </form>
    </Dialog>
  );
}

export function ChangePasswordDialog({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const person = { name: user?.full_name, email: user?.contact_email };
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const close = () => {
    setForm({ current: '', next: '', confirm: '' });
    setErrors({});
    setApiError('');
    onClose();
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!form.current) found.current = 'Enter your current password.';
    // #44: the new password must be Strong (the API refuses anything else).
    if (!isStrong(form.next, person)) found.next = NOT_STRONG;
    if (form.confirm !== form.next) found.confirm = "Passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setApiError('');
    setBusy(true);
    try {
      await auth.changePassword({ current_password: form.current, new_password: form.next });
      onSaved?.('Password changed.');
      close();
    } catch (err) {
      const found = fieldErrorsFrom(err, { current_password: 'current', new_password: 'next' });
      if (Object.keys(found).length > 0) setErrors(found);
      else setApiError(apiErrorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Change password"
      description="After a change you stay signed in on this device."
      actions={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField
          label="Current password"
          required
          autoComplete="current-password"
          value={form.current}
          onChange={update('current')}
          error={errors.current}
        />
        <PasswordField
          label="New password"
          required
          autoComplete="new-password"
          value={form.next}
          onChange={update('next')}
          error={errors.next}
          showStrength
          person={person}
        />
        <PasswordField
          label="Confirm new password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
        />
        <ErrorMessage>{apiError}</ErrorMessage>
      </form>
    </Dialog>
  );
}

// Contact support: RoadWatch has no help desk; the system administrator handles accounts.
export function ContactSupportDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Contact support"
      description="RoadWatch accounts are managed by the system administrator. Contact them for a forgotten password, a deactivated account or details you cannot change yourself."
      actions={<Button onClick={onClose}>Close</Button>}
    >
      <p className="type-body text-text-primary">
        To report an emergency, do not wait for RoadWatch: call{' '}
        <a href={HOTLINES.emergency.tel} className="type-button text-text-blue underline">
          {HOTLINES.emergency.number}
        </a>
        .
      </p>
    </Dialog>
  );
}

// About (reporter web): the staff About page (W9) is staff-only, so reporters get the essentials here.
export function AboutDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="About RoadWatch"
      description="RoadWatch lets the public report road accidents with location and photos, and lets administrators and traffic officers verify, assign and close each report."
      actions={<Button onClick={onClose}>Close</Button>}
    >
      <ul className="flex list-disc flex-col gap-2 pl-5 type-body-sm text-text-primary">
        <li>Reporter contact details are visible only to the reporter, administrators and the officer assigned to the report.</li>
        <li>Passwords are stored hashed. RoadWatch never shows or emails them.</li>
        <li>Map data © OpenStreetMap contributors.</li>
      </ul>
    </Dialog>
  );
}
