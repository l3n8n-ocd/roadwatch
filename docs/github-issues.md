# RoadWatch GitHub Issues Checklist (updated Oct 13)

Owners are proposed. Fixed dates: Oct 12 open, Oct 30 close, Nov 2 submission. Other dates are internal checkpoints.

Use either: paste each block as a GitHub issue, or run `bash create-issues.sh` once (needs GitHub CLI).


## Milestone: M0 Foundation Prep (due 2026-10-14)

### 1. Hold kickoff meeting and confirm decisions
**Owner:** Lenon | **Due:** Oct 13

- [ ] Confirm stack, roles and action items
- [ ] Confirm login required (anonymous reporting to be asked Oct 16)
- [ ] Confirm the 8 report statuses and email-only notifications

### 2. Collect GitHub usernames and no-reply emails; fill scripts/members.conf
**Owner:** Lenon | **Due:** Oct 14

- [ ] Get each member's GitHub username
- [ ] Look up the numeric ID at api.github.com/users/<username>
- [ ] Build ID+username@users.noreply.github.com for each member
- [ ] Replace REPLACE_ME in scripts/members.conf
- [ ] Turn on Keep my email private and Block command line pushes that expose my email
- [ ] Test scripts/commit-as.sh once and check the author on GitHub

### 3. Log decisions in docs/DECISIONS.md
**Owner:** Princess | **Due:** Oct 14

- [ ] Copy the decisions table from the starter zip
- [ ] Add the professor follow-up for Oct 16
- [ ] Update the file whenever a decision changes


## Milestone: M1 Foundation (Oct 16) (due 2026-10-16)

### 4. Set up the public GitHub repo from the starter zip
**Owner:** Lenon | **Due:** Oct 14

- [ ] Create public repo roadwatch on your account
- [ ] Unzip starter, git init, git branch -M main, first commit
- [ ] Push main, then create and push dev
- [ ] Protect main: block force pushes and deletions, no required approvals
- [ ] Merge dev into main with merge commits, never squash
- [ ] Run git lfs install once on your machine

### 5. Create the Aiven MySQL service and load the schema
**Owner:** Carl | **Due:** Oct 15

- [ ] Create the free Aiven MySQL service
- [ ] Save host, port, user, password and the CA certificate privately
- [ ] Use the database Aiven provides (defaultdb) and run schema.sql then seed.sql as they are
- [ ] Run database/schema.sql then seed.sql (users table includes is_active)
- [ ] Verify all 8 tables exist and users.is_active is present (npm run check:db)
- [ ] Optional: keep a local MySQL for development

### 6. Run the API skeleton
**Owner:** Carl | **Due:** Oct 15

- [ ] cd api, copy .env.example to .env
- [ ] npm install and npm run dev
- [ ] Open /api/health and /api/app-info
- [ ] Connect Sequelize using src/config/dbConfig.js (set DB_SSL=true for Aiven), then run npm run check:db
- [ ] npm test passes

### 7. Draw wireframes in Figma (web and mobile)
**Owner:** Pauline, Lenon | **Due:** Oct 16

- [ ] Mobile: login, register, report form, location, photos, confirmation, tracking, demo video
- [ ] Web: login, dashboard, report list, report details, users, demo video
- [ ] Share the Figma link with the team
- [ ] Export PNGs to docs/ui-design/

### 8. Generate the Vite and Flutter projects
**Owner:** Lenon, Pauline | **Due:** Oct 16

- [ ] Pauline: follow web/SETUP.md
- [ ] Lenon: follow mobile/SETUP.md
- [ ] Both apps start with an empty screen
- [ ] Hand the files to Lenon to commit under each author

### 9. Ask the professor about anonymous reporting
**Owner:** Princess | **Due:** Oct 16

- [ ] Ask whether anonymous or guest reporting is required
- [ ] Log the answer in docs/DECISIONS.md
- [ ] If yes: make reporter_id nullable, add a tracking code, and tell Carl before step 11 (Oct 20)


## Milestone: M2 Core Flow (Oct 21) (due 2026-10-21)

### 10. Register, login, JWT, roles and admin seed
**Owner:** Carl | **Due:** Oct 18

- [ ] POST /api/auth/register: name, email, password (min 8), optional phone
- [ ] Registration always creates a Reporter and ignores any role from the client
- [ ] POST /api/auth/login with JWT and bcrypt
- [ ] Role middleware: reporter, admin, officer
- [ ] npm run seed:admin creates the first Administrator from .env
- [ ] Test in Postman or Thunder Client

### 11. Report submission endpoints and Cloudinary upload
**Owner:** Carl | **Due:** Oct 20

- [ ] Create report
- [ ] List my reports and get one report
- [ ] Photo upload with multer to Cloudinary
- [ ] Save URLs in report_photos
- [ ] Write the first row in report_status_history

### 12. Mobile: register, login and report form
**Owner:** Lenon | **Due:** Oct 21

- [ ] Register and login screens
- [ ] Details form
- [ ] Location (manual first, then GPS and map)
- [ ] Photo upload
- [ ] Submit and confirmation with Report ID

### 13. Web: login, report list and report details
**Owner:** Pauline | **Due:** Oct 21

- [ ] Login with role-based redirect
- [ ] Report list
- [ ] Report details page
- [ ] Show reports submitted from mobile

### 14. Start the test plan
**Owner:** Pauline | **Due:** Oct 21

- [ ] One test case per FR-01 to FR-15
- [ ] Columns: steps, expected, actual, pass/fail
- [ ] Save in docs/


## Milestone: M3 Workflows (Oct 26) (due 2026-10-26)

### 15. Admin and officer endpoints and user management
**Owner:** Carl | **Due:** Oct 24

- [ ] Verify or reject with reason
- [ ] Assign officer, update status, officer remarks
- [ ] Set record_type to verified_record when verified
- [ ] Write report_status_history and audit_logs
- [ ] POST /api/users (admin only) creates Traffic Officers
- [ ] Promote or deactivate users, logged in audit_logs

### 16. Web admin pages including User Management
**Owner:** Pauline | **Due:** Oct 25

- [ ] Status management and officer assignment
- [ ] Search and filters (date, location, status, type)
- [ ] Officer queue page
- [ ] User Management page: create officers, change roles, deactivate

### 17. Mobile tracking and notifications screens
**Owner:** Lenon | **Due:** Oct 25

- [ ] My reports list with status chips
- [ ] Status history
- [ ] Notifications screen

### 18. Email notifications with Nodemailer and Gmail SMTP
**Owner:** Carl | **Due:** Oct 25

- [ ] Use src/config/mailer.js with MAIL_PROVIDER=smtp (Gmail app password)
- [ ] Set SMTP_USER, SMTP_PASS (Gmail app password) and MAIL_FROM
- [ ] Resend is optional and only emails other people after you verify a domain
- [ ] Send on submission and on status change
- [ ] Save a row in notifications

### 19. Dashboard and exports
**Owner:** Pauline, Carl | **Due:** Oct 26

- [ ] Pauline: summary cards, charts, map of reports
- [ ] Carl: daily, weekly, monthly and annual summaries
- [ ] Carl: PDF and CSV export (FR-15)

### 20. Demo video feature in API, web and mobile
**Owner:** Carl, Pauline, Lenon | **Due:** Oct 26

- [ ] Carl: GET /api/app-info returns DEMO_VIDEO_URL (already in the starter)
- [ ] Pauline: Demo Video page with a video tag and a coming soon fallback
- [ ] Lenon: Demo Video screen with video_player and a coming soon fallback
- [ ] Finish before the Oct 30 freeze


## Milestone: M4 Deploy and Test (Oct 30) (due 2026-10-30)

### 21. Deploy API, database and web
**Owner:** Carl | **Due:** Oct 28

- [ ] API on Render
- [ ] Aiven MySQL: set DB_SSL=true and the CA certificate in the host environment
- [ ] Web on Vercel (root folder web) with VITE_API_URL
- [ ] Set all env vars from .env.example on the host
- [ ] Confirm MAIL_PROVIDER=smtp and the Gmail app password are set on Render
- [ ] Open the API a few minutes before any demo (free tiers sleep)

### 22. Build the release APK
**Owner:** Lenon | **Due:** Oct 28

- [ ] Point the app at the deployed API
- [ ] git tag v1.0.0 and push tags
- [ ] Download the roadwatch-apk artifact

### 23. Run the full test plan on the deployed system
**Owner:** Pauline | **Due:** Oct 29

- [ ] Run every test case
- [ ] Log bugs as issues
- [ ] Re-test fixes

### 24. Bug fixes only
**Owner:** All | **Due:** Oct 30

- [ ] No new features after Oct 27
- [ ] Fix bugs from the test log

### 25. Feature freeze and final tag
**Owner:** Lenon | **Due:** Oct 30

- [ ] Merge dev into main with a merge commit
- [ ] Tag the final version


> Issues 28 and 29 moved to M4 on Oct 20: the demo and promotional video is due Oct 30 (DECISIONS #34).

### 28. Record the demo and promotional video
**Owner:** All | **Due:** Oct 30

- [ ] MP4, any length, decided by the Documentation Lead
- [ ] Technologies used
- [ ] Demo of major features
- [ ] Database structure and architecture
- [ ] Challenges and solutions
- [ ] Every member speaks

### 29. Publish the demo video
**Owner:** Princess, Lenon, Carl | **Due:** Oct 30

- [ ] Princess: export the final MP4 and upload it to Cloudinary
- [ ] Lenon: git lfs install, commit docs/video/roadwatch-demo.mp4 (LFS, 1 GB free storage, check bandwidth)
- [ ] Carl: set DEMO_VIDEO_URL on the API host
- [ ] Check the video plays in the web page and the mobile screen

## Milestone: M5 Docs and Submission (Nov 2) (due 2026-11-02)

### 26. PowerPoint user guide
**Owner:** Princess | **Due:** Nov 1

- [ ] Screenshots of each screen
- [ ] Steps for reporter, admin and officer
- [ ] Save in docs/user-guide/

### 27. Individual contribution report
**Owner:** Princess | **Due:** Nov 1

- [ ] Fill docs/contributions/CONTRIBUTIONS.md
- [ ] Attach commit-log.txt and handoff-log.csv
- [ ] Get sign-offs

### 30. Final submission check
**Owner:** Lenon | **Due:** Nov 2

- [ ] Working deployed system (web and mobile)
- [ ] Source code
- [ ] Database files and schema
- [ ] PPT user guide
- [ ] Video
- [ ] Contribution report


## Cut order if time runs short
Dashboard map, then charts, then PDF export. Never cut login, report submission, status tracking or admin review.
