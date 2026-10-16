#!/usr/bin/env bash
# Creates labels, milestones and issues for RoadWatch using the GitHub CLI (gh).
# Run once inside the cloned repo after: gh auth login. Running it twice creates duplicate issues.
set -uo pipefail
gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login"; exit 1; }

for l in owner:lenon owner:pauline owner:carl owner:princess owner:all; do gh label create "$l" --color 0B2545 --force >/dev/null; done
gh label create "phase:0-prep" --color 4A7FB5 --force >/dev/null
gh label create "phase:1-foundation" --color 4A7FB5 --force >/dev/null
gh label create "phase:2-core-flow" --color 4A7FB5 --force >/dev/null
gh label create "phase:3-workflows" --color 4A7FB5 --force >/dev/null
gh label create "phase:4-deploy-test" --color 4A7FB5 --force >/dev/null
gh label create "phase:5-docs-submit" --color 4A7FB5 --force >/dev/null

gh api repos/{owner}/{repo}/milestones -f title="M0 Foundation Prep" -f due_on="2026-10-14T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M0 Foundation Prep"
gh api repos/{owner}/{repo}/milestones -f title="M1 Foundation (Oct 16)" -f due_on="2026-10-16T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M1 Foundation (Oct 16)"
gh api repos/{owner}/{repo}/milestones -f title="M2 Core Flow (Oct 21)" -f due_on="2026-10-21T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M2 Core Flow (Oct 21)"
gh api repos/{owner}/{repo}/milestones -f title="M3 Workflows (Oct 26)" -f due_on="2026-10-26T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M3 Workflows (Oct 26)"
gh api repos/{owner}/{repo}/milestones -f title="M4 Deploy and Test (Oct 30)" -f due_on="2026-10-30T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M4 Deploy and Test (Oct 30)"
gh api repos/{owner}/{repo}/milestones -f title="M5 Docs and Submission (Nov 2)" -f due_on="2026-11-02T23:59:59Z" >/dev/null 2>&1 || echo "Milestone exists: M5 Docs and Submission (Nov 2)"

gh issue create --title "Hold kickoff meeting and confirm decisions" --milestone "M0 Foundation Prep" --label "owner:lenon,phase:0-prep" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 13

- [ ] Confirm stack, roles and action items
- [ ] Confirm login required (anonymous reporting to be asked Oct 16)
- [ ] Confirm the 8 report statuses and email-only notifications
EOF
gh issue create --title "Collect GitHub usernames and no-reply emails; fill scripts/members.conf" --milestone "M0 Foundation Prep" --label "owner:lenon,phase:0-prep" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 14

- [ ] Get each member's GitHub username
- [ ] Look up the numeric ID at api.github.com/users/<username>
- [ ] Build ID+username@users.noreply.github.com for each member
- [ ] Replace REPLACE_ME in scripts/members.conf
- [ ] Turn on Keep my email private and Block command line pushes that expose my email
- [ ] Test scripts/commit-as.sh once and check the author on GitHub
EOF
gh issue create --title "Log decisions in docs/DECISIONS.md" --milestone "M0 Foundation Prep" --label "owner:princess,phase:0-prep" --body-file - << 'EOF'
**Owner:** Princess
**Due:** Oct 14

- [ ] Copy the decisions table from the starter zip
- [ ] Add the professor follow-up for Oct 16
- [ ] Update the file whenever a decision changes
EOF
gh issue create --title "Set up the public GitHub repo from the starter zip" --milestone "M1 Foundation (Oct 16)" --label "owner:lenon,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 14

- [ ] Create public repo roadwatch on your account
- [ ] Unzip starter, git init, git branch -M main, first commit
- [ ] Push main, then create and push dev
- [ ] Protect main: block force pushes and deletions, no required approvals
- [ ] Merge dev into main with merge commits, never squash
- [ ] Run git lfs install once on your machine
EOF
gh issue create --title "Create the Aiven MySQL service and load the schema" --milestone "M1 Foundation (Oct 16)" --label "owner:carl,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 15

- [ ] Create the free Aiven MySQL service
- [ ] Save host, port, user, password and the CA certificate privately
- [ ] Use the database Aiven provides (defaultdb) and run schema.sql then seed.sql as they are
- [ ] Run database/schema.sql then seed.sql (users table includes is_active)
- [ ] Verify all 8 tables exist and users.is_active is present (npm run check:db)
- [ ] Optional: keep a local MySQL for development
EOF
gh issue create --title "Run the API skeleton" --milestone "M1 Foundation (Oct 16)" --label "owner:carl,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 15

- [ ] cd api, copy .env.example to .env
- [ ] npm install and npm run dev
- [ ] Open /api/health and /api/app-info
- [ ] Connect Sequelize using src/config/dbConfig.js (set DB_SSL=true for Aiven), then run npm run check:db
- [ ] npm test passes
EOF
gh issue create --title "Draw wireframes in Figma (web and mobile)" --milestone "M1 Foundation (Oct 16)" --label "owner:pauline,owner:lenon,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Pauline, Lenon
**Due:** Oct 16

- [ ] Mobile: login, register, report form, location, photos, confirmation, tracking, demo video
- [ ] Web: login, dashboard, report list, report details, users, demo video
- [ ] Share the Figma link with the team
- [ ] Export PNGs to docs/ui-design/
EOF
gh issue create --title "Generate the Vite and Flutter projects" --milestone "M1 Foundation (Oct 16)" --label "owner:lenon,owner:pauline,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Lenon, Pauline
**Due:** Oct 16

- [ ] Pauline: follow web/SETUP.md
- [ ] Lenon: follow mobile/SETUP.md
- [ ] Both apps start with an empty screen
- [ ] Hand the files to Lenon to commit under each author
EOF
gh issue create --title "Ask the professor about anonymous reporting" --milestone "M1 Foundation (Oct 16)" --label "owner:princess,phase:1-foundation" --body-file - << 'EOF'
**Owner:** Princess
**Due:** Oct 16

- [ ] Ask whether anonymous or guest reporting is required
- [ ] Log the answer in docs/DECISIONS.md
- [ ] If yes: make reporter_id nullable, add a tracking code, and tell Carl before step 11 (Oct 20)
EOF
gh issue create --title "Register, login, JWT, roles and admin seed" --milestone "M2 Core Flow (Oct 21)" --label "owner:carl,phase:2-core-flow" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 18

- [ ] POST /api/auth/register: name, email, password (min 8), optional phone
- [ ] Registration always creates a Reporter and ignores any role from the client
- [ ] POST /api/auth/login with JWT and bcrypt
- [ ] Role middleware: reporter, admin, officer
- [ ] npm run seed:admin creates the first Administrator from .env
- [ ] Test in Postman or Thunder Client
EOF
gh issue create --title "Report submission endpoints and Cloudinary upload" --milestone "M2 Core Flow (Oct 21)" --label "owner:carl,phase:2-core-flow" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 20

- [ ] Create report
- [ ] List my reports and get one report
- [ ] Photo upload with multer to Cloudinary
- [ ] Save URLs in report_photos
- [ ] Write the first row in report_status_history
EOF
gh issue create --title "Mobile: register, login and report form" --milestone "M2 Core Flow (Oct 21)" --label "owner:lenon,phase:2-core-flow" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 21

- [ ] Register and login screens
- [ ] Details form
- [ ] Location (manual first, then GPS and map)
- [ ] Photo upload
- [ ] Submit and confirmation with Report ID
EOF
gh issue create --title "Web: login, report list and report details" --milestone "M2 Core Flow (Oct 21)" --label "owner:pauline,phase:2-core-flow" --body-file - << 'EOF'
**Owner:** Pauline
**Due:** Oct 21

- [ ] Login with role-based redirect
- [ ] Report list
- [ ] Report details page
- [ ] Show reports submitted from mobile
EOF
gh issue create --title "Start the test plan" --milestone "M2 Core Flow (Oct 21)" --label "owner:pauline,phase:2-core-flow" --body-file - << 'EOF'
**Owner:** Pauline
**Due:** Oct 21

- [ ] One test case per FR-01 to FR-15
- [ ] Columns: steps, expected, actual, pass/fail
- [ ] Save in docs/
EOF
gh issue create --title "Admin and officer endpoints and user management" --milestone "M3 Workflows (Oct 26)" --label "owner:carl,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 24

- [ ] Verify or reject with reason
- [ ] Assign officer, update status, officer remarks
- [ ] Set record_type to verified_record when verified
- [ ] Write report_status_history and audit_logs
- [ ] POST /api/users (admin only) creates Traffic Officers
- [ ] Promote or deactivate users, logged in audit_logs
EOF
gh issue create --title "Web admin pages including User Management" --milestone "M3 Workflows (Oct 26)" --label "owner:pauline,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Pauline
**Due:** Oct 25

- [ ] Status management and officer assignment
- [ ] Search and filters (date, location, status, type)
- [ ] Officer queue page
- [ ] User Management page: create officers, change roles, deactivate
EOF
gh issue create --title "Mobile tracking and notifications screens" --milestone "M3 Workflows (Oct 26)" --label "owner:lenon,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 25

- [ ] My reports list with status chips
- [ ] Status history
- [ ] Notifications screen
EOF
gh issue create --title "Email notifications with Nodemailer and Gmail SMTP" --milestone "M3 Workflows (Oct 26)" --label "owner:carl,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 25

- [ ] Use src/config/mailer.js with MAIL_PROVIDER=smtp (Gmail app password)
- [ ] Set SMTP_USER, SMTP_PASS (Gmail app password) and MAIL_FROM
- [ ] Resend is optional and only emails other people after you verify a domain
- [ ] Send on submission and on status change
- [ ] Save a row in notifications
EOF
gh issue create --title "Dashboard and exports" --milestone "M3 Workflows (Oct 26)" --label "owner:pauline,owner:carl,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Pauline, Carl
**Due:** Oct 26

- [ ] Pauline: summary cards, charts, map of reports
- [ ] Carl: daily, weekly, monthly and annual summaries
- [ ] Carl: PDF and CSV export (FR-15)
EOF
gh issue create --title "Demo video feature in API, web and mobile" --milestone "M3 Workflows (Oct 26)" --label "owner:carl,owner:pauline,owner:lenon,phase:3-workflows" --body-file - << 'EOF'
**Owner:** Carl, Pauline, Lenon
**Due:** Oct 26

- [ ] Carl: GET /api/app-info returns DEMO_VIDEO_URL (already in the starter)
- [ ] Pauline: Demo Video page with a video tag and a coming soon fallback
- [ ] Lenon: Demo Video screen with video_player and a coming soon fallback
- [ ] Finish before the Oct 30 freeze
EOF
gh issue create --title "Deploy API, database and web" --milestone "M4 Deploy and Test (Oct 30)" --label "owner:carl,phase:4-deploy-test" --body-file - << 'EOF'
**Owner:** Carl
**Due:** Oct 28

- [ ] API on Render
- [ ] Aiven MySQL: set DB_SSL=true and the CA certificate in the host environment
- [ ] Web on Vercel (root folder web) with VITE_API_URL
- [ ] Set all env vars from .env.example on the host
- [ ] Confirm MAIL_PROVIDER=smtp and the Gmail app password are set on Render
- [ ] Open the API a few minutes before any demo (free tiers sleep)
EOF
gh issue create --title "Build the release APK" --milestone "M4 Deploy and Test (Oct 30)" --label "owner:lenon,phase:4-deploy-test" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 28

- [ ] Point the app at the deployed API
- [ ] git tag v1.0.0 and push tags
- [ ] Download the roadwatch-apk artifact
EOF
gh issue create --title "Run the full test plan on the deployed system" --milestone "M4 Deploy and Test (Oct 30)" --label "owner:pauline,phase:4-deploy-test" --body-file - << 'EOF'
**Owner:** Pauline
**Due:** Oct 29

- [ ] Run every test case
- [ ] Log bugs as issues
- [ ] Re-test fixes
EOF
gh issue create --title "Bug fixes only" --milestone "M4 Deploy and Test (Oct 30)" --label "owner:all,phase:4-deploy-test" --body-file - << 'EOF'
**Owner:** All
**Due:** Oct 30

- [ ] No new features after Oct 27
- [ ] Fix bugs from the test log
EOF
gh issue create --title "Feature freeze and final tag" --milestone "M4 Deploy and Test (Oct 30)" --label "owner:lenon,phase:4-deploy-test" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Oct 30

- [ ] Merge dev into main with a merge commit
- [ ] Tag the final version
EOF
gh issue create --title "PowerPoint user guide" --milestone "M5 Docs and Submission (Nov 2)" --label "owner:princess,phase:5-docs-submit" --body-file - << 'EOF'
**Owner:** Princess
**Due:** Nov 1

- [ ] Screenshots of each screen
- [ ] Steps for reporter, admin and officer
- [ ] Save in docs/user-guide/
EOF
gh issue create --title "Individual contribution report" --milestone "M5 Docs and Submission (Nov 2)" --label "owner:princess,phase:5-docs-submit" --body-file - << 'EOF'
**Owner:** Princess
**Due:** Nov 1

- [ ] Fill docs/contributions/CONTRIBUTIONS.md
- [ ] Attach commit-log.txt and handoff-log.csv
- [ ] Get sign-offs
EOF
gh issue create --title "Record the video presentation" --milestone "M5 Docs and Submission (Nov 2)" --label "owner:all,phase:5-docs-submit" --body-file - << 'EOF'
**Owner:** All
**Due:** Oct 31

- [ ] MP4, any length, decided by the Documentation Lead
- [ ] Technologies used
- [ ] Demo of major features
- [ ] Database structure and architecture
- [ ] Challenges and solutions
- [ ] Every member speaks
EOF
gh issue create --title "Publish the demo video" --milestone "M5 Docs and Submission (Nov 2)" --label "owner:princess,owner:lenon,owner:carl,phase:5-docs-submit" --body-file - << 'EOF'
**Owner:** Princess, Lenon, Carl
**Due:** Nov 1

- [ ] Princess: export the final MP4 and upload it to Cloudinary
- [ ] Lenon: git lfs install, commit docs/video/roadwatch-demo.mp4 (LFS, 1 GB free storage, check bandwidth)
- [ ] Carl: set DEMO_VIDEO_URL on the API host
- [ ] Check the video plays in the web page and the mobile screen
EOF
gh issue create --title "Final submission check" --milestone "M5 Docs and Submission (Nov 2)" --label "owner:lenon,phase:5-docs-submit" --body-file - << 'EOF'
**Owner:** Lenon
**Due:** Nov 2

- [ ] Working deployed system (web and mobile)
- [ ] Source code
- [ ] Database files and schema
- [ ] PPT user guide
- [ ] Video
- [ ] Contribution report
EOF
