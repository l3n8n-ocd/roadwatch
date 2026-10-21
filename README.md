# RoadWatch: Web and Mobile-Based Road Accident Reporting System

IT 305 Advance Web Development | BSIT 3I-G1 | Bulacan State University
Build window: Oct 12-30, 2026 | Submission: Nov 2, 2026

## Team

| Member | Role |
|---|---|
| Lenon Adriano | Project Leader, Front-End Developer (Mobile), Repo Manager |
| Pauline Lapuz | QA Testing (Web/Mobile), Front-End Developer (Web) |
| Carl Ernest Santos | Back-End Developer, Database Developer |
| Princess Lorellyn Isip | Documentation Lead |

## Stack

React + Vite + Tailwind (web) | Flutter + Dart (mobile) | Node.js + Express (API) | MySQL (Aiven) |
OpenStreetMap (Leaflet / flutter_map) + Nominatim | Cloudinary | Brevo email API (HTTPS) | GitHub Actions

## Folder map

| Folder | Contents | Owner |
|---|---|---|
| `api/` | Express REST API | Carl |
| `web/` | React web dashboard | Pauline |
| `mobile/` | Flutter app | Lenon |
| `database/` | `schema.sql`, `seed.sql` | Carl |
| `docs/` | ERD, architecture, UI design, user guide, contribution report | Princess |
| `scripts/` | `commit-as.sh` helper | Lenon |
| `.github/workflows/` | CI for api, web, mobile | Lenon |

## Quick start

1. **Database:** run `database/schema.sql` then `database/seed.sql` in MySQL (local or Aiven).
2. **API:** `cd api && cp .env.example .env` (fill in values), `npm install`, `npm run dev`. Health check: `GET /api/health`. DB check: `npm run check:db`. Create the first admin with `npm run seed:admin`.
3. **Web:** follow `web/SETUP.md`.
4. **Mobile:** follow `mobile/SETUP.md`.

## Key decisions

See `docs/DECISIONS.md`. Highlights: login required for reporters (anonymous reporting to be asked on Oct 16), first admin
created with `npm run seed:admin`, admin creates officers, deployed system required, demo video in `docs/video/` (Git LFS) and
inside the web and mobile apps.

## Contributions

All work is committed by the repo manager on behalf of each member using `scripts/commit-as.sh`
so every member keeps credit. See `docs/contributions/CONTRIBUTIONS.md`.
