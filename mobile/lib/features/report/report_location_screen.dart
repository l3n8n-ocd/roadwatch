import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import '../../core/services/location_service.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import 'report_details_screen.dart' show confirmCancelReport;
import 'report_draft.dart';

/// Report an accident, step 2 of 3. Figma (Mobile page 90:4): M3/Location/Pin placed 113:804,
/// Locating 113:913, Permission off 113:1016.
///
/// The typed accident_location is required; the map pin (latitude/longitude) is optional.
/// "Use my current location" asks geolocator through [LocationService]; tapping the map places
/// the pin, and "Expand map" opens the full-screen "Move the pin" view (#46). A new pin fills the location text from OpenStreetMap Nominatim when the reporter has
/// not typed their own.
class ReportLocationScreen extends StatefulWidget {
  const ReportLocationScreen({super.key, this.locationService = const LocationService(), this.geocoder});

  final LocationService locationService;

  /// Reverse geocoder (lat/long -> address). Defaults to Nominatim; tests pass a stub.
  final Future<String?> Function(LatLng point)? geocoder;

  @override
  State<ReportLocationScreen> createState() => _ReportLocationScreenState();
}

class _ReportLocationScreenState extends State<ReportLocationScreen> {
  late final ReportDraft _draft = context.read<ReportDraft>();
  late final _location = TextEditingController(text: _draft.location);

  bool _locating = false;
  LocationResult? _problem;

  /// The text last filled from the pin; replaced on the next pin unless the user edited it.
  String? _autoFilled;
  int _geocodeRequest = 0;
  String? _locationError;
  bool _tried = false;

  @override
  void initState() {
    super.initState();
    // Locating state (113:913) on first visit, when no pin is set yet.
    if (_draft.pin == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _locate();
      });
    }
  }

  @override
  void dispose() {
    _location.dispose();
    super.dispose();
  }

  Future<void> _locate() async {
    if (_locating) return;
    setState(() {
      _locating = true;
      _problem = null;
    });
    final result = await widget.locationService.current();
    if (!mounted) return;
    setState(() {
      _locating = false;
      if (result.ok) {
        _setPin(result.position!);
      } else {
        _problem = result;
      }
    });
  }

  void _setPin(LatLng? p) {
    _draft.update((d) => d.pin = p);
    setState(() {});
    if (p != null) _fillAddress(p);
  }

  Future<void> _fillAddress(LatLng p) async {
    final current = _location.text.trim();
    if (current.isNotEmpty && current != _autoFilled) return; // keep what the reporter typed
    final request = ++_geocodeRequest;
    final address = await (widget.geocoder ?? _nominatimReverse)(p);
    if (!mounted || request != _geocodeRequest || address == null || address.isEmpty) return;
    final now = _location.text.trim();
    if (now.isNotEmpty && now != _autoFilled) return;
    final text = address.length > 255 ? address.substring(0, 255) : address;
    setState(() {
      _autoFilled = text;
      _location.text = text;
      _draft.location = text;
      if (_tried) _locationError = _validate();
    });
  }

  /// Full-screen "Move the pin" (#46, Figma 406:4431): the reporter drags the map under the pin.
  Future<void> _moveOnFullMap() async {
    final picked = await RwFullScreenMap.pick(
      context,
      initial: _draft.pin,
      address: _location.text.trim().isEmpty ? null : _location.text.trim(),
      geocoder: widget.geocoder ?? _nominatimReverse,
    );
    if (picked != null && mounted) _setPin(picked);
  }

  String? _validate() {
    final t = _location.text.trim();
    if (t.isEmpty) return 'Enter where the accident happened.';
    if (t.length < 3) return 'Use at least 3 characters.';
    return null;
  }

  void _next() {
    _tried = true;
    final error = _validate();
    setState(() => _locationError = error);
    if (error != null) return;
    _draft.update((d) => d.location = _location.text.trim());
    FocusScope.of(context).unfocus();
    Navigator.of(context).pushNamed(Routes.reportPhotos);
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final pin = _draft.pin;
    final filledFromPin = _autoFilled != null && _location.text.trim() == _autoFilled;
    final problem = _problem;

    return Scaffold(
      backgroundColor: c.surfaceWhite,
      appBar: RwTopBar.inner(
        title: 'Report an accident',
        action: RwTopBarAction(
          icon: RwIcons.x,
          semanticLabel: 'Cancel report',
          onPressed: () => confirmCancelReport(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(RwSpace.s16),
              children: [
                const RwStepper(step: 2),
                if (problem != null) ...[
                  const SizedBox(height: RwSpace.s16),
                  RwToast(
                    type: RwToastType.warning,
                    title: problem.problem == LocationProblem.failed
                        ? "Couldn't find your location"
                        : 'Location is off',
                    message: problem.problem == LocationProblem.failed
                        ? problem.message
                        : 'Tap the map to place a pin, or just type the address below.',
                    onClose: () => setState(() => _problem = null),
                  ),
                  if (problem.problem == LocationProblem.deniedForever)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: _TextLink(
                        label: 'Open app settings',
                        onTap: () => widget.locationService.openSettings(),
                      ),
                    ),
                ],
                const SizedBox(height: RwSpace.s16),
                RwButton.secondary(
                  label: _locating ? 'Finding your location…' : 'Use my current location',
                  icon: RwIcons.locate,
                  loading: _locating,
                  onPressed: _locate,
                ),
                const SizedBox(height: RwSpace.s16),
                RwMap(
                  height: 240,
                  pin: pin,
                  locating: _locating,
                  onPinChanged: (p) => _setPin(p),
                  onLocate: _locate,
                  onExpand: _moveOnFullMap,
                ),
                const SizedBox(height: RwSpace.s16),
                RwTextField(
                  label: 'Accident location',
                  required: true,
                  controller: _location,
                  leadingIcon: RwIcons.mapPin,
                  hintText: 'Street, landmark or barangay',
                  helperText: filledFromPin
                      ? 'Filled from the pin (OpenStreetMap). Edit if needed.'
                      : 'Required even without a pin.',
                  errorText: _locationError,
                  maxLength: 255,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.done,
                  onChanged: (v) {
                    _draft.location = v;
                    setState(() {
                      if (_tried) _locationError = _validate();
                    });
                  },
                  onSubmitted: (_) => _next(),
                ),
                if (pin != null) ...[
                  const SizedBox(height: RwSpace.s8),
                  Wrap(
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: RwSpace.s8,
                    children: [
                      Text(
                        'Lat ${pin.latitude.toStringAsFixed(4)} · Long ${pin.longitude.toStringAsFixed(4)}',
                        semanticsLabel:
                            'Pin at latitude ${pin.latitude.toStringAsFixed(4)}, '
                            'longitude ${pin.longitude.toStringAsFixed(4)}',
                        style: RwType.bodySm.copyWith(color: c.textMuted),
                      ),
                      _TextLink(label: 'Remove pin', onTap: () => _setPin(null)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          _ActionBar(
            children: [
              Expanded(
                child: RwButton.secondary(label: 'Back', onPressed: () => Navigator.of(context).maybePop()),
              ),
              const SizedBox(width: RwSpace.s12),
              Expanded(
                child: RwButton(label: 'Next: Photos', onPressed: _next),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// OpenStreetMap Nominatim reverse lookup (usage policy: identify the app, low volume).
Future<String?> _nominatimReverse(LatLng p) async {
  try {
    final res =
        await Dio(
          BaseOptions(
            connectTimeout: const Duration(seconds: 8),
            receiveTimeout: const Duration(seconds: 8),
            headers: {'User-Agent': 'RoadWatch/1.0 (com.roadwatch.roadwatch_mobile)'},
          ),
        ).get<Map<String, dynamic>>(
          'https://nominatim.openstreetmap.org/reverse',
          queryParameters: {
            'format': 'jsonv2',
            'lat': p.latitude,
            'lon': p.longitude,
            'zoom': 18,
            'accept-language': 'en',
          },
        );
    final name = res.data?['display_name'];
    if (name is! String) return null;
    // Shorten "Street, Barangay, City, Province, Region, Postcode, Philippines" to 3 parts.
    final parts = name.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    return parts.take(3).join(', ');
  } catch (_) {
    return null;
  }
}

/// Sticky bottom action bar: white, top border, 16 px padding.
class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(top: BorderSide(color: c.borderSubtle)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(RwSpace.s16),
          child: Row(children: children),
        ),
      ),
    );
  }
}

/// Underlined text/blue link with a 48 px touch target.
class _TextLink extends StatelessWidget {
  const _TextLink({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      borderRadius: RwRadius.smAll,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: RwSize.touch, minWidth: RwSize.touch),
        alignment: Alignment.center,
        child: Text(
          label,
          style: RwType.label.copyWith(
            color: c.textBlue,
            decoration: TextDecoration.underline,
            decorationColor: c.textBlue,
          ),
        ),
      ),
    );
  }
}
