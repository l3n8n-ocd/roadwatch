// GENERATED from the Figma Foundations variables (file psx52NYL69RkycK7Z44EAb, collections
// Primitives, Color [Light/Dark], Layout). Names mirror the Figma variables: `brand/navy` -> brandNavy.
// Regenerate rather than hand-edit hex values; widgets read colors through RwColors.of(context).
library;

import 'package:flutter/material.dart';

/// Semantic colors with Light and Dark values (docs/DECISIONS.md #26).
@immutable
class RwColors extends ThemeExtension<RwColors> {
  const RwColors({
    required this.brandNavy,
    required this.brandBlue,
    required this.brandAmber,
    required this.brandSuccess,
    required this.brandDanger,
    required this.surfaceWhite,
    required this.surfaceLightGray,
    required this.surfaceNavySubtle,
    required this.surfaceNavyHover,
    required this.surfaceBlueSubtle,
    required this.surfaceAmberSubtle,
    required this.surfaceSuccessSubtle,
    required this.surfaceDangerSubtle,
    required this.textPrimary,
    required this.textMuted,
    required this.textInverse,
    required this.textInverseMuted,
    required this.textBlue,
    required this.textSuccess,
    required this.textDanger,
    required this.textAccent,
    required this.borderSubtle,
    required this.borderControl,
    required this.borderFocus,
    required this.borderFocusOnDark,
    required this.borderDanger,
  });

  /// Figma `brand/navy`.
  final Color brandNavy;

  /// Figma `brand/blue`.
  final Color brandBlue;

  /// Figma `brand/amber`.
  final Color brandAmber;

  /// Figma `brand/success`.
  final Color brandSuccess;

  /// Figma `brand/danger`.
  final Color brandDanger;

  /// Figma `surface/white`.
  final Color surfaceWhite;

  /// Figma `surface/light-gray`.
  final Color surfaceLightGray;

  /// Figma `surface/navy-subtle`.
  final Color surfaceNavySubtle;

  /// Figma `surface/navy-hover`.
  final Color surfaceNavyHover;

  /// Figma `surface/blue-subtle`.
  final Color surfaceBlueSubtle;

  /// Figma `surface/amber-subtle`.
  final Color surfaceAmberSubtle;

  /// Figma `surface/success-subtle`.
  final Color surfaceSuccessSubtle;

  /// Figma `surface/danger-subtle`.
  final Color surfaceDangerSubtle;

  /// Figma `text/primary`.
  final Color textPrimary;

  /// Figma `text/muted`.
  final Color textMuted;

  /// Figma `text/inverse`.
  final Color textInverse;

  /// Figma `text/inverse-muted`.
  final Color textInverseMuted;

  /// Figma `text/blue`.
  final Color textBlue;

  /// Figma `text/success`.
  final Color textSuccess;

  /// Figma `text/danger`.
  final Color textDanger;

  /// Figma `text/accent`.
  final Color textAccent;

  /// Figma `border/subtle`.
  final Color borderSubtle;

  /// Figma `border/control`.
  final Color borderControl;

  /// Figma `border/focus`.
  final Color borderFocus;

  /// Figma `border/focus-on-dark`.
  final Color borderFocusOnDark;

  /// Figma `border/danger`.
  final Color borderDanger;

  static const light = RwColors(
    brandNavy: Color(0xFF0B2545),
    brandBlue: Color(0xFF4A7FB5),
    brandAmber: Color(0xFFF2A900),
    brandSuccess: Color(0xFF2E9E6B),
    brandDanger: Color(0xFFD64545),
    surfaceWhite: Color(0xFFFFFFFF),
    surfaceLightGray: Color(0xFFF4F6F9),
    surfaceNavySubtle: Color(0xFFE7EBF1),
    surfaceNavyHover: Color(0xFF1B3A63),
    surfaceBlueSubtle: Color(0xFFE8F0F8),
    surfaceAmberSubtle: Color(0xFFFFF4D6),
    surfaceSuccessSubtle: Color(0xFFE5F4EC),
    surfaceDangerSubtle: Color(0xFFFBE9E9),
    textPrimary: Color(0xFF0B2545),
    textMuted: Color(0xFF4A5B73),
    textInverse: Color(0xFFFFFFFF),
    textInverseMuted: Color(0xFFB8C4D4),
    textBlue: Color(0xFF2F6296),
    textSuccess: Color(0xFF1F6F4A),
    textDanger: Color(0xFFB42B2B),
    textAccent: Color(0xFFF2A900),
    borderSubtle: Color(0xFFC9D2DE),
    borderControl: Color(0xFF6B7A90),
    borderFocus: Color(0xFF2F6296),
    borderFocusOnDark: Color(0xFFF2A900),
    borderDanger: Color(0xFFD64545),
  );

  static const dark = RwColors(
    brandNavy: Color(0xFF2F6296),
    brandBlue: Color(0xFF6E9FD3),
    brandAmber: Color(0xFF7A5800),
    brandSuccess: Color(0xFF1F6F4A),
    brandDanger: Color(0xFFE06666),
    surfaceWhite: Color(0xFF112240),
    surfaceLightGray: Color(0xFF0A1628),
    surfaceNavySubtle: Color(0xFF1C3358),
    surfaceNavyHover: Color(0xFF3A72AD),
    surfaceBlueSubtle: Color(0xFF142E52),
    surfaceAmberSubtle: Color(0xFF33290A),
    surfaceSuccessSubtle: Color(0xFF0E2E22),
    surfaceDangerSubtle: Color(0xFF3A1519),
    textPrimary: Color(0xFFE7EBF1),
    textMuted: Color(0xFFB8C4D4),
    textInverse: Color(0xFFFFFFFF),
    textInverseMuted: Color(0xFFD5DEEA),
    textBlue: Color(0xFF8DB6E2),
    textSuccess: Color(0xFF6FCF9E),
    textDanger: Color(0xFFF19A9A),
    textAccent: Color(0xFFFFE08A),
    borderSubtle: Color(0xFF2A3F63),
    borderControl: Color(0xFF8796AB),
    borderFocus: Color(0xFF8DB6E2),
    borderFocusOnDark: Color(0xFFFFE08A),
    borderDanger: Color(0xFFE06666),
  );

  /// Colors for the current theme.
  static RwColors of(BuildContext context) => Theme.of(context).extension<RwColors>() ?? RwColors.light;

  @override
  RwColors copyWith({
    Color? brandNavy,
    Color? brandBlue,
    Color? brandAmber,
    Color? brandSuccess,
    Color? brandDanger,
    Color? surfaceWhite,
    Color? surfaceLightGray,
    Color? surfaceNavySubtle,
    Color? surfaceNavyHover,
    Color? surfaceBlueSubtle,
    Color? surfaceAmberSubtle,
    Color? surfaceSuccessSubtle,
    Color? surfaceDangerSubtle,
    Color? textPrimary,
    Color? textMuted,
    Color? textInverse,
    Color? textInverseMuted,
    Color? textBlue,
    Color? textSuccess,
    Color? textDanger,
    Color? textAccent,
    Color? borderSubtle,
    Color? borderControl,
    Color? borderFocus,
    Color? borderFocusOnDark,
    Color? borderDanger,
  }) {
    return RwColors(
      brandNavy: brandNavy ?? this.brandNavy,
      brandBlue: brandBlue ?? this.brandBlue,
      brandAmber: brandAmber ?? this.brandAmber,
      brandSuccess: brandSuccess ?? this.brandSuccess,
      brandDanger: brandDanger ?? this.brandDanger,
      surfaceWhite: surfaceWhite ?? this.surfaceWhite,
      surfaceLightGray: surfaceLightGray ?? this.surfaceLightGray,
      surfaceNavySubtle: surfaceNavySubtle ?? this.surfaceNavySubtle,
      surfaceNavyHover: surfaceNavyHover ?? this.surfaceNavyHover,
      surfaceBlueSubtle: surfaceBlueSubtle ?? this.surfaceBlueSubtle,
      surfaceAmberSubtle: surfaceAmberSubtle ?? this.surfaceAmberSubtle,
      surfaceSuccessSubtle: surfaceSuccessSubtle ?? this.surfaceSuccessSubtle,
      surfaceDangerSubtle: surfaceDangerSubtle ?? this.surfaceDangerSubtle,
      textPrimary: textPrimary ?? this.textPrimary,
      textMuted: textMuted ?? this.textMuted,
      textInverse: textInverse ?? this.textInverse,
      textInverseMuted: textInverseMuted ?? this.textInverseMuted,
      textBlue: textBlue ?? this.textBlue,
      textSuccess: textSuccess ?? this.textSuccess,
      textDanger: textDanger ?? this.textDanger,
      textAccent: textAccent ?? this.textAccent,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      borderControl: borderControl ?? this.borderControl,
      borderFocus: borderFocus ?? this.borderFocus,
      borderFocusOnDark: borderFocusOnDark ?? this.borderFocusOnDark,
      borderDanger: borderDanger ?? this.borderDanger,
    );
  }

  @override
  RwColors lerp(ThemeExtension<RwColors>? other, double t) {
    if (other is! RwColors) return this;
    return RwColors(
      brandNavy: Color.lerp(brandNavy, other.brandNavy, t)!,
      brandBlue: Color.lerp(brandBlue, other.brandBlue, t)!,
      brandAmber: Color.lerp(brandAmber, other.brandAmber, t)!,
      brandSuccess: Color.lerp(brandSuccess, other.brandSuccess, t)!,
      brandDanger: Color.lerp(brandDanger, other.brandDanger, t)!,
      surfaceWhite: Color.lerp(surfaceWhite, other.surfaceWhite, t)!,
      surfaceLightGray: Color.lerp(surfaceLightGray, other.surfaceLightGray, t)!,
      surfaceNavySubtle: Color.lerp(surfaceNavySubtle, other.surfaceNavySubtle, t)!,
      surfaceNavyHover: Color.lerp(surfaceNavyHover, other.surfaceNavyHover, t)!,
      surfaceBlueSubtle: Color.lerp(surfaceBlueSubtle, other.surfaceBlueSubtle, t)!,
      surfaceAmberSubtle: Color.lerp(surfaceAmberSubtle, other.surfaceAmberSubtle, t)!,
      surfaceSuccessSubtle: Color.lerp(surfaceSuccessSubtle, other.surfaceSuccessSubtle, t)!,
      surfaceDangerSubtle: Color.lerp(surfaceDangerSubtle, other.surfaceDangerSubtle, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      textInverse: Color.lerp(textInverse, other.textInverse, t)!,
      textInverseMuted: Color.lerp(textInverseMuted, other.textInverseMuted, t)!,
      textBlue: Color.lerp(textBlue, other.textBlue, t)!,
      textSuccess: Color.lerp(textSuccess, other.textSuccess, t)!,
      textDanger: Color.lerp(textDanger, other.textDanger, t)!,
      textAccent: Color.lerp(textAccent, other.textAccent, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      borderControl: Color.lerp(borderControl, other.borderControl, t)!,
      borderFocus: Color.lerp(borderFocus, other.borderFocus, t)!,
      borderFocusOnDark: Color.lerp(borderFocusOnDark, other.borderFocusOnDark, t)!,
      borderDanger: Color.lerp(borderDanger, other.borderDanger, t)!,
    );
  }
}

/// 8-pt spacing scale (Figma Layout/space-*).
abstract final class RwSpace {
  static const double s0 = 0;
  static const double s4 = 4;
  static const double s8 = 8;
  static const double s12 = 12;
  static const double s16 = 16;
  static const double s24 = 24;
  static const double s32 = 32;
  static const double s40 = 40;
  static const double s48 = 48;
  static const double s64 = 64;
}

/// Corner radii (Figma Layout/radius-*).
abstract final class RwRadius {
  static const double sm = 8;
  static const double md = 16;
  static const double full = 999;

  static const BorderRadius smAll = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius mdAll = BorderRadius.all(Radius.circular(md));
  static const BorderRadius fullAll = BorderRadius.all(Radius.circular(full));
}

/// Fixed sizes (Figma Layout/size-*). Touch targets are at least 48 on mobile.
abstract final class RwSize {
  static const double touch = 48;
  static const double controlHeight = 48;
  static const double iconSm = 16;
  static const double iconMd = 20;
  static const double iconLg = 24;
}

/// Text styles from the Figma type scale (Poppins Bold headings, Inter body).
/// Colors are not set here; widgets apply RwColors.
abstract final class RwType {
  static const TextStyle hero = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 48,
    height: 56 / 48,
    letterSpacing: -0.24,
  );
  static const TextStyle display = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 32,
    height: 40 / 32,
    letterSpacing: -0.16,
  );
  static const TextStyle h1 = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 28,
    height: 36 / 28,
    letterSpacing: -0.07,
  );
  static const TextStyle h2 = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 22,
    height: 30 / 22,
    letterSpacing: 0.0,
  );
  static const TextStyle h3 = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 18,
    height: 26 / 18,
    letterSpacing: 0.0,
  );
  static const TextStyle stat = TextStyle(
    fontFamily: 'Poppins',
    fontWeight: FontWeight.w700,
    fontSize: 36,
    height: 44 / 36,
    letterSpacing: -0.18,
  );
  static const TextStyle bodyLg = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 18,
    height: 28 / 18,
    letterSpacing: 0.0,
  );
  static const TextStyle body = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 16,
    height: 24 / 16,
    letterSpacing: 0.0,
  );
  static const TextStyle bodySm = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 14,
    height: 20 / 14,
    letterSpacing: 0.0,
  );
  static const TextStyle label = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 14,
    height: 20 / 14,
    letterSpacing: 0.0,
  );
  static const TextStyle button = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 16,
    height: 24 / 16,
    letterSpacing: 0.0,
  );
  static const TextStyle caption = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w500,
    fontSize: 12,
    height: 16 / 12,
    letterSpacing: 0.024,
  );
  static const TextStyle overline = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 12,
    height: 16 / 12,
    letterSpacing: 0.096,
  );
  static const TextStyle nav = TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 12,
    height: 16 / 12,
    letterSpacing: 0.024,
  );
}

/// Elevation shadows (Figma effect styles Shadow/sm, md, lg).
abstract final class RwShadow {
  static const List<BoxShadow> sm = [
    BoxShadow(color: Color(0x0F0B2545), offset: Offset(0, 1), blurRadius: 2),
    BoxShadow(color: Color(0x0F0B2545), offset: Offset(0, 1), blurRadius: 3),
  ];
  static const List<BoxShadow> md = [
    BoxShadow(color: Color(0x140B2545), offset: Offset(0, 4), blurRadius: 12),
  ];
  static const List<BoxShadow> lg = [
    BoxShadow(color: Color(0x240B2545), offset: Offset(0, 12), blurRadius: 32),
  ];

  /// Focus/ring: 2 px gap in the surface color, then 2 px of border/focus.
  /// On navy bars use [focusOnDark] (amber ring, Focus/ring-on-dark).
  static List<BoxShadow> focus(RwColors c) => [
    BoxShadow(color: c.surfaceWhite, spreadRadius: 2),
    BoxShadow(color: c.borderFocus, spreadRadius: 4),
  ];
  static List<BoxShadow> focusOnDark(RwColors c) => [
    BoxShadow(color: c.brandNavy, spreadRadius: 2),
    BoxShadow(color: c.borderFocusOnDark, spreadRadius: 4),
  ];
}
