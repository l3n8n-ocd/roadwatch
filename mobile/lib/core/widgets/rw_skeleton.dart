import 'package:flutter/material.dart';

import '../theme/tokens.dart';

/// Figma "Skeleton" (101:784): navy-subtle placeholder blocks. Static (no shimmer) so it also
/// suits reduced motion. Wrap a group in [RwSkeletonGroup] so screen readers hear "Loading".
class RwSkeleton extends StatelessWidget {
  const RwSkeleton({super.key, this.width, this.height = 12, this.radius = RwRadius.full});

  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(color: c.surfaceNavySubtle, borderRadius: BorderRadius.circular(radius)),
    );
  }
}

/// Announces [label] once and hides the placeholder shapes from screen readers.
class RwSkeletonGroup extends StatelessWidget {
  const RwSkeletonGroup({super.key, required this.child, this.label = 'Loading'});

  final Widget child;
  final String label;

  @override
  Widget build(BuildContext context) =>
      Semantics(label: label, liveRegion: true, excludeSemantics: true, child: child);
}

/// Loading placeholder shaped like [RwReportCard] (M1/M6 loading states).
class RwSkeletonReportCard extends StatelessWidget {
  const RwSkeletonReportCard({super.key});

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [RwSkeleton(width: 88), RwSkeleton(width: 112, height: 32)],
          ),
          SizedBox(height: RwSpace.s12),
          RwSkeleton(width: 140, height: 24, radius: RwRadius.sm),
          SizedBox(height: RwSpace.s12),
          RwSkeleton(width: 220),
          SizedBox(height: RwSpace.s12),
          RwSkeleton(width: 160),
        ],
      ),
    );
  }
}
