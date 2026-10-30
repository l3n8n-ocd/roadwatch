# RoadWatch test plan (FR-01 to FR-15)

**Owner:** Pauline (QA). **Status:** draft prepared Oct 21 from the built system for Pauline to review, then run
on the deployed system around Oct 29 (#14, #23). Fill **Actual** and **Result** (Pass / Fail / Blocked) while
testing. First run Oct 23: fixes in issues #39 to #44 (APK v1.0.1); re-tested Oct 24-25, all Pass (`docs/test-plan-retest.md`). Log every Fail as a GitHub issue (label `bug`, link the test ID) and re-test it after the fix.

## Setup

| Item | Value |
|---|---|
| Web (Administrator and Traffic Officer) | https://www.roadwatch-ph.me (old address https://roadwatch-theta.vercel.app also works) |
| API | https://api.roadwatch-ph.me/api (open `/api/health` first; the free tier sleeps and the first request can take up to a minute) |
| Mobile (Reporter and Traffic Officer) | `roadwatch.apk` from the latest GitHub Release (#22), Android phone with GPS and camera |
| Accounts | A1 Administrator (from `npm run seed:admin`); O1 Traffic Officer (created in TC-13.1); R1 and R2 Reporters (registered in TC-01.1) |
| Email | A real inbox for R1 (Brevo sends from `no-reply@roadwatch-ph.me`; check Spam too) |
| Tester, date, build | Name, date, app version (mobile Settings > About) and web version (admin About) |

Never put real passwords in this file. Use made-up test data (no real accident victims, plates or phone numbers).

## Test cases

### FR-01 User registration (mobile)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-01.1 | On the app: Create account, enter full name, a new email, a **Strong** password (8+ with uppercase, lowercase, a number and a symbol), optional mobile number; submit | Account created as a **Reporter** and signed in to Home (no role choice is offered) | | |
| TC-01.2 | Register again with the same email | "An account with this email already exists. Log in instead." on the Email field; no second account | | |
| TC-01.3 | Register with a 6-character password, then with an empty full name | Field errors ("Make the password Strong to save it." with the meter at **Weak**, "Use at least 8 characters (6 so far)."; name required); nothing is sent until fixed | | |
| TC-01.4 | Type into the Register password, one step at a time: `Abc12!`, `Sunflower`, `Sunflower7`, `Sunflower7!`; then a password with your own name (e.g. `Juan#2026x` for Juan Dela Cruz) and `Password1!` (#44) | The meter shows 1 red segment **Weak**, 2 amber **Fair** ("Add a number and a symbol"), 3 blue **Good** ("Add a symbol, or use 12+ characters"), 4 green **Strong**; the name and the common password both show **Weak** with a tip; only Strong can be saved; the level word is always shown next to the bar | | |

### FR-02 User login and logout

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-02.1 | Mobile: log in as R1, then Settings > Log out > confirm | Home opens; after Log out the login screen shows and the back button does not return to Home | | |
| TC-02.2 | Mobile: wrong password | "Couldn't log in": "Email or password is incorrect. Check both and try again." No hint about which one was wrong | | |
| TC-02.3 | Web: `/staff/sign-in` > **Administrator**, sign in as A1, then Log out (confirm dialog) | Dashboard opens; Log out lands on the Administrator sign-in form; opening `/admin` again also goes to that form | | |
| TC-02.4 | Web: sign in as R1 (a reporter) on either staff form | Refused with "This account uses the mobile app": "Reporter accounts sign in on the RoadWatch Android app." and a **Get the Android app** button (WRONG_PLATFORM, #36) | | |
| TC-02.5 | Mobile: log in as A1 | Refused with "Use the RoadWatch website" | | |
| TC-02.6 | Mobile: log in as O1 | Officer home opens on **Assigned** (tabs: Assigned, Notifications, Settings) | | |
| TC-02.7 | Mobile (R1, then O1): Log in > **Forgot password?** > email > Send code; type the 8-character code from the email and a new password (#37) | "If ... has a RoadWatch account, we sent it a code"; a wrong code shows "This code is wrong or has expired. Send a new code." under Code; the right code returns to Log in with "Password changed"; the new password works, the old one does not | | |
| TC-02.8 | Web (A1): `/staff/sign-in` > **Forgot password?**, same steps; then try the same code again, and a code older than 15 minutes (#37) | Same as TC-02.7 on the web; a used or expired code is refused; an unknown email gets the same "we sent it a code" message (nothing reveals whether an account exists) | | |
| TC-02.9 | Every password field (mobile Log in, Register, Change password, Forgot password; web sign-in, Change password, Create officer, Reset password): press the eye (#45) | The password shows and the icon becomes the crossed eye; it stays shown until pressed again; screen readers hear "Show password" / "Hide password" | | |
| TC-02.10 | Mobile Change password, web Change password and both Forgot password screens: enter a **Good** new password (e.g. `Sunflower7`) and save (#44) | Not saved: "Make the password Strong to save it." under New password, meter at Good with its tip; a Strong password saves | | |
| TC-02.11 | Web: open `/staff/sign-in`; pick **Administrator** and sign in with O1's email and password (#52) | The role chooser shows two cards (Administrator, Traffic Officer) and "Reporters use the RoadWatch Android app."; on the Administrator form O1 stays signed out with "This is a Traffic Officer account" ("Go back with "Choose a different role" and pick Traffic Officer.") | | |
| TC-02.12 | Web: **Choose a different role** > **Traffic Officer**, sign in as O1, then Log out (#52) | "Assigned to me" opens with the Traffic Officer console sidebar (Assigned to me, Demo video); opening `/admin` goes back to Assigned to me; Log out lands on the Traffic Officer form; "Forgot password?" from this form returns to it | | |

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
| TC-04.4 | Step 2: press **Expand map** (bottom-left), drag the map under the pin, Use this location; repeat with Cancel (#46) | Full-screen "Move the pin" view; Use this location moves the pin and refills the address; Cancel keeps the old pin | | |

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
| TC-07.4 | W4: press the main photo; use the arrows, the arrow keys, + and −, then Esc. Press **Expand map** (#46) | Full-screen photo viewer "Photo 2 of 3", uncropped, zoom works, no download button, Esc closes and focus returns; full-screen map with Close | | |
| TC-07.5 | Mobile tracking (R1) and officer details (O1): tap a photo, swipe; press Expand map (#46) | Photo viewer with swipe and pinch/double-tap zoom; full-screen map with the address (officer view keeps **Open in Maps**) | | |
| TC-07.6 | Landing "Public road updates" and W2 "Accident hotspots": press Expand map (#46) | Full-screen map with the list beside it (text alternative); Close or Esc returns | | |

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
| TC-08.9 | Web (O1, #52): open an assigned report from Assigned to me; Update investigation > In Progress with remarks > Save update | "Update saved: Status is now In Progress. The reporter and the admin were notified."; the history shows "O1 (Officer)"; only In Progress, Additional Information Required and Resolved/Closed can be chosen; a Rejected report is read-only | | |

### FR-09 Notifications (in-app and email)

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-09.1 | After TC-03.1, check R1's inbox | Email "RoadWatch: report #N received" from `no-reply@roadwatch-ph.me` | | |
| TC-09.2 | After each status change in FR-07/08 | R1 gets an in-app notification and an email for the change | | |
| TC-09.3 | R1: Notifications > Mark all as read; open one | Unread badge clears; tapping opens the report | | |
| TC-09.4 | Web (O1, #47): after an admin assigns a report to O1, look at the bell in the top bar; open it; select the new alert; then open it again and press **Mark all as read**; sign in as A1 | The bell shows the unread count ("Notifications (1 unread)" for screen readers); the panel lists "Report #N was assigned to you." with the unread dot; selecting it opens the report and lowers the count; Mark all as read clears it; Esc closes the panel and focus returns to the bell; A1's top bar has no bell | | |

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
| TC-13.6 | A1: Users > **Reset password** on R2 (temporary password + confirm), then log in as R2 with it (#37) | "Password reset" toast; R2 gets an email that the password was reset (without the password); R2 logs in with the temporary password; not offered on A1's own row or other administrators | | |
| TC-13.7 | A1: Create officer and Reset password with a temporary password that is not Strong (e.g. `Sunflower7`), and one that contains the person's name (#44) | Refused with "Make the password Strong to save it."; the meter under the field shows the level and tip; a Strong temporary password works | | |

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
| TC-P.3 | Demo video on web (`/demo-video`) as an Administrator and as a Traffic Officer (#48) | Two cards, Administrator and Traffic Officer, 30 seconds each; the signed-in role comes first with "Your role"; a clip plays from its Render URL with captions, "Transcript" opens the text; a clip without a URL says "Clip coming soon" | | |
| TC-P.4 | Open `/does-not-exist` | 404 page with Go back home | | |
| TC-P.5 | Web: landing footer and About block, `/about`, and the staff About (`/admin/about`, `/officer/about`), in Light and Dark (#48, #49) | No school, course or section wording anywhere; team shown with photos and titles (Project Lead & Mobile, Web & QA, Backend & Database, Documentation); "Built with" shows 29 logos in 6 groups, each with its name; one-color logos (Express, JWT, Vercel, Render, GitHub, PDFKit, Aiven text) stay visible in Dark | | |
| TC-P.6 | Mobile: Settings (version row), Settings > About RoadWatch, Settings > Demo video, in Light and Dark (#48, #49) | Version row says only "Version 1.2.0"; About has the 911 disclaimer and the Built with card (3 tiles per row); Settings > Demo video shows the Reporter clip with "Your role" (a Traffic Officer sees the Traffic Officer clip first, then the Reporter clip); "Read the transcript" opens the text; a clip without a URL says "Clip coming soon" (#48) | | |
| TC-P.7 | Landing page with and without `PROMO_VIDEO_URL` on Render, at 1440 and on a phone (#48) | Without it: no "Watch the video" section and no footer link. With it: a navy "Watch the video" section after How it works plays the promo (captions on, Transcript when `PROMO_VIDEO_TRANSCRIPT` is set); the footer link "Watch the video" scrolls to it | | |

### v1.2.0: priority, Users toolbar, guide, nearby on-duty officers (#54 to #57, DECISIONS #49, #50)

Before these: run `npm run migrate` on the database once (Aiven), and have two officers (O1, O2) on the app with location on.

| ID | Steps | Expected | Actual | Result |
|---|---|---|---|---|
| TC-V.1 | R1 submits a Pedestrian accident with Fatalities, then a Collision with no injuries; A1 opens Reports (#54) | The first is **Urgent**, the second **Medium**; Reports is sorted Urgent first, each row shows the Priority chip (icon + word); the Priority filter shows only that level; R1's app never shows a priority | | |
| TC-V.2 | A1 opens the Collision report, Change priority > High > Save priority; then Back to automatic | Chip shows High and "Set by admin · was Medium"; the Action log has "report.priority_changed"; Back to automatic returns to Medium with "Auto · Collision, no injuries" | | |
| TC-V.3 | O1 on the app: Assigned > Sort by Priority (Urgent first), then Newest first | The order changes; each card shows its Priority chip; O1 cannot change the priority anywhere | | |
| TC-V.4 | A1: Users & settings; press Edit with no row selected; select an officer's round button > Edit; change the phone > Save changes (#55) | Edit is disabled until a row is selected; no buttons in the rows; the dialog shows name, phone, role, Reset password and Deactivate; the phone saves and the Action log has "user.updated" | | |
| TC-V.5 | A1 selects their own row > Edit | Role, Reset password and Deactivate are disabled with "aren't available for your own account"; name and phone can be saved | | |
| TC-V.6 | A1: + Create officer (dialog) creates O2; Nearby officers > Alert range 5 > Save range | O2 can sign in; "Alert range saved"; the Action log has "settings.updated" | | |
| TC-V.7 | O1 and O2 switch **On duty** on the app (allow location), both within 5 km of a spot; R1 reports an accident there with GPS on (#57) | Within 30 seconds both phones show "Accident reported near you" with the priority, "Not yet verified", the distance and Respond / Not now; both get an email | | |
| TC-V.8 | O2 presses Respond first, then O1 presses Respond | O2 opens the report with "You're responding"; O1 sees "Already taken: O2 responded first..." | | |
| TC-V.9 | O2: Confirm on scene > confirm | Status **In Progress**, badge **Verified record**; R1 is notified; A1's Reports row says "Responded on scene · O2" | | |
| TC-V.10 | Repeat TC-V.7; the responding officer presses Reject report with a reason | Status Rejected with the reason; A1 gets an in-app note and sees "Rejected on scene"; A1 can set it back to Under Review | | |
| TC-V.11 | Repeat TC-V.7 but nobody responds for 10 minutes | The alert disappears from the phones; A1's Reports row says "No nearby officer responded · N min"; A1 verifies and assigns as usual | | |
| TC-V.12 | O1 switches On duty off; R1 reports near O1 | O1 gets no alert; the location is cleared on the server | | |
| TC-V.13 | Web O1: Assigned to me > On duty on (allow location in the browser) and repeat TC-V.7 | The web shows the same alert card with Respond / Not now; Respond opens the report with Confirm on scene / Reject report | | |
| TC-V.14 | Web A1 and O1: press **Guide** in the top bar (on a phone: account menu > Guide) on Dashboard, Reports, a report, Users & settings and Assigned to me (#56) | A text tour of that page: "STEP n OF m", a ring around the part explained, Back / Next / Done, Esc closes, ← → change steps; Read aloud speaks the step and Speed changes it; nothing depends on sound | | |
| TC-V.15 | App R1: Home > Guide (top bar); Settings > Accessibility > Read aloud on, Reading speed 1.25×, Start the guide | 5-step tour of Home; with Read aloud on each step is spoken; Start the guide goes back to Home and starts it; the Videos row says captions and transcripts are always available | | |
| TC-V.16 | App O1: Assigned > Guide | 4-step tour: On duty, Filter by status, Sort by, the list | | |

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
