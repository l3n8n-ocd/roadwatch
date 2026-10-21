# RoadWatch API contract

Base URL: `http://localhost:5000/api` (deployed: your Render URL + `/api`). Send `Authorization: Bearer <token>` on everything except health, app-info, public stats, public updates, register and login.

Responses: success is `{ "success": true, "data": ... }` (lists add `"pagination": { page, limit, total, pages }`). Errors are `{ "success": false, "error": "message", "details"?: {field: [messages]} }` with status 400 validation, 401 not logged in or account inactive, 403 wrong role, 404 not found (also used when a record belongs to someone else), 409 duplicate, 413 photo too big.

Values that must match the database exactly:

- **Roles:** `Reporter`, `Administrator`, `Traffic Officer`
- **Statuses (8):** `Submitted`, `Under Review`, `Additional Information Required`, `Verified`, `Assigned`, `In Progress`, `Resolved/Closed`, `Rejected`
- **Injury:** `none`, `injuries`, `fatalities`, `unknown`
- **record_type:** `public_submission` or `verified_record` (the response also has `is_verified_record`; show a clear Verified/Public badge)

## Public

| Method and path | Body | Notes |
|---|---|---|
| GET `/health` | | `{"status":"ok","service":"roadwatch-api"}` (no `success` field) |
| GET `/app-info` | | `{"demoVideoUrl": string or null}` |
| GET `/public/stats` | | Landing stats bar (#40): `{ reports_received, verified_records, cases_resolved, active_officers }`. Counts only, no personal data. Rate limited (60 a minute per IP, `PUBLIC_RATE_LIMIT`), `Cache-Control: max-age=60`. |
| GET `/public/updates` | | Landing "Public road updates" (#23): up to 20 `verified_record` reports whose accident date is in the last 7 days, newest first. Each item: `report_id`, `accident_type: { type_name }`, `accident_date`, `accident_time`, `accident_location`, `latitude`, `longitude` (numbers or null), `report_status`, `record_type`. Never reporter or contact fields, description, remarks or photos. Same rate limit and cache as `/public/stats`. |
| POST `/auth/register` | `full_name`, `contact_email`, `password` (8+), `contact_phone?` | Always a Reporter. Returns `{ user, token }`. |
| POST `/auth/login` | `contact_email`, `password`, `platform` (`web` or `mobile`, required) | Returns `{ token, user: { user_id, full_name, contact_email, contact_phone, role } }`. Use `user.role` for the role-based redirect. Platforms (#36): Reporter and Traffic Officer sign in with `mobile`, Administrator with `web`. A correct password on the wrong platform returns **403** `{ success: false, error, details: { code: "WRONG_PLATFORM", platform } }`, where `details.platform` is the platform the account must use; it is written to the audit log as `auth.login_wrong_platform`. A wrong password always returns 401 first, so the platform message never reveals whether an email exists. A missing or unknown `platform` returns 400. |
| GET `/auth/me` | | Current user |
| PATCH `/auth/me` | `full_name`, `contact_phone?` (string or `null` to clear) | Edit own profile (#25). Email and role cannot be changed here (extra fields are ignored). Returns `{ user }`. Audit: `account.profile_updated`. |
| PATCH `/auth/me/password` | `current_password`, `new_password` (8+, different from the current one) | Change own password (#25). A wrong current password is **400** with `details.current_password` (not 401, so the apps keep the session). Rate limited like login. Existing tokens stay valid. Audit: `account.password_changed`. |
| GET `/auth/me/activity` | `period` (`7d`, `30d` default, `90d`, `all`), `action?`, `page`, `limit` | Action log, own actions (#27). Rows: `{ log_id, user_id, action_taken, action_details (object), timestamp }` plus `pagination`. `action` matches exactly (`auth.login`) or as a group (`user` matches `user.*`). User ids inside `action_details` come with names (`target_name`, `officer_name`). |

## Any logged-in user

| Method and path | Notes |
|---|---|
| GET `/accident-types` | List for the report form dropdown |
| GET `/notifications` | Newest 100, plus `unread` count |
| PATCH `/notifications/:id/read`, PATCH `/notifications/read-all` | |

## Reporter

| Method and path | Body or query | Notes |
|---|---|---|
| POST `/reports` | `accident_type_id`, `accident_date` (YYYY-MM-DD), `accident_time` (HH:MM), `accident_location`, `accident_description` (10+ chars), `injury_information`, `latitude?` and `longitude?` (together), `vehicles_involved?` | Returns the new report (Report ID = `report_id`) |
| GET `/reports` | `page`, `limit`, `status?` | Only my reports |
| GET `/reports/:id` | | My report with `photos` and `statusHistory` (tracking) |
| POST `/reports/:id/photos` | multipart form, field `photos` (up to 5 files, JPG/PNG/WEBP, 5 MB each, 10 per report) | Uploads to Cloudinary, saves the URLs. Needs `CLOUDINARY_URL` on the server. |

## Traffic Officer (assigned reports only)

| Method and path | Body | Notes |
|---|---|---|
| GET `/officer/reports` | same filters as the admin list | Only reports assigned to me |
| GET `/officer/reports/:id` | | Includes reporter contact because it is assigned to me |
| PATCH `/officer/reports/:id` | `status?` one of Additional Information Required, In Progress, Resolved/Closed; `remarks?` (at least one) | Officers cannot review, verify, assign or reject (#30) |

## Administrator

| Method and path | Body or query | Notes |
|---|---|---|
| GET `/admin/reports` | `status`, `accident_type_id`, `record_type`, `assigned_officer_id`, `date_from`, `date_to`, `location`, `q` (id, location or description text), `page`, `limit` | FR-11 search and filter |
| GET `/admin/reports/:id` | | Full detail with history |
| PATCH `/admin/reports/:id/status` | `status`, `remarks?`, `rejection_reason` (required when `Rejected`) | Not for `Assigned` (use assign). `Verified` sets `record_type = verified_record`. |
| PATCH `/admin/reports/:id/assign` | `officer_id`, `remarks?` | Sets status `Assigned`. The report must be **Verified** first (#30), or already have an officer (re-assign); never Rejected or Resolved/Closed. The officer must be an active Traffic Officer. |
| POST `/admin/accident-types` | `type_name` | Add a category |
| POST `/users` | `full_name`, `contact_email`, `password`, `role`, `contact_phone?` | Creates Traffic Officers (or any role) |
| GET `/users` | `role?` | |
| PATCH `/users/:id/role` | `role` | Not on yourself |
| PATCH `/users/:id/active` | `is_active` (boolean) | Deactivate or reactivate. Not on yourself. |
| GET `/admin/audit-logs` | same as `/auth/me/activity`, plus `user_id?` | Action log, "All staff" view (#27): actions by Administrators and Traffic Officers (reporters left out); each row adds `user: { user_id, full_name, role }`. |
| GET `/dashboard/stats` | | `cards` (total, pending, verified, closed), `by_status`, `by_type`, `trend` (last 30 days), `hotspots`, `map_points`, `recent` |
| GET `/exports/summary` | `period` = daily, weekly, monthly or annual; `date?` (YYYY-MM-DD) | FR-12 summary JSON |
| GET `/exports/reports.csv`, GET `/exports/reports.pdf` | same filters as the admin list | File download. Use `fetch` with the token and save the blob (a plain link cannot send the header). |

Every status change writes `report_status_history`, `audit_logs` and an in-app notification (plus an email to the reporter when Brevo is configured, #37; an assigned officer is told in the app only). Rejection reasons are stored in `official_remarks` as `Rejected: <reason>`.
