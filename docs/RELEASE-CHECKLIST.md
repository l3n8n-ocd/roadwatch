# Release checklist: RoadWatch v1.1.0 (final)

Decided Oct 27 (DECISIONS #48): the final version is **v1.1.0** (app `1.1.0+5`, web About "1.1.0"). It replaces the
planned v1.0.3. Owner: Lenon (merge and tag), with Pauline (live tests) and Carl (Render, Cloudinary).

## 1. Freeze rules (from Oct 30)
- **No new features** after the freeze. Only fixes for something that does not work as the test plan says.
- A fix that changes what users see (text, button, screen) is drawn in Figma first and shown to Lenon (#33).
- Every fix gets a line in the test plan (case that failed, then the retest) and goes through `dev` → pull request →
  `main` with **Create a merge commit** (never squash, never force-push).
- A fix after the v1.1.0 tag becomes **v1.1.1** (pubspec `1.1.1+6`, `AppConfig.appVersion`, web `APP_VERSION`) with
  its own tag.

## 2. Before the merge (PR #53, `dev` → `main`)
- [ ] CI green on the latest commit: `api-ci` (32 tests incl. the database flow), `web-ci` (lint + build),
      `mobile-ci` (analyze + widget tests).
- [ ] The Vercel preview of `dev` opens and the officer and admin sign-ins work against the live API.
- [ ] Version: `mobile/pubspec.yaml` says `1.1.0+5`, `mobile/lib/core/config.dart` `1.1.0`,
      `web/src/pages/staff/About.jsx` `1.1.0`.
- [ ] `docs/DECISIONS.md`, `CLAUDE.md` and `docs/test-plan.md` describe what is in the PR.
- [ ] Nothing secret in the diff (`.env`, keys, `ca.pem`, real passwords).

## 3. Merge and deploy
1. GitHub, PR #53, **Merge pull request** with **Create a merge commit**.
2. **Render** (roadwatch-api, Events): wait for "Deploy live" for the merge commit.
3. **Vercel** (roadwatch, Deployments): wait for the Production deployment of the merge commit to be "Ready".
4. Render, Environment: check the settings exist: `CLIENT_ORIGIN`, `DB_*`, `DB_SSL_CA`, `CLOUDINARY_URL`, `JWT_SECRET`,
   `MAIL_PROVIDER=brevo`, `BREVO_API_KEY`, `MAIL_FROM`, and (once the videos exist) `PROMO_VIDEO_URL`,
   `DEMO_VIDEO_REPORTER_URL`, `DEMO_VIDEO_OFFICER_URL`, `DEMO_VIDEO_ADMIN_URL`.

## 4. Tag the release (builds the APK)
```bash
git checkout main
git pull origin main
git tag -a v1.1.0 -m "RoadWatch v1.1.0"
git push origin v1.1.0
```
`mobile-ci` checks that the tag matches `pubspec.yaml` (1.1.0), builds the release APK and publishes the GitHub
Release **v1.1.0** with `roadwatch.apk`. Then:
- [ ] Actions: the `mobile-ci` run for `v1.1.0` is green.
- [ ] Releases: v1.1.0 is marked **Latest** and has `roadwatch.apk`.
- [ ] `https://github.com/l3n8n-ocd/roadwatch/releases/latest/download/roadwatch.apk` downloads the new file, and the
      landing "Get the Android app" button does the same.
- [ ] Paste the release notes (section 6) into the release description.

## 5. Live smoke test (about 20 minutes, after the tag)
Warm the API first: open `/api/health` and wait for `{"status":"ok"}`.

| # | Check | Expected |
|---|---|---|
| 1 | `/api/health`, `/api/app-info` | `ok`; app-info lists the video URLs that are set |
| 2 | Landing page at 1440 and on a phone, Light and Dark | Stats bar numbers, public road updates, hotlines, FAQ; "Watch the video" once the promo URL is set |
| 3 | Install the v1.1.0 APK over the old one | Settings shows "Version 1.1.0" |
| 4 | Register a new reporter with a Strong password; a Good one is refused | TC-01.4 |
| 5 | Submit a report with GPS and a photo | Report number shown; "report received" email arrives; photo opens full screen |
| 6 | Web: staff sign-in > Administrator; verify the report, assign an officer | Verified badge; status history rows |
| 7 | Web: staff sign-in > Traffic Officer (same officer) | Bell shows the assignment; opening it opens the report |
| 8 | Officer sets In Progress with remarks (web or app), then Resolved/Closed | Reporter sees each status in My reports and gets the emails |
| 9 | A reporter account on the web sign-in | "This account uses the mobile app" |
| 10 | Admin: Summaries, export PDF and CSV | Files download and open |
| 11 | Forgot password (app and web) | Code email arrives; new Strong password works once |
| 12 | Demo video (web for both staff roles, app for reporter and officer) | Clips play or show "Clip coming soon" |
| 13 | About pages (web admin/officer, public `/about`, app About) | Version 1.1.0, team photos, Built with logos |

Record the results in `docs/test-plan.md` (Actual, Pass/Fail) with the date and who ran them.

## 6. Release notes (paste into the GitHub Release)
```
RoadWatch v1.1.0 (final release)

New since v1.0.2
- Traffic Officers can sign in on the website as well as the app; the staff sign-in asks for the role first.
- Notification bell for Traffic Officers on the website (assignment alerts).
- Password strength meter; only Strong passwords can be saved.
- Short demo clips for each role (app and website) and the promotional video on the landing page.
- About pages with the team, "Built with" logos and the current version.
- Product wording across the apps and the website; new README.

Install: download roadwatch.apk below on an Android phone and allow installs from this source.
Website: https://roadwatch-theta.vercel.app (or https://roadwatch-ph.me once connected)
```

## 7. After the release
- [ ] Close the issues the PR fixed (the PR's "Closes" line does most of it) and #25 (freeze and final tag).
- [ ] Update `CLAUDE.md` section 16 (setup status) and section 19 (next steps).
- [ ] Turn off any test accounts the graders should not see; keep one demo account per role for the presentation.
- [ ] Warm the API before every demo, recording and grading session (Render's free plan sleeps).
