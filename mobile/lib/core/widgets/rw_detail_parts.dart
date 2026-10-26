import 'package:flutter/material.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_icon_button.dart';

/// Building blocks of the report detail screens (Figma M6 tracking and O2 officer details):
/// white cards, section titles, icon + text meta rows, label/value pairs and a full-size photo viewer.

/// White card with the subtle border (Figma Summary card, timeline, details).
class RwCard extends StatelessWidget {
  const RwCard({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(RwSpace.s16),
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: child,
    );
  }
}

/// H3 section title, announced as a heading.
class RwSectionTitle extends StatelessWidget {
  const RwSectionTitle(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: Text(text, style: RwType.h3.copyWith(color: RwColors.of(context).textPrimary)),
  );
}

/// 16 px icon + muted small text (location, date and time).
class RwMetaRow extends StatelessWidget {
  const RwMetaRow({super.key, required this.icon, required this.text});
  final String icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: RwIcon(icon, size: RwSize.iconSm, color: c.textMuted),
        ),
        const SizedBox(width: RwSpace.s8),
        Expanded(
          child: Text(text, style: RwType.bodySm.copyWith(color: c.textMuted)),
        ),
      ],
    );
  }
}

/// Figma "Detail": muted label over a body-size value, read as one item.
class RwDetailItem extends StatelessWidget {
  const RwDetailItem({super.key, required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return MergeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: RwType.label.copyWith(color: c.textMuted)),
          const SizedBox(height: 2),
          Text(value, style: RwType.body.copyWith(color: c.textPrimary)),
        ],
      ),
    );
  }
}

/// Full-screen photo viewer (#46, Figma M6/Photo viewer/Full screen 406:4287): every photo of the report,
/// uncropped, "Photo 2 of 3", swipe or previous/next, pinch or double-tap to zoom, close. Always dark
/// (Figma dark/bg) in both themes. No download (DECISIONS #43). Open with [show].
class RwPhotoViewer extends StatefulWidget {
  const RwPhotoViewer({super.key, required this.urls, this.initialIndex = 0, this.captions});

  final List<String> urls;
  final int initialIndex;

  /// Optional line under each photo (e.g. "Added Oct 17, 2026 · 08:42").
  final List<String?>? captions;

  static Future<void> show(
    BuildContext context, {
    required List<String> urls,
    int initialIndex = 0,
    List<String?>? captions,
  }) => Navigator.of(context).push(
    PageRouteBuilder<void>(
      opaque: true,
      transitionDuration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 200),
      pageBuilder: (_, _, _) => RwPhotoViewer(urls: urls, initialIndex: initialIndex, captions: captions),
      transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
    ),
  );

  @override
  State<RwPhotoViewer> createState() => _RwPhotoViewerState();
}

class _RwPhotoViewerState extends State<RwPhotoViewer> {
  late final _pages = PageController(initialPage: widget.initialIndex);
  late int _index = widget.initialIndex;
  final _zoom = TransformationController();
  bool _zoomed = false;

  @override
  void initState() {
    super.initState();
    _zoom.addListener(() {
      final zoomed = _zoom.value.getMaxScaleOnAxis() > 1.01;
      if (zoomed != _zoomed) setState(() => _zoomed = zoomed);
    });
  }

  @override
  void dispose() {
    _pages.dispose();
    _zoom.dispose();
    super.dispose();
  }

  void _go(int step) {
    final count = widget.urls.length;
    final next = (_index + step + count) % count;
    final reduce = MediaQuery.disableAnimationsOf(context);
    if (reduce) {
      _pages.jumpToPage(next);
    } else {
      _pages.animateToPage(next, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
    }
  }

  void _toggleZoom(TapDownDetails? details) {
    if (_zoomed) {
      _zoom.value = Matrix4.identity();
    } else {
      final p = details?.localPosition ?? Offset.zero;
      _zoom.value = Matrix4.identity()
        ..translateByDouble(-p.dx, -p.dy, 0, 1)
        ..scaleByDouble(2, 2, 1, 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Always dark, whatever the app theme.
    const c = RwColors.dark;
    final count = widget.urls.length;
    final caption = widget.captions != null && _index < widget.captions!.length
        ? widget.captions![_index]
        : null;
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(RwSpace.s8),
              child: Row(
                children: [
                  RwIconButton(
                    icon: RwIcons.x,
                    semanticLabel: 'Close photo viewer',
                    tone: RwIconButtonTone.dark,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Expanded(
                    child: Semantics(
                      header: true,
                      liveRegion: true,
                      child: Text(
                        'Photo ${_index + 1} of $count',
                        textAlign: TextAlign.center,
                        style: RwType.button.copyWith(color: c.textInverse),
                      ),
                    ),
                  ),
                  const SizedBox(width: RwSize.touch),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pages,
                itemCount: count,
                // Swiping turns pages only while the photo is not zoomed in (then a drag pans).
                physics: _zoomed ? const NeverScrollableScrollPhysics() : null,
                onPageChanged: (i) => setState(() {
                  _index = i;
                  _zoom.value = Matrix4.identity();
                }),
                itemBuilder: (context, i) => GestureDetector(
                  onDoubleTapDown: (d) => _lastTap = d,
                  onDoubleTap: () => _toggleZoom(_lastTap),
                  child: InteractiveViewer(
                    transformationController: i == _index ? _zoom : null,
                    maxScale: 4,
                    child: Center(
                      child: Image.network(
                        widget.urls[i],
                        semanticLabel: 'Accident photo ${i + 1} of $count',
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => Text(
                          "Couldn't load this photo.",
                          style: RwType.body.copyWith(color: c.textInverseMuted),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s8, RwSpace.s16, RwSpace.s8, RwSpace.s8),
              child: Row(
                children: [
                  if (count > 1)
                    RwIconButton(
                      icon: RwIcons.chevronLeft,
                      semanticLabel: 'Previous photo',
                      tone: RwIconButtonTone.dark,
                      onPressed: () => _go(-1),
                    )
                  else
                    const SizedBox(width: RwSize.touch),
                  Expanded(
                    child: Text(
                      caption ?? '',
                      textAlign: TextAlign.center,
                      style: RwType.bodySm.copyWith(color: c.textInverse),
                    ),
                  ),
                  if (count > 1)
                    RwIconButton(
                      icon: RwIcons.chevronRight,
                      semanticLabel: 'Next photo',
                      tone: RwIconButtonTone.dark,
                      onPressed: () => _go(1),
                    )
                  else
                    const SizedBox(width: RwSize.touch),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s32, RwSpace.s16, RwSpace.s32, RwSpace.s24),
              child: Text(
                count > 1
                    ? 'Pinch or double-tap to zoom. Swipe for the next photo.'
                    : 'Pinch or double-tap to zoom.',
                textAlign: TextAlign.center,
                style: RwType.bodySm.copyWith(color: c.textInverseMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  TapDownDetails? _lastTap;
}
