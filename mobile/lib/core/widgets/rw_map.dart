import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:url_launcher/url_launcher.dart';

import '../services/location_service.dart';
import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

/// Figma "Map" (101:649), mobile size: OpenStreetMap tiles with zoom buttons, "use current
/// location", attribution, and three states:
/// - pin placed: navy pin + coordinates chip
/// - no pin: "Tap the map to place a pin" hint
/// - locating: "Finding your location…" card ([locating] = true)
///
/// The pin is optional for a report; the typed location stays required. A text alternative
/// (coordinates) is always exposed to screen readers.
class RwMap extends StatefulWidget {
  const RwMap({
    super.key,
    this.pin,
    this.onPinChanged,
    this.onLocate,
    this.locating = false,
    this.height = 280,
    this.initialZoom = 15,
    this.controller,
  });

  /// Current pin, or null for the "No pin" state.
  final LatLng? pin;

  /// Called when the user taps the map. Null makes the map read-only (tracking screen).
  final ValueChanged<LatLng>? onPinChanged;

  /// "Use current location" button. Hidden when null.
  final VoidCallback? onLocate;
  final bool locating;
  final double height;
  final double initialZoom;
  final MapController? controller;

  @override
  State<RwMap> createState() => _RwMapState();
}

class _RwMapState extends State<RwMap> {
  MapController? _own;
  MapController get _map => widget.controller ?? (_own ??= MapController());
  bool _ready = false;

  @override
  void didUpdateWidget(RwMap old) {
    super.didUpdateWidget(old);
    // Follow the pin when it is set from outside (GPS result).
    final pin = widget.pin;
    if (_ready && pin != null && pin != old.pin) {
      _map.move(pin, _map.camera.zoom < 14 ? widget.initialZoom : _map.camera.zoom);
    }
  }

  @override
  void dispose() {
    _own?.dispose();
    super.dispose();
  }

  void _zoom(double delta) {
    final cam = _map.camera;
    _map.move(cam.center, (cam.zoom + delta).clamp(3, 19).toDouble());
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final pin = widget.pin;
    final description = widget.locating
        ? 'Map. Finding your location.'
        : pin == null
        ? 'Map. No pin placed.${widget.onPinChanged != null ? ' Tap the map to place a pin.' : ''}'
        : 'Map. Pin at ${pin.latitude.toStringAsFixed(4)}, ${pin.longitude.toStringAsFixed(4)}.';

    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Semantics(
            label: description,
            container: true,
            child: FlutterMap(
              mapController: _map,
              options: MapOptions(
                initialCenter: pin ?? LocationService.defaultCenter,
                initialZoom: widget.initialZoom,
                minZoom: 3,
                maxZoom: 19,
                onMapReady: () => _ready = true,
                onTap: widget.onPinChanged == null ? null : (_, latLng) => widget.onPinChanged!(latLng),
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                ),
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.roadwatch.roadwatch_mobile',
                ),
                if (pin != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: pin,
                        width: 40,
                        height: 48,
                        alignment: Alignment.topCenter,
                        child: CustomPaint(painter: _PinPainter(c.brandNavy, c.surfaceWhite)),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          if (pin != null && !widget.locating)
            Positioned(
              left: 11,
              top: 11,
              child: _Floating(
                radius: RwRadius.smAll,
                shadow: RwShadow.sm,
                padding: const EdgeInsets.symmetric(horizontal: RwSpace.s12, vertical: RwSpace.s8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    RwIcon(RwIcons.mapPin, size: RwSize.iconSm, color: c.textPrimary),
                    const SizedBox(width: RwSpace.s8),
                    Text(
                      '${pin.latitude.toStringAsFixed(4)}, ${pin.longitude.toStringAsFixed(4)}',
                      style: RwType.label.copyWith(color: c.textPrimary),
                    ),
                  ],
                ),
              ),
            ),
          if (pin == null && !widget.locating && widget.onPinChanged != null)
            Center(
              child: IgnorePointer(
                child: ExcludeSemantics(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s12),
                    decoration: BoxDecoration(
                      color: c.brandNavy,
                      borderRadius: RwRadius.fullAll,
                      boxShadow: RwShadow.md,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        RwIcon(RwIcons.mapPin, size: RwSize.iconSm, color: c.textInverse),
                        const SizedBox(width: RwSpace.s8),
                        Text(
                          'Tap the map to place a pin',
                          style: RwType.label.copyWith(color: c.textInverse),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          if (widget.locating)
            Center(
              child: Semantics(
                liveRegion: true,
                child: _Floating(
                  radius: RwRadius.mdAll,
                  shadow: RwShadow.md,
                  padding: const EdgeInsets.all(RwSpace.s16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Static loader icon when animations are reduced.
                      MediaQuery.disableAnimationsOf(context)
                          ? RwIcon(RwIcons.loader, size: RwSize.iconLg, color: c.textPrimary)
                          : SizedBox(
                              width: RwSize.iconLg,
                              height: RwSize.iconLg,
                              child: CircularProgressIndicator(strokeWidth: 2, color: c.textPrimary),
                            ),
                      const SizedBox(height: RwSpace.s8),
                      Text('Finding your location…', style: RwType.label.copyWith(color: c.textPrimary)),
                    ],
                  ),
                ),
              ),
            ),
          Positioned(
            right: 11,
            top: 11,
            child: _Floating(
              radius: RwRadius.smAll,
              shadow: RwShadow.sm,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _MapButton(icon: RwIcons.plus, label: 'Zoom in', onTap: () => _zoom(1)),
                  _MapButton(icon: RwIcons.minus, label: 'Zoom out', onTap: () => _zoom(-1)),
                ],
              ),
            ),
          ),
          if (widget.onLocate != null)
            Positioned(
              right: 11,
              bottom: 37,
              child: RwPressable(
                onTap: widget.locating ? null : widget.onLocate,
                semanticLabel: 'Use my current location',
                excludeChildSemantics: true,
                borderRadius: RwRadius.fullAll,
                builder: (context, s) => Container(
                  width: RwSize.touch,
                  height: RwSize.touch,
                  decoration: BoxDecoration(
                    color: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
                    shape: BoxShape.circle,
                    boxShadow: RwShadow.md,
                  ),
                  alignment: Alignment.center,
                  child: RwIcon(RwIcons.locate, size: RwSize.iconLg, color: c.textBlue),
                ),
              ),
            ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Semantics(
              link: true,
              label: 'Map data © OpenStreetMap contributors',
              excludeSemantics: true,
              onTap: _openAttribution,
              child: GestureDetector(
                onTap: _openAttribution,
                child: Container(
                  color: c.surfaceWhite,
                  padding: const EdgeInsets.symmetric(horizontal: RwSpace.s8, vertical: RwSpace.s4),
                  child: Text(
                    '© OpenStreetMap contributors',
                    style: RwType.caption.copyWith(color: c.textMuted),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openAttribution() {
    launchUrl(Uri.parse('https://www.openstreetmap.org/copyright'), mode: LaunchMode.externalApplication);
  }
}

class _Floating extends StatelessWidget {
  const _Floating({required this.child, required this.radius, required this.shadow, this.padding});
  final Widget child;
  final BorderRadius radius;
  final List<BoxShadow> shadow;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: padding,
      decoration: BoxDecoration(color: c.surfaceWhite, borderRadius: radius, boxShadow: shadow),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }
}

class _MapButton extends StatelessWidget {
  const _MapButton({required this.icon, required this.label, required this.onTap});
  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      semanticLabel: label,
      excludeChildSemantics: true,
      borderRadius: RwRadius.smAll,
      builder: (context, s) => Container(
        width: RwSize.touch,
        height: RwSize.touch,
        color: s.active ? c.surfaceNavySubtle : null,
        alignment: Alignment.center,
        child: RwIcon(icon, size: RwSize.iconMd, color: c.textPrimary),
      ),
    );
  }
}

/// The Figma map pin: navy teardrop with a white dot, 40 × 48, tip at the bottom center.
class _PinPainter extends CustomPainter {
  _PinPainter(this.fill, this.dot);
  final Color fill;
  final Color dot;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final r = w / 2 - 4;
    final cx = w / 2;
    final cy = r + 4;
    final path = Path()
      ..moveTo(cx, h - 2)
      ..quadraticBezierTo(cx - r * 0.35, cy + r * 1.05, cx - r, cy)
      ..arcToPoint(Offset(cx + r, cy), radius: Radius.circular(r))
      ..quadraticBezierTo(cx + r * 0.35, cy + r * 1.05, cx, h - 2)
      ..close();
    canvas.drawShadow(path, const Color(0xFF0B2545), 2, false);
    canvas.drawPath(path, Paint()..color = fill);
    canvas.drawCircle(Offset(cx, cy), r * 0.38, Paint()..color = dot);
  }

  @override
  bool shouldRepaint(_PinPainter old) => old.fill != fill || old.dot != dot;
}
