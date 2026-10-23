# RoadWatch test plan (FR-01 to FR-15)

**Owner:** Pauline (QA). **Status:** draft prepared Oct 21 from the built system for Pauline to review, then run
on the deployed system around Oct 29 (#14, #23). Fill **Actual** and **Result** (Pass / Fail / Blocked) while
testing. First run Oct 23: fixes in issues #39 to #44 (APK v1.0.1); re-test those rows after the fix is deployed. Log every Fail as a GitHub issue (label `bug`, link the test ID) and re-test it after the fix.

## Setup

| Item | Value |
|---|---|
| Web (Administrator only) | https://roadwatch-theta.vercel.app |
| API | https://roadwatch-api-gnky.onrender.com/api (open `/api/health` first; the free tier sleeps and the first request can take up to a minute) |
| Mobile (Reporter and Traffic Officer) | `roadwatch.apk` from the latest GitHub Release (#22), Android phone with GPS and camera |
| Accounts | A1 Administrator (from `npm run seed:admin`); O1 Traffic Officer (created in TC-13.1); R1 and R2 Reporters (registered in TC-01.1) |
| Email | A real inbox for R1 (Brevo sends from `no-reply@roadwatch-ph.me`; check Spam too) |
| Tester, date, build | Name, date, app version (mobile Settings > About) and web version (admin About) |

Never put real passwords in this file. Use made-up test data (no real accident victims, plates or phone numbers).

## Test cases

### FR-01 User registration (mobile)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-01.1 | On the app: Create account, enter full name, a new email, password of 8+ characters, optional mobile number; submit | Account created as a **Reporter** and signed in to Home (no role choice is offered) | | |
| TC-01.2 | Register again with the same email | "An account with this email already exists. Log in instead." on the Email field; no second account | | |
| TC-01.3 | Register with a 6-character password, then with an empty full name | Field errors ("at least 8 characters", name required); nothing is sent until fixed | | |

### FR-02 User login and logout

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-02.1 | Mobile: log in as R1, then Settings > Log out > confirm | Home opens; after Log out the login screen shows and the back button does not return to Home | | |
| TC-02.2 | Mobile: wrong password | "Couldn't log in": "Email or password is incorrect. Check both and try again." No hint about which one was wrong | | |
| TC-02.3 | Web: sign in as A1 at `/staff/sign-in`, then Log out (confirm dialog) | Dashboard opens; Log out lands on the Administrator sign-in page; opening `/admin` again also goes to sign-in | | |
| TC-02.4 | Web: sign in as R1 (a reporter) | Refused with the "This account uses the mobile app" message and a **Get the Android app** button (WRONG_PLATFORM, #36) | | |
| TC-02.5 | Mobile: log in as A1 | Refused with "Use the RoadWatch website" | | |
| TC-02.6 | Mobile: log in as O1 | Officer home opens on **Assigned** (tabs: Assigned, Notifications, Settings) | | |

### FR-03 Accident reporting (mobile)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-03.1 | As R1: Home > Report an Accident; fill type, date, time, injuries, vehicles, description (10+ characters); finish location and photos; Submit | Confirmation screen with a Report ID (RW-000xxx), status Submitted, "Public submission" badge | | |
| TC-03.2 | Step 1 with empty required fields, then a date in the future | Field errors; "Date cannot be in the future"; Next stays on step 1 | | |
| TC-03.3 | Injuries: choose **Unknown** | Accepted; shows as Unknown on tracking and on the admin details | | |

### FR-04 Location capture

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-04.1 | Step 2: Use my current location (allow permission) | Pin on the map, coordinates shown, address filled from OpenStreetMap; address stays editable | | |
| TC-04.2 | Deny location permission; tap the map to place a pin, type a landmark | "Location is off" notice; manual pin and typed location are accepted | | |
| TC-04.3 | Remove the pin and type only a location | Report submits without coordinates (location text is required, pin is optional) | | |

### FR-05 Evidence upload

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-05.1 | Step 3: add 2 photos (camera and gallery), submit | Both upload; they show on tracking (M6) and on the admin report page (W4) | | |
| TC-05.2 | Add a photo larger than 5 MB | "Too large" on that tile; the other photos still upload | | |
| TC-05.3 | Try to add a 6th photo; try a non-image file | At most 5 photos (JPG, PNG, WebP); others are refused with a message | | |
| TC-05.4 | Submit with no photos | Accepted (photos are optional) | | |

### FR-06 Report tracking

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-06.1 | R1: My reports; open the report from TC-03.1 | List newest first with status chips (text + color); details show status history with times and the actor's **role** (not staff names) | | |
| TC-06.2 | Filter My reports by status | Only matching reports; empty state when none | | |
| TC-06.3 | Sign in as R2 and look for R1's report | Not listed; R2 sees only R2's reports | | |

### FR-07 Report management (web)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-07.1 | A1: Reports, open R1's report | Details, map, photos, history; reporter contact hidden until "Show contact details" | | |
| TC-07.2 | Set Under Review with remarks | Status and history update; R1 gets an in-app notification | | |
| TC-07.3 | Open `/admin/reports/999999` | "Report not found" state, no crash | | |

### FR-08 Report verification

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-08.1 | Mark as Verified (confirm dialog) | Status Verified; badge changes from Public submission to **Verified record** (`record_type = verified_record`) | | |
| TC-08.2 | On a report that is **not yet Verified**, try to assign an officer (screenshot the refusal, not a later successful assignment) | Refused: "Verify the report first..." (#30) | | |
| TC-08.3 | Set Additional Information Required with remarks (incomplete report) | R1 sees the status and the remarks on tracking | | |
| TC-08.4 | Reject a duplicate with reason "Duplicate of RW-000xxx" | Reason is required (3+ characters); R1 sees Rejected and the reason | | |
| TC-08.5 | Assign the verified report to O1 | Status Assigned; O1 gets a notification; O1 sees it in Assigned | | |
| TC-08.6 | O1: open it, Update status > In Progress with remarks, then Resolved/Closed | Officer can only pick In Progress, Additional Information Required, Resolved/Closed; "Update saved" toast; admin and R1 see the new status | | |
| TC-08.7 | O1: Open in Maps; Call on the reporter card | Maps app opens at the pin; dialer opens with R1's number | | |
| TC-08.8 | Admin rejects a report assigned to O1; O1 opens it on the app | Not listed under "All open"; no Update status button, a note says the administrator rejected it (issue #44) | | |

### FR-09 Notifications (in-app and email)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-09.1 | After TC-03.1, check R1's inbox | Email "RoadWatch: report #N received" from `no-reply@roadwatch-ph.me` | | |
| TC-09.2 | After each status change in FR-07/08 | R1 gets an in-app notification and an email for the change | | |
| TC-09.3 | R1: Notifications > Mark all as read; open one | Unread badge clears; tapping opens the report | | |

### FR-10 Dashboard

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-10.1 | A1: Dashboard | Cards (total, pending, verified, closed) match the Reports page counts; trend and type charts; hotspot map; recent reports | | |
| TC-10.2 | Charts and map with a screen reader or "View as table" | Each chart and the map has a text or table alternative | | |

### FR-11 Search and filtering

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-11.1 | Reports: search by Report ID as shown (`RW-000004`, also `#4` or `4`), then by a word in the location | Matching rows only; count updates | | |
| TC-11.2 | Filter by status, accident type, date range, location | Each filter narrows the list; combined filters work; Clear filters resets | | |
| TC-11.3 | Filters with no match | "No reports match these filters" state | | |

### FR-12 Report generation

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-12.1 | Summaries: Daily, Weekly, Monthly, Annual for a period with reports | Totals by status and by type match the data | | |

### FR-13 User management

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-13.1 | A1: Users > Create officer account (name, email, password) | O1 listed as Traffic Officer, Active; O1 can log in on mobile | | |
| TC-13.2 | Change R2's role to Traffic Officer and back | Role changes; R2's next sign-in follows the new role | | |
| TC-13.3 | Deactivate R2 (confirm dialog), then log in as R2 on mobile | "Account deactivated" message; R2's reports and history remain | | |
| TC-13.4 | Reactivate R2 | R2 can log in again | | |
| TC-13.5 | A1 tries to deactivate or change the role of A1's own account | Not offered in the UI ("You can't deactivate your own account"); the API refuses it too | | |

### FR-14 Audit trail

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-14.1 | A1: user menu > Action log > All staff | Entries for the verify, assign, status changes, officer creation, deactivate and reactivate above, with actor, time and target | | |
| TC-14.2 | Filter by action and period | Only matching entries | | |
| TC-14.3 | Edit profile and Change password (wrong current password first) | Wrong current password shows a field error; success is logged as "Profile and password" entries | | |

### FR-15 Data export

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-15.1 | Reports or Summaries: Export CSV with a filter applied | CSV downloads; rows match the filter; opens in Excel or Sheets | | |
| TC-15.2 | Export PDF | PDF downloads with the same rows and a readable layout | | |

### Public pages and demo video

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-P.1 | Open the landing page signed out | Stats bar, public road updates (verified records only, no reporter names), hotlines, FAQ | | |
| TC-P.2 | Download the app on an Android phone | `roadwatch.apk` downloads and installs | | |
| TC-P.3 | Demo video on web (`/demo-video`) and mobile (Settings > Demo video) | Plays from `DEMO_VIDEO_URL`, or shows "Video coming soon" if not set | | |
| TC-P.4 | Open `/does-not-exist` | 404 page with Go back home | | |

## Accessibility (WCAG 2.1 AA target)

| ID | Check | Expected | Actual | Result |
|---|---|---|---|---|
| TC-A.1 | Web keyboard only: sign in, open a report, verify it, log out | Every control reachable with Tab, visible focus ring, dialogs trap focus and close with Esc | | |
| TC-A.2 | Contrast check (browser DevTools or WebAIM) on landing, dashboard, report details, light and dark | Normal text at least 4.5:1 | | |
| TC-A.3 | Web at 390 px wide and at 200% zoom | No horizontal scrolling, no clipped text | | |
| TC-A.4 | Android TalkBack: submit a report, read tracking | Every field and icon button is announced with a label; status read as text | | |
| TC-A.5 | Android font size at largest; Remove animations on | Text scales without overlap; motion becomes short fades | | |
| TC-A.6 | Status chips everywhere | Status is shown as text, never by color alone | | |

## Bug log

| Bug | Test ID | Issue link | Fixed in | Re-test result |
|---|---|---|---|---|
| | | | | |

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| QA | Pauline Lapuz | | |
| Project Leader | Lenon Adriano | | |
