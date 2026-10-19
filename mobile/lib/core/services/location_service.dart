import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

enum LocationProblem { serviceOff, denied, deniedForever, failed }

/// Result of asking for the phone's GPS position (M3 location step).
class LocationResult {
  const LocationResult.found(LatLng this.position) : problem = null;
  const LocationResult.failed(LocationProblem this.problem) : position = null;

  final LatLng? position;
  final LocationProblem? problem;

  bool get ok => position != null;

  /// Text for the M3 "Permission off" state. The pin and the typed address stay optional.
  String get message {
    switch (problem) {
      case LocationProblem.serviceOff:
        return 'Location is turned off. Turn it on, or type the place and tap the map.';
      case LocationProblem.denied:
      case LocationProblem.deniedForever:
        return 'RoadWatch cannot use your location. Type the place and tap the map to place a pin.';
      case LocationProblem.failed:
        return "Couldn't find your location. Type the place and tap the map to place a pin.";
      case null:
        return '';
    }
  }
}

/// Wraps geolocator: checks the service, asks for permission once, returns a [LatLng].
class LocationService {
  const LocationService();

  /// Bulacan State University (Malolos) as the initial map center before any pin.
  static const defaultCenter = LatLng(14.8433, 120.8114);

  Future<LocationResult> current() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        return const LocationResult.failed(LocationProblem.serviceOff);
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        return const LocationResult.failed(LocationProblem.deniedForever);
      }
      if (permission == LocationPermission.denied) {
        return const LocationResult.failed(LocationProblem.denied);
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
      return LocationResult.found(LatLng(pos.latitude, pos.longitude));
    } catch (_) {
      return const LocationResult.failed(LocationProblem.failed);
    }
  }

  /// Opens Android settings so the user can allow location after "Don't ask again".
  Future<bool> openSettings() => Geolocator.openAppSettings();
}
