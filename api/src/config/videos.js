// Videos for the apps and the landing page (DECISIONS #48). The URLs are Cloudinary links set on the host
// (Render environment); a clip without a URL shows "Clip coming soon" in the apps. The transcripts live here,
// so a wording change needs only an API deploy, not a new APK. Scripts: docs/video/PRODUCTION-GUIDE.md.

const TRANSCRIPTS = {
  reporter:
    "Saw a road accident? Open RoadWatch and tap Report an Accident. Add when it happened, the type of accident, " +
    "the vehicles and any injuries. Your phone's GPS pins the place, or you move the pin yourself. Attach photos " +
    'as evidence, then send it. You get a report number right away, and you can track every status update in My reports.',
  officer:
    'When the administrator assigns you a report, it appears in Assigned. Open it to see the details, the photos and ' +
    'the exact place on the map. Set it to In Progress and record your official remarks. When the case is done, mark ' +
    'it Resolved or Closed. On a computer, use the same account on the RoadWatch website.',
  admin:
    'Administrators start on the dashboard: totals, trends and accident hot spots. Filter new reports and open one to ' +
    'review the details, photos and map. Verify it to turn the public report into an official record, then assign a ' +
    'traffic officer, who is notified at once. Summaries and PDF or CSV exports are one click away.',
  // The promo has no fixed script; PROMO_VIDEO_TRANSCRIPT can carry its final transcript.
  promo: null,
};

function clip(urlVar, key) {
  const url = process.env[urlVar] || null;
  const transcript = key === 'promo' ? process.env.PROMO_VIDEO_TRANSCRIPT || null : TRANSCRIPTS[key];
  return { url, transcript: url ? transcript : null };
}

// GET /api/app-info
function appInfo() {
  const promoVideo = clip('PROMO_VIDEO_URL', 'promo');
  return {
    // Kept for apps before v1.1.0, which play one video from this field.
    demoVideoUrl: promoVideo.url || process.env.DEMO_VIDEO_URL || null,
    promoVideo,
    demoVideos: {
      reporter: clip('DEMO_VIDEO_REPORTER_URL', 'reporter'),
      officer: clip('DEMO_VIDEO_OFFICER_URL', 'officer'),
      admin: clip('DEMO_VIDEO_ADMIN_URL', 'admin'),
    },
  };
}

module.exports = { appInfo, TRANSCRIPTS };
