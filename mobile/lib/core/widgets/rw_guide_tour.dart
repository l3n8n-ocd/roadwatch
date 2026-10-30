import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../theme/tokens.dart';
import 'rw_button.dart';
import 'rw_icon.dart';

/// One step of the accessibility guide (#56). [target] is the part of the screen the step explains;
/// without one (or when it is off screen) only the card shows.
class RwGuideStep {
  const RwGuideStep({required this.title, required this.text, this.target});

  final String title;
  final String text;
  final GlobalKey? target;
}

/// Settings > Accessibility > Start the guide: HomeShell goes back to the first tab (Home or Assigned) and then
/// bumps [rwGuideStart], which that tab listens to.
final rwGuideRequests = ValueNotifier<int>(0);

/// HomeShell -> the visible first tab: start your guide now.
final rwGuideStart = ValueNotifier<int>(0);

/// Accessibility guide tour (#56, Figma M1 543:32730). The screen dims, a focus ring marks the part being
/// explained, and a card shows "STEP 1 OF 5", the title, the text, Read aloud, Close and Next.
/// Everything is text, so nothing depends on sound; Read aloud (flutter_tts) is optional.
Future<void> showRwGuideTour(
  BuildContext context, {
  required List<RwGuideStep> steps,
  bool readAloud = false,
  double readingSpeed = 1.0,
}) {
  return Navigator.of(context).push(
    PageRouteBuilder<void>(
      opaque: false,
      barrierDismissible: false,
      pageBuilder: (_, _, _) => _GuideTour(steps: steps, readAloud: readAloud, readingSpeed: readingSpeed),
      transitionsBuilder: (context, animation, _, child) => FadeTransition(opacity: animation, child: child),
    ),
  );
}

class _GuideTour extends StatefulWidget {
  const _GuideTour({required this.steps, required this.readAloud, required this.readingSpeed});

  final List<RwGuideStep> steps;
  final bool readAloud;
  final double readingSpeed;

  @override
  State<_GuideTour> createState() => _GuideTourState();
}

class _GuideTourState extends State<_GuideTour> {
  int _index = 0;
  late bool _reading = widget.readAloud;
  FlutterTts? _tts;
  Rect? _rect;

  RwGuideStep get _step => widget.steps[_index];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _show());
  }

  @override
  void dispose() {
    _stopSpeaking();
    super.dispose();
  }

  // Scrolls the explained part into view, then measures it for the ring.
  Future<void> _show() async {
    final ctx = _step.target?.currentContext;
    if (ctx != null) {
      await Scrollable.ensureVisible(
        ctx,
        alignment: 0.15,
        duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 250),
      );
    }
    if (!mounted) return;
    final box = _step.target?.currentContext?.findRenderObject();
    setState(() {
      _rect = box is RenderBox && box.hasSize && box.attached
          ? box.localToGlobal(Offset.zero) & box.size
          : null;
    });
    if (_reading) _speak();
  }

  // Android rate: 0.5 is normal speed.
  Future<void> _speak() async {
    try {
      _tts ??= FlutterTts();
      await _tts!.stop();
      await _tts!.setSpeechRate(0.5 * widget.readingSpeed);
      await _tts!.speak('${_step.title}. ${_step.text}');
    } catch (e) {
      // No speech engine (or a test): the guide is all text anyway.
      debugPrint('Read aloud unavailable: $e');
    }
  }

  void _stopSpeaking() {
    try {
      _tts?.stop();
    } catch (_) {}
  }

  void _go(int index) {
    _stopSpeaking();
    setState(() {
      _index = index;
      _rect = null;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _show());
  }

  void _toggleReading() {
    setState(() => _reading = !_reading);
    _reading ? _speak() : _stopSpeaking();
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final last = _index == widget.steps.length - 1;
    final media = MediaQuery.of(context);
    final rect = _rect;
    // The card sits under the ring when there is room, else above it, else at the bottom.
    final below = rect != null && rect.bottom + 300 < media.size.height - media.padding.bottom;
    final above = rect != null && !below && rect.top > 340;

    final card = Material(
      color: c.surfaceWhite,
      borderRadius: RwRadius.mdAll,
      elevation: 0,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(borderRadius: RwRadius.mdAll, boxShadow: RwShadow.lg),
        child: Semantics(
          scopesRoute: true,
          namesRoute: true,
          explicitChildNodes: true,
          label: 'Guide',
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(
                liveRegion: true,
                child: Text(
                  'STEP ${_index + 1} OF ${widget.steps.length}',
                  style: RwType.overline.copyWith(color: c.textMuted),
                ),
              ),
              const SizedBox(height: RwSpace.s12),
              Semantics(
                header: true,
                child: Text(_step.title, style: RwType.h3.copyWith(color: c.textPrimary)),
              ),
              const SizedBox(height: RwSpace.s12),
              Text(_step.text, style: RwType.body.copyWith(color: c.textPrimary)),
              const SizedBox(height: RwSpace.s12),
              RwButton.secondary(
                label: _reading ? 'Stop reading' : 'Read aloud',
                icon: _reading ? RwIcons.pause : RwIcons.volume,
                onPressed: _toggleReading,
              ),
              const SizedBox(height: RwSpace.s12),
              Row(
                children: [
                  Expanded(
                    child: _index == 0
                        ? RwButton.secondary(label: 'Close', onPressed: () => Navigator.of(context).pop())
                        : RwButton.secondary(
                            label: 'Back',
                            icon: RwIcons.chevronLeft,
                            onPressed: () => _go(_index - 1),
                          ),
                  ),
                  const SizedBox(width: RwSpace.s12),
                  Expanded(
                    child: RwButton(
                      label: last ? 'Done' : 'Next',
                      icon: last ? RwIcons.check : RwIcons.chevronRight,
                      onPressed: last ? () => Navigator.of(context).pop() : () => _go(_index + 1),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    return PopScope(
      onPopInvokedWithResult: (_, _) => _stopSpeaking(),
      child: Stack(
        children: [
          Positioned.fill(
            child: ExcludeSemantics(child: ColoredBox(color: c.brandNavy.withValues(alpha: 0.45))),
          ),
          if (rect != null)
            Positioned(
              left: rect.left - 6,
              top: rect.top - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              child: IgnorePointer(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: c.borderFocus, width: 3),
                    color: c.surfaceWhite.withValues(alpha: 0.12),
                  ),
                ),
              ),
            ),
          Positioned(
            left: RwSpace.s16,
            right: RwSpace.s16,
            top: below ? rect.bottom + RwSpace.s12 : null,
            bottom: below
                ? null
                : above
                ? media.size.height - rect.top + RwSpace.s12
                : media.padding.bottom + RwSpace.s16,
            child: SafeArea(top: false, child: card),
          ),
        ],
      ),
    );
  }
}
