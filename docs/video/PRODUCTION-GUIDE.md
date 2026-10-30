# RoadWatch videos: production guide (Oct 27)

Decided by Lenon on Oct 27 (DECISIONS #48): one **promotional video of at least 3 minutes** and three **demo clips of
exactly 30 seconds**, one per role. Owner: the Documentation Lead (Princess), with every member on camera or voice.
Due **Oct 30**.

| File | Length | Shown where | URL setting on Render |
|---|---|---|---|
| `roadwatch-promo.mp4` | 3:00 minimum (aim for 3:30) | Landing page "Watch the video", README, submission | `PROMO_VIDEO_URL` |
| `demo-reporter.mp4` | 0:30 exactly | Android app, Settings > Demo video (everyone) | `DEMO_VIDEO_REPORTER_URL` |
| `demo-officer.mp4` | 0:30 exactly | Android app (officers) and the web Demo video page | `DEMO_VIDEO_OFFICER_URL` |
| `demo-admin.mp4` | 0:30 exactly | Web Demo video page | `DEMO_VIDEO_ADMIN_URL` |

All four go to `docs/video/` (Git LFS) and to Cloudinary. The apps read the Cloudinary URLs from `GET /api/app-info`;
a clip whose URL is not set shows "Clip coming soon", and the landing hides "Watch the video" until the promo URL is set.

---

## 1. Tools and workflow (CapCut Pro first, Google Flow for extra footage)

The recommended split: **record real screens yourselves, generate only the "mood" shots with Google Flow, and do the
whole edit, captions and export in CapCut Pro.** CapCut is better for screen recordings, cuts, captions and exact
durations; Flow is good at short cinematic shots that you cannot film (a busy road at dusk, a city from above).

```
1 Script (this file)  →  2 Record screens + voice  →  3 Generate b-roll in Flow  →  4 Edit in CapCut Pro  →  5 Export + upload
```

### Step 1: Lock the script
Use the scripts in sections 2 and 3. At a normal pace people say about **2.3 words per second**, so a 30-second clip
holds about **65 words** of voice-over. Read each script aloud with a stopwatch before recording.

### Step 2: Record the screens and voices
- **Before recording:** open `https://roadwatch-api-gnky.onrender.com/api/health` (wakes the free Render server), and
  use demo accounts and made-up report data only. Never show a real password, a real email inbox, or a real person's
  phone number. Type passwords off camera or cut that part.
- **Android app:** the phone's built-in screen recorder (Quick Settings > Screen record, no audio). Turn on Do Not
  Disturb, set the battery above 50 % and the clock to a tidy time. Record in Light mode for the clips (optionally a
  few Dark mode shots for the promo).
- **Website:** OBS Studio (free) or the Windows Game Bar (Win + Alt + R) at **1920 x 1080**; set the browser zoom to
  125 % so text is readable on phones. Hide bookmarks and other tabs.
- **Voices:** record each line separately on a phone in a quiet, soft room (a closet works), 15 cm from the mouth.
  Record 2 takes of every line. In CapCut use **Audio > Reduce noise** (or "Enhance voice" in Pro).
- **On camera (promo only):** landscape, eye level, window light in front of you, plain background.

### Step 3: Google Flow for b-roll (optional, promo only)
Google Flow (labs.google/flow) makes short AI video shots from a text prompt. Use it only for scene-setting shots,
never for the product itself (the app must be real recordings).
- Good prompts: "Slow aerial shot of a busy Philippine city road at dusk, jeepneys and motorcycles, headlights,
  cinematic, no text"; "Close-up of a hand holding a phone on a roadside, blurred traffic lights behind, night".
- Do **not** generate crashes with injured people, police or fire officers' faces, real logos (PNP or BFP seals), or
  anything that looks like real news footage. Keep it calm: traffic, roads, phones, maps.
- Each Flow shot is a few seconds long; download the MP4s and bring them into CapCut. Use at most 4 to 6 shots.
- Credits and plan limits depend on the Google account; check them before planning many shots.
- Add a small line in the end credits: "Some background shots were generated with Google Flow."

You can also use Flow the other way round: export a CapCut rough cut, then in Flow extend or restyle only the opening
shot. Keep the final assembly in CapCut so the timing, captions and logos stay exact.

### Step 4: Edit in CapCut Pro (desktop)
1. **New project, 16:9, 1920 x 1080, 30 fps.** Import the recordings, voices, Flow shots and the logo
   (`docs/assets/logos/`, `web/src/assets/images/emblem.png`).
2. Lay the voice track first, then put the screen recordings on top and cut them to the words.
3. **Exact 30 seconds for each demo clip:** set the end of the timeline at **00:00:30:00** (CapCut shows frames;
   30 fps means 900 frames). Check the duration in the export dialog. Speed up a recording (1.2x to 1.5x) rather than
   cutting a step; never leave dead air.
4. **Zoom in** on taps and buttons (Keyframes > scale 120 to 140 %) so small screens read on phones.
5. **Captions (required, accessibility):** Text > Auto captions > English. Read every caption and fix names
   (RoadWatch, Aiven, Brevo, Cloudinary, Flutter). Style: white text, navy box (`#0B2545`), Inter or Poppins,
   bottom center, at least 40 px. **Burn them into the video** (they stay on in every player). Also export the caption
   file (SRT) for the transcripts.
6. Music: CapCut's library tracks marked for commercial use, at -20 dB under the voice. No copyrighted songs.
7. Colors: titles navy `#0B2545` with amber `#F2A900` accents, matching the apps.
8. Export: **MP4, H.264, 1080p, 30 fps, "Recommended" bit rate, AAC audio.** Keep each file under **100 MB** for the
   Cloudinary upload (the 30-second clips will be about 10 to 20 MB).

### Step 5: Publish
1. **Cloudinary** (Carl's account): Media Library > Upload. Open the asset and copy its secure `https://...mp4` URL.
2. **Render** (roadwatch-api > Environment): add `PROMO_VIDEO_URL`, `DEMO_VIDEO_REPORTER_URL`,
   `DEMO_VIDEO_OFFICER_URL`, `DEMO_VIDEO_ADMIN_URL`. Save and deploy. Check `https://.../api/app-info`.
3. **Repo:** Lenon commits the four MP4s to `docs/video/` (Git LFS is already set up for `*.mp4`):
   ```bash
   git lfs install
   git add docs/video/roadwatch-promo.mp4 docs/video/demo-*.mp4
   ```
   and the caption text in `docs/video/transcripts.md`.
4. **Transcripts in the apps:** send the final wording to Lenon if it differs from the scripts below; the transcripts
   live in the API (one file), so a change needs no new APK.
5. Check: the landing shows "Watch the video", the web Demo video page plays both clips, and the app plays the
   Reporter clip (and, for an officer, the Traffic Officer clip).

---

## 2. Demo clip scripts (30 seconds each)

Each clip: one title card (2 s), the role's main task, one closing line. One voice per clip. Timings are targets.

### 2.1 Reporter (Android app): "Report an accident"
Speaker: Lenon. Account: a demo reporter.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00-0:02 | Title card "RoadWatch for Reporters" | (music only) |
| 0:02-0:06 | Home, tap **Report an Accident** | "Saw a road accident? Open RoadWatch and tap Report an Accident." |
| 0:06-0:13 | Details form: date, time, type, vehicles, injuries, description | "Add when it happened, the type of accident, the vehicles and any injuries." |
| 0:13-0:18 | Location: **Use my location**, the pin drops | "Your phone's GPS pins the place, or you move the pin yourself." |
| 0:18-0:22 | Photos: take one, add one from the gallery | "Attach photos as evidence," |
| 0:22-0:26 | Review, **Submit**, confirmation with the RW number | "then send it. You get a report number right away," |
| 0:26-0:30 | My reports, the status chip, end card logo | "and you can track every status update in My reports." |

Word count: about 60.

### 2.2 Traffic Officer (Android app, plus the web portal): "Work a case from your queue"
Speaker: Carl. Account: a demo officer with one assigned report.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00-0:02 | Title card "RoadWatch for Traffic Officers" | (music only) |
| 0:02-0:07 | App: notification "New assignment", Assigned list | "When the administrator assigns you a report, it appears in Assigned." |
| 0:07-0:13 | Report details: map, **Open in Maps**, photos | "Open it to see the details, the photos and the exact place on the map." |
| 0:13-0:20 | **Update status** > In Progress, add remarks, Save | "Set it to In Progress and record your official remarks." |
| 0:20-0:25 | Status > Resolved/Closed, the saved toast | "When the case is done, mark it Resolved or Closed." |
| 0:25-0:30 | Web: `/staff/sign-in`, Traffic Officer, Assigned to me with the bell; end card | "On a computer, use the same account on the RoadWatch website." |

Word count: about 65.

### 2.3 Administrator (website): "Review, verify and assign a report"
Speaker: Pauline. Account: the demo administrator. Browser at 1920 x 1080, zoom 125 %.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00-0:02 | Title card "RoadWatch for Administrators" | (music only) |
| 0:02-0:07 | Staff sign-in > Administrator > Dashboard cards and charts | "Administrators start on the dashboard: totals, trends and accident hot spots." |
| 0:07-0:13 | Reports: filter by status Submitted, open one | "Filter new reports and open one to review the details, photos and map." |
| 0:13-0:18 | **Verify** (the Verified record badge appears) | "Verify it to turn the public report into an official record," |
| 0:18-0:23 | **Assign officer**, pick an officer, Save | "then assign a traffic officer, who is notified at once." |
| 0:23-0:30 | Summaries: weekly, Export PDF; end card | "Summaries and PDF or CSV exports are one click away." |

Word count: about 60.

---

## 3. Promotional video (3:00 minimum, aim for 3:30)

Covers what the video presentation needs: the problem, the technologies, a demo, the database and architecture, and
the challenges, with **every member speaking**. Landscape 16:9. Burned-in captions throughout.

| Time | Scene | Speaker | Content and shots |
|---|---|---|---|
| 0:00-0:15 | Hook | (voice: Princess) | Flow b-roll of a busy road at dusk; text "Every minute counts after a road accident." Logo reveal. |
| 0:15-0:40 | The problem | Princess (on camera) | Reports by phone calls and paper are slow, scattered and hard to verify; no one sees the hot spots. |
| 0:40-1:00 | Meet RoadWatch | Lenon (on camera) | One system: the Android app for the public and officers, the website for administrators and officers. Show the landing page and the app home side by side. |
| 1:00-1:35 | Demo: reporting | Lenon (voice) | Fast version of the Reporter clip: form, GPS pin, photos, submit, report number, email received. |
| 1:35-2:05 | Demo: review and response | Pauline (voice), Carl (voice) | Admin verifies and assigns (web); officer gets the bell / notification, updates the status (app and web); the reporter sees the new status. |
| 2:05-2:35 | How it is built | Carl (on camera, then voice over the diagram) | Architecture diagram (`docs/architecture/roadwatch.png`): Flutter and React clients, Node.js + Express API on Render, MySQL on Aiven with TLS, Cloudinary photos, Brevo email, OpenStreetMap. Show the ERD (`docs/erd/`) for 5 seconds: 8 tables, status history and audit log. |
| 2:35-2:55 | Quality and security | Pauline (on camera) | Manual test plan for every requirement, retests, WCAG 2.1 AA (labels, focus, contrast, captions), light and dark mode; bcrypt, JWT, role checks on the server, strong passwords. |
| 2:55-3:20 | Challenges | All four, one line each (cuts) | Examples: Render blocks email ports, so we moved to the Brevo API (Carl); learning Flutter and React in three weeks (Lenon); keeping the web accessible on phones (Pauline); keeping the documentation in step with the code (Princess). |
| 3:20-3:35 | Closing | Princess (on camera), team shot | "Download the app and try RoadWatch." Show the website address, the APK QR code or link, the team names and roles. End card. |

Shooting tips: record the four on-camera parts on the same day with the same background; say each line twice;
leave one second of silence before and after each take for clean cuts.

---

## 4. Before you export: checklist
- [ ] Each demo clip is **exactly 0:30** in the CapCut export dialog; the promo is **3:00 or longer**.
- [ ] Captions are burned in and spelled correctly.
- [ ] No passwords, real emails, real phone numbers or real people's data on screen.
- [ ] The app version shown is 1.2.0 (Settings) and the web About says 1.2.0.
- [ ] Logos used are ours or the official tool logos from `docs/assets/logos/`; no PNP or BFP seals in AI shots.
- [ ] Every member is heard in the promo.
- [ ] Files are named exactly as in the table at the top and are under 100 MB each.
