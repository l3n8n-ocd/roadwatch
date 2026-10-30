# Videos

How to make them: [`PRODUCTION-GUIDE.md`](PRODUCTION-GUIDE.md) (CapCut Pro workflow, Google Flow b-roll, scripts).

| File | Length | Where it shows | Render setting |
|---|---|---|---|
| `roadwatch-promo.mp4` | 3:00 minimum | Landing page "Watch the video", README, submission | `PROMO_VIDEO_URL` |
| `demo-reporter.mp4` | 0:30 | Android app, Settings > Demo video | `DEMO_VIDEO_REPORTER_URL` |
| `demo-officer.mp4` | 0:30 | Android app (officers) and the web Demo video page | `DEMO_VIDEO_OFFICER_URL` |
| `demo-admin.mp4` | 0:30 | Web Demo video page | `DEMO_VIDEO_ADMIN_URL` |

Before committing them:

```bash
git lfs install
git add docs/video/roadwatch-promo.mp4 docs/video/demo-reporter.mp4 docs/video/demo-officer.mp4 docs/video/demo-admin.mp4
```

The same files are uploaded to Cloudinary. Their URLs go in the Render settings above, and the web and the app play
them from there (`GET /api/app-info`). Do not copy the videos into `web/public` or the Flutter assets.
"Download ZIP" on GitHub contains only Git LFS pointers, so submit the MP4 files separately as well.
