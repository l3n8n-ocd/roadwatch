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
To let GitHub build it, tag a release (`git tag v0.1.0 && git push --tags`) and download the
`roadwatch-apk` artifact from the mobile-ci run.

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
