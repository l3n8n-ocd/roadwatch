# RoadWatch Figma index

Figma file: [RoadWatch-Wireframes](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=0-1) (file key `psx52NYL69RkycK7Z44EAb`).
Built Oct 17, 2026 with Claude Code (Figma MCP). Source of truth for decisions: `CLAUDE.md` and `docs/DECISIONS.md` (#17, #23 to #26).

How to read this file:
- **Mobile** and **Web** pages hold the source screens. **Flows** holds copies wired for the prototype; if a screen changes, update the source page and re-copy it to Flows.
- Every color, spacing and radius is a variable (collections Primitives, Color with Light and Dark modes, Layout). Web code syntax is `var(--rw-*)`.
- Open the prototype: Flows page → Present (▶) → choose a flow from the flow list.
- Pauline's original draft is untouched on the page "Pauline draft (original)" and now serves as the **low-fidelity prototype**. The high-fidelity prototype (and the source for the React and Flutter code) is the five pages below: Foundations, Components, Mobile, Web, Flows (DECISIONS #33).

## Pages

| Frame / asset | Node ID | Link |
|---|---|---|
| Foundations | `90:2` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=90-2) |
| Components | `90:3` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=90-3) |
| Mobile | `90:4` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=90-4) |
| Web | `90:5` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=90-5) |
| Flows | `90:6` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=90-6) |
| Archive (superseded frames, Oct 20, #36) | `316:14443` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=316-14443) |
| Pauline draft (original, untouched; low-fidelity prototype) | `0:1` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=0-1) |

## Foundations

| Frame / asset | Node ID | Link |
|---|---|---|
| Overview and rules | `93:2` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=93-2) |
| Color (palette and roles) | `93:20` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=93-20) |
| Typography | `93:172` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=93-172) |
| Spacing, radius, elevation, focus | `94:2` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=94-2) |
| Contrast checks (light) | `94:76` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=94-76) |
| Contrast checks (dark mode) | `159:2` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=159-2) |
| Iconography (icon components) | `95:4` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=95-4) |

Text styles: Heading/Hero, Display, H1, H2, H3, Stat; Body/Large, Default, Small; Label/Default, Button, Caption, Overline, Nav. Effect styles: Shadow/sm, md, lg; Focus/ring, Focus/ring-on-dark.

## Components (component sets)

| Frame / asset | Node ID | Link |
|---|---|---|
| Logo (emblem shield + wordmark) | `96:17` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=96-17) |
| Logo/Emblem (from draft) | `96:18` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=96-18) |
| Button | `96:193` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=96-193) |
| Icon button | `96:261` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=96-261) |
| Text field | `97:178` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=97-178) |
| Select | `97:279` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=97-279) |
| Date time field | `97:411` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=97-411) |
| Calendar popover | `97:412` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=97-412) |
| Textarea | `97:566` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=97-566) |
| Status chip (8 statuses) | `99:257` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=99-257) |
| Record badge | `99:272` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=99-272) |
| Report card | `99:348` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=99-348) |
| Timeline item | `99:388` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=99-388) |
| Stat card | `99:431` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=99-431) |
| Table row | `101:401` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-401) |
| Photo tile | `101:443` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-443) |
| Map | `101:649` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-649) |
| Toast | `101:708` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-708) |
| Empty / error state | `101:760` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-760) |
| Skeleton | `101:784` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=101-784) |
| Top bar mobile | `105:501` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=105-501) |
| Bottom nav (Role=Reporter: Home, My reports, Notifications, Settings; Role=Officer: Assigned, Notifications, Settings; #36) | `105:617` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=105-617) |
| Top bar web (Light/Dark switch, bell, user menu, Log out button) | `105:665` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=105-665) |
| Top bar reporter (web; Active = Report an accident / My reports / Notifications) | `228:1396` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=228-1396) |
| Sidebar item | `105:701` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=105-701) |
| Sidebar (Admin / Officer; Active=None for user-menu pages; "Show log out" off by default, on only as the 390 drawer) | `105:1211` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=105-1211) |
| Dialog | `106:880` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=106-880) |
| Notification item | `106:902` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=106-902) |
| Segmented control | `106:950` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=106-950) |
| Pagination | `106:954` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=106-954) |
| Stepper | `106:1001` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=106-1001) |
| Switch | `160:866` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=160-866) |
| Settings row | `160:904` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=160-904) |
| Theme switch (web Light/Dark) | `202:994` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=202-994) |
| Menu item (web dropdown row) | `194:938` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=194-938) |
| User menu dropdown (web) | `194:1134` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=194-1134) |
| Chat bubble (Type=Question/Answer × Size=Web/Mobile; landing FAQ, #40) | `341:4109` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=341-4109) |
| Team member card (initials avatar, name, role badge, 2-line bio; About page, #40) | `344:36590` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=344-36590) |

## Mobile (360 × 800, Android)

| Frame / asset | Node ID | Link |
|---|---|---|
| M0/Login/Default | `109:5` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=109-5) |
| M0/Login/Error | `109:79` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=109-79) |
| M0/Login/Deactivated account | `109:164` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=109-164) |
| M0/Register/Default (Reporter only; note: Traffic Officer accounts come from the administrator, #40) | `109:239` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=109-239) |
| M0/Register/Validation | `109:323` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=109-323) |
| M1/Home/Default | `112:263` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=112-263) |
| M1/Home/Empty | `112:415` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=112-415) |
| M1/Home/Loading | `112:495` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=112-495) |
| M1/Home/Default (Dark) | `164:2704` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=164-2704) |
| M2/Accident details/Default | `113:517` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=113-517) |
| M2/Accident details/Validation | `113:659` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=113-659) |
| M3/Location/Pin placed | `113:804` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=113-804) |
| M3/Location/Locating | `113:913` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=113-913) |
| M3/Location/Permission off | `113:1016` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=113-1016) |
| M4/Photos/Default | `115:1010` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=115-1010) |
| M4/Photos/Too large | `115:1118` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=115-1118) |
| M4/Photos/Submitting | `115:1231` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=115-1231) |
| M5/Confirmation/Default | `115:1305` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=115-1305) |
| M5/Confirmation/Photo upload failed | `115:1364` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=115-1364) |
| M6/My reports/Default | `116:1286` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=116-1286) |
| M6/My reports/Empty | `116:1456` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=116-1456) |
| M6/My reports/Loading | `116:1506` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=116-1506) |
| M6/My reports/Error | `116:1581` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=116-1581) |
| M6/Tracking/Under Review | `118:1606` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=118-1606) |
| M6/Tracking/Additional info required | `118:1731` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=118-1731) |
| Notifications/Default | `119:1759` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=119-1759) |
| Notifications/Empty | `119:1871` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=119-1871) |
| Settings/Main (Light) | `161:2022` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=161-2022) |
| Settings/Main (Dark) | `161:2285` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=161-2285) |
| Settings/Edit profile | `162:2322` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=162-2322) |
| Settings/Change password (validation) | `162:2396` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=162-2396) |
| Settings/Appearance | `162:2465` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=162-2465) |
| Settings/Language | `162:2516` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=162-2516) |
| Settings/How to report | `164:2576` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=164-2576) |
| Settings/About | `164:2646` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=164-2646) |
| Settings/Privacy | `177:2752` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=177-2752) |
| Settings/Emergency hotlines (911, PNP, BFP; scrolls) | `252:2763` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=252-2763) |
| Settings/Log out (confirm dialog; reporter and officer Settings, #40) | `347:36744` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-36744) |
| Label/O · Traffic Officer (mobile, #36) | `323:2814` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=323-2814) |
| O1/Assigned/Default (officer home; GET /officer/reports) | `323:2817` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=323-2817) |
| O1/Assigned/Empty | `323:3010` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=323-3010) |
| O2/Report details/Assigned (full scroll: location + Open in Maps, reporter contact, details, photos, history, sticky Update status) | `324:3382` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=324-3382) |
| O3/Update status (bottom sheet: status + official remarks) | `325:3328` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=325-3328) |
| O4/Report details/Update saved (toast) | `325:3567` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=325-3567) |
| O5/Notifications/Default (officer: assignment alerts) | `323:3085` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=323-3085) |
| O6/Settings/Main (Light) (officer) | `323:3198` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=323-3198) |
| Settings/Demo video/Playing | `119:1923` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=119-1923) |
| Settings/Demo video/Coming soon (demoVideoUrl = null) | `119:1991` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=119-1991) |
| Accessibility checklist/Mobile | `120:1977` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=120-1977) |

## Web (1440 desktop, 390 responsive)

| Frame / asset | Node ID | Link |
|---|---|---|
| W0/Landing/Default (1440) (#40: Light/Dark switch, FAQ nav link, stats bar, full hotlines card, Meet the team link, FAQ chat, QR placeholder) | `137:4095` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=137-4095) |
| W0/Landing/Responsive (390) (#40; FAQ shows 4 then "Show 4 more questions"; no QR on phones) | `139:4275` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=139-4275) |
| Handoff note/Public updates endpoint (confirmed) | `139:4434` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=139-4434) |
| W1/Login/Administrator (1440) | `121:5` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=121-5) |
| W1/Login/Administrator · Error (1440) | `121:57` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=121-57) |
| W1/Login/Administrator · Responsive (390) | `121:126` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=121-126) |
| W1/Login/Administrator · Mobile-only account (1440; reporter or officer account on the web, #36) | `321:15655` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=321-15655) |
| Handoff note/Role-based redirect | `121:182` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=121-182) |
| W2/Dashboard (1440) | `123:108` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=123-108) |
| W2/Dashboard (1440) · Dark theme | `166:4256` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=166-4256) |
| W2/Dashboard · User menu open (1440) | `196:4514` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=196-4514) |
| W2/Overlay/Log out (dialog, all staff screens, #40) | `347:36709` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-36709) |
| W3/Report management/Default (1440) | `124:492` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=124-492) |
| W3/Report management/No results (1440) | `124:1091` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=124-1091) |
| W3/Report management/Loading (1440) | `124:1321` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=124-1321) |
| W3/Report management/Responsive (390) | `131:3837` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=131-3837) |
| W4/Report details/Admin · 1 Under Review (assign locked) (1440) | `125:1372` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=125-1372) |
| W4/Report details/Admin · 2 Verified (assign enabled) (1440) | `126:1827` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=126-1827) |
| W4/Report details/Admin · 3 Assigned (1440) | `125:1729` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=125-1729) |
| W4/Overlay/Confirm Verified (dialog) | `126:2703` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=126-2703) |
| W4/Overlay/Reject with reason (dialog) | `126:2719` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=126-2719) |
| W4/Report details/Responsive (390) | `131:4011` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=131-4011) |
| W6/Users & settings/Default (1440) | `128:2944` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=128-2944) |
| W6/Users & settings/After deactivation (1440) | `128:3348` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=128-3348) |
| W6/Overlay/Deactivate user (dialog) | `128:3709` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=128-3709) |
| W7/Summaries & export/Default (1440) | `130:3413` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=130-3413) |
| W7/Summaries & export/Export complete (1440) | `130:3753` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=130-3753) |
| W8/Action log/Default (1440, admin) | `210:5390` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=210-5390) |
| W8/Action log/Empty (1440, officer) | `214:5677` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=214-5677) |
| W8/Action log/All staff (1440, admin only) | `245:6849` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=245-6849) |
| W9/About (admin console, moves to /admin/about, #40) | `212:5577` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=212-5577) |
| Demo video/Web/Playing (1440) | `127:2829` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=127-2829) |
| Demo video/Web/Coming soon (1440) | `127:2974` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=127-2974) |
| W10/About/Public (1440) (/about, Meet our team, #40) | `345:15810` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=345-15810) |
| W10/About/Public · Responsive (390) | `346:15885` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=346-15885) |
| W11/404 Page not found (1440) | `347:15949` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-15949) |
| W11/404 Page not found · Responsive (390) | `347:15995` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-15995) |
| W12/500 Something went wrong (1440) (render errors, API 5xx, /500) | `347:16031` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-16031) |
| W12/500 Something went wrong · Responsive (390) | `347:16084` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=347-16084) |
| Accessibility checklist/Web | `132:4095` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=132-4095) |

## Flows (prototype)

Flow starting points: 0 · Public landing (web); A · Reporter (mobile); B · Admin (starts at B1 Administrator sign-in): review, verify, assign; C · Officer (mobile, starts at C1, added Oct 20, #36); D · Admin: users and export; E1 · Settings and demo video (mobile); E2 · Demo video (web). The old web flows C (officer) and R (reporter) are on the Archive page.

| Frame / asset | Node ID | Link |
|---|---|---|
| 0 · W0 Public landing (flow start) | `148:9833` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=148-9833) |
| A1 · M0 Login (flow start) | `134:5` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-5) |
| A2 · M1 Home (flow start for E1) | `134:21` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-21) |
| A3 · M2 Accident details | `134:41` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-41) |
| A4 · M3 Location | `134:54` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-54) |
| A5 · M4 Photos | `134:67` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-67) |
| A6 · M5 Confirmation | `134:85` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-85) |
| A7 · M6 Tracking | `134:118` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-118) |
| B1 · W1 Administrator sign-in | `134:174` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-174) |
| B2 · W2 Dashboard (flow start for E2) | `134:187` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-187) |
| B3 · W3 Reports | `134:308` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-308) |
| B4 · W4 Details (Under Review; Save status → B5) | `134:346` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-346) |
| B5 · Overlay · Confirm Verified | `134:527` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-527) |
| B6 · W4 Verified (Assign officer → B7) | `134:557` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-557) |
| B7 · W4 Assigned | `134:436` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-436) |
| B8 · Overlay · Reject with reason | `134:640` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-640) |
| B2a · Overlay · User menu (from B2 user menu; Action log → F1, About → F2, outside click closes) | `198:4108` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=198-4108) |
| F1 · W8 Action log (RW-000128 link → B4; sidebar Dashboard → B2) | `215:10763` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=215-10763) |
| F2 · W9 About (sidebar Dashboard → B2) | `215:10845` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=215-10845) |
| C1 · M0 Login (officer; C flow start) | `328:15597` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15597) |
| C2 · O1 Assigned (RW-000128 card → C3; tabs → C6, C7) | `328:15614` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15614) |
| C3 · O2 Report details (scrolls; Open in Maps opens Google Maps; Update status at the end → C4) | `328:15623` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15623) |
| C4 · O3 Update status (Save → C5, Cancel → C3) | `328:15679` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15679) |
| C5 · O4 Update saved (back → C2) | `328:15745` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15745) |
| C6 · O5 Notifications (first alert → C3) | `328:15803` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15803) |
| C7 · O6 Settings (Log out → C1) | `328:15814` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=328-15814) |
| D1 · W6 Users & settings (flow start) | `134:926` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-926) |
| D2 · Overlay · Deactivate user | `134:1031` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-1031) |
| D3 · W6 After deactivation | `134:1057` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-1057) |
| D4 · W7 Summaries & export | `134:1162` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-1162) |
| D5 · W7 Export complete | `134:1257` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-1257) |
| E0 · Settings (mobile) | `172:3933` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=172-3933) |
| E1 · Demo video (mobile, from Settings) | `175:4123` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=175-4123) |
| E3 · Emergency hotlines (from Settings row or Home "Hotlines") | `256:5755` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=256-5755) |
| E2 · Demo video (web) | `134:1356` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-1356) |
| Motion and reduced motion notes | `135:3898` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=135-3898) |

Flow F (user menu pages) starts at B2 · W2 Dashboard (the same start as E2): open the user menu, then Action log or About.

Landing page (updated Oct 20, #36): the footer "Staff sign-in" goes to B1 Administrator sign-in. "Get the app" (header) and the two "Download the Android app" buttons open the latest GitHub release (APK). The reporter buttons and the header "Log in" were removed; "Track my report" became "See how it works".

Log out: every signed-in web frame in Flows (B2 to B7, D1 to D5, E2, F1, F2) has a Log out button beside the user menu, wired to 0 · W0 Public landing.

## Motion (#41, key frames; spec: `docs/ui-design/motion-spec.md`)

| Frame / asset | Node ID | Link |
|---|---|---|
| Page: Motion (#41) | `356:29566` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-29566) |
| P1 · Hero road and pin story (4 key frames) | `356:29570` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-29570) |
| P4 · Stats count-up (3 key frames) | `356:37184` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-37184) |
| P10 · FAQ chat (3 key frames) | `356:37292` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-37292) |
| App · M5 Report sent and M6 tracking (6 key frames) | `356:37328` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-37328) |
| Motion tokens and Reduce motion | `356:37668` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-37668) |
| W0 hero: Road and pin illustration (desktop) | `356:16116` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-16116) |
| W0 hero: Road and pin illustration (390) | `356:16123` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-16123) |
| Flows 0 · W0 hero: Road and pin illustration | `356:25892` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=356-25892) |

## Archive (superseded Oct 20, 2026, decision #36)

Page **Archive** (`316:14443`, [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=316-14443)). The professor ruled that Reporter and Traffic Officer are mobile-only and Administrator is web-only, so these frames are no longer used by the apps or the prototype. They are kept for the record, and the officer frames are the reference for the officer mobile screens. Links that led from them to frames still in use were removed; links between archived frames still work on the Archive page.

| Frame / asset | Node ID | Link |
|---|---|---|
| Label/Archive · read me | `318:19371` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=318-19371) |
| W1/Login/Choose role (1440) | `225:5910` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=225-5910) |
| W1/Login/Choose role · Responsive (390) | `226:5877` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=226-5877) |
| W1/Login/Traffic Officer (1440) | `225:5796` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=225-5796) |
| W1/Login/Wrong role (1440, officer account on Administrator sign-in) | `225:5832` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=225-5832) |
| W4/Report details/Officer (1440) | `126:2143` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=126-2143) |
| W4/Report details/Officer · Update saved (1440) | `126:2424` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=126-2424) |
| W5/Officer queue/Default (1440) | `127:2467` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=127-2467) |
| W5/Officer queue/Empty (1440) | `127:2755` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=127-2755) |
| B0 · W1 Choose role (B flow start) | `241:4853` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4853) |
| C0 · W1 Choose role (C flow start) | `241:4886` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4886) |
| C1 · W1 Traffic Officer sign-in | `134:709` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-709) |
| C2 · W5 Assigned to me | `134:722` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-722) |
| C3 · W4 Officer view | `134:767` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-767) |
| C4 · W4 Update saved | `134:844` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=134-844) |
| R0 · Reporter sign-in (R flow start) | `241:4922` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4922) |
| R0b · Reporter register | `241:4941` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4941) |
| R1 · Report details | `241:4962` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4962) |
| R2 · Report location | `241:4998` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-4998) |
| R3 · Report photos | `241:5033` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-5033) |
| R4 · Confirmation | `241:5073` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-5073) |
| R5 · My reports | `241:5104` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-5104) |
| R6 · Report tracking | `241:5120` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=241-5120) |
| R0/Reporter sign-in | `229:5883` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=229-5883) |
| R0/Reporter register | `229:5922` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=229-5922) |
| R1/Report · Details (step 1 of 3) | `231:5950` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=231-5950) |
| R2/Report · Location (step 2 of 3) | `231:6193` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=231-6193) |
| R3/Report · Photos (step 3 of 3) | `231:6369` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=231-6369) |
| R4/Report · Confirmation | `232:6397` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=232-6397) |
| R5/My reports | `232:6508` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=232-6508) |
| R6/Report tracking | `232:6888` | [Open](https://www.figma.com/design/psx52NYL69RkycK7Z44EAb/RoadWatch-Wireframes?node-id=232-6888) |

## Open items for the team

- Endpoints approved in design but not built (Carl): `GET /api/public/updates` (#23), update own profile and change own password (#25). Proposed, needs approval: a read-only endpoint for the user's own Action log (#27), with `action_type` and period filters and pagination; W8 is designed against it. W9 About reads the server state from `GET /api/health`; the version is static in the web build.
- Officer mobile screens O1 to O6 approved by the team on Oct 20 (#36), including "Call reporter" on O2 (opens the phone dialer). In the prototype, Update status sits at the end of the scrolling C3 screen because the plugin API cannot pin it; the app keeps it fixed at the bottom.
- The APK download buttons open the latest GitHub release; switch them to `roadwatch-ph.me/app` once the domain is live (#38).
- The demo video needs a WebVTT caption file and a transcript (WCAG 1.2.2), as promised on the Demo video screens.
- The draft emblem raster has a baked-in white haze; a transparent PNG or SVG export would render more cleanly.
