import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Motion tokens and helpers for the app (decision #41, docs/ui-design/motion-spec.md, M1-M8).
/// Built on Flutter's own animation tools. When Reduce motion is on (Android "Remove animations" or
/// Settings > Reduce motion, both set `disableAnimations`), everything becomes a short fade.
abstract final class RwMotion {
  static const micro = Duration(milliseconds: 150);
  static const short = Duration(milliseconds: 250);
  static const medium = Duration(milliseconds: 450);
  static const long = Duration(milliseconds: 700);
  static const reducedFade = Duration(milliseconds: 200);

  /// power3.out, the same curve as the website.
  static const enter = Cubic(0.22, 1, 0.36, 1);

  /// The map pin landing (the only playful moment).
  static const drop = Curves.easeOutBack;

  static const listStagger = Duration(milliseconds: 40);
  static const maxStaggered = 8;
  static const rise = 16.0;

  static bool reduced(BuildContext context) => MediaQuery.disableAnimationsOf(context);

  /// Delay for the item at [index] in a list; items after the 8th share the last delay.
  static Duration stagger(int index, {Duration step = listStagger}) =>
      step * math.min(index, maxStaggered - 1);
}

/// Fades and rises its child in once, when it first appears (optionally growing from [fromScale]).
/// Reduce motion: a 200 ms fade with no delay, movement or scaling.
class RwEntrance extends StatefulWidget {
  const RwEntrance({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = RwMotion.medium,
    this.offset = RwMotion.rise,
    this.fromScale = 1,
  });

  /// Item [index] of a list, staggered 40 ms apart (max 8 staggered).
  RwEntrance.listItem({
    Key? key,
    required int index,
    required Widget child,
    Duration baseDelay = Duration.zero,
  }) : this(key: key, delay: baseDelay + RwMotion.stagger(index), child: child);

  final Widget child;
  final Duration delay;
  final Duration duration;
  final double offset;
  final double fromScale;

  @override
  State<RwEntrance> createState() => _RwEntranceState();
}

class _RwEntranceState extends State<RwEntrance> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this);
  late Animation<double> _t;
  bool _started = false;
  bool _reduced = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    _reduced = RwMotion.reduced(context);
    final delay = _reduced ? Duration.zero : widget.delay;
    final duration = _reduced ? RwMotion.reducedFade : widget.duration;
    final total = delay + duration;
    _controller.duration = total;
    final begin = delay.inMicroseconds / total.inMicroseconds;
    _t = CurvedAnimation(
      parent: _controller,
      curve: Interval(begin, 1, curve: _reduced ? Curves.linear : RwMotion.enter),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      child: widget.child,
      builder: (context, child) {
        final t = _t.value;
        if (_reduced) return Opacity(opacity: t, child: child);
        final scale = widget.fromScale + (1 - widget.fromScale) * t;
        return Opacity(
          opacity: t.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, (1 - t) * widget.offset),
            child: scale == 1 ? child : Transform.scale(scale: scale, child: child),
          ),
        );
      },
    );
  }
}

/// Grows its child a little and back, [times] times after [delay], then stops (current-status dot,
/// the amber tile on Home). Never loops forever. Does nothing with Reduce motion.
class RwPulse extends StatefulWidget {
  const RwPulse({
    super.key,
    required this.child,
    this.times = 2,
    this.delay = Duration.zero,
    this.scale = 1.2,
  });

  final Widget child;
  final int times;
  final Duration delay;
  final double scale;

  @override
  State<RwPulse> createState() => _RwPulseState();
}

class _RwPulseState extends State<RwPulse> with SingleTickerProviderStateMixin {
  static const _pulse = Duration(milliseconds: 400);
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: widget.delay + _pulse * widget.times,
  );
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started || RwMotion.reduced(context)) return;
    _started = true;
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.times == 0 || RwMotion.reduced(context)) return widget.child;
    final total = _controller.duration!.inMicroseconds;
    final delay = widget.delay.inMicroseconds;
    return AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        final elapsed = _controller.value * total - delay;
        if (elapsed <= 0 || _controller.isCompleted) return child!;
        final phase = (elapsed / _pulse.inMicroseconds) % 1;
        return Transform.scale(scale: 1 + (widget.scale - 1) * math.sin(math.pi * phase), child: child);
      },
    );
  }
}

/// Reveals its child from left to right, as if drawn (the tick on "Report sent", M5).
class RwDrawIn extends StatelessWidget {
  const RwDrawIn({
    super.key,
    required this.child,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 500),
  });

  final Widget child;
  final Duration delay;
  final Duration duration;

  @override
  Widget build(BuildContext context) {
    if (RwMotion.reduced(context)) return child;
    final total = delay + duration;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: total,
      curve: Interval(delay.inMicroseconds / total.inMicroseconds, 1, curve: RwMotion.enter),
      child: child,
      builder: (context, t, child) => ClipRect(
        child: Align(alignment: Alignment.centerLeft, widthFactor: t, child: child),
      ),
    );
  }
}

/// Shared-axis page transition (M3): the new screen slides 30 px in from the right and fades in;
/// going back plays it in reverse, so the old screen returns from the left.
class RwSharedAxisPageTransitionsBuilder extends PageTransitionsBuilder {
  const RwSharedAxisPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final enter = CurvedAnimation(parent: animation, curve: RwMotion.enter, reverseCurve: Curves.easeIn);
    final exit = CurvedAnimation(parent: secondaryAnimation, curve: RwMotion.enter);
    return AnimatedBuilder(
      animation: Listenable.merge([enter, exit]),
      child: child,
      builder: (context, child) => Transform.translate(
        offset: Offset(30 * (1 - enter.value) - 30 * exit.value, 0),
        child: Opacity(opacity: (enter.value * (1 - exit.value * 0.6)).clamp(0.0, 1.0), child: child),
      ),
    );
  }
}
