import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_pressable.dart';

enum RwPhotoTileState { empty, uploading, uploaded, error }

/// Figma "Photo tile" (101:443): 104 px tile with a caption.
/// - empty: dashed "Add photo" button (caption "JPG, PNG, WebP")
/// - uploading: progress bar + percent
/// - uploaded: the photo with a remove button (48 px hit area)
/// - error: "Too large" with the reason in the caption
class RwPhotoTile extends StatelessWidget {
  const RwPhotoTile({
    super.key,
    required this.state,
    this.caption,
    this.image,
    this.progress = 0,
    this.onTap,
    this.onRemove,
    this.errorLabel = 'Too large',
    this.semanticLabel,
  });

  final RwPhotoTileState state;

  /// File name, format hint or error reason.
  final String? caption;

  /// Preview for [RwPhotoTileState.uploaded] (FileImage or NetworkImage of the Cloudinary URL).
  final ImageProvider? image;

  /// 0..1 for [RwPhotoTileState.uploading].
  final double progress;

  /// "Add photo" action (empty tile) or open the photo (uploaded tile).
  final VoidCallback? onTap;
  final VoidCallback? onRemove;
  final String errorLabel;
  final String? semanticLabel;

  static const double size = 104;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final captionText = caption ?? (state == RwPhotoTileState.empty ? 'JPG, PNG, WebP' : '');
    return SizedBox(
      width: size,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _tile(context, c),
          if (captionText.isNotEmpty) ...[
            const SizedBox(height: RwSpace.s8),
            Text(
              captionText,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: RwType.caption.copyWith(
                color: state == RwPhotoTileState.error ? c.textDanger : c.textMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _tile(BuildContext context, RwColors c) {
    switch (state) {
      case RwPhotoTileState.empty:
        return RwPressable(
          onTap: onTap,
          semanticLabel: semanticLabel ?? 'Add photo',
          excludeChildSemantics: true,
          builder: (context, s) => CustomPaint(
            painter: _DashedRRectPainter(
              color: c.borderControl,
              fill: s.active ? c.surfaceNavySubtle : c.surfaceWhite,
            ),
            child: SizedBox(
              width: size,
              height: size,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  RwIcon(RwIcons.camera, size: RwSize.iconLg, color: c.textPrimary),
                  const SizedBox(height: RwSpace.s4),
                  Text('Add photo', style: RwType.label.copyWith(color: c.textPrimary)),
                ],
              ),
            ),
          ),
        );
      case RwPhotoTileState.uploading:
        final pct = (progress.clamp(0, 1) * 100).round();
        return Semantics(
          label: 'Uploading ${caption ?? 'photo'}, $pct percent',
          excludeSemantics: true,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(color: c.surfaceNavySubtle, borderRadius: RwRadius.mdAll),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                RwIcon(RwIcons.image, size: RwSize.iconLg, color: c.textPrimary),
                const SizedBox(height: RwSpace.s4),
                ClipRRect(
                  borderRadius: RwRadius.fullAll,
                  child: SizedBox(
                    width: 72,
                    height: 6,
                    child: LinearProgressIndicator(
                      value: progress.clamp(0, 1).toDouble(),
                      backgroundColor: c.surfaceWhite,
                      color: c.brandNavy,
                    ),
                  ),
                ),
                const SizedBox(height: RwSpace.s4),
                Text('$pct%', style: RwType.caption.copyWith(color: c.textPrimary)),
              ],
            ),
          ),
        );
      case RwPhotoTileState.uploaded:
        return SizedBox(
          width: size,
          height: size,
          child: Stack(
            children: [
              Positioned.fill(
                child: RwPressable(
                  onTap: onTap,
                  semanticLabel: semanticLabel ?? 'Photo ${caption ?? ''}'.trim(),
                  excludeChildSemantics: true,
                  isButton: onTap != null,
                  builder: (context, s) => ClipRRect(
                    borderRadius: RwRadius.mdAll,
                    child: ColoredBox(
                      color: c.surfaceNavySubtle,
                      child: image == null
                          ? Center(child: RwIcon(RwIcons.image, size: 28, color: c.textMuted))
                          : Image(
                              image: image!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) =>
                                  Center(child: RwIcon(RwIcons.image, size: 28, color: c.textMuted)),
                            ),
                    ),
                  ),
                ),
              ),
              if (onRemove != null)
                Positioned(
                  right: 0,
                  top: 0,
                  child: RwPressable(
                    onTap: onRemove,
                    semanticLabel: 'Remove ${caption ?? 'photo'}',
                    excludeChildSemantics: true,
                    borderRadius: RwRadius.fullAll,
                    builder: (context, s) => SizedBox(
                      width: RwSize.touch,
                      height: RwSize.touch,
                      child: Center(
                        child: Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(color: c.brandNavy, shape: BoxShape.circle),
                          alignment: Alignment.center,
                          child: RwIcon(RwIcons.x, size: RwSize.iconSm, color: c.textInverse),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      case RwPhotoTileState.error:
        return Semantics(
          label: 'Error: $errorLabel. ${caption ?? ''}',
          excludeSemantics: true,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: c.surfaceDangerSubtle,
              borderRadius: RwRadius.mdAll,
              border: Border.all(color: c.borderDanger, width: 2),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                RwIcon(RwIcons.alertCircle, size: RwSize.iconLg, color: c.textDanger),
                const SizedBox(height: RwSpace.s4),
                Text(errorLabel, style: RwType.label.copyWith(color: c.textDanger)),
              ],
            ),
          ),
        );
    }
  }
}

class _DashedRRectPainter extends CustomPainter {
  _DashedRRectPainter({required this.color, required this.fill});
  final Color color;
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      (Offset.zero & size).deflate(0.75),
      const Radius.circular(RwRadius.md),
    );
    canvas.drawRRect(rrect, Paint()..color = fill);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    for (final m in (Path()..addRRect(rrect)).computeMetrics()) {
      for (var d = 0.0; d < m.length; d += 9) {
        canvas.drawPath(m.extractPath(d, d + 5), paint);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedRRectPainter old) => old.color != color || old.fill != fill;
}
