import 'package:flutter/material.dart';

import '../constants.dart';
import '../theme/tokens.dart';

/// Figma "Logo" (96:17): the emblem shield (cropped from Pauline's raster) on a navy tile plus the
/// "RoadWatch" wordmark. "Watch" uses text/accent (amber in light mode). Accessible name: RoadWatch.
class RwLogo extends StatelessWidget {
  const RwLogo({super.key, this.showWordmark = true, this.markSize = 40});

  final bool showWordmark;
  final double markSize;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    // Same crop as Figma: image at 222.22 % of the mark, offset -60 % / -31.11 %.
    final img = markSize * 2.2222;
    final mark = ClipRRect(
      borderRadius: RwRadius.smAll,
      child: Container(
        width: markSize,
        height: markSize,
        color: c.brandNavy,
        child: OverflowBox(
          maxWidth: img,
          maxHeight: img,
          alignment: Alignment.topLeft,
          child: Transform.translate(
            offset: Offset(-0.6 * markSize, -0.3111 * markSize),
            child: Image.asset(RwImages.emblem, width: img, height: img, fit: BoxFit.cover),
          ),
        ),
      ),
    );

    return Semantics(
      label: 'RoadWatch',
      image: true,
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.all(RwSpace.s8),
        decoration: BoxDecoration(color: c.brandNavy, borderRadius: RwRadius.mdAll),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            mark,
            if (showWordmark) ...[
              const SizedBox(width: RwSpace.s12),
              Text.rich(
                TextSpan(
                  style: RwType.h3.copyWith(fontSize: 20, height: 26 / 20, color: c.textInverse),
                  children: [
                    const TextSpan(text: 'Road'),
                    TextSpan(
                      text: 'Watch',
                      style: TextStyle(color: c.textAccent),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
