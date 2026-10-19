import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/tokens.dart';

/// Interaction states passed to [RwPressable.builder].
class RwPressState {
  const RwPressState({
    required this.pressed,
    required this.hovered,
    required this.focused,
    required this.enabled,
  });
  final bool pressed;
  final bool hovered;
  final bool focused;
  final bool enabled;

  /// Pressed or hovered: Figma draws both with the same "hover" fill on mobile.
  bool get active => enabled && (pressed || hovered);
}

/// Base for every tappable RoadWatch widget.
///
/// - Keyboard and switch access: focusable, Enter/Space activate.
/// - Draws the Figma Focus/ring (or Focus/ring-on-dark) when focused from a keyboard.
/// - Announces itself as a button (or toggle/selected item) with an optional label.
class RwPressable extends StatefulWidget {
  const RwPressable({
    super.key,
    required this.onTap,
    required this.builder,
    this.borderRadius = RwRadius.mdAll,
    this.semanticLabel,
    this.semanticHint,
    this.excludeChildSemantics = false,
    this.isButton = true,
    this.selected,
    this.toggled,
    this.onDark = false,
    this.focusNode,
    this.autofocus = false,
  });

  final VoidCallback? onTap;
  final Widget Function(BuildContext context, RwPressState state) builder;
  final BorderRadius borderRadius;

  /// Accessible name. When null the visible text inside is read.
  final String? semanticLabel;
  final String? semanticHint;

  /// Use with [semanticLabel] when the visible content would repeat or confuse the label.
  final bool excludeChildSemantics;
  final bool isButton;
  final bool? selected;
  final bool? toggled;

  /// Uses the amber Focus/ring-on-dark (for controls on navy bars).
  final bool onDark;
  final FocusNode? focusNode;
  final bool autofocus;

  @override
  State<RwPressable> createState() => _RwPressableState();
}

class _RwPressableState extends State<RwPressable> {
  bool _pressed = false;
  bool _hovered = false;
  bool _focused = false;

  bool get _enabled => widget.onTap != null;

  void _activate() {
    if (!_enabled) return;
    HapticFeedback.selectionClick();
    widget.onTap!();
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final state = RwPressState(pressed: _pressed, hovered: _hovered, focused: _focused, enabled: _enabled);
    final content = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: widget.borderRadius,
        boxShadow: _focused ? (widget.onDark ? RwShadow.focusOnDark(c) : RwShadow.focus(c)) : null,
      ),
      child: widget.builder(context, state),
    );

    return Semantics(
      container: true,
      button: widget.isButton,
      enabled: _enabled,
      selected: widget.selected,
      toggled: widget.toggled,
      label: widget.semanticLabel,
      hint: widget.semanticHint,
      excludeSemantics: widget.excludeChildSemantics,
      onTap: _enabled ? _activate : null,
      child: FocusableActionDetector(
        enabled: _enabled,
        focusNode: widget.focusNode,
        autofocus: widget.autofocus,
        mouseCursor: _enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
        onShowFocusHighlight: (v) => setState(() => _focused = v),
        onShowHoverHighlight: (v) => setState(() => _hovered = v),
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              _activate();
              return null;
            },
          ),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          excludeFromSemantics: true,
          onTapDown: _enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: _enabled ? (_) => setState(() => _pressed = false) : null,
          onTapCancel: _enabled ? () => setState(() => _pressed = false) : null,
          onTap: _enabled ? _activate : null,
          child: content,
        ),
      ),
    );
  }
}
