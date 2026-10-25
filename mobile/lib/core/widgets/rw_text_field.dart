import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/tokens.dart';
import 'rw_field_parts.dart';
import 'rw_icon.dart';
import 'rw_icon_button.dart';

/// Figma "Text field" (97:178): visible label, 48 px box with optional 20 px leading icon,
/// 16 px value text, helper or error row. Map [label] to the API field in the screen
/// (e.g. accident_location).
class RwTextField extends StatefulWidget {
  const RwTextField({
    super.key,
    required this.label,
    this.controller,
    this.hintText,
    this.helperText,
    this.errorText,
    this.required = false,
    this.leadingIcon,
    this.trailing,
    this.enabled = true,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.autofillHints,
    this.onChanged,
    this.onSubmitted,
    this.maxLength,
    this.minLines,
    this.maxLines = 1,
    this.inputFormatters,
    this.focusNode,
    this.textCapitalization = TextCapitalization.none,
  });

  final String label;
  final TextEditingController? controller;
  final String? hintText;
  final String? helperText;

  /// Shows the error state (2 px danger border + red helper row).
  final String? errorText;
  final bool required;

  /// Icon name from [RwIcons].
  final String? leadingIcon;

  /// For example a show/hide password RwIconButton.
  final Widget? trailing;
  final bool enabled;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final int? maxLength;
  final int? minLines;
  final int? maxLines;
  final List<TextInputFormatter>? inputFormatters;
  final FocusNode? focusNode;
  final TextCapitalization textCapitalization;

  @override
  State<RwTextField> createState() => _RwTextFieldState();
}

class _RwTextFieldState extends State<RwTextField> {
  FocusNode? _ownFocus;
  FocusNode get _focus => widget.focusNode ?? (_ownFocus ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focus.addListener(_onFocus);
  }

  @override
  void didUpdateWidget(RwTextField old) {
    super.didUpdateWidget(old);
    if (old.focusNode != widget.focusNode) {
      (old.focusNode ?? _ownFocus)?.removeListener(_onFocus);
      _focus.addListener(_onFocus);
    }
  }

  void _onFocus() => setState(() {});

  @override
  void dispose() {
    _focus.removeListener(_onFocus);
    _ownFocus?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final multiline = (widget.maxLines ?? 2) > 1;
    final state = !widget.enabled
        ? RwFieldState.disabled
        : widget.errorText != null
        ? RwFieldState.error
        : _focus.hasFocus
        ? RwFieldState.focused
        : RwFieldState.normal;
    final textColor = widget.enabled ? c.textPrimary : c.textMuted;

    final field = TextField(
      controller: widget.controller,
      focusNode: _focus,
      enabled: widget.enabled,
      obscureText: widget.obscureText,
      keyboardType: widget.keyboardType ?? (multiline ? TextInputType.multiline : null),
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      maxLength: widget.maxLength,
      minLines: widget.minLines,
      maxLines: widget.obscureText ? 1 : widget.maxLines,
      inputFormatters: widget.inputFormatters,
      textCapitalization: widget.textCapitalization,
      style: RwType.body.copyWith(color: textColor),
      cursorColor: c.textPrimary,
      decoration: InputDecoration(
        isCollapsed: true,
        // The theme's 48 px minimum applies to the outer box, not the bare input.
        constraints: const BoxConstraints(),
        filled: false,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        disabledBorder: InputBorder.none,
        errorBorder: InputBorder.none,
        hintText: widget.hintText,
        hintStyle: RwType.body.copyWith(color: c.textMuted),
        counterText: '',
        contentPadding: EdgeInsets.zero,
      ),
    );

    final box = AnimatedContainer(
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : const Duration(milliseconds: 120),
      constraints: BoxConstraints(minHeight: multiline ? 128 : RwSize.controlHeight),
      padding: EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: multiline ? 12 : 0),
      decoration: rwFieldDecoration(c, state),
      child: Row(
        crossAxisAlignment: multiline ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          if (widget.leadingIcon != null) ...[
            RwIcon(widget.leadingIcon!, size: RwSize.iconMd, color: textColor),
            const SizedBox(width: RwSpace.s12),
          ],
          Expanded(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: multiline ? 0 : 12),
              // The visible label is excluded in RwFieldColumn and announced here instead.
              child: MergeSemantics(
                child: Semantics(
                  label: widget.required ? '${widget.label}, required' : widget.label,
                  child: field,
                ),
              ),
            ),
          ),
          if (widget.trailing != null) widget.trailing!,
        ],
      ),
    );

    return RwFieldColumn(
      label: widget.label,
      required: widget.required,
      enabled: widget.enabled,
      helperText: widget.helperText,
      errorText: widget.errorText,
      child: GestureDetector(
        // Tapping the padding or icon still focuses the input.
        onTap: widget.enabled ? _focus.requestFocus : null,
        excludeFromSemantics: true,
        child: box,
      ),
    );
  }
}

/// Figma "Textarea" (97:566): multiline [RwTextField], 128 px tall (accident_description,
/// official remarks, rejection reason).
class RwTextarea extends RwTextField {
  const RwTextarea({
    super.key,
    required super.label,
    super.controller,
    super.hintText,
    super.helperText,
    super.errorText,
    super.required,
    super.enabled,
    super.onChanged,
    super.maxLength,
    super.focusNode,
    super.textCapitalization = TextCapitalization.sentences,
  }) : super(minLines: 4, maxLines: 8, textInputAction: TextInputAction.newline);
}

/// Password [RwTextField] with the eye button (Figma Text field "Show password toggle", #45):
/// one button per field, icon only ("Show password" / "Hide password" for screen readers), and the
/// password stays shown until the button is tapped again (no auto-hide).
class RwPasswordField extends StatefulWidget {
  const RwPasswordField({
    super.key,
    required this.label,
    this.controller,
    this.hintText,
    this.helperText,
    this.errorText,
    this.required = false,
    this.enabled = true,
    this.focusNode,
    this.textInputAction,
    this.autofillHints,
    this.onChanged,
    this.onSubmitted,
    this.maxLength = 128,
  });

  final String label;
  final TextEditingController? controller;
  final String? hintText;
  final String? helperText;
  final String? errorText;
  final bool required;
  final bool enabled;
  final FocusNode? focusNode;
  final TextInputAction? textInputAction;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final int? maxLength;

  @override
  State<RwPasswordField> createState() => _RwPasswordFieldState();
}

class _RwPasswordFieldState extends State<RwPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return RwTextField(
      label: widget.label,
      controller: widget.controller,
      hintText: widget.hintText,
      helperText: widget.helperText,
      errorText: widget.errorText,
      required: widget.required,
      enabled: widget.enabled,
      focusNode: widget.focusNode,
      leadingIcon: RwIcons.lock,
      obscureText: _obscure,
      maxLength: widget.maxLength,
      textInputAction: widget.textInputAction,
      autofillHints: widget.autofillHints,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      trailing: RwIconButton(
        icon: _obscure ? RwIcons.eye : RwIcons.eyeOff,
        semanticLabel: _obscure ? 'Show password' : 'Hide password',
        onPressed: widget.enabled ? () => setState(() => _obscure = !_obscure) : null,
      ),
    );
  }
}
