# RoadWatch screen exports (PNG)

Static PNG copies of the Figma screens, exported on Oct 21, 2026 from the high-fidelity file
`psx52NYL69RkycK7Z44EAb` (Mobile page `90:4`, Web page `90:5`) at 1x. Use them in the PPT user guide,
the video and the course documentation. Figma stays the source of truth: when a screen changes there,
export it again under the same file name. Node IDs for every frame are in `../figma-index.md`.

| Folder | Frames | Size |
|---|---|---|
| `mobile/` | 58: M0-M6 (Reporter), Notifications, Settings and its sub-screens, O1-O6 (Traffic Officer), mobile accessibility checklist | 360 x 800 (O2 report details is the full scroll, 360 x 2197) |
| `web/` | 51: W0 landing, W1 sign-in, W2-W4, W6-W12, Demo video, dialogs, web accessibility checklist | 1440 desktop, 390 phone, 480 dialogs |

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
