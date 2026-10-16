# Mobile (Flutter + Dart)

Owner: Lenon.

The Flutter project is NOT generated yet, so run this once from the repo root:

```bash
cd mobile
flutter create . --org com.roadwatch --project-name roadwatch_mobile
flutter pub add dio flutter_map latlong2 geolocator image_picker flutter_secure_storage provider
```

Run with `flutter run`. Build the demo APK with `flutter build apk --release`.
To let GitHub build it, tag a release (`git tag v0.1.0 && git push --tags`) and download the
`roadwatch-apk` artifact from the mobile-ci run.

Suggested folders under `lib/`: `core/` (api client, theme), `features/` (auth, report_form,
location, photos, tracking, notifications).

## Demo video screen

`flutter pub add video_player`. Add a "Demo Video" screen that reads `GET /api/app-info` and plays `demoVideoUrl`.
If it is null, show "Video coming soon". Build this before the Oct 30 freeze.
