# RoadWatch screen exports (PNG)

Static PNG copies of the Figma screens, exported on Oct 21, 2026 from the high-fidelity file
`psx52NYL69RkycK7Z44EAb` (Mobile page `90:4`, Web page `90:5`) at 1x. Use them in the PPT user guide,
the video and the course documentation. Figma stays the source of truth: when a screen changes there,
export it again under the same file name. Node IDs for every frame are in `../figma-index.md`.

| Folder | Frames | Size |
|---|---|---|
| `mobile/` | 48: M0-M6 (Reporter), Notifications, Settings and its sub-screens, O1-O6 (Traffic Officer), mobile accessibility checklist | 360 x 800 (O2 report details is the full scroll, 360 x 2197) |
| `web/` | 38: W0 landing, W1 sign-in, W2-W4, W6-W12, Demo video, dialogs, web accessibility checklist | 1440 desktop, 390 phone, 480 dialogs |

File names follow the frame names: `<screen>-<state>[-dark][-<width>].png`, for example
`w4-report-verified-1440.png` is "W4/Report details/Verified (1440)" and `m6-my-reports-empty.png` is
"M6/My reports/Empty".

Figma fixes on Oct 21 (frames re-exported): Edit profile no longer shows the "not built yet" endpoint note,
Change password's note matches the app, O3 and O4 say only the reporter is notified (as the API does), and the
W12 500 heading wraps at 390 px.
