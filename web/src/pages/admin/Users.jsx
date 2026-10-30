import { useCallback, useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  Icon,
  PasswordField,
  Radio,
  Select,
  Skeleton,
  Tabs,
  TextField,
  Toast,
} from '../../components/ui';
import { tabPanelProps } from '../../lib/tabs';
import { admin, lookups, users } from '../../api/endpoints';
import useServerError from '../../lib/useServerError';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';
import { NOT_STRONG, isStrong } from '../../lib/passwordStrength';
import { cx } from '../../lib/cx';

// W6 Users & settings (Figma 128:2944, after deactivation 128:3348; v1.2.0 toolbar 528:22568, no selection 528:23244).
// #55: one toolbar with + Create officer and Edit; no buttons in the rows. Select an account (radio), then Edit opens
// one dialog (529:23706; own account 529:23828) with name, phone, role, Reset password and Deactivate/Reactivate.
// Create officer opens a dialog (529:23958).
// v1.2.1 (Figma 564:27407, phone 568:29575): Accounts, Accident types and Nearby officers (#57 alert range) are tabs;
// Accounts is the default, and the open tab is kept in the address (?tab=types or ?tab=nearby).
// Reset password (#37, dialog 404:16418, toast 404:16490): Reporters and Traffic Officers only.
// An administrator cannot change or deactivate their own account (#16); the API also refuses it.

const ROLE_OPTIONS = [ROLES.REPORTER, ROLES.ADMIN, ROLES.OFFICER].map((r) => ({ value: r, label: r }));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTIONS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'types', label: 'Accident types' },
  { id: 'nearby', label: 'Nearby officers' },
];

function Card({ titleId, title, className = '', children, aside, guide }) {
  return (
    <section
      data-guide={guide}
      aria-labelledby={titleId}
      className={cx('flex min-w-0 flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6', className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={titleId} className="type-h3 text-text-primary">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ActiveStatus({ active }) {
  return (
    <span className="inline-flex items-center gap-2 type-label text-text-primary">
      <Icon
        name={active ? 'check-circle' : 'user-x'}
        size={20}
        className={active ? 'text-text-success' : 'text-text-danger'}
      />
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}

// ---------- accounts ----------

// Edit account (#55): name and phone (PATCH /users/:id), role (PATCH /users/:id/role), and the account actions.
// Own account: name and phone only. Another administrator: no Reset password (they use Forgot password).
function EditAccountDialog({ user, isSelf, onClose, onSaved, onResetPassword, onDeactivate, onReactivate, busy }) {
  const [form, setForm] = useState({ full_name: user.full_name, contact_phone: user.contact_phone || '', role: user.role });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const canReset = !isSelf && user.role !== ROLES.ADMIN && user.is_active;

  const save = async (event) => {
    event.preventDefault();
    const name = form.full_name.trim();
    if (name.length < 2) {
      setErrors({ full_name: 'Enter the full name (2 characters or more).' });
      document.getElementById('edit-full_name')?.focus();
      return;
    }
    setSaving(true);
    setError('');
    try {
      const phone = form.contact_phone.trim() || null;
      const changes = {};
      if (name !== user.full_name || phone !== (user.contact_phone || null)) {
        await users.update(user.user_id, { full_name: name, contact_phone: phone });
        Object.assign(changes, { full_name: name, contact_phone: phone });
      }
      if (!isSelf && form.role !== user.role) {
        await users.setRole(user.user_id, form.role);
        changes.role = form.role;
      }
      onSaved(user, changes);
    } catch (err) {
      if (err.details) {
        const mapped = {};
        Object.entries(err.details).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit account: ${user.full_name}`}
      description={
        isSelf
          ? 'This is your own account. You can change your name and phone here; your role and access can only be changed by another administrator.'
          : `${user.contact_email} · ${user.role}. Changes are saved to the action log.`
      }
    >
      <form noValidate onSubmit={save} className="flex flex-col gap-4">
        <TextField
          id="edit-full_name"
          label="Full name"
          required
          icon="user"
          autoComplete="off"
          value={form.full_name}
          onChange={set('full_name')}
          error={errors.full_name}
          data-autofocus
        />
        <TextField
          id="edit-contact_phone"
          label="Mobile number"
          optional
          type="tel"
          autoComplete="off"
          placeholder="09XX XXX XXXX"
          value={form.contact_phone}
          onChange={set('contact_phone')}
          error={errors.contact_phone}
        />
        <Select label="Role" required disabled={isSelf} value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />
        <div className="flex flex-col gap-2">
          <p className="type-body-sm text-text-muted">
            {isSelf
              ? 'Reset password and Deactivate aren’t available for your own account.'
              : user.role === ROLES.ADMIN && user.is_active
                ? 'Account actions · Administrators reset their own password with Forgot password.'
                : 'Account actions'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              icon="lock"
              disabled={!canReset}
              onClick={() => onResetPassword(user)}
              className="max-sm:min-w-0 max-sm:flex-1"
            >
              Reset password
            </Button>
            {user.is_active || isSelf ? (
              <Button
                variant="destructive"
                icon="user-x"
                disabled={isSelf}
                onClick={() => onDeactivate(user)}
                className="max-sm:min-w-0 max-sm:flex-1"
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon="refresh"
                disabled={busy}
                onClick={() => onReactivate(user)}
                className="max-sm:min-w-0 max-sm:flex-1"
              >
                Reactivate
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="type-body-sm text-text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// Admin reset (#37): a temporary password the administrator gives to the person directly. The API
// emails the person that the password was reset, never the password itself.
function ResetPasswordDialog({ user, onClose, onSaved }) {
  const firstName = user.full_name.split(' ')[0];
  const person = { name: user.full_name, email: user.contact_email };
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();
    const found = {};
    // #44: a temporary password must be Strong too (the API refuses anything else).
    if (!isStrong(form.password, person)) found.password = NOT_STRONG;
    if (form.confirm !== form.password) found.confirm = "Passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(found.password ? 'reset-password' : 'reset-confirm')?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await users.resetPassword(user.user_id, form.password);
      onSaved(user);
    } catch (err) {
      if (err.details?.new_password) setErrors({ password: [].concat(err.details.new_password)[0] });
      else setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset the password for ${user.full_name}?`}
      description={`Type a temporary password and give it to ${firstName} in person or by phone. RoadWatch emails ${firstName} that the password was reset, without the password.`}
    >
      <form noValidate onSubmit={save} className="flex flex-col gap-4">
        <PasswordField
          id="reset-password"
          label="Temporary password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          helper={`Ask ${firstName} to change it after logging in.`}
          error={errors.password}
          showStrength
          person={person}
          data-autofocus
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm temporary password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
        {error && (
          <p role="alert" className="type-body-sm text-text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={busy} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            {busy ? 'Saving…' : 'Reset password'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ---------- create officer ----------

const EMPTY_FORM = { full_name: '', contact_email: '', contact_phone: '', password: '', role: ROLES.OFFICER };

function validate(form) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = 'Enter the officer’s full name.';
  if (!EMAIL_RE.test(form.contact_email.trim())) errors.contact_email = 'Enter a valid email address.';
  if (!isStrong(form.password, { name: form.full_name, email: form.contact_email })) errors.password = NOT_STRONG;
  return errors;
}

function CreateOfficerDialog({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      document.getElementById(`officer-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const body = {
        full_name: form.full_name.trim(),
        contact_email: form.contact_email.trim(),
        password: form.password,
        role: form.role,
        ...(form.contact_phone.trim() ? { contact_phone: form.contact_phone.trim() } : {}),
      };
      const created = await users.create(body);
      setForm(EMPTY_FORM);
      onCreated(created || body);
    } catch (err) {
      if (err.status === 409) setErrors({ contact_email: err.message });
      else if (err.details) {
        const mapped = {};
        Object.entries(err.details).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Create officer account"
      description="The new Traffic Officer signs in with this email and the temporary password, then changes it."
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          id="officer-full_name"
          data-autofocus
          label="Full name"
          required
          icon="user"
          autoComplete="off"
          placeholder="e.g. Ana Reyes"
          value={form.full_name}
          onChange={set('full_name')}
          error={errors.full_name}
        />
        <TextField
          id="officer-contact_email"
          label="Email"
          required
          type="email"
          autoComplete="off"
          placeholder="name@roadwatch.example"
          value={form.contact_email}
          onChange={set('contact_email')}
          error={errors.contact_email}
        />
        <TextField
          id="officer-contact_phone"
          label="Mobile number"
          optional
          type="tel"
          autoComplete="off"
          placeholder="09XX XXX XXXX"
          value={form.contact_phone}
          onChange={set('contact_phone')}
          error={errors.contact_phone}
        />
        <PasswordField
          id="officer-password"
          label="Temporary password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set('password')}
          helper="Share it privately; the officer should change it."
          error={errors.password}
          showStrength
          person={{ name: form.full_name, email: form.contact_email }}
        />
        <Select
          id="officer-role"
          label="Role"
          required
          value={form.role}
          onChange={set('role')}
          options={[{ value: ROLES.OFFICER, label: ROLES.OFFICER }]}
          error={errors.role}
        />
        {formError && (
          <p role="alert" className="flex items-start gap-2 type-body-sm text-text-danger">
            <Icon name="alert-circle" size={16} className="mt-0.5" />
            {formError}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            Cancel
          </Button>
          <Button type="submit" icon="plus" disabled={busy} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ---------- accident types ----------

function AccidentTypesCard({ onAdded }) {
  const [types, setTypes] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    lookups
      .accidentTypes()
      .then((list) => setTypes(list || []))
      .catch((err) => setLoadError(err.message));
  }, []);

  const add = async (event) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setError('Enter a type name.');
      return;
    }
    if (types?.some((t) => t.type_name.toLowerCase() === value.toLowerCase())) {
      setError('This type already exists.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await admin.addAccidentType(value);
      setTypes((list) => [...(list || []), created || { type_id: Date.now(), type_name: value }]);
      setName('');
      onAdded(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card titleId="types-title" title="Accident types">
      {loadError ? (
        <p role="alert" className="type-body-sm text-text-danger">
          Could not load accident types. {loadError}
        </p>
      ) : !types ? (
        <p className="type-body-sm text-text-muted" aria-busy="true">
          Loading accident types…
        </p>
      ) : (
        <ul aria-labelledby="types-title" className="flex flex-col">
          {types.map((t) => (
            <li key={t.type_id} className="border-b border-border-subtle py-3 type-body text-text-primary">
              {t.type_name}
            </li>
          ))}
        </ul>
      )}
      <form noValidate onSubmit={add} className="flex flex-col gap-4">
        <TextField
          label="New type"
          placeholder="e.g. Motorcycle skid"
          value={name}
          maxLength={60}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          helper="Types can be added, not removed, so older reports keep their category."
          error={error}
        />
        <Button type="submit" variant="secondary" icon="plus" disabled={busy} className="self-start">
          {busy ? 'Adding…' : 'Add type'}
        </Button>
      </form>
    </Card>
  );
}

// ---------- nearby officers (#57) ----------

function NearbyOfficersCard({ onSaved }) {
  const [saved, setSaved] = useState(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    admin
      .settings()
      .then((s) => {
        setSaved(s.alert_range_km);
        setValue(String(s.alert_range_km));
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    const km = Number(value);
    if (!Number.isFinite(km) || km < 0.5 || km > 50) {
      setError('Enter a range from 0.5 to 50 km.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const s = await admin.updateSettings({ alert_range_km: km });
      setSaved(s.alert_range_km);
      setValue(String(s.alert_range_km));
      onSaved(s.alert_range_km);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card titleId="nearby-title" title="Nearby officers" guide="nearby-range">
      <p className="type-body text-text-muted">
        When a report comes in, up to 3 nearest on-duty officers within this range are alerted. The first to respond
        confirms it on scene. If nobody responds in 10 minutes, the report comes to you to verify and assign.
      </p>
      {loadError ? (
        <p role="alert" className="type-body-sm text-text-danger">
          Could not load the alert range. {loadError}
        </p>
      ) : (
        <form noValidate onSubmit={save} className="flex flex-col gap-4">
          <TextField
            label="Alert range (km)"
            type="number"
            inputMode="decimal"
            min="0.5"
            max="50"
            step="0.5"
            disabled={saved == null}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
            helper="Straight-line distance from the report’s pin."
            error={error}
          />
          <Button type="submit" variant="secondary" icon="check" disabled={busy || saved == null || Number(value) === saved} className="self-start">
            {busy ? 'Saving…' : 'Save range'}
          </Button>
        </form>
      )}
    </Card>
  );
}

// ---------- page ----------

export default function Users() {
  const { user: me } = useAuth();
  const selfNoteId = useId();
  const [roleFilter, setRoleFilter] = useState('');
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const raiseServerError = useServerError();
  const [params, setParams] = useSearchParams();
  const tab = SECTIONS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'accounts';
  const setTab = (id) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === 'accounts') next.delete('tab');
        else next.set('tab', id);
        return next;
      },
      { replace: true },
    );

  const load = useCallback(() => {
    setLoadError(null);
    users
      .list(roleFilter ? { role: roleFilter } : undefined)
      .then((rows) => setList(rows || []))
      .catch((err) => !raiseServerError(err) && setLoadError(err));
  }, [roleFilter, raiseServerError]);

  useEffect(load, [load]);

  const isSelf = (u) => me && u.user_id === me.user_id;
  const selected = list?.find((u) => u.user_id === selectedId) || null;
  const updateRow = (id, patch) => setList((rows) => rows.map((r) => (r.user_id === id ? { ...r, ...patch } : r)));

  const deactivate = async () => {
    const target = deactivateTarget;
    setBusyId(target.user_id);
    setActionError('');
    try {
      await users.setActive(target.user_id, false);
      updateRow(target.user_id, { is_active: false });
      setDeactivateTarget(null);
      setEditing(false);
      setToast({
        title: `${target.full_name} deactivated`,
        body: 'They can no longer log in. Their reports and history are kept. Reactivate any time.',
      });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const reactivate = async (target) => {
    setBusyId(target.user_id);
    try {
      await users.setActive(target.user_id, true);
      updateRow(target.user_id, { is_active: true });
      setEditing(false);
      setToast({ title: `${target.full_name} reactivated`, body: 'They can log in again.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Could not reactivate', body: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: 'select',
      header: <span className="sr-only">Select</span>,
      className: 'w-14',
      // The table and the phone list each get their own radio group (both are in the page, one is hidden).
      render: (u, group = 'account') => (
        <Radio
          name={group}
          checked={selectedId === u.user_id}
          onChange={() => setSelectedId(u.user_id)}
          label={`Select ${u.full_name}`}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      className: 'min-w-[220px]',
      render: (u) => (
        <div className="flex flex-col gap-0.5 py-2">
          <span className="type-label text-text-primary">
            {u.full_name}
            {isSelf(u) && ' (you)'}
          </span>
          <span className="type-body-sm break-all text-text-muted">{u.contact_email}</span>
        </div>
      ),
    },
    { key: 'role', header: 'Role', className: 'whitespace-nowrap' },
    { key: 'status', header: 'Status', className: 'whitespace-nowrap', render: (u) => <ActiveStatus active={u.is_active} /> },
  ];

  const count = list?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <h1 className="type-h1 text-text-primary">Users and settings</h1>

      <Tabs
        label="Users and settings sections"
        tabs={SECTIONS}
        value={tab}
        onChange={setTab}
        idPrefix="users"
        data-guide="users-tabs"
        className="-mt-2"
      />

      {toast && (
        <Toast type={toast.type || 'success'} title={toast.title} onClose={() => setToast(null)} className="max-w-[400px]">
          {toast.body}
        </Toast>
      )}

      {tab === 'accounts' && (
        <div {...tabPanelProps('users', 'accounts')} className="min-w-0 focus-visible:outline-none">
          <Card
            titleId="accounts-title"
            title="Accounts"
            aside={
              <Select
                label="Role"
                value={roleFilter}
                onChange={(e) => {
                  setList(null);
                  setRoleFilter(e.target.value);
                }}
                className="w-full sm:w-50"
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            }
          >
            <p className="-mt-3 type-body-sm text-text-muted" aria-live="polite">
              {list
                ? `${count} ${count === 1 ? 'account' : 'accounts'} · ${
                    roleFilter ? `role: ${roleFilter}` : 'roles: Reporter, Administrator, Traffic Officer'
                  }`
                : 'Loading accounts…'}
            </p>

            {/* Toolbar (#55): the only buttons on this card. */}
            <div data-guide="accounts-toolbar" role="toolbar" aria-label="Account actions" aria-controls="accounts-table" className="flex flex-wrap items-center gap-3">
              <Button icon="plus" onClick={() => setCreating(true)} aria-haspopup="dialog" className="max-sm:min-w-0 max-sm:flex-1">
                Create officer
              </Button>
              <Button
                variant="secondary"
                icon="pencil"
                disabled={!selected}
                onClick={() => setEditing(true)}
                aria-haspopup="dialog"
                aria-describedby={selfNoteId}
                className="min-w-[178px] max-sm:min-w-0 max-sm:flex-1"
              >
                Edit<span className="sr-only">{selected ? ` ${selected.full_name}` : ''}</span>
              </Button>
              <p className="type-body-sm text-text-muted max-sm:basis-full" aria-live="polite">
                {selected ? `Selected: ${selected.full_name} (${selected.role})` : 'Select an account to edit it.'}
              </p>
            </div>

            {loadError ? (
              <EmptyState
                type="error"
                title="Could not load accounts"
                description={loadError.message}
                action={
                  <Button icon="refresh" onClick={load}>
                    Try again
                  </Button>
                }
              />
            ) : !list ? (
              <div aria-busy="true" className="flex flex-col">
                <Skeleton type="table-row" />
                <Skeleton type="table-row" />
                <Skeleton type="table-row" />
              </div>
            ) : list.length === 0 ? (
              <EmptyState type="no-results" title="No accounts" description="No accounts have this role yet." />
            ) : (
              <div id="accounts-table" data-guide="accounts-table">
                {/* Table from 768 px; a stacked list on phones (no horizontal page scroll). Selecting a row selects its radio. */}
                <DataTable
                  className="hidden md:block"
                  caption="User accounts. Select an account, then choose Edit."
                  columns={columns}
                  rows={list}
                  getRowKey={(u) => u.user_id}
                  selectedKey={selectedId}
                />
                <ul className="flex flex-col md:hidden" aria-label="User accounts">
                  {list.map((u) => (
                    <li
                      key={u.user_id}
                      className={cx(
                        'flex items-start gap-2 border-b border-border-subtle px-1 py-3',
                        selectedId === u.user_id && 'bg-surface-blue-subtle',
                      )}
                    >
                      {columns[0].render(u, 'account-list')}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {columns[1].render(u)}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="type-body-sm text-text-primary">{u.role}</span>
                          <ActiveStatus active={u.is_active} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p id={selfNoteId} className="flex items-start gap-2 type-body-sm text-text-primary">
              <Icon name="info" size={20} className="text-text-blue" />
              Select an account, then choose Edit to change its details, role, password or access. You can&apos;t deactivate
              your own account.
            </p>
          </Card>
        </div>
      )}

      {tab === 'types' && (
        <div {...tabPanelProps('users', 'types')} className="min-w-0 focus-visible:outline-none">
          <AccidentTypesCard
            onAdded={(name) =>
              setToast({ title: 'Accident type added', body: `${name} is now available on the report form.` })
            }
          />
        </div>
      )}

      {tab === 'nearby' && (
        <div {...tabPanelProps('users', 'nearby')} className="min-w-0 focus-visible:outline-none">
          <NearbyOfficersCard
            onSaved={(km) =>
              setToast({ title: 'Alert range saved', body: `Nearby on-duty officers within ${km} km are alerted about new reports.` })
            }
          />
        </div>
      )}

      {creating && (
        <CreateOfficerDialog
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setToast({
              title: 'Account created',
              body: `${created.full_name} can now sign in as a ${created.role || ROLES.OFFICER}. Share the temporary password privately.`,
            });
            load();
          }}
        />
      )}

      {editing && selected && !resetTarget && !deactivateTarget && (
        <EditAccountDialog
          user={selected}
          isSelf={isSelf(selected)}
          busy={busyId === selected.user_id}
          onClose={() => setEditing(false)}
          onResetPassword={setResetTarget}
          onDeactivate={(target) => {
            setActionError('');
            setDeactivateTarget(target);
          }}
          onReactivate={reactivate}
          onSaved={(target, changes) => {
            setEditing(false);
            if (!Object.keys(changes).length) return;
            updateRow(target.user_id, changes);
            setToast({
              title: 'Account saved',
              body: changes.role ? `${changes.full_name || target.full_name} is now a ${changes.role}.` : `${changes.full_name || target.full_name}’s details were updated.`,
            });
            if (roleFilter && changes.role && changes.role !== roleFilter) load();
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSaved={(target) => {
            setResetTarget(null);
            setEditing(false);
            setToast({
              title: 'Password reset',
              body: `${target.full_name} can log in with the temporary password. We emailed them that it changed.`,
            });
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={deactivate}
        title={`Deactivate ${deactivateTarget?.full_name || ''}?`}
        description="They are signed out and cannot log in. Their reports, status history and audit logs stay intact. You can reactivate them later."
        confirmLabel="Deactivate"
        tone="destructive"
        busy={busyId != null}
        error={actionError}
      />
    </div>
  );
}
