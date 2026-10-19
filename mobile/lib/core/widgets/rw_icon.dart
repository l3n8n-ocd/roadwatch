import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Names of the 56 Figma icons (Foundations > Iconography, Lucide-style outline, 2 px stroke).
/// Files live in `assets/icons/<name>.svg` (generated from the Figma icon components).
abstract final class RwIcons {
  static const alertCircle = 'alert-circle';
  static const alertTriangle = 'alert-triangle';
  static const arrowLeft = 'arrow-left';
  static const barChart = 'bar-chart';
  static const bell = 'bell';
  static const calendar = 'calendar';
  static const camera = 'camera';
  static const car = 'car';
  static const check = 'check';
  static const checkCircle = 'check-circle';
  static const chevronDown = 'chevron-down';
  static const chevronLeft = 'chevron-left';
  static const chevronRight = 'chevron-right';
  static const clock = 'clock';
  static const dashboard = 'dashboard';
  static const download = 'download';
  static const eye = 'eye';
  static const fileText = 'file-text';
  static const filter = 'filter';
  static const globe = 'globe';
  static const helpCircle = 'help-circle';
  static const home = 'home';
  static const image = 'image';
  static const inbox = 'inbox';
  static const info = 'info';
  static const list = 'list';
  static const loader = 'loader';
  static const locate = 'locate';
  static const lock = 'lock';
  static const logOut = 'log-out';
  static const mail = 'mail';
  static const map = 'map';
  static const mapPin = 'map-pin';
  static const menu = 'menu';
  static const message = 'message';
  static const minus = 'minus';
  static const moon = 'moon';
  static const pencil = 'pencil';
  static const phone = 'phone';
  static const playCircle = 'play-circle';
  static const plus = 'plus';
  static const refresh = 'refresh';
  static const search = 'search';
  static const send = 'send';
  static const settings = 'settings';
  static const shieldCheck = 'shield-check';
  static const sliders = 'sliders';
  static const sun = 'sun';
  static const upload = 'upload';
  static const user = 'user';
  static const userCheck = 'user-check';
  static const userX = 'user-x';
  static const users = 'users';
  static const wifiOff = 'wifi-off';
  static const x = 'x';
  static const xCircle = 'x-circle';
}

/// An outline icon from assets/icons, recolored to [color] (default: the current IconTheme color).
///
/// Icons are decorative unless [semanticLabel] is given. Icon-only controls should put the
/// accessible name on the control (RwIconButton.semanticLabel), not here.
class RwIcon extends StatelessWidget {
  const RwIcon(this.name, {super.key, this.size = 24, this.color, this.semanticLabel});

  /// One of [RwIcons], e.g. RwIcons.mapPin.
  final String name;
  final double size;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = color ?? IconTheme.of(context).color ?? DefaultTextStyle.of(context).style.color!;
    return SvgPicture.asset(
      'assets/icons/$name.svg',
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(c, BlendMode.srcIn),
      semanticsLabel: semanticLabel,
      excludeFromSemantics: semanticLabel == null,
    );
  }
}
