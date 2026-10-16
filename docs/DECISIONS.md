# Decisions Log

Last updated: Oct 16, 2026

| # | Topic | Decision | Status |
|---|---|---|---|
| 1 | Section | BSIT 3I-G1 | Final |
| 2 | Timeline | System finished Oct 30. Oct 31 to Nov 2 for documentation and video. | Final |
| 3 | Sign-in | Login required for reporters. `reports.reporter_id` is NOT NULL. | **Open: ask professor about anonymous reporting on Oct 16** |
| 4 | Registration fields | Full name, email (unique), password (min 8), optional phone. No email verification. Registration always creates a Reporter. | Final |
| 5 | Admin and officer accounts | First admin created with `npm run seed:admin`. Admin creates Traffic Officers in the system. | Final |
| 6 | Stack | React + Vite + Tailwind, Flutter, Node/Express, MySQL, OpenStreetMap | Final |
| 7 | Database host | Aiven managed MySQL (TLS) | Final |
| 8 | API and web hosting | **Render** for API, Vercel for web. Free-tier limits verified by Lenon. | Final |
| 9 | Notifications | Email only. Nodemailer using **Gmail SMTP** (app password, `MAIL_PROVIDER=smtp`) for the demo. Resend stays optional and needs a verified domain. | Final |
| 10 | Deployment | Deployed system required | Final |
| 11 | Repo | Public GitHub repo on Lenon's account. Work on `dev`, merge to `main` at milestones with merge commits (no squash). | Final |
| 12 | Authorship | Lenon commits for all members with `scripts/commit-as.sh` using GitHub no-reply emails | Final |
| 13 | Video | MP4, any length (Documentation Lead decides). Stored in `docs/video/` with Git LFS, uploaded to Cloudinary, and shown inside web and mobile via `/api/app-info`. | Final |
| 14 | Database folder | `database/` at the repo root | Final |
| 15 | ORM | Sequelize (Prisma not used) | Final |
| 16 | User deactivation | `users.is_active TINYINT(1) NOT NULL DEFAULT 1`. Inactive users cannot log in. Admins cannot deactivate themselves. | Final |
| 17 | UI quality | Fully responsive web, WCAG 2.1 AA target. Palette contrast still to be checked with a tool. | Final (contrast check open) |

## If the professor says anonymous reporting is required
Make `reporter_id` nullable, add a tracking code to `reports`, allow contact fields to be optional, and tell Carl before step 11 (Oct 20).
