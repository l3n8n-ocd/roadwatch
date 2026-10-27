import { useCallback, useEffect, useId, useState } from 'react';
import {
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  EmptyState,
  Icon,
  PasswordField,
  Select,
  Skeleton,
  TextField,
  Toast,
} from '../../components/ui';
import { admin, lookups, users } from '../../api/endpoints';
import useServerError from '../../lib/useServerError';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';
import { NOT_STRONG, isStrong } from '../../lib/passwordStrength';
import { cx } from '../../lib/cx';

// W6 Users & settings (Figma 128:2944, after deactivation 128:3348, dialog 128:3709).
// Accounts table (role, reset password, deactivate/reactivate), create officer form, accident types.
// Reset password (#37, dialog 404:16418, toast 404:16490): Reporters and Traffic Officers only.
// An administrator cannot change or deactivate their own account (#16); the API also refuses it.

const ROLE_OPTIONS = [ROLES.REPORTER, ROLES.ADMIN, ROLES.OFFICER].map((r) => ({ value: r, label: r }));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Card({ titleId, title, className = '', children, aside }) {
  return (
    <section
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

// Phones: the buttons share the row width with less side padding.
const ACTION_BTN = 'max-md:min-w-0 max-md:flex-1 max-md:px-3';

function UserActions({ user, isSelf, selfNoteId, onChangeRole, onResetPassword, onDeactivate, onReactivate, busy }) {
  const name = user.full_name;
  if (isSelf) {
    return (
      <Button variant="destructive" disabled aria-describedby={selfNoteId} className={ACTION_BTN}>
        Deactivate
      </Button>
    );
  }
  if (!user.is_active) {
    return (
      <Button variant="secondary" icon="refresh" onClick={() => onReactivate(user)} disabled={busy} className={ACTION_BTN}>
        Reactivate<span className="sr-only"> {name}</span>
      </Button>
    );
  }
  return (
    <>
      <Button variant="secondary" onClick={() => onChangeRole(user)} className={ACTION_BTN}>
        Change role<span className="sr-only"> for {name}</span>
      </Button>
      {user.role !== ROLES.ADMIN && (
        <Button variant="secondary" onClick={() => onResetPassword(user)} className={ACTION_BTN}>
          Reset password<span className="sr-only"> for {name}</span>
        </Button>
      )}
      <Button variant="destructive" onClick={() => onDeactivate(user)} className={ACTION_BTN}>
        Deactivate<span className="sr-only"> {name}</span>
      </Button>
    </>
  );
}

function ChangeRoleDialog({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user?.role || ROLES.OFFICER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (event) => {
    event.preventDefault();
    if (role === user.role) {
      onClose();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await users.setRole(user.user_id, role);
      onSaved(user, role);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Change role for ${user.full_name}`}
      description="The change is recorded in the audit log. Role names match the database."
    >
      <form noValidate onSubmit={save} className="flex flex-col gap-6">
        <Select label="Role" required value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} data-autofocus />
        {error && (
          <p role="alert" className="type-body-sm text-text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onClose} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={busy} className="min-w-[184px] max-sm:min-w-0 max-sm:flex-1">
            {busy ? 'Saving…' : 'Save role'}
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

function CreateOfficerCard({ onCreated }) {
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
    <Card titleId="create-officer-title" title="Create officer account">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          id="officer-full_name"
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
        <Button type="submit" icon="plus" fullWidth disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>
    </Card>
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

// ---------- page ----------

export default function Users() {
  const { user: me } = useAuth();
  const selfNoteId = useId();
  const [roleFilter, setRoleFilter] = useState('');
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const raiseServerError = useServerError();

  const load = useCallback(() => {
    setLoadError(null);
    users
      .list(roleFilter ? { role: roleFilter } : undefined)
      .then((rows) => setList(rows || []))
      .catch((err) => !raiseServerError(err) && setLoadError(err));
  }, [roleFilter, raiseServerError]);

  useEffect(load, [load]);

  const isSelf = (u) => me && u.user_id === me.user_id;
  const updateRow = (id, patch) => setList((rows) => rows.map((r) => (r.user_id === id ? { ...r, ...patch } : r)));

  const deactivate = async () => {
    const target = deactivateTarget;
    setBusyId(target.user_id);
    setActionError('');
    try {
      await users.setActive(target.user_id, false);
      updateRow(target.user_id, { is_active: false });
      setDeactivateTarget(null);
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
      setToast({ title: `${target.full_name} reactivated`, body: 'They can log in again.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Could not reactivate', body: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
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
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
          <UserActions
            user={u}
            isSelf={isSelf(u)}
            selfNoteId={selfNoteId}
            busy={busyId === u.user_id}
            onChangeRole={setRoleTarget}
            onResetPassword={setResetTarget}
            onDeactivate={(target) => {
              setActionError('');
              setDeactivateTarget(target);
            }}
            onReactivate={reactivate}
          />
        </div>
      ),
    },
  ];

  const count = list?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <h1 className="type-h1 text-text-primary">Users and settings</h1>

      {toast && (
        <Toast type={toast.type || 'success'} title={toast.title} onClose={() => setToast(null)} className="max-w-[400px]">
          {toast.body}
        </Toast>
      )}

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
          <>
            {/* Table from 768 px; a stacked list on phones (no horizontal page scroll). */}
            <DataTable
              className="hidden md:block"
              caption="User accounts"
              columns={columns}
              rows={list}
              getRowKey={(u) => u.user_id}
            />
            <ul className="flex flex-col md:hidden" aria-label="User accounts">
              {list.map((u) => (
                <li
                  key={u.user_id}
                  className={cx(
                    'flex flex-col gap-3 border-b border-border-subtle px-2 py-4',
                    isSelf(u) && 'bg-surface-navy-subtle',
                  )}
                >
                  {columns[0].render(u)}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="type-body-sm text-text-primary">{u.role}</span>
                    <ActiveStatus active={u.is_active} />
                  </div>
                  {columns[3].render(u)}
                </li>
              ))}
            </ul>
          </>
        )}

        <p id={selfNoteId} className="flex items-start gap-2 type-body-sm text-text-primary">
          <Icon name="info" size={20} className="text-text-blue" />
          You can&apos;t deactivate your own account. Ask another administrator.
        </p>
      </Card>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <CreateOfficerCard
          onCreated={(created) => {
            setToast({
              title: 'Account created',
              body: `${created.full_name} can now sign in as a ${created.role || ROLES.OFFICER}. Share the temporary password privately.`,
            });
            load();
          }}
        />
        <AccidentTypesCard
          onAdded={(name) =>
            setToast({ title: 'Accident type added', body: `${name} is now available on the report form.` })
          }
        />
      </div>

      {roleTarget && (
        <ChangeRoleDialog
          user={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSaved={(target, role) => {
            updateRow(target.user_id, { role });
            setRoleTarget(null);
            setToast({ title: 'Role changed', body: `${target.full_name} is now a ${role}.` });
            if (roleFilter && role !== roleFilter) load();
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSaved={(target) => {
            setResetTarget(null);
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
