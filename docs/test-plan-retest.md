# RoadWatch re-test after the Oct 23 fixes (v1.0.1)

**Result (Oct 24-25, Pauline, APK v1.0.1): all 10 re-tests Pass;** issues #39 to #44 closed on Oct 25.

**Owner:** Pauline (QA). **What:** only the test cases that failed, had wrong evidence, or are new after the first run on Oct 23. The fixes are in PR #38 (merged Oct 23): API and web are live; the phone needs APK **v1.0.1**. Fill **Actual** and **Result** (Pass / Fail / Blocked) with a screenshot for each row. When a row passes, write the date in the Bug log's **Re-test result** and close its GitHub issue; if it fails again, write "Fail again" with the date and comment on the issue.

## Setup

| Item | Value |
|---|---|
| Web (Administrator only) | https://roadwatch-theta.vercel.app |
| API | https://roadwatch-api-gnky.onrender.com/api (open `/api/health` first; runs on Node 22.23.4 since Oct 23) |
| Mobile | `roadwatch.apk` **v1.0.1** from the latest GitHub Release; check Settings > About shows 1.0.1 (uninstall the old app if the install fails) |
| Accounts | A1 Administrator, O1 Traffic Officer, R1 and R2 Reporters (same as the first run) |
| Tester, date | Name and date of the re-test |

Never write passwords in this file or show them in screenshots. Use made-up test data.

## Web (do these first)

| ID | Issue | First run | Steps | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| TC-14.3 | #43 | Pass (should have been Fail) | A1: user menu > **Change password**. Enter a wrong current password and a new one, then Update password. Then do it again with the right current password (use this to change A1's password) | Wrong password: "Your current password is incorrect." under **Current password**, no "Validation failed" box. Right password: "Password changed."; Action log > Profile and password shows the entry | Wrong current password: "Your current password is incorrect." under Current password, no "Validation failed" box. Right password: "Password changed."; Action log lists it. A1's password is now changed (Oct 24-25) | Pass |
| TC-02.3 | #41 | Fail | A1: Log out > confirm. Then type `/admin` in the address bar | Log out lands on the **Administrator sign-in** page (not the landing page); `/admin` also goes to sign-in | Log out landed on the Administrator sign-in page; `/admin` also opened the sign-in page (Oct 24-25) | Pass |
| TC-02.4 | - | Fail (button wording) | Sign in on the web with R1's email and password | Refused with "This account uses the mobile app" and a **Get the Android app** button; no dashboard | R1 refused with "This account uses the mobile app" and the Get the Android app button; no dashboard (Oct 24-25) | Pass |
| TC-11.1 | #39 | Fail | A1: Reports > Search `RW-000004` (also try `#4` and `4`), then a word from a report's location | Only the matching report; the count says "1 report matches these filters" | `RW-000004`, `#4` and `4` each listed only RW-000004 ("1 report matches these filters"); a location word listed only the matching reports (Oct 24-25) | Pass |
| TC-11.2 | #39 | Fail | Clear the search box. Filter by status, accident type, date range and location one at a time, then combined; then Clear filters | Each filter narrows the list; combined filters work; Clear filters shows all reports again | Each filter narrowed the list; combined filters worked; Clear filters showed all reports again (Oct 24-25) | Pass |
| TC-15.2 | #42 | Fail | Reports (with a filter) > **Export PDF**; open the file | Landscape table: Report, Date and time, Type, Location, Injuries, Status, Record, Reporter, Officer; the filters in the title; header row repeats; "Page X of Y" at the bottom | PDF opened as a landscape table with the filters in the title, the header row on every page and "Page X of Y" (Oct 24-25) | Pass |
| TC-08.2 | - | Pass, wrong screenshot | Open a report that is **not yet Verified** (Submitted or Under Review) and try to assign an officer | Refused: "Verify the report first..."; screenshot this refusal | Assign officer on a Submitted report was refused: "Verify the report first. You can assign an officer once it is Verified." (Oct 24-25) | Pass |

## Web and phone

| ID | Issue | First run | Steps | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| TC-13.3 | #40 | Fail | Web: Users > deactivate R2. Phone: log in as R2 with the **right** password, then with a wrong one. Web: reactivate R2 afterwards | Right password: "**Account deactivated**". Wrong password: "Couldn't log in". After reactivation R2 can log in | R2 with the right password: "Account deactivated"; wrong password: "Couldn't log in"; after reactivation R2 logged in (Oct 24-25) | Pass |
| TC-08.6 | #44 | Fail | Web: verify a new report and assign it to O1. Phone (O1): open it > Update status > In Progress with remarks, then Resolved/Closed | Only In Progress, Additional Information Required and Resolved/Closed are offered; "Update saved" toast; admin and R1 see the new status | O1 could choose only In Progress, Additional Information Required and Resolved/Closed; "Update saved" toast; admin and R1 saw Resolved/Closed (Oct 24-25) | Pass |
| TC-08.8 | #44 | New | Web: verify another report, assign it to O1, then **Reject** it with a reason. Phone (O1): Assigned tab, then open the report from "All assigned to me" | Not listed under "All open"; no Update status button; the note "An administrator rejected this report, so it can no longer be updated" | Rejected report not under "All open", listed under "All assigned to me"; no Update status button; the rejection note shown (Oct 24-25) | Pass |

## Bug log

| Bug | Test ID | Issue link | Fixed in | Re-test result |
|---|---|---|---|---|
| Searching the Report ID as shown (RW-000004) finds nothing; rows return only after pressing X | TC-11.1, TC-11.2 | #39 | PR #38 (Oct 23) | Pass, Oct 25 |
| Deactivated account says "Couldn't log in" instead of "Account deactivated" | TC-13.3 | #40 | PR #38 + APK v1.0.1 | Pass, Oct 25 |
| Web Log out goes to the landing page instead of sign-in | TC-02.3 | #41 | PR #38 | Pass, Oct 25 |
| PDF export is plain text with no table layout | TC-15.2 | #42 | PR #38 | Pass, Oct 25 |
| Change password shows "Validation failed" instead of the field error | TC-14.3 | #43 | PR #38 | Pass, Oct 25 |
| Officer can move a Rejected report back to In Progress | TC-08.6, TC-08.8 | #44 | PR #38 + APK v1.0.1 | Pass, Oct 25 |

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| QA | Pauline Lapuz | | |
| Project Leader | Lenon Adriano | | |
