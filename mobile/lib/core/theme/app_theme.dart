import 'package:flutter/material.dart';

import 'tokens.dart';

/// Material 3 themes built from the Figma tokens (light and dark, #26).
///
/// Most RoadWatch widgets (lib/core/widgets) draw themselves from [RwColors] directly, so the
/// Material component themes below mainly keep stock widgets (dialogs, pickers, snackbars,
/// text selection) consistent with the design.
abstract final class AppTheme {
  static ThemeData light() => _build(RwColors.light, Brightness.light);
  static ThemeData dark() => _build(RwColors.dark, Brightness.dark);

  static ThemeData _build(RwColors c, Brightness brightness) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.brandNavy,
      onPrimary: c.textInverse,
      primaryContainer: c.surfaceNavySubtle,
      onPrimaryContainer: c.textPrimary,
      secondary: c.brandBlue,
      onSecondary: c.textInverse,
      secondaryContainer: c.surfaceBlueSubtle,
      onSecondaryContainer: c.textPrimary,
      tertiary: c.brandAmber,
      onTertiary: c.textPrimary,
      error: c.brandDanger,
      onError: c.textInverse,
      errorContainer: c.surfaceDangerSubtle,
      onErrorContainer: c.textDanger,
      surface: c.surfaceWhite,
      onSurface: c.textPrimary,
      onSurfaceVariant: c.textMuted,
      surfaceContainerLowest: c.surfaceWhite,
      surfaceContainerLow: c.surfaceWhite,
      surfaceContainer: c.surfaceLightGray,
      surfaceContainerHigh: c.surfaceNavySubtle,
      surfaceContainerHighest: c.surfaceNavySubtle,
      outline: c.borderControl,
      outlineVariant: c.borderSubtle,
      shadow: const Color(0xFF0B2545),
      inverseSurface: c.textPrimary,
      onInverseSurface: c.surfaceWhite,
      inversePrimary: c.textBlue,
    );

    final text = TextTheme(
      displayLarge: RwType.hero,
      displayMedium: RwType.display,
      displaySmall: RwType.stat,
      headlineLarge: RwType.h1,
      headlineMedium: RwType.h1,
      headlineSmall: RwType.h2,
      titleLarge: RwType.h2,
      titleMedium: RwType.h3,
      titleSmall: RwType.label,
      bodyLarge: RwType.body,
      bodyMedium: RwType.body,
      bodySmall: RwType.bodySm,
      labelLarge: RwType.button,
      labelMedium: RwType.label,
      labelSmall: RwType.caption,
    ).apply(bodyColor: c.textPrimary, displayColor: c.textPrimary);

    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
      borderRadius: RwRadius.mdAll,
      borderSide: BorderSide(color: color, width: width),
    );

    final buttonShape = WidgetStatePropertyAll<OutlinedBorder>(
      const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
    );
    const buttonSize = WidgetStatePropertyAll(Size(64, RwSize.touch));
    const buttonPadding = WidgetStatePropertyAll(EdgeInsets.symmetric(horizontal: RwSpace.s24));
    const buttonText = WidgetStatePropertyAll(RwType.button);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      fontFamily: 'Inter',
      textTheme: text,
      scaffoldBackgroundColor: c.surfaceLightGray,
      canvasColor: c.surfaceWhite,
      dividerColor: c.borderSubtle,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      visualDensity: VisualDensity.standard,
      extensions: [c],
      iconTheme: IconThemeData(color: c.textPrimary, size: RwSize.iconLg),
      dividerTheme: DividerThemeData(color: c.borderSubtle, thickness: 1, space: 1),
      appBarTheme: AppBarTheme(
        backgroundColor: c.surfaceWhite,
        foregroundColor: c.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: RwType.h3.copyWith(color: c.textPrimary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceWhite,
        hoverColor: Colors.transparent,
        contentPadding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: 12),
        constraints: const BoxConstraints(minHeight: RwSize.controlHeight),
        hintStyle: RwType.body.copyWith(color: c.textMuted),
        labelStyle: RwType.label.copyWith(color: c.textPrimary),
        helperStyle: RwType.bodySm.copyWith(color: c.textMuted),
        errorStyle: RwType.bodySm.copyWith(color: c.textDanger),
        prefixIconColor: c.textPrimary,
        suffixIconColor: c.textPrimary,
        border: border(c.borderControl, 1),
        enabledBorder: border(c.borderControl, 1),
        focusedBorder: border(c.borderFocus, 2),
        errorBorder: border(c.borderDanger, 2),
        focusedErrorBorder: border(c.borderDanger, 2),
        disabledBorder: border(c.borderSubtle, 1),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          minimumSize: buttonSize,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
          backgroundColor: WidgetStateProperty.resolveWith((s) {
            if (s.contains(WidgetState.disabled)) return c.surfaceNavySubtle;
            if (s.contains(WidgetState.pressed) || s.contains(WidgetState.hovered)) {
              return c.surfaceNavyHover;
            }
            return c.brandNavy;
          }),
          foregroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.disabled) ? c.textMuted : c.textInverse,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          minimumSize: buttonSize,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: buttonText,
          foregroundColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.disabled) ? c.textMuted : c.textPrimary,
          ),
          backgroundColor: WidgetStateProperty.resolveWith((s) {
            if (s.contains(WidgetState.disabled)) return c.surfaceNavySubtle;
            if (s.contains(WidgetState.pressed) || s.contains(WidgetState.hovered)) {
              return c.surfaceNavySubtle;
            }
            return c.surfaceWhite;
          }),
          side: WidgetStateProperty.resolveWith(
            (s) =>
                BorderSide(color: s.contains(WidgetState.disabled) ? c.borderSubtle : c.brandNavy, width: 2),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          minimumSize: buttonSize,
          shape: buttonShape,
          textStyle: buttonText,
          foregroundColor: WidgetStatePropertyAll(c.textBlue),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        insetPadding: const EdgeInsets.all(RwSpace.s16),
        contentTextStyle: RwType.bodySm.copyWith(color: c.textPrimary),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
        titleTextStyle: RwType.h2.copyWith(color: c.textPrimary),
        contentTextStyle: RwType.body.copyWith(color: c.textMuted),
      ),
      datePickerTheme: DatePickerThemeData(
        backgroundColor: c.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
      ),
      timePickerTheme: TimePickerThemeData(
        backgroundColor: c.surfaceWhite,
        shape: const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surfaceWhite,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(RwRadius.md)),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.brandNavy,
        linearTrackColor: c.surfaceNavySubtle,
      ),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: c.textPrimary,
        selectionColor: c.surfaceBlueSubtle,
        selectionHandleColor: c.borderFocus,
      ),
    );
  }
}
