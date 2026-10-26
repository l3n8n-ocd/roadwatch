import 'dart:async';

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../theme/tokens.dart';
import 'rw_button.dart';
import 'rw_icon.dart';
import 'rw_map.dart';
import 'rw_top_bar.dart';

/// Full-screen map (#46). Figma (Mobile page 90:4): M6/Map/Full screen 406:4311 (reporter),
/// O2/Map/Full screen 406:4367 (officer, keeps "Open in Maps"), M3/Location/Full-screen map
/// 406:4431 ("Move the pin": the map moves under a fixed pin, Cancel / Use this location).
/// Back closes it. The card under the map is the text alternative (address and coordinates).
class RwFullScreenMap extends StatefulWidget {
  const RwFullScreenMap({
    super.key,
    required this.title,
    this.pin,
    this.address,
    this.onOpenInMaps,
    this.pickPin = false,
    this.geocoder,
  });

  final String title;
  final LatLng? pin;
  final String? address;
  final VoidCallback? onOpenInMaps;

  /// "Move the pin" mode: pops the chosen [LatLng], or null on Cancel / Back.
  final bool pickPin;

  /// Reverse geocoder for the address line in "Move the pin" mode (Nominatim in the app).
  final Future<String?> Function(LatLng point)? geocoder;

  /// Read-only view of one report's pin (tracking M6 and officer O2).
  static Future<void> show(
    BuildContext context, {
    required String title,
    required LatLng pin,
    String? address,
    VoidCallback? onOpenInMaps,
  }) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => RwFullScreenMap(title: title, pin: pin, address: address, onOpenInMaps: onOpenInMaps),
    ),
  );

  /// M3: lets the reporter move the pin; returns the new point, or null when cancelled.
  static Future<LatLng?> pick(
    BuildContext context, {
    LatLng? initial,
    String? address,
    Future<String?> Function(LatLng point)? geocoder,
  }) => Navigator.of(context).push<LatLng>(
    MaterialPageRoute<LatLng>(
      builder: (_) => RwFullScreenMap(
        title: 'Move the pin',
        pin: initial,
        address: address,
        pickPin: true,
        geocoder: geocoder,
      ),
    ),
  );

  @override
  State<RwFullScreenMap> createState() => _RwFullScreenMapState();
}

class _RwFullScreenMapState extends State<RwFullScreenMap> {
  late LatLng? _center = widget.pin;
  late String? _address = widget.address;
  Timer? _lookup;
  int _request = 0;

  @override
  void dispose() {
    _lookup?.cancel();
    super.dispose();
  }

  void _onCenter(LatLng point) {
    setState(() => _center = point);
    final geocoder = widget.geocoder;
    if (geocoder == null) return;
    // Look the address up once the map stops moving.
    _lookup?.cancel();
    _lookup = Timer(const Duration(milliseconds: 700), () async {
      final request = ++_request;
      final address = await geocoder(point);
      if (mounted && request == _request && address != null && address.isNotEmpty) {
        setState(() => _address = address);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final center = _center;
    final coords = center == null
        ? null
        : 'Lat ${center.latitude.toStringAsFixed(4)} · Long ${center.longitude.toStringAsFixed(4)}';

    return Scaffold(
      backgroundColor: c.surfaceWhite,
      appBar: RwTopBar.inner(title: widget.title),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: RwMap(
              pin: widget.pin,
              height: double.infinity,
              framed: false,
              centerPin: widget.pickPin,
              onCenterChanged: widget.pickPin ? _onCenter : null,
            ),
          ),
          Container(
            decoration: BoxDecoration(color: c.surfaceWhite, boxShadow: RwShadow.md),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(RwSpace.s16, RwSpace.s16, RwSpace.s16, RwSpace.s24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (widget.pickPin) ...[
                      Text(
                        'Drag the map so the pin sits on the accident spot.',
                        style: RwType.label.copyWith(color: c.textPrimary),
                      ),
                      const SizedBox(height: RwSpace.s8),
                    ],
                    if (_address != null && _address!.isNotEmpty) ...[
                      Text(_address!, style: RwType.button.copyWith(color: c.textPrimary)),
                      const SizedBox(height: RwSpace.s8),
                    ],
                    if (coords != null) Text(coords, style: RwType.bodySm.copyWith(color: c.textMuted)),
                    if (widget.onOpenInMaps != null) ...[
                      const SizedBox(height: RwSpace.s12),
                      RwButton.secondary(
                        label: 'Open in Maps',
                        icon: RwIcons.map,
                        onPressed: widget.onOpenInMaps,
                      ),
                    ],
                    if (widget.pickPin) ...[
                      const SizedBox(height: RwSpace.s12),
                      Row(
                        children: [
                          Expanded(
                            child: RwButton.secondary(
                              label: 'Cancel',
                              compact: true,
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                          ),
                          const SizedBox(width: RwSpace.s12),
                          Expanded(
                            child: RwButton(
                              label: 'Use this location',
                              compact: true,
                              onPressed: center == null ? null : () => Navigator.of(context).pop(center),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
