# Mobile (Flutter + Dart)

Owner: Lenon. The Flutter project is generated (Android only, `com.roadwatch`, package
`roadwatch_mobile`). Conventions for code and screens: `mobile/CLAUDE.md`.

```bash
cd mobile
flutter pub get
flutter analyze && flutter test
flutter run                                   # emulator; API defaults to http://10.0.2.2:5000/api
flutter run --dart-define=API_URL=https://<render-app>.onrender.com/api
```

Build the demo APK with `flutter build apk --release --dart-define=API_URL=https://<render-app>.onrender.com/api`.
To let GitHub build it (#22): make sure `version:` in `pubspec.yaml` (and `AppConfig.appVersion`) match the
tag, then tag `main` and push the tag (`git tag v1.0.0 && git push origin v1.0.0`). mobile-ci builds the APK
against the live API and publishes a GitHub Release with `roadwatch.apk` attached; the website's "Download the
app" buttons link to `releases/latest/download/roadwatch.apk`. A tag that does not match `pubspec.yaml` fails
the run. "Run workflow" on the Actions tab builds the same APK as a `roadwatch-apk` artifact without a release.
The APK is signed with the CI runner's debug key, so installing a newer release may require uninstalling the
old one first.

Packages: dio, flutter_map, latlong2, geolocator, image_picker, flutter_secure_storage, provider,
video_player, flutter_svg, shared_preferences (device-only settings), url_launcher (hotline `tel:` links).
Fonts (Inter, Poppins) are bundled in `assets/fonts`; nothing is downloaded at runtime.

## Android notes
- Permissions (`android/app/src/main/AndroidManifest.xml`): INTERNET, ACCESS_COARSE/FINE_LOCATION.
  CAMERA is intentionally not declared: image_picker uses the system camera app, and declaring
  CAMERA would force a runtime request before every capture.
- Debug and profile builds allow plain HTTP for the local API (`usesCleartextTraffic`); release
  builds must use the HTTPS Render URL.

## Demo video screen

Settings > Demo video reads `GET /api/app-info` and plays `demoVideoUrl` with video_player.
If it is null, show "Video coming soon" (`RwEmptyState.videoComingSoon()`).
