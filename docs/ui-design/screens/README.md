# RoadWatch screen exports (PNG)

Static PNG copies of the Figma screens, exported on Oct 21, 2026 from the high-fidelity file
`psx52NYL69RkycK7Z44EAb` (Mobile page `90:4`, Web page `90:5`) at 1x. Use them in the PPT user guide,
the video and the product documentation. Figma stays the source of truth: when a screen changes there,
export it again under the same file name. Node IDs for every frame are in `../figma-index.md`.

| Folder | Frames | Size |
|---|---|---|
| `mobile/` | 58: M0-M6 (Reporter), Notifications, Settings and its sub-screens, O1-O6 (Traffic Officer), mobile accessibility checklist | 360 x 800 (O2 report details is the full scroll, 360 x 2197) |
| `web/` | 61: W0 landing, W1 staff sign-in (role chooser, Administrator, Traffic Officer), W2-W12 (W5 and officer W4 since #52), Demo video, dialogs, web accessibility checklist | 1440 desktop, 390 phone, 480 dialogs |

File names follow the frame names: `<screen>-<state>[-dark][-<width>].png`, for example
`w4-report-verified-1440.png` is "W4/Report details/Verified (1440)" and `m6-my-reports-empty.png` is
"M6/My reports/Empty".

Figma fixes on Oct 21 (frames re-exported): Edit profile no longer shows the "not built yet" endpoint note,
Change password's note matches the app, O3 and O4 say only the reporter is notified (as the API does), and the
W12 500 heading wraps at 390 px.

Added Oct 23 after the first test run (Figma first, then code; DECISIONS #42): `web/w1-login-deactivated-1440.png`,
`web/w2-change-password-dialog.png`, `mobile/o2-report-details-rejected.png`; `web/w1-login-error-1440.png` re-exported
with the generic "Email or password is incorrect" copy.

Added Oct 25 for #37, #45 and #46 (Figma approved by Lenon before any code; DECISIONS #43):
- Forgot password: `mobile/m0-forgot-password-email.png`, `-code.png`, `-code-wrong.png`, `mobile/m0-login-password-changed.png`,
  `web/w1-forgot-password-email-1440.png`, `web/w1-forgot-password-code-1440.png`, `web/w1-forgot-password-code-390.png`,
  `web/w1-login-password-changed-1440.png`; admin reset: `web/w6-reset-password-dialog.png`, `web/w6-users-password-reset-1440.png`.
- Full screen: `mobile/photo-viewer-full-screen.png`, `mobile/m6-map-full-screen.png`, `mobile/o2-map-full-screen.png`,
  `mobile/m3-location-full-screen-map.png`, `web/w4-photo-viewer-full-screen-1440.png`, `web/w4-map-full-screen-1440.png`,
  `web/w0-updates-map-full-screen-1440.png`, `web/w2-hotspots-map-full-screen-1440.png`.
- Re-exported: every frame with a password field (eye button, #45) or a map (Expand map button, #46), the W1 frames
  ("Forgot password?" link) and W6 (Reset password row action).
- Oct 25, later: "New code sent" state (`mobile/m0-forgot-password-new-code-sent.png`, `web/w1-forgot-password-new-code-sent-1440.png`); `mobile/m3-location-full-screen-map.png` re-exported (button label on one line).

Re-exported Oct 27 for the password strength meter (#44, Figma approved by Lenon before any code; DECISIONS #44):
- Mobile: `m0-register-default.png`, `m0-register-validation.png`, `settings-change-password.png`, `m0-forgot-password-code.png`,
  `m0-forgot-password-code-wrong.png`, `m0-forgot-password-new-code-sent.png`.
- Web: `w6-users-1440.png`, `w6-users-after-deactivation-1440.png`, `w6-users-password-reset-1440.png`, `w6-reset-password-dialog.png`,
  `w2-change-password-dialog.png`, `w1-forgot-password-code-1440.png`, `w1-forgot-password-code-390.png`,
  `w1-forgot-password-new-code-sent-1440.png`.

Added Oct 27 for #48, #49 and #52 (Figma approved by Lenon before any code; DECISIONS #45, #46):
- Traffic Officer web portal (#52): `web/w1-staff-choose-role-1440.png`, `-390.png`, `web/w1-login-officer-1440.png`,
  `web/w1-login-wrong-role-1440.png`, `web/w5-officer-queue-1440.png`, `web/w5-officer-queue-empty-1440.png`,
  `web/w4-report-officer-1440.png`, `web/w4-report-officer-saved-1440.png`. The Administrator sign-in frames
  (`w1-login-*`, `w1-forgot-password-email-1440.png`) were re-exported with "Choose a different role" and the new notes.
- Product wording, team photos and Built with logos (#48, #49): `web/w0-landing-1440.png`, `-390.png`, `web/w9-admin-about-1440.png`,
  `web/w10-about-1440.png`, `-390.png`, `mobile/settings-about.png`, `mobile/settings-demo-video-playing.png` re-exported.
- Officer bell (#47): `web/w5-notifications-open-1440.png`, `web/w5-notifications-panel-empty.png`. The bell was removed from every
  Administrator frame, so `w2-*`, `w3-*`, `w4-report-*` (admin), `w6-*`, `w7-*`, `w8-action-log-1440.png`, `w8-action-log-all-staff-1440.png`,
  `w9-admin-about-1440.png` and `demo-video-*` were re-exported; `w8-action-log-empty-1440.png` is an officer frame and keeps the bell.

Added Oct 27 for the per-role demo clips and the promotional video (#48, DECISIONS #48; Figma approved by Lenon before any code):
- Web: `demo-video-per-role-admin-1440.png`, `demo-video-per-role-officer-1440.png`, `demo-video-clip-coming-soon.png`,
  `w0-watch-the-video-1440.png`, `w0-watch-the-video-390.png`; `w0-landing-1440.png` and `w0-landing-390.png` re-exported
  (new section after How it works; footer link "Watch the video").
- Mobile: `demo-video-per-role-reporter.png`, `demo-video-per-role-officer.png`. The older `settings-demo-video-*.png` and
  `demo-video-playing-1440.png` / `demo-video-coming-soon-1440.png` show the single video used before v1.1.0.
