# Demo video

Final file: `docs/video/roadwatch-demo.mp4` (MP4, any length, decided by the Documentation Lead).

Before committing it:

```bash
git lfs install
git add .gitattributes
git add docs/video/roadwatch-demo.mp4
```

The same video is also uploaded to Cloudinary. Its URL goes in the `DEMO_VIDEO_URL` environment variable of the
deployed API, and both the web page and the mobile screen play it from there (`GET /api/app-info`).
Do not copy the video into `web/public` or the Flutter assets.
