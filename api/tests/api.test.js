// Integration tests against a REAL local database. They are skipped unless RUN_DB_TESTS=true,
// and they refuse to run against Aiven or any non-local host. Use a throwaway local database only.
const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcrypt');

const enabled = process.env.RUN_DB_TESTS === 'true';
const host = process.env.DB_HOST || '';
const safeHost = ['localhost', '127.0.0.1', '::1', 'mysql', 'mariadb'].includes(host);
const skip = !enabled ? 'set RUN_DB_TESTS=true with a local database to run' : (!safeHost ? 'refusing to run on a non-local database' : false);

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-123456';
process.env.AUTH_RATE_LIMIT = '1000';

test('JWT secret placeholder is rejected', () => {
  const { getJwtSecret } = require('../src/config/env');
  const old = process.env.JWT_SECRET;
  for (const bad of ['', 'change-me', 'short', 'replace_with_a_random_secret_at_least_32_characters_long']) {
    process.env.JWT_SECRET = bad;
    assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  }
  process.env.JWT_SECRET = old;
  assert.ok(getJwtSecret());
});

test('database-backed API flow', { skip }, async (t) => {
  const { sequelize, User, Role, Report, AuditLog, ReportStatusHistory, Notification } = require('../src/models');
  const app = require('../src/app');
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const run = Date.now();
  const pw = 'Sunflower7!';

  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const type = res.headers.get('content-type') || '';
    return { status: res.status, body: type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()), type };
  };
  const makeStaff = async (roleName, label) => {
    const role = await Role.findOne({ where: { role_name: roleName } });
    const email = `${label}.${run}@test.local`;
    const u = await User.create({ role_id: role.role_id, full_name: label, contact_email: email, password_hash: await bcrypt.hash(pw, 4) });
    const platform = roleName === 'Administrator' ? 'web' : 'mobile';
    const login = await call('POST', '/auth/login', { body: { contact_email: email, password: pw, platform } });
    return { user: u, token: login.body.data.token, email };
  };
  const report = (over = {}) => ({
    accident_type_id: 1, accident_date: '2026-10-15', accident_time: '14:30', accident_location: 'MacArthur Highway, Malolos',
    injury_information: 'injuries', accident_description: 'Two vehicles collided at the intersection.', latitude: 14.84, longitude: 120.81, ...over,
  });

  try {
    const admin = await makeStaff('Administrator', 'admin');

    await t.test('register always creates a Reporter and ignores a client-sent role', async () => {
      const r = await call('POST', '/auth/register', { body: { full_name: 'Rep One', contact_email: `rep.${run}@test.local`, password: pw, role: 'Administrator' } });
      assert.equal(r.status, 201);
      assert.equal(r.body.data.user.role, 'Reporter');
      const dup = await call('POST', '/auth/register', { body: { full_name: 'Rep One', contact_email: `REP.${run}@test.local`, password: pw, platform: 'mobile' } });
      assert.equal(dup.status, 409);
      const weak = await call('POST', '/auth/register', { body: { full_name: 'Weak', contact_email: `weak.${run}@test.local`, password: 'short' } });
      assert.equal(weak.status, 400);
      // #44: a new password must be Strong (Good is not enough), and must not contain the name or email.
      const good = await call('POST', '/auth/register', { body: { full_name: 'Weak', contact_email: `weak.${run}@test.local`, password: 'Sunflower7' } });
      assert.equal(good.status, 400);
      assert.equal(good.body.details.password[0], 'Make the password Strong to save it.');
      const named = await call('POST', '/auth/register', { body: { full_name: 'Maria Santos', contact_email: `weak.${run}@test.local`, password: 'Santos#2026x' } });
      assert.equal(named.status, 400);
    });

    const rep = { email: `rep.${run}@test.local` };
    rep.token = (await call('POST', '/auth/login', { body: { contact_email: rep.email, password: pw, platform: 'mobile' } })).body.data.token;
    const rep2 = await (async () => {
      await call('POST', '/auth/register', { body: { full_name: 'Rep Two', contact_email: `rep2.${run}@test.local`, password: pw, platform: 'mobile' } });
      return { token: (await call('POST', '/auth/login', { body: { contact_email: `rep2.${run}@test.local`, password: pw, platform: 'mobile' } })).body.data.token };
    })();

    await t.test('login rejects wrong password; endpoints need a token', async () => {
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: 'wrongpass1', platform: 'mobile' } })).status, 401);
      assert.equal((await call('GET', '/reports')).status, 401);
      assert.equal((await call('GET', '/reports', { token: 'garbage' })).status, 401);
    });

    let reportId;
    await t.test('login is refused on the wrong platform (#36); the check comes after the password', async () => {
      const onWeb = await call('POST', '/auth/login', { body: { contact_email: rep.email, password: pw, platform: 'web' } });
      assert.equal(onWeb.status, 403);
      assert.equal(onWeb.body.details.code, 'WRONG_PLATFORM');
      assert.equal(onWeb.body.details.platform, 'mobile');
      const adminOnMobile = await call('POST', '/auth/login', { body: { contact_email: admin.email, password: pw, platform: 'mobile' } });
      assert.equal(adminOnMobile.status, 403);
      assert.equal(adminOnMobile.body.details.platform, 'web');
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: admin.email, password: pw, platform: 'web' } })).status, 200);
      // wrong password on the wrong platform still says only "invalid", so nothing leaks
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: 'wrongpass1', platform: 'web' } })).status, 401);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: pw } })).status, 400);
      assert.ok(await AuditLog.findOne({ where: { action_taken: 'auth.login_wrong_platform' } }));
    });

    await t.test('reporter submits a report; history, audit and notification are written', async () => {
      assert.equal((await call('POST', '/reports', { token: rep.token, body: report({ accident_description: 'short' }) })).status, 400);
      assert.equal((await call('POST', '/reports', { token: rep.token, body: report({ injury_information: 'bogus' }) })).status, 400);
      assert.equal((await call('POST', '/reports', { token: rep.token, body: report({ longitude: undefined }) })).status, 400);
      const r = await call('POST', '/reports', { token: rep.token, body: report() });
      assert.equal(r.status, 201);
      reportId = r.body.data.report_id;
      assert.equal(r.body.data.report_status, 'Submitted');
      assert.equal(r.body.data.record_type, 'public_submission');
      assert.equal(await ReportStatusHistory.count({ where: { report_id: reportId } }), 1);
      assert.ok(await AuditLog.findOne({ where: { action_taken: 'report.created' }, order: [['log_id', 'DESC']] }));
      assert.ok(await Notification.findOne({ where: { report_id: reportId, user_id: admin.user.user_id } }));
    });

    await t.test('reporters only see their own reports (404 for others)', async () => {
      assert.equal((await call('GET', `/reports/${reportId}`, { token: rep.token })).status, 200);
      assert.equal((await call('GET', `/reports/${reportId}`, { token: rep2.token })).status, 404);
      assert.equal((await call('GET', '/reports', { token: rep2.token })).body.pagination.total, 0);
      assert.equal((await call('GET', '/admin/reports', { token: rep.token })).status, 403);
      assert.equal((await call('GET', '/users', { token: rep.token })).status, 403);
    });

    const officer = {};
    await t.test('admin creates a Traffic Officer; cannot create with bad data', async () => {
      const bad = await call('POST', '/users', { token: admin.token, body: { full_name: 'X', contact_email: 'x@test.local', password: pw, role: 'Superuser' } });
      assert.equal(bad.status, 400);
      const notStrong = await call('POST', '/users', { token: admin.token, body: { full_name: 'Officer One', contact_email: `off1.${run}@test.local`, password: 'Sunflower7', role: 'Traffic Officer' } });
      assert.equal(notStrong.status, 400, 'an officer password must be Strong too (#44)');
      const ok = await call('POST', '/users', { token: admin.token, body: { full_name: 'Officer One', contact_email: `off1.${run}@test.local`, password: pw, role: 'Traffic Officer' } });
      assert.equal(ok.status, 201);
      officer.id = ok.body.data.user_id;
      officer.token = (await call('POST', '/auth/login', { body: { contact_email: `off1.${run}@test.local`, password: pw, platform: 'mobile' } })).body.data.token;
      const other = await call('POST', '/users', { token: admin.token, body: { full_name: 'Officer Two', contact_email: `off2.${run}@test.local`, password: pw, role: 'Traffic Officer' } });
      officer.token2 = (await call('POST', '/auth/login', { body: { contact_email: `off2.${run}@test.local`, password: pw, platform: 'mobile' } })).body.data.token;
      officer.id2 = other.body.data.user_id;
      // Traffic Officers sign in on the web portal as well as the app (#52, DECISIONS #45)
      const onWeb = await call('POST', '/auth/login', { body: { contact_email: `off1.${run}@test.local`, password: pw, platform: 'web' } });
      assert.equal(onWeb.status, 200);
      assert.equal(onWeb.body.data.user.role, 'Traffic Officer');
    });

    await t.test('admin filters, verifies, rejects (reason required) and assigns', async () => {
      const list = await call('GET', `/admin/reports?status=Submitted&q=Malolos&date_from=2026-10-01&date_to=2026-10-31`, { token: admin.token });
      assert.ok(list.body.data.some((r) => r.report_id === reportId));
      // #39: the Report ID as the apps show it (RW-000004), #4 or 4 all find the report.
      for (const typed of [`RW-${String(reportId).padStart(6, '0')}`, `rw${reportId}`, `#${reportId}`, String(reportId)]) {
        const found = await call('GET', `/admin/reports?q=${encodeURIComponent(typed)}`, { token: admin.token });
        assert.ok(found.body.data.some((r) => r.report_id === reportId), `search "${typed}"`);
      }
      assert.equal((await call('GET', '/admin/reports?status=Nonsense', { token: admin.token })).status, 400);
      assert.equal((await call('PATCH', `/admin/reports/${reportId}/status`, { token: admin.token, body: { status: 'Rejected' } })).status, 400);
      assert.equal((await call('PATCH', `/admin/reports/${reportId}/status`, { token: admin.token, body: { status: 'Assigned' } })).status, 400);
      // Workflow #30: assigning is locked until the report is Verified.
      const early = await call('PATCH', `/admin/reports/${reportId}/assign`, { token: admin.token, body: { officer_id: officer.id } });
      assert.equal(early.status, 400);
      assert.match(early.body.error, /Verify the report first/);
      const v = await call('PATCH', `/admin/reports/${reportId}/status`, { token: admin.token, body: { status: 'Verified', remarks: 'Checked against photos' } });
      assert.equal(v.body.data.record_type, 'verified_record');
      assert.equal(v.body.data.is_verified_record, true);
      assert.equal((await call('PATCH', `/admin/reports/${reportId}/assign`, { token: admin.token, body: { officer_id: admin.user.user_id } })).status, 400); // an Administrator is not a Traffic Officer
      const a = await call('PATCH', `/admin/reports/${reportId}/assign`, { token: admin.token, body: { officer_id: officer.id } });
      assert.equal(a.status, 200);
      assert.equal(a.body.data.report_status, 'Assigned');
      assert.equal(a.body.data.assigned_officer_id, officer.id);
      assert.ok(await Notification.findOne({ where: { user_id: officer.id, report_id: reportId } }));
      assert.ok((await ReportStatusHistory.count({ where: { report_id: reportId } })) >= 3);
    });

    await t.test('officer sees ONLY assigned reports and cannot see contact of others', async () => {
      assert.equal((await call('GET', `/officer/reports/${reportId}`, { token: officer.token })).status, 200);
      assert.equal((await call('GET', `/officer/reports/${reportId}`, { token: officer.token2 })).status, 404);
      assert.equal((await call('GET', '/officer/reports', { token: officer.token2 })).body.pagination.total, 0);
      const mine = await call('GET', '/officer/reports', { token: officer.token });
      assert.equal(mine.body.data[0].report_id, reportId);
      assert.ok(mine.body.data[0].reporter.contact_email, 'assigned officer may see reporter contact');
      const detail = await call('GET', `/officer/reports/${reportId}`, { token: officer.token });
      assert.ok(detail.body.data.statusHistory.every((h) => h.changedBy.role.role_name), 'history names the role of each actor');
      const r = await call('PATCH', `/officer/reports/${reportId}`, { token: officer.token, body: { status: 'In Progress', remarks: 'On site' } });
      assert.equal(r.body.data.report_status, 'In Progress');
      assert.equal((await call('PATCH', `/officer/reports/${reportId}`, { token: officer.token, body: { status: 'Rejected' } })).status, 400);
      // Workflow #30: officers no longer review or verify.
      assert.equal((await call('PATCH', `/officer/reports/${reportId}`, { token: officer.token, body: { status: 'Verified' } })).status, 400);
      assert.equal((await call('PATCH', `/officer/reports/${reportId}`, { token: officer.token, body: { status: 'Under Review' } })).status, 400);
      assert.equal((await call('PATCH', `/officer/reports/${reportId}`, { token: officer.token2, body: { remarks: 'hi' } })).status, 404);
      assert.equal((await call('PATCH', `/admin/reports/${reportId}/assign`, { token: officer.token, body: { officer_id: officer.id } })).status, 403);
    });

    await t.test('rejection records the reason and goes back to public_submission', async () => {
      const r2 = (await call('POST', '/reports', { token: rep.token, body: report({ accident_location: 'Second location' }) })).body.data.report_id;
      const rej = await call('PATCH', `/admin/reports/${r2}/status`, { token: admin.token, body: { status: 'Rejected', rejection_reason: 'Duplicate of #1' } });
      assert.equal(rej.body.data.report_status, 'Rejected');
      assert.match(rej.body.data.official_remarks, /Duplicate of #1/);
      assert.equal(rej.body.data.record_type, 'public_submission');
      const tracked = await call('GET', `/reports/${r2}`, { token: rep.token });
      assert.equal(tracked.body.data.statusHistory.length, 2);
      assert.equal((await call('PATCH', `/admin/reports/${r2}/assign`, { token: admin.token, body: { officer_id: officer.id } })).status, 400);
    });

    await t.test('an officer cannot update a report the administrator rejected (#44)', async () => {
      const r3 = (await call('POST', '/reports', { token: rep.token, body: report({ accident_location: 'Third location' }) })).body.data.report_id;
      await call('PATCH', `/admin/reports/${r3}/status`, { token: admin.token, body: { status: 'Verified' } });
      await call('PATCH', `/admin/reports/${r3}/assign`, { token: admin.token, body: { officer_id: officer.id } });
      await call('PATCH', `/admin/reports/${r3}/status`, { token: admin.token, body: { status: 'Rejected', rejection_reason: 'Duplicate of RW-000001' } });
      const blocked = await call('PATCH', `/officer/reports/${r3}`, { token: officer.token, body: { status: 'In Progress' } });
      assert.equal(blocked.status, 409);
      assert.equal(blocked.body.details.code, 'REPORT_REJECTED');
      const still = await call('GET', `/officer/reports/${r3}`, { token: officer.token });
      assert.equal(still.body.data.report_status, 'Rejected');
      assert.equal(still.body.data.record_type, 'public_submission');
    });

    await t.test('deactivation blocks login and existing tokens; admin cannot deactivate self; reactivation works', async () => {
      assert.equal((await call('PATCH', `/users/${admin.user.user_id}/active`, { token: admin.token, body: { is_active: false } })).status, 400);
      assert.equal((await call('PATCH', `/users/${officer.id2}/active`, { token: admin.token, body: { is_active: false } })).status, 200);
      assert.equal((await call('GET', '/officer/reports', { token: officer.token2 })).status, 401);
      // #40: the right password on a deactivated account says so; a wrong password stays the generic 401.
      const off = await call('POST', '/auth/login', { body: { contact_email: `off2.${run}@test.local`, password: pw, platform: 'mobile' } });
      assert.equal(off.status, 403);
      assert.equal(off.body.details.code, 'ACCOUNT_DEACTIVATED');
      assert.equal(off.body.data, undefined, 'no token for a deactivated account');
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: `off2.${run}@test.local`, password: 'Wrong-password-9', platform: 'mobile' } })).status, 401);
      assert.equal((await call('PATCH', `/admin/reports/${reportId}/assign`, { token: admin.token, body: { officer_id: officer.id2 } })).status, 400);
      assert.equal((await call('PATCH', `/users/${officer.id2}/active`, { token: admin.token, body: { is_active: true } })).status, 200);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: `off2.${run}@test.local`, password: pw, platform: 'mobile' } })).status, 200);
      assert.ok(await AuditLog.findOne({ where: { action_taken: 'user.deactivated' } }));
      assert.equal((await call('PATCH', `/users/${officer.id2}/role`, { token: admin.token, body: { role: 'Reporter' } })).status, 200);
    });

    await t.test('notifications list and mark read', async () => {
      const n = await call('GET', '/notifications', { token: rep.token });
      assert.ok(n.body.data.length >= 2);
      const id = n.body.data[0].notification_id;
      assert.equal((await call('PATCH', `/notifications/${id}/read`, { token: rep.token })).status, 200);
      assert.equal((await call('PATCH', `/notifications/${id}/read`, { token: rep2.token })).status, 404);
    });

    await t.test('dashboard, period summary, CSV and PDF exports (admin only)', async () => {
      const s = await call('GET', '/dashboard/stats', { token: admin.token });
      assert.ok(s.body.data.cards.total >= 2);
      assert.ok(Array.isArray(s.body.data.hotspots));
      assert.equal((await call('GET', '/dashboard/stats', { token: officer.token })).status, 403);
      // Public totals (#40): no token, counts only.
      const pub = await call('GET', '/public/stats');
      assert.equal(pub.status, 200);
      assert.deepEqual(Object.keys(pub.body.data).sort(), ['active_officers', 'cases_resolved', 'reports_received', 'verified_records']);
      assert.equal(pub.body.data.reports_received, s.body.data.cards.total);
      assert.equal(pub.body.data.verified_records, s.body.data.cards.verified);
      assert.ok(pub.body.data.active_officers >= 1);
      const sum = await call('GET', '/exports/summary?period=monthly&date=2026-10-20', { token: admin.token });
      assert.equal(sum.body.data.from, '2026-10-01');
      assert.equal(sum.body.data.to, '2026-10-31');
      assert.ok(sum.body.data.total >= 2);
      const wk = await call('GET', '/exports/summary?period=weekly&date=2026-10-15', { token: admin.token });
      assert.equal(wk.body.data.from, '2026-10-12');
      assert.equal(wk.body.data.to, '2026-10-18');
      const csv = await call('GET', '/exports/reports.csv?status=Rejected', { token: admin.token });
      assert.equal(csv.status, 200);
      assert.match(csv.type, /text\/csv/);
      assert.match(csv.body.toString(), /report_id/);
      const pdf = await call('GET', '/exports/reports.pdf', { token: admin.token });
      assert.equal(pdf.body.subarray(0, 4).toString(), '%PDF');
      assert.equal((await call('GET', '/exports/reports.csv', { token: rep.token })).status, 403);
    });

    await t.test('public road updates show verified records only, without reporter data (#23)', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const fresh = (await call('POST', '/reports', { token: rep.token, body: report({ accident_date: today, accident_location: 'Public update road' }) })).body.data.report_id;
      const pending = (await call('POST', '/reports', { token: rep.token, body: report({ accident_date: today, accident_location: 'Not verified yet' }) })).body.data.report_id;
      await call('PATCH', `/admin/reports/${fresh}/status`, { token: admin.token, body: { status: 'Verified' } });
      const u = await call('GET', '/public/updates');
      assert.equal(u.status, 200);
      const item = u.body.data.find((x) => x.report_id === fresh);
      assert.ok(item, 'a verified record from today is listed');
      assert.ok(!u.body.data.some((x) => x.report_id === pending), 'unverified submissions are not listed');
      assert.ok(u.body.data.every((x) => x.record_type === 'verified_record'));
      assert.deepEqual(Object.keys(item).sort(), ['accident_date', 'accident_location', 'accident_time', 'accident_type', 'latitude', 'longitude', 'record_type', 'report_id', 'report_status']);
      assert.equal(typeof item.latitude, 'number');
      assert.ok(item.accident_type.type_name);
    });

    await t.test('own profile and password (#25)', async () => {
      assert.equal((await call('PATCH', '/auth/me', { body: { full_name: 'No Token' } })).status, 401);
      assert.equal((await call('PATCH', '/auth/me', { token: rep.token, body: { full_name: 'X' } })).status, 400);
      const p = await call('PATCH', '/auth/me', { token: rep.token, body: { full_name: 'Rep Renamed', contact_phone: '09171234567', contact_email: `taken.${run}@test.local`, role: 'Administrator' } });
      assert.equal(p.status, 200);
      assert.equal(p.body.data.user.full_name, 'Rep Renamed');
      assert.equal(p.body.data.user.contact_phone, '09171234567');
      assert.equal(p.body.data.user.contact_email, rep.email, 'email cannot be changed here');
      assert.equal(p.body.data.user.role, 'Reporter', 'role cannot be changed here');
      const cleared = await call('PATCH', '/auth/me', { token: rep.token, body: { full_name: 'Rep Renamed', contact_phone: null } });
      assert.equal(cleared.body.data.user.contact_phone, null);

      const wrong = await call('PATCH', '/auth/me/password', { token: rep.token, body: { current_password: 'not-it-123', new_password: 'Lantern#456b' } });
      assert.equal(wrong.status, 400, 'a wrong current password is 400, not 401, so the apps keep the session');
      assert.equal((await call('PATCH', '/auth/me/password', { token: rep.token, body: { current_password: pw, new_password: 'short' } })).status, 400);
      assert.equal((await call('PATCH', '/auth/me/password', { token: rep.token, body: { current_password: pw, new_password: pw } })).status, 400);
      const notStrong = await call('PATCH', '/auth/me/password', { token: rep.token, body: { current_password: pw, new_password: 'Sunflower8' } });
      assert.equal(notStrong.status, 400);
      assert.equal(notStrong.body.details.new_password[0], 'Make the password Strong to save it.');
      assert.equal((await call('PATCH', '/auth/me/password', { token: rep.token, body: { current_password: pw, new_password: 'Lantern#456b' } })).status, 200);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: pw, platform: 'mobile' } })).status, 401);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: 'Lantern#456b', platform: 'mobile' } })).status, 200);
    });

    await t.test('action log: own actions for anyone, all staff for admins only (#27)', async () => {
      const mine = await call('GET', '/auth/me/activity?period=all', { token: rep.token });
      assert.equal(mine.status, 200);
      assert.ok(mine.body.pagination.total >= 3);
      assert.ok(mine.body.data.every((row) => row.user_id === mine.body.data[0].user_id));
      const actions = mine.body.data.map((row) => row.action_taken);
      assert.ok(actions.includes('account.password_changed') && actions.includes('account.profile_updated'));
      const group = await call('GET', '/auth/me/activity?action=account', { token: rep.token });
      assert.ok(group.body.data.length >= 2 && group.body.data.every((row) => row.action_taken.startsWith('account.')));
      assert.equal((await call('GET', '/auth/me/activity?period=1y', { token: rep.token })).status, 400);

      assert.equal((await call('GET', '/admin/audit-logs', { token: rep.token })).status, 403);
      assert.equal((await call('GET', '/admin/audit-logs', { token: officer.token })).status, 403);
      const all = await call('GET', `/admin/audit-logs?user_id=${admin.user.user_id}&action=user&period=7d&limit=50`, { token: admin.token });
      assert.equal(all.status, 200);
      assert.ok(all.body.data.every((row) => row.user_id === admin.user.user_id && row.action_taken.startsWith('user.')));
      assert.equal(all.body.data[0].user.role, 'Administrator');
      const everyone = await call('GET', '/admin/audit-logs?period=all&limit=100', { token: admin.token });
      assert.ok(everyone.body.data.every((row) => row.user.role !== 'Reporter'), 'All staff leaves out reporters');
      assert.ok(all.body.data.some((row) => row.action_details.target_name === 'Officer One'), 'user ids in details get names');
      const assigned = await call('GET', `/admin/audit-logs?action=report.status_changed&user_id=${admin.user.user_id}&limit=100`, { token: admin.token });
      assert.ok(assigned.body.data.some((row) => row.action_details.to === 'Assigned' && row.action_details.officer_name === 'Officer One'));
    });

    await t.test('forgot password with an emailed code; admin resets a password (#37)', async () => {
      const { makeResetCode } = require('../src/services/passwordResetService');
      const sent = await call('POST', '/auth/forgot-password', { body: { contact_email: rep.email } });
      const unknown = await call('POST', '/auth/forgot-password', { body: { contact_email: `nobody.${run}@test.local` } });
      assert.equal(sent.status, 200);
      assert.deepEqual(unknown.body, sent.body, 'same answer whether or not the email has an account');
      assert.equal((await call('POST', '/auth/forgot-password', { body: { contact_email: 'not-an-email' } })).status, 400);

      const repUser = await User.scope('withPassword').findOne({ where: { contact_email: rep.email } });
      const code = makeResetCode(repUser);
      assert.match(code, /^[A-Z2-9]{8}$/);
      const reset = (body) => call('POST', '/auth/reset-password', { body: { contact_email: rep.email, new_password: 'Harbor$789k', ...body } });
      const wrong = await reset({ reset_code: code === 'AAAAAAAA' ? 'BBBBBBBB' : 'AAAAAAAA' });
      assert.equal(wrong.status, 400);
      assert.ok(wrong.body.details.reset_code, 'the error goes under the code field');
      const noUser = await call('POST', '/auth/reset-password', { body: { contact_email: `nobody.${run}@test.local`, reset_code: code, new_password: 'Harbor$789k' } });
      assert.equal(noUser.status, 400);
      assert.equal(noUser.body.error, wrong.body.error, 'unknown email gives the same answer as a wrong code');
      assert.equal((await reset({ reset_code: code, new_password: 'short' })).status, 400);
      const notStrong = await reset({ reset_code: code, new_password: 'Sunflower8' });
      assert.equal(notStrong.status, 400);
      assert.ok(notStrong.body.details.new_password, 'a right code with a not-Strong password: the error is on the password');

      const realNow = Date.now;
      Date.now = () => realNow() + 16 * 60000;
      try {
        assert.equal((await reset({ reset_code: code })).status, 400, 'the code expires after 15 minutes');
      } finally {
        Date.now = realNow;
      }
      const typed = `${code.slice(0, 4).toLowerCase()}-${code.slice(4)}`;
      assert.equal((await reset({ reset_code: typed })).status, 200, 'case and dashes do not matter');
      assert.equal((await reset({ reset_code: code })).status, 400, 'a code works once');
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: 'Lantern#456b', platform: 'mobile' } })).status, 401);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: rep.email, password: 'Harbor$789k', platform: 'mobile' } })).status, 200);
      assert.equal((await call('GET', '/auth/me', { token: rep.token })).status, 200, 'other signed-in devices stay signed in');
      assert.ok(await AuditLog.findOne({ where: { user_id: repUser.user_id, action_taken: 'account.password_reset' } }));

      const path = `/users/${officer.id}/password`;
      assert.equal((await call('PATCH', path, { token: rep.token, body: { new_password: 'Temp-Key-2026x' } })).status, 403);
      assert.equal((await call('PATCH', path, { token: officer.token, body: { new_password: 'Temp-Key-2026x' } })).status, 403);
      assert.equal((await call('PATCH', path, { token: admin.token, body: { new_password: 'short' } })).status, 400);
      const tempNotStrong = await call('PATCH', path, { token: admin.token, body: { new_password: 'Sunflower8' } });
      assert.equal(tempNotStrong.status, 400, 'a temporary password must be Strong too (#44)');
      assert.ok(tempNotStrong.body.details.new_password);
      assert.equal((await call('PATCH', `/users/${admin.user.user_id}/password`, { token: admin.token, body: { new_password: 'Temp-Key-2026x' } })).status, 400, 'not on your own account');
      const admin2 = await makeStaff('Administrator', 'admin2');
      assert.equal((await call('PATCH', `/users/${admin2.user.user_id}/password`, { token: admin.token, body: { new_password: 'Temp-Key-2026x' } })).status, 400, 'not on another administrator');
      assert.equal((await call('PATCH', '/users/99999999/password', { token: admin.token, body: { new_password: 'Temp-Key-2026x' } })).status, 404);
      const done = await call('PATCH', path, { token: admin.token, body: { new_password: 'Temp-Key-2026x' } });
      assert.equal(done.status, 200);
      assert.equal((await call('POST', '/auth/login', { body: { contact_email: `off1.${run}@test.local`, password: 'Temp-Key-2026x', platform: 'mobile' } })).status, 200);
      assert.ok(await AuditLog.findOne({ where: { user_id: admin.user.user_id, action_taken: 'user.password_reset' } }));
    });

    await t.test('report priority: automatic, staff only, admin override and back to automatic (#54)', async () => {
      // type 1 is Collision (seed order): Medium base, raised to High by injuries; fatalities make it Urgent.
      const made = await call('POST', '/reports', { token: rep.token, body: report({ latitude: undefined, longitude: undefined }) });
      assert.equal(made.status, 201);
      assert.equal(made.body.data.priority, undefined, 'reporters never see priority');
      const id = made.body.data.report_id;
      const urgent = await call('POST', '/reports', { token: rep.token, body: report({ injury_information: 'fatalities', latitude: undefined, longitude: undefined }) });
      const one = await call('GET', `/admin/reports/${id}`, { token: admin.token });
      assert.equal(one.body.data.priority, 'High');
      assert.equal(one.body.data.priority_source, 'auto');
      assert.equal((await call('GET', `/reports/${id}`, { token: rep.token })).body.data.priority, undefined);
      assert.ok((await call('GET', '/reports', { token: rep.token })).body.data.every((r) => r.priority === undefined));

      const filtered = await call('GET', '/admin/reports?priority=Urgent&sort=priority', { token: admin.token });
      assert.ok(filtered.body.data.some((r) => r.report_id === urgent.body.data.report_id));
      assert.ok(filtered.body.data.every((r) => r.priority === 'Urgent'));
      const sorted = (await call('GET', '/admin/reports?sort=priority&limit=100', { token: admin.token })).body.data.map((r) => ['Low', 'Medium', 'High', 'Urgent'].indexOf(r.priority));
      assert.deepEqual(sorted, [...sorted].sort((a, b) => b - a), 'Urgent first');

      assert.equal((await call('PATCH', `/admin/reports/${id}/priority`, { token: admin.token, body: { priority: 'Severe' } })).status, 400);
      assert.equal((await call('PATCH', `/admin/reports/${id}/priority`, { token: officer.token, body: { priority: 'Low' } })).status, 403);
      const set = await call('PATCH', `/admin/reports/${id}/priority`, { token: admin.token, body: { priority: 'Urgent' } });
      assert.equal(set.status, 200);
      assert.equal(set.body.data.priority, 'Urgent');
      assert.equal(set.body.data.priority_source, 'admin');
      assert.equal(set.body.data.priority_auto, 'High');
      assert.ok(await AuditLog.findOne({ where: { user_id: admin.user.user_id, action_taken: 'report.priority_changed' } }));
      const back = await call('PATCH', `/admin/reports/${id}/priority`, { token: admin.token, body: { priority: null } });
      assert.equal(back.body.data.priority, 'High');
      assert.equal(back.body.data.priority_source, 'auto');
      const csv = await call('GET', '/exports/reports.csv', { token: admin.token });
      assert.ok(csv.body.toString().split('\n')[0].includes('"priority"'));
    });

    await t.test('admin edits another account\'s name and phone (#55)', async () => {
      const target = await makeStaff('Traffic Officer', 'edit-me');
      const path = `/users/${target.user.user_id}`;
      assert.equal((await call('PATCH', path, { token: rep.token, body: { full_name: 'Nope' } })).status, 403);
      assert.equal((await call('PATCH', path, { token: admin.token, body: { full_name: 'X' } })).status, 400);
      assert.equal((await call('PATCH', '/users/99999999', { token: admin.token, body: { full_name: 'Nobody Here' } })).status, 404);
      const ok = await call('PATCH', path, { token: admin.token, body: { full_name: 'Edited Officer', contact_phone: '0917 555 0142', contact_email: 'ignored@test.local' } });
      assert.equal(ok.status, 200);
      assert.equal(ok.body.data.full_name, 'Edited Officer');
      assert.equal(ok.body.data.contact_phone, '0917 555 0142');
      assert.equal(ok.body.data.contact_email, target.email, 'email stays fixed');
      assert.equal(ok.body.data.password_hash, undefined);
      const cleared = await call('PATCH', path, { token: admin.token, body: { full_name: 'Edited Officer', contact_phone: null } });
      assert.equal(cleared.body.data.contact_phone, null);
      const log = await AuditLog.findOne({ where: { user_id: admin.user.user_id, action_taken: 'user.updated' }, order: [['log_id', 'DESC']] });
      assert.deepEqual(JSON.parse(log.action_details).fields, ['contact_phone']);
    });

    await t.test('nearby on-duty officers: alert, first to respond wins, confirm or reject on scene (#57)', async () => {
      const { ReportDispatch, OfficerStatus } = require('../src/models');
      // A spot of its own (Samar), so other tests' reports never fall in range. 0.009 degrees of latitude is about 1 km.
      const at = (km) => ({ latitude: 12.5 + km * 0.009, longitude: 124.9 });
      const officers = {};
      for (const [name, km] of [['near1', 1], ['near2', 2], ['near3', 3], ['near4', 4], ['far', 20], ['offduty', 0.5]]) {
        officers[name] = await makeStaff('Traffic Officer', `${name}`);
      }
      try {
        // settings: admin only, bounded
        assert.equal((await call('GET', '/admin/settings', { token: officers.near1.token })).status, 403);
        assert.equal((await call('PATCH', '/admin/settings', { token: admin.token, body: { alert_range_km: 500 } })).status, 400);
        const range = await call('PATCH', '/admin/settings', { token: admin.token, body: { alert_range_km: 5 } });
        assert.equal(range.body.data.alert_range_km, 5);
        assert.ok(await AuditLog.findOne({ where: { user_id: admin.user.user_id, action_taken: 'settings.updated' } }));

        // duty switch: officers only; latitude and longitude together
        assert.equal((await call('PUT', '/officer/duty', { token: rep.token, body: { on_duty: true } })).status, 403);
        assert.equal((await call('PUT', '/officer/duty', { token: officers.near1.token, body: { on_duty: true, latitude: 12.5 } })).status, 400);
        for (const [name, km] of [['near1', 1], ['near2', 2], ['near3', 3], ['near4', 4], ['far', 20]]) {
          const d = await call('PUT', '/officer/duty', { token: officers[name].token, body: { on_duty: true, ...at(km) } });
          assert.equal(d.status, 200);
          assert.equal(d.body.data.on_duty, true);
        }
        await call('PUT', '/officer/duty', { token: officers.offduty.token, body: { on_duty: true, ...at(0.5) } });
        const off = await call('PUT', '/officer/duty', { token: officers.offduty.token, body: { on_duty: false } });
        assert.equal(off.body.data.latitude, null, 'going off duty clears the location');
        assert.ok(await AuditLog.findOne({ where: { user_id: officers.offduty.user.user_id, action_taken: 'officer.off_duty' } }));

        // a report there alerts the 3 nearest on-duty officers in range
        const r1 = (await call('POST', '/reports', { token: rep.token, body: report(at(0)) })).body.data;
        const alerted = await ReportDispatch.findAll({ where: { report_id: r1.report_id }, order: [['distance_km', 'ASC']] });
        assert.deepEqual(alerted.map((d) => d.officer_id), ['near1', 'near2', 'near3'].map((n) => officers[n].user.user_id));
        assert.ok(Math.abs(Number(alerted[0].distance_km) - 1) < 0.05);
        const pending = await call('GET', '/officer/nearby', { token: officers.near2.token });
        assert.equal(pending.status, 200);
        assert.equal(pending.body.data[0].report_id, r1.report_id);
        assert.equal(pending.body.data[0].priority, 'High');
        assert.equal((await call('GET', '/officer/nearby', { token: officers.far.token })).body.data.length, 0);
        assert.ok(await Notification.findOne({ where: { user_id: officers.near1.user.user_id, report_id: r1.report_id } }));
        assert.equal((await call('GET', `/admin/reports/${r1.report_id}`, { token: admin.token })).body.data.dispatch.state, 'alerting');

        // first to respond wins; the others see who took it
        assert.equal((await call('POST', `/officer/nearby/${r1.report_id}/respond`, { token: officers.far.token })).status, 404);
        const won = await call('POST', `/officer/nearby/${r1.report_id}/respond`, { token: officers.near2.token });
        assert.equal(won.status, 200);
        assert.equal(won.body.data.assigned_officer_id, officers.near2.user.user_id);
        assert.equal(won.body.data.record_type, 'public_submission', 'not verified until confirmed on scene');
        assert.equal(won.body.data.dispatch.state, 'responding');
        assert.ok(won.body.data.reporter.contact_email, 'the responding officer sees the reporter contact');
        const lost = await call('POST', `/officer/nearby/${r1.report_id}/respond`, { token: officers.near1.token });
        assert.equal(lost.status, 409);
        assert.equal(lost.body.details.code, 'ALREADY_TAKEN');
        assert.equal(lost.body.details.responder_name, 'near2');
        assert.equal((await call('GET', '/officer/nearby', { token: officers.near1.token })).body.data.length, 0);

        // the responder confirms on scene before any other update
        const early = await call('PATCH', `/officer/reports/${r1.report_id}`, { token: officers.near2.token, body: { status: 'In Progress' } });
        assert.equal(early.status, 409);
        assert.equal(early.body.details.code, 'CONFIRM_FIRST');
        assert.equal((await call('POST', `/officer/reports/${r1.report_id}/confirm`, { token: officers.near1.token, body: {} })).status, 404);
        const confirmed = await call('POST', `/officer/reports/${r1.report_id}/confirm`, { token: officers.near2.token, body: { remarks: 'Two cars, one lane blocked.' } });
        assert.equal(confirmed.status, 200);
        assert.equal(confirmed.body.data.report_status, 'In Progress');
        assert.equal(confirmed.body.data.record_type, 'verified_record');
        assert.equal(confirmed.body.data.dispatch.state, 'confirmed');
        assert.equal((await call('POST', `/officer/reports/${r1.report_id}/confirm`, { token: officers.near2.token, body: {} })).status, 409);
        assert.ok(await AuditLog.findOne({ where: { user_id: officers.near2.user.user_id, action_taken: 'report.confirmed_on_scene' } }));
        const listed = await call('GET', '/admin/reports?limit=100', { token: admin.token });
        assert.equal(listed.body.data.find((r) => r.report_id === r1.report_id).dispatch.responder.full_name, 'near2');

        // reject on scene: Rejected with the reason, admins are told, and the admin can reopen it
        const r2 = (await call('POST', '/reports', { token: rep.token, body: report(at(0.2)) })).body.data;
        assert.equal((await call('POST', `/officer/nearby/${r2.report_id}/decline`, { token: officers.near1.token })).status, 200);
        assert.equal((await call('POST', `/officer/nearby/${r2.report_id}/respond`, { token: officers.near1.token })).status, 409, 'declined');
        assert.equal((await call('POST', `/officer/nearby/${r2.report_id}/respond`, { token: officers.near3.token })).status, 200);
        assert.equal((await call('POST', `/officer/reports/${r2.report_id}/reject`, { token: officers.near3.token, body: { rejection_reason: 'x' } })).status, 400);
        const rejected = await call('POST', `/officer/reports/${r2.report_id}/reject`, { token: officers.near3.token, body: { rejection_reason: 'No accident at this spot.' } });
        assert.equal(rejected.status, 200);
        assert.equal(rejected.body.data.report_status, 'Rejected');
        assert.equal(rejected.body.data.dispatch.state, 'rejected_on_scene');
        assert.ok(await Notification.findOne({ where: { user_id: admin.user.user_id, report_id: r2.report_id } }));
        const reopened = await call('PATCH', `/admin/reports/${r2.report_id}/status`, { token: admin.token, body: { status: 'Under Review' } });
        assert.equal(reopened.status, 200);

        // nobody responds in 10 minutes: the alert closes and the report waits for the administrator
        const r3 = (await call('POST', '/reports', { token: rep.token, body: report(at(0.1)) })).body.data;
        await ReportDispatch.update({ alerted_at: new Date(Date.now() - 12 * 60000) }, { where: { report_id: r3.report_id } });
        const late = await call('POST', `/officer/nearby/${r3.report_id}/respond`, { token: officers.near1.token });
        assert.equal(late.status, 409);
        assert.equal(late.body.details.code, 'ALERT_CLOSED');
        const waiting = (await call('GET', `/admin/reports/${r3.report_id}`, { token: admin.token })).body.data.dispatch;
        assert.equal(waiting.state, 'no_response');
        assert.ok(waiting.minutes_since_alert >= 12);

        // the admin acting closes alerts nobody answered
        const r4 = (await call('POST', '/reports', { token: rep.token, body: report(at(0.3)) })).body.data;
        await call('PATCH', `/admin/reports/${r4.report_id}/status`, { token: admin.token, body: { status: 'Verified' } });
        assert.equal(await ReportDispatch.count({ where: { report_id: r4.report_id, dispatch_status: 'alerted' } }), 0);
        assert.equal((await call('POST', `/officer/nearby/${r4.report_id}/respond`, { token: officers.near1.token })).status, 409);

        // no map pin, no alert
        const r5 = (await call('POST', '/reports', { token: rep.token, body: report({ latitude: undefined, longitude: undefined }) })).body.data;
        assert.equal(await ReportDispatch.count({ where: { report_id: r5.report_id } }), 0);
      } finally {
        await OfficerStatus.update({ is_on_duty: false, latitude: null, longitude: null, location_updated_at: null },
          { where: { officer_id: Object.values(officers).map((o) => o.user.user_id) } });
      }
    });

    await t.test('photo upload validates input (Cloudinary itself is not called)', async () => {
      const none = await fetch(`${base}/reports/${reportId}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${rep.token}` }, body: new FormData() });
      assert.equal(none.status, 400);
      const form = new FormData();
      form.append('photos', new Blob(['hello'], { type: 'text/plain' }), 'x.txt');
      const bad = await fetch(`${base}/reports/${reportId}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${rep.token}` }, body: form });
      assert.equal(bad.status, 400);
      const form2 = new FormData();
      form2.append('photos', new Blob(['x'], { type: 'image/png' }), 'x.png');
      const other = await fetch(`${base}/reports/${reportId}/photos`, { method: 'POST', headers: { Authorization: `Bearer ${rep2.token}` }, body: form2 });
      assert.equal(other.status, 404);
    });
  } finally {
    server.close();
    await sequelize.close();
  }
});
