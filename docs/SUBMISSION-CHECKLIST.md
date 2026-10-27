# Submission checklist (due Nov 2)

Owner: Lenon (final check, #30), with Princess (documents and video). Tick each line only after opening the file or
link yourself. Required deliverables: (1) one functional web and mobile system, (2) complete source code,
(3) database files or schema, (4) documentation: PowerPoint user guide, video presentation, individual contribution
report.

## 1. Links (put them in one text file, `RoadWatch-Links.txt`, and in the submission form)

| Item | Where | Check |
|---|---|---|
| Website | `https://roadwatch-theta.vercel.app` (and `https://roadwatch-ph.me` if connected, SETUP-GUIDE Part G) | [ ] opens, landing and staff sign-in work |
| API health | `https://roadwatch-api-gnky.onrender.com/api/health` (or `https://api.roadwatch-ph.me/api/health`) | [ ] `{"status":"ok"}` |
| Android app (APK) | `https://github.com/l3n8n-ocd/roadwatch/releases/latest/download/roadwatch.apk` (release v1.1.0) | [ ] installs, shows Version 1.1.0 |
| Source code | `https://github.com/l3n8n-ocd/roadwatch` (public), tag `v1.1.0` | [ ] the tag exists on `main` |
| Promotional video | Cloudinary URL (`PROMO_VIDEO_URL`), and on the landing page | [ ] plays |
| Demo accounts | One per role (Reporter, Traffic Officer, Administrator) | [ ] given **privately** in the form, never in the repo |

## 2. Files to hand in

| # | Deliverable | File | Where it lives | Owner | Check |
|---|---|---|---|---|---|
| 1 | Functional system | `roadwatch.apk` (v1.1.0) | GitHub Release v1.1.0 | Lenon | [ ] |
| 2 | Source code | `roadwatch-v1.1.0-source.zip` | GitHub Release v1.1.0, "Source code (zip)" (rename it) | Lenon | [ ] |
| 3 | Database | `schema.sql`, `seed.sql`, `local-init.sql` | `database/` | Carl | [ ] |
| 3 | Database diagram | ERD PNG and SVG | `docs/erd/` | Carl | [ ] |
| 3 | Architecture | `roadwatch.png`, `roadwatch.svg` | `docs/architecture/` | Carl | [ ] |
| 4 | PowerPoint user guide | `RoadWatch-User-Guide.pptx` | `docs/user-guide/` | Princess | [ ] |
| 4 | Video presentation | `roadwatch-promo.mp4` (3:00 or longer) | `docs/video/` (Git LFS) and a separate upload | Princess | [ ] |
| 4 | Demo clips (extra) | `demo-reporter.mp4`, `demo-officer.mp4`, `demo-admin.mp4` | `docs/video/` | Princess | [ ] |
| 4 | Contribution report | `RoadWatch-Contribution-Report.pdf` (exported from the Google Doc tab "INDIVIDUAL CONTRIBUTION REPORT") | `docs/contributions/` | Princess | [ ] |
| + | Test plan and retest | `RoadWatch-Test-Plan.docx`, `RoadWatch-Retest-v1.0.1.docx` | `docs/` | Pauline | [ ] |
| + | API reference, decisions, setup | `API.md`, `DECISIONS.md`, `SETUP-GUIDE.md`, `README.md` | `docs/`, root | Lenon | [ ] |

**Git LFS warning:** GitHub's "Download ZIP" and the release "Source code (zip)" hold only small pointer files instead
of the MP4s. Always hand in the MP4 files as separate files (or a Google Drive link set to "Anyone with the link").

## 3. Suggested folder for the upload
```
RoadWatch-Submission/
  01-Links/RoadWatch-Links.txt
  02-System/roadwatch.apk
  03-Source/roadwatch-v1.1.0-source.zip
  04-Database/schema.sql, seed.sql, local-init.sql, erd.png, architecture.png
  05-Documentation/RoadWatch-User-Guide.pptx, RoadWatch-Contribution-Report.pdf, RoadWatch-Test-Plan.docx
  06-Video/roadwatch-promo.mp4, demo-reporter.mp4, demo-officer.mp4, demo-admin.mp4
```
Zip it as `RoadWatch-Submission.zip`. If the upload limit is too small for the videos, upload `06-Video` to Google
Drive and put the share link in `RoadWatch-Links.txt`.

## 4. Final checks (Nov 1 or 2)
- [ ] Release checklist done (`docs/RELEASE-CHECKLIST.md`): merged, tagged v1.1.0, live smoke test passed.
- [ ] Test plan complete: every case has Actual and Pass/Fail, with dates and testers.
- [ ] The PowerPoint matches the final screens (v1.1.0) and every role is covered.
- [ ] The contribution report lists all four members with their real work (commits, issues, documents).
- [ ] Every member appears in the promo video.
- [ ] No secrets in the repo, the slides or the video (passwords, keys, `.env`, real personal data).
- [ ] Warm the API before submitting and before grading time; Render's free plan sleeps after 15 minutes idle.
- [ ] Ask one person outside the team to open every link on their own phone.
