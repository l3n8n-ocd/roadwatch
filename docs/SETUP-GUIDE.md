# RoadWatch Setup Guide: GitHub Monorepo, Carl's Database, API Skeleton and /api/health

Written Oct 16, 2026. Follow the parts in order. Every command assumes **Git Bash on Windows** unless noted.
Menu names on GitHub and Aiven change over time. If a label differs slightly, look for the closest match.

| Part | Who | What | Time |
|---|---|---|---|
| A | Lenon | Create the public GitHub monorepo, branches, protection, CI check, author test | 45-60 min |
| B | Carl | Create the Aiven MySQL service, load `schema.sql` and `seed.sql`, verify | 30-45 min |
| C | Carl | Run the API skeleton, `npm test`, `npm run check:db`, `/api/health` | 20-30 min |
| D | Lenon | Verify Carl's evidence and commit his work under his name | 15 min |
| E | Both | Troubleshooting | as needed |
| F | Lenon + Carl | Deploy the API to Render with the Blueprint (`render.yaml`), added Oct 20 | 30-45 min |

Parts A and B can run at the same time. Part C needs the Aiven connection details from Part B. Part D needs Parts A and C.

**Golden rules (the repo is public)**
1. Never put passwords, API keys, `.env` files or `ca.pem` into the repo, a screenshot, or a chat. `.gitignore` blocks `.env`, `*.pem`, `*.key` and `*.crt`, but you are the last line of defense.
2. Lenon is the only person who commits. Teammates send files. Lenon commits them with `scripts/commit-as.sh` so the teammate stays the author.
3. Work on `dev`. Merge `dev` into `main` only at milestones, always with a **merge commit** (never squash).

> **Update (Oct 16, afternoon): Carl already built his own backend, so Parts B and C are replaced by this.**
> His code was reviewed and merged into `api/`, aligned to the approved schema (see `docs/DECISIONS.md` 18 to 22 and `docs/API.md`). Do this instead:
> 1. **Carl rotates every credential that was in his zipped `.env`:** reset the Aiven database password, create a new Cloudinary API secret, and generate a new `JWT_SECRET` (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). The old values were shared outside the team, so treat them as exposed.
> 2. **Carl resets his Aiven database.** It still has the OLD tables from his migration (wrong status and role values). In his MySQL client, connected to `defaultdb`, run this once (it deletes everything in that database, which only holds his test data):
>    ```sql
>    SET FOREIGN_KEY_CHECKS = 0;
>    DROP TABLE IF EXISTS audit_logs, notifications, report_status_history, report_photos, reports, accident_types, users, roles, SequelizeMeta;
>    SET FOREIGN_KEY_CHECKS = 1;
>    ```
>    Then run `database/schema.sql` and `database/seed.sql` against `defaultdb`, in that order.
> 3. **Carl's `.env`** (never committed): use the variable names in `api/.env.example`. Set `DB_SSL=true` and `DB_SSL_CA_PATH` to his downloaded `ca.pem` (or paste it into `DB_SSL_CA`). Photos use ONE variable, `CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME`, not three. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
> 4. In `api/`: `npm install`, `npm run check:db` (expect 8 tables, TLS on), `npm run seed:admin`, `npm run dev`, then open `http://localhost:5000/api/health`.
> 5. Run the tests: `npm test`. Without a database it runs 3 tests and skips the database flow. To run all 16, use a **local** throwaway database (not Aiven): `RUN_DB_TESTS=true npm test` with `DB_HOST=127.0.0.1` and local credentials. CI runs them automatically on every pull request.
> Parts A, D and E below still apply. Ignore B and C unless something fails.

---

# PART A: Lenon creates the GitHub monorepo

## A1. Install the tools
1. **Git for Windows** from git-scm.com. In the installer keep "Git Bash" and "Git LFS" selected. Accept the other defaults.
2. **Node.js 22 LTS** from nodejs.org (needed later for the API).
3. **VS Code** (optional, but easiest for editing files with the right line endings).
4. **GitHub CLI** from cli.github.com (needed once, to create the issues).

Open **Git Bash** and confirm:
```bash
git --version
git lfs version
node -v
gh --version
```
`node -v` must print `v22` or higher.

## A2. Protect your email on GitHub (public repo)
1. GitHub, then your avatar, then **Settings**, then **Emails**.
2. Tick **Keep my email addresses private**.
3. Tick **Block command line pushes that expose my email**.
4. Copy your no-reply address shown on that page. It looks like `12345678+yourusername@users.noreply.github.com`.

## A3. Set your Git identity
```bash
git config --global user.name "Lenon Adriano"
git config --global user.email "12345678+yourusername@users.noreply.github.com"
git config --global user.name
git config --global user.email
```
Use your real no-reply address from A2. The last two commands print what you set.

## A4. Build each teammate's no-reply email
Your teammates' real emails must not appear in a public repo. Use their GitHub no-reply addresses.

For each of Carl, Pauline and Princess:
1. Get their GitHub username.
2. Open `https://api.github.com/users/THEIR_USERNAME` in a browser.
3. Find the line `"id": 12345678`.
4. Their email is `12345678+THEIR_USERNAME@users.noreply.github.com`.

Very old accounts (created before July 2017) may use `THEIR_USERNAME@users.noreply.github.com` instead. If a commit does not show their avatar in A14, try that form.

## A5. Create the empty repo on GitHub
1. GitHub, then **+**, then **New repository**.
2. Repository name: `roadwatch`.
3. Choose **Public**.
4. **Leave every "Initialize this repository" box unticked** (no README, no .gitignore, no license). The starter already has them, and ticking them causes a history conflict.
5. Click **Create repository**.
6. Copy the HTTPS URL, for example `https://github.com/YOURUSERNAME/roadwatch.git`.

## A6. Unzip the starter
1. Unzip `roadwatch-starter.zip`. You get a folder named `roadwatch`.
2. Right-click inside that folder and choose **Open Git Bash here**.
3. Check the hidden files are there:
```bash
pwd
ls -a
```
You must see `.github`, `.gitignore`, `.gitattributes`, `.editorconfig`, `CLAUDE.md`, `README.md`, and folders `api`, `database`, `docs`, `mobile`, `scripts`, `web`.

## A7. Fill `scripts/members.conf`
Open `scripts/members.conf` in VS Code. Replace each `REPLACE_ME` with that member's no-reply email from A4 (Lenon's from A2). Keep the format `key|Full Name|email|default folders`:
```
lenon|Lenon Adriano|12345678+lenonname@users.noreply.github.com|mobile/
pauline|Pauline Lapuz|23456789+paulinename@users.noreply.github.com|web/
carl|Carl Ernest Santos|34567890+carlname@users.noreply.github.com|api/ database/
princess|Princess Lorellyn Isip|45678901+princessname@users.noreply.github.com|docs/user-guide/
```
(The numbers and usernames above are examples. Use the real ones.)

Line endings: the starter script now tolerates Windows line endings, but it is still best to save with LF. In VS Code click **CRLF** at the bottom right and choose **LF**, then save.

## A8. First commit
```bash
git init -b main
git lfs install
git add .
git status --short
```
Read the `git status` list. It must **not** contain `.env`, `ca.pem`, or `node_modules`. Then:
```bash
git commit -m "chore: scaffold monorepo"
```
Git may print CRLF warnings. They are harmless.

## A9. Push `main`
```bash
git remote add origin https://github.com/YOURUSERNAME/roadwatch.git
git push -u origin main
```
A browser window asks you to sign in to GitHub the first time. Approve it.

## A10. Create and push `dev`
```bash
git switch -c dev
git push -u origin dev
```
From now on you work on `dev`.

## A11. Repo settings on GitHub
**Block squash merges (keeps each member's credit):**
1. Repo, then **Settings**, then **General**, scroll to **Pull Requests**.
2. Keep **Allow merge commits** ticked.
3. Untick **Allow squash merging** and **Allow rebase merging**.

**Protect `main`:**
1. **Settings**, then **Rules**, then **Rulesets**, then **New ruleset**, then **New branch ruleset**.
2. Name: `protect-main`. Enforcement status: **Active**.
3. Target branches: add **Include default branch**.
4. Tick **Restrict deletions** and **Block force pushes**.
5. Do **not** tick "Require a pull request" or approvals. You are the only committer and approvals would lock you out.
6. Click **Create**.

## A12. Check the automatic tests (CI)
1. Repo, then the **Actions** tab.
2. You should see runs for `api-ci`. It should turn **green** (a tick). It installs the API and runs the 2 tests.
3. `web-ci` and `mobile-ci` skip themselves because those projects do not exist yet. A skipped or quickly green run is correct.
4. If `api-ci` is red, click it, open the failing step, and use Part E.

## A13. Create the GitHub issues (once only)
```bash
gh auth login
bash scripts/create-issues.sh
```
Choose GitHub.com, HTTPS, and log in with the browser. The script creates labels, 6 milestones and 30 issues. **Run it once.** A second run creates duplicates. The same text is in `docs/github-issues.md` if you would rather paste issues by hand.

## A14. Test the author trick before using it for real
This proves a teammate gets credit while you push. It uses a throwaway branch.
```bash
git switch -c test-author
echo "test" >> docs/contributions/author-test.txt
bash scripts/commit-as.sh carl "chore: author test" docs/contributions/author-test.txt
git log -1 --format='author: %an <%ae>%ncommitter: %cn <%ce>'
git push -u origin test-author
```
Expected: `author` shows Carl and `committer` shows you. On GitHub, open that commit. It should say **Carl authored and Lenon committed**, with Carl's avatar.
- If Carl's avatar does not appear, the email in `members.conf` does not match his GitHub account. Fix the email (see A4).

Clean up (all of these lines, in order):
```bash
git switch dev
git restore docs/contributions/handoff-log.csv
git push origin --delete test-author
git branch -D test-author
git status --short
```
`git status --short` should print nothing. If `author-test.txt` is listed, delete that file.

Part A is done when: `main` and `dev` exist on GitHub, `api-ci` is green, the 30 issues exist, and the author test showed Carl as author.

---

# PART B: Carl creates the Aiven MySQL database and loads the schema

## B1. Get the code and tools
1. Install **Node.js 22 LTS** (nodejs.org) and **MySQL Workbench** (or DBeaver Community).
2. Get the code from Lenon's public repo. Easiest without Git: open the repo on GitHub, change the branch dropdown from `main` to **`dev`**, click **Code**, then **Download ZIP**, then unzip it (for example to `C:\roadwatch`).
3. Do not edit the SQL files. They are final for today.

## B2. Create the Aiven account and service
1. Go to aiven.io and sign up (free account).
2. In the console choose **Create service**, then **MySQL**.
3. Choose the **Free** plan if it is offered. Read the plan's limits on the page and note them (storage, idle behavior). Free plans can have restrictions.
4. Choose a cloud region close to the Philippines.
5. Name it `roadwatch-mysql` and create it.
6. Wait until the status says **Running** (a few minutes).

## B3. Copy the connection details (keep them private)
On the service **Overview** page, under **Connection information**, find:

| Field | Note |
|---|---|
| Host | long name ending in `aivencloud.com` |
| Port | usually **not** 3306, copy the real one |
| User | usually `avnadmin` |
| Password | click to reveal |
| Database name | usually `defaultdb` |
| SSL mode | `REQUIRED` |
| CA certificate | click **Download** and save as `ca.pem` |

Save the password in a password manager or a private note. **Never** paste it in the group chat, in the repo, or in a screenshot.

Put the downloaded file at `roadwatch/api/ca.pem` (create the file by moving it there). It is git-ignored.

If a connection later times out, check the service's **Allowed IP addresses** setting. It is normally open to all by default.

## B4. Connect with MySQL Workbench
1. Click **+** next to MySQL Connections.
2. Connection Name: `RoadWatch Aiven`.
3. Hostname: your Host. Port: your Port. Username: `avnadmin`.
4. Click **Store in Vault** and enter the password.
5. Open the **SSL** tab. Set **Use SSL** to **Require and Verify CA**. Set **SSL CA File** to your `ca.pem`.
6. Click **Test Connection**. It must say it succeeded. Then click **OK** and open the connection.

(Command-line alternative: `mysql --host HOST --port PORT --user avnadmin --password --ssl-ca=ca.pem --ssl-mode=VERIFY_CA defaultdb`.)

## B5. Load the schema and the seed
In the Workbench query tab:
1. Run `USE defaultdb;` (use your database name if it differs).
2. **File, Open SQL Script**, choose `database/schema.sql`, and run it (lightning bolt button, "execute all").
3. Open `database/seed.sql` and run it.

The files have no `CREATE DATABASE` or `USE` line. That is deliberate: they load into the database you selected. They are safe to run again if something fails halfway.

## B6. Verify the database
Run these and compare:
```sql
SHOW TABLES;
SELECT * FROM roles;
SELECT * FROM accident_types;
SHOW COLUMNS FROM users;
```
Expected:
- **8 tables:** `accident_types`, `audit_logs`, `notifications`, `report_photos`, `report_status_history`, `reports`, `roles`, `users`.
- **3 roles:** Reporter, Administrator, Traffic Officer.
- **5 accident types:** Collision, Hit-and-run, Vehicle rollover, Pedestrian accident, Other.
- `users` has an **`is_active`** column (`tinyint(1)`, default 1).

Take a screenshot of the `SHOW TABLES` result. Do not include any password.

If something is off, drop nothing by hand. Tell Lenon what you see.

---

# PART C: Carl runs the API skeleton and checks /api/health

## C1. Open a terminal in the `api` folder
In VS Code open the `roadwatch` folder and use **Terminal, New Terminal**, then:
```bash
cd api
node -v
```
`node -v` must print `v22` or higher.

## C2. Create your `.env`
```bash
cp .env.example .env
```
(In Windows Command Prompt use `copy .env.example .env`.) Open `.env` and set only these lines, using the values from B3:
```
DB_HOST=your-host.aivencloud.com
DB_PORT=your-port
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_SSL=true
DB_SSL_CA_PATH=./ca.pem
```
Leave everything else as it is for now. Notes:
- If your password contains `#`, `$` or spaces, wrap it in double quotes: `DB_PASSWORD="pa#ss"`.
- The file must be named exactly `.env` (not `.env.txt`).
- Never send `.env` to anyone.

## C3. Install the packages
```bash
npm install
```
Wait for it to finish. A `package-lock.json` file appears. That is normal.

## C4. Run the automated tests
```bash
npm test
```
Expected: `# tests 2`, `# pass 2`, `# fail 0`.

## C5. Prove the API can reach Aiven
```bash
npm run check:db
```
Expected output (host and numbers will match your service):
```
Connecting to your-host.aivencloud.com:PORT as avnadmin, database "defaultdb", TLS on
Connected. 8 tables found.
roles rows: 3 (expected 3)
accident_types rows: 5 (expected 5)
users.is_active column: present
```
This is the real database proof. The health check below does **not** touch the database.

## C6. Start the API and check /api/health
```bash
npm run dev
```
The terminal shows: `RoadWatch API running on port 5000`.

In a browser open:
- `http://localhost:5000/api/health` must show exactly `{"status":"ok","service":"roadwatch-api"}`
- `http://localhost:5000/api/app-info` must show `{"demoVideoUrl":null}`

Take a screenshot of the health page. Stop the server with **Ctrl+C**.

If port 5000 is busy, change `PORT=5001` in `.env` and use that port in the URLs.

## C7. (Optional, 2 minutes) Create the first administrator
Add to `.env`:
```
ADMIN_NAME=System Administrator
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=choose-at-least-8-characters
```
Then run `npm run seed:admin`. Expected: `Administrator created: your-admin-email@example.com`. Running it again says the account already exists. The password is stored hashed (bcrypt) in the database. Do not share the password in chat.

## C8. Send Lenon the evidence
Send these three things (and nothing else):
1. Screenshot of `SHOW TABLES` from B6.
2. Screenshot or text of the `npm run check:db` output from C5.
3. Screenshot of `http://localhost:5000/api/health` from C6, plus the new `package-lock.json` file.

**Never send:** `.env`, `ca.pem`, the Aiven password.

Part C is done when: tests pass, `check:db` shows 8 tables with TLS on, and `/api/health` returns the exact JSON.

---

# PART D: Lenon verifies Carl's work and commits it under Carl's name

## D1. Verify the evidence
Check each item against Carl's screenshots:
- [ ] 8 table names exactly as listed in B6.
- [ ] 3 roles and 5 accident types.
- [ ] `users.is_active` present.
- [ ] `check:db` says `TLS on` (confirms the Aiven TLS settings work).
- [ ] Health JSON is exactly `{"status":"ok","service":"roadwatch-api"}`.
- [ ] No password, `.env` or `ca.pem` visible in any screenshot.

If Carl changed any file (for example the schema), ask him to send that file and compare it before committing.

## D2. Commit Carl's file under his name
Copy `package-lock.json` into your `api/` folder, then:
```bash
git switch dev
git pull
git status --short
```
Make sure no `.env` or `ca.pem` is listed. Then:
```bash
bash scripts/commit-as.sh carl "chore(api): add package-lock after Aiven DB verification" api/package-lock.json
git add docs/contributions/handoff-log.csv
git commit -m "docs: log Carl handoff"
git push
```
The first commit is authored by Carl. The second is your own log entry.

## D3. Close the matching issues
On GitHub, Issues tab, close **Create the Aiven MySQL service and load the schema** and **Run the API skeleton**. Paste a short note and Carl's screenshots (no secrets) as proof.

## D4. Check what is left in milestone M1
- Draw wireframes in Figma (Pauline, Lenon)
- Generate the Vite and Flutter projects (Pauline, Lenon)
- Ask the professor about anonymous reporting (Princess, today)

Today's date is the Oct 16 milestone. If these are not done tonight, shift the Oct 21 core-flow target by a day rather than rushing them.

---

# PART E: Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `git push` asks for a password and fails | GitHub no longer accepts account passwords | Complete the browser sign-in, or create a personal access token and use it as the password |
| Push rejected: `GH007 ... email privacy` | Your Git email is a real email | Use your no-reply address (A2, A3), then amend nothing and just retry after fixing `git config` |
| `refusing to merge unrelated histories` | The GitHub repo was created with a README or .gitignore | Create a new empty repo (A5) or ask for help before forcing anything |
| Author test shows no avatar for Carl | Email in `members.conf` does not match his GitHub account | Rebuild it from A4 |
| `commit-as.sh`: `Set carl's email in scripts/members.conf first` | `REPLACE_ME` still there | Do A7 |
| `commit-as.sh`: `Nothing staged` | The files were not copied in first | Copy the member's files into the repo, then rerun |
| `commit-as.sh`: `Unknown member` | Typo in the key | Use `lenon`, `pauline`, `carl` or `princess` |
| Workbench: `SSL connection error` | CA file not set | Set SSL to Require and Verify CA with `ca.pem` (B4) |
| Workbench or `check:db`: timeout | Wrong host or port, or IP not allowed | Recopy host and port from Aiven; check Allowed IP addresses |
| `Access denied for user` | Wrong password or user | Recopy from the Aiven Overview page; quote the password in `.env` if it has special characters |
| `No database selected` when running the SQL | Skipped `USE defaultdb;` | Run it, or double-click the database in Workbench to make it the default |
| `Table already exists` | Ran the schema twice | Harmless, the file uses IF NOT EXISTS. Verify with B6 |
| `check:db` prints `Missing tables` | Schema did not finish | Rerun `schema.sql` (safe to repeat), then `seed.sql` |
| `users.is_active column: MISSING` | An older schema was loaded | Get the latest `dev` branch ZIP and rerun `schema.sql`. For an existing `users` table ask Lenon before altering anything |
| `npm install` errors about Node | Node older than 22 | Install Node 22 LTS (C1) |
| `EADDRINUSE` on `npm run dev` | Port 5000 busy | Change `PORT` in `.env` |
| `api-ci` is red on GitHub | Dependency or test failure | Open the failing step in the Actions log and send it to the team |
| `.env` shows up in `git status` | It is not being ignored | Stop. Do not commit. Check `.gitignore` still has `.env`, and that the file is named exactly `.env` |

---

# PART F: Deploy the API to Render (Blueprint, added Oct 20)

**Done Oct 20:** API `https://roadwatch-api-gnky.onrender.com`, web `https://roadwatch-theta.vercel.app` (Vercel: root `web`, `VITE_API_URL=https://roadwatch-api-gnky.onrender.com/api`; Render `CLIENT_ORIGIN=https://roadwatch-theta.vercel.app,http://localhost:5173`, applied with "Save and deploy").

The repo has a Render Blueprint, `render.yaml` at the root. It describes one free web service, `roadwatch-api`: Node 22, region Singapore, folder `api/`, `npm ci` then `npm start`, health check `/api/health`, auto-deploy from `main`. It holds setting **names** only. Every secret is typed into the Render dashboard (`sync: false`), and Render makes `JWT_SECRET` itself. Decisions #8 and #39.

## F0. Before you start
1. **Aiven is ready:** `npm run check:db` on Carl's laptop (with `.env` pointing at Aiven) shows 8 tables, 3 roles, 5 accident types.
2. **The first administrator exists in Aiven.** Render's free plan has no shell, so run `npm run seed:admin` once **from Carl's laptop** with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in that `.env` (C7).
3. **`main` has the code.** Lenon opens a pull request on GitHub from `dev` into `main` and merges it with **Create a merge commit** (never squash). Render deploys `main`, so `render.yaml` and the latest `api/` must be there.
4. **Have these ready (never in chat):** Aiven host, port, user, password and database name; the Aiven `ca.pem` file; `CLOUDINARY_URL`; the web address that will call the API (`http://localhost:5173` for now, plus the Vercel address later).

## F1. Give Render access to the repo
Render needs its GitHub app on the repo, and the repo lives on **Lenon's** personal GitHub account. GitHub only lets the account owner install apps there, so:
1. **Lenon** signs in at render.com with GitHub. Free plan, no card needed.
2. New, then Blueprint, then Connect GitHub. Choose **Only select repositories**, pick `l3n8n-ocd/roadwatch` and install.
3. Do F2 together on a call. **Carl types the database and Cloudinary values himself**, so the secrets never pass through chat.

## F2. Create the Blueprint
1. New, then Blueprint, then pick `l3n8n-ocd/roadwatch`, branch `main`. Blueprint name: `roadwatch`.
2. Render reads `render.yaml` and lists `roadwatch-api` (Web Service, Free, Singapore). It asks for the values marked `sync: false`:

| Key | What to enter |
|---|---|
| `CLIENT_ORIGIN` | `http://localhost:5173` for now. Later add the Vercel address, comma separated, no spaces needed. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | From Aiven, service Overview, Connection information. `DB_NAME` is the database you loaded in B5 (usually `defaultdb`). |
| `DB_SSL_CA` | Open `ca.pem` in a text editor and paste **all** of it, including the `BEGIN` and `END` lines. |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |

3. Click **Apply**. If Render rejects a field in `render.yaml`, copy the exact error and send it to Lenon. The file was written without access to Render's live validator.

## F3. Watch the first deploy
Open the service, then **Events** and **Logs**. A good deploy shows, in order: `npm ci` finishing, `Connected to MySQL.`, `RoadWatch API running on port 10000` (Render chooses the port), and a passing health check. The first build takes a few minutes.

## F4. Check it from a browser
Use the address Render shows at the top of the service (for example `https://roadwatch-api.onrender.com`; Render adds a suffix if the name is taken):
- `https://<your-address>/api/health` shows `{"status":"ok","service":"roadwatch-api"}`
- `https://<your-address>/api/app-info` shows `{"demoVideoUrl":null}`

Then sign in for real. In `web/`, create `.env.local` with `VITE_API_URL=https://<your-address>/api`, run `npm run dev`, open `http://localhost:5173/staff/sign-in` and log in with the administrator from F0. The dashboard should load with the real (empty) data.

## F5. Point the phone at it
```bash
flutter run --dart-define=API_URL=https://<your-address>/api
```
Register a reporter on the phone, submit a report with a photo, then refresh the web dashboard. That is the Phase 2 "done when": **a reporter submits on mobile and an admin sees it on the web.**

## F6. Free plan notes
- The service **sleeps after about 15 minutes idle**. The next request wakes it in about a minute; the mobile app already waits long enough and shows a "server may be waking up" message. Open `/api/health` a few minutes before demos, recordings and grading.
- **Email is off on purpose.** Render's free plan blocks SMTP, and Brevo arrives in Phase 3 (#37). With no mail settings the API skips emails; in-app notifications still work.
- If Aiven ever restricts **Allowed IP addresses**, add Render's outbound addresses (service, Connect, Outbound) or the API cannot reach the database.
- Later additions in the dashboard (Environment), not in the repo: `MAIL_PROVIDER=brevo`, `BREVO_API_KEY` and `MAIL_FROM` (Phase 3), `DEMO_VIDEO_URL` (Oct 30), and the custom domain `api.roadwatch-ph.me` under Settings, Custom Domains, with a CNAME at Namecheap (#38).

## F7. Troubleshooting

| Symptom in the Render logs | Likely cause | Fix |
|---|---|---|
| `Unable to start RoadWatch API: JWT_SECRET must be ...` | `JWT_SECRET` missing or short | Environment: add it again with **Generate**, or paste a 64-character random hex value |
| `Unable to start ...: connect ETIMEDOUT` or `ECONNREFUSED` | Wrong `DB_HOST` or `DB_PORT`, or an Aiven IP allowlist | Recopy them from Aiven; see the allowlist note in F6 |
| `self-signed certificate` or `unable to get local issuer certificate` | `DB_SSL_CA` incomplete | Paste the whole `ca.pem` again, including the `BEGIN` and `END` lines |
| `Access denied for user` | Wrong `DB_USER` or `DB_PASSWORD` | Recopy them from Aiven |
| Health check failing but no error | The service is still starting or asleep | Wait two minutes and reload `/api/health` |
| Browser console: `CORS` error | The web address is not in `CLIENT_ORIGIN` | Add it exactly (scheme, host, port), comma separated, then let Render redeploy |
| Login answers 400 `platform must be 'web' or 'mobile'` | An old web or mobile build | Rebuild from the latest `dev` |
| Login answers 403 "sign in on the RoadWatch Android app" on the web | A reporter or officer account on the web | Expected (#36): only administrators use the web |

---

# What was verified, and what was not

**Added Oct 20 (Render Blueprint, Part F):** `render.yaml` parses as YAML, and the API was started the way Render will run it (`npm start`, `NODE_ENV=production`, a 44-character generated-style `JWT_SECRET`, `PORT=10000`) against a local MariaDB: `/api/health` answered, an administrator signed in with `platform: "web"` and was refused on `"mobile"`, CORS allowed only `CLIENT_ORIGIN`, and SIGTERM shut it down cleanly. Not verified: the Blueprint on Render itself (Render's validator and docs were not reachable from the build environment), Aiven, Cloudinary, the real deploy.

**Added Oct 16 (backend merge):** on local MariaDB 10.11 with Node 22 the merged API passed 16 automated tests (the 12-step database flow plus health, app-info and the JWT guard), the TLS connection path (`DB_SSL=true` with a CA file, using a throwaway certificate), `seed:admin` and the startup refusal for a placeholder `JWT_SECRET`. Not verified: Aiven, Cloudinary uploads, Gmail SMTP, MySQL 8 (CI will exercise it), Render.

**Verified by running it (Oct 16):** on a local **MariaDB 10.11** test server, `schema.sql`, `seed.sql` and `local-init.sql` load cleanly in both the local flow and an Aiven-style flow (database named `defaultdb`); re-running is safe; foreign keys and defaults work. On Node 22: `npm test` passes (2 tests), `npm run check:db` and `npm run seed:admin` work against that local database, and `/api/health` and `/api/app-info` return the JSON shown above. `scripts/commit-as.sh` was tested in throwaway repos, including Windows line endings, unknown members, co-author trailers and the author test flow.

**Not verified:** anything on **Aiven itself** (account, free plan limits, the TLS connection path `DB_SSL=true` with `DB_SSL_CA_PATH`), **MySQL 8** specifically (the test server was MariaDB), Windows paths and Workbench menus, real GitHub behavior (rulesets, Actions, avatars), and `scripts/create-issues.sh` against a real repo (syntax checked only).

Carl should treat the `check:db` result against Aiven as the first real test of the TLS settings.
