import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

import '../../core/api/models.dart';

/// The report being written across the 3 form steps (M2 details, M3 location, M4 photos).
/// Provided app-wide; call [reset] after a successful submit or when the user cancels.
class ReportDraft extends ChangeNotifier {
  int? accidentTypeId;
  DateTime? accidentDate;

  /// 24 h "HH:MM".
  String? accidentTime;
  String location = '';
  String description = '';

  /// none | injuries | fatalities | unknown
  String? injury;
  String vehiclesInvolved = '';

  /// Optional map pin (M3). The typed [location] is the required part.
  LatLng? pin;

  /// Local file paths picked with image_picker (M4); uploaded after the report is created.
  final List<String> photoPaths = [];

  void update(void Function(ReportDraft d) change) {
    change(this);
    notifyListeners();
  }

  void reset() {
    accidentTypeId = null;
    accidentDate = null;
    accidentTime = null;
    location = '';
    description = '';
    injury = null;
    vehiclesInvolved = '';
    pin = null;
    photoPaths.clear();
    notifyListeners();
  }

  /// Body for POST /reports. Call only after the details step validated the required fields.
  NewReport toNewReport({required String Function(DateTime) formatDate}) => NewReport(
    accidentTypeId: accidentTypeId!,
    accidentDate: formatDate(accidentDate!),
    accidentTime: accidentTime!,
    location: location.trim(),
    description: description.trim(),
    injury: injury ?? 'unknown',
    latitude: pin?.latitude,
    longitude: pin?.longitude,
    vehiclesInvolved: vehiclesInvolved,
  );
}
