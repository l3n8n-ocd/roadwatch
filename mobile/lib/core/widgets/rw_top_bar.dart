import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/tokens.dart';
import 'rw_icon.dart';
import 'rw_icon_button.dart';
import 'rw_logo.dart';

/// Optional trailing action of an inner top bar (e.g. close the report form).
class RwTopBarAction {
  const RwTopBarAction({required this.icon, required this.semanticLabel, required this.onPressed});
  final String icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
}

/// Figma "Top bar mobile" (105:501), the Scaffold.appBar for every screen. App bar 64 px
/// under the system status bar.
/// - [RwTopBar.home]: navy bar, logo, bell with unread badge.
/// - [RwTopBar.inner]: white bar with bottom border, back button, H3 title, optional action.
class RwTopBar extends StatelessWidget implements PreferredSizeWidget {
  const RwTopBar.home({super.key, this.unreadCount = 0, this.onNotifications})
    : title = null,
      onBack = null,
      action = null,
      _home = true;

  const RwTopBar.inner({super.key, required String this.title, this.onBack, this.action})
    : unreadCount = 0,
      onNotifications = null,
      _home = false;

  final bool _home;
  final String? title;

  /// Back button action. Defaults to Navigator.maybePop; hidden when nothing can be popped
  /// (root tabs such as My reports and Settings).
  final VoidCallback? onBack;
  final RwTopBarAction? action;
  final int unreadCount;
  final VoidCallback? onNotifications;

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final overlay = (_home || isDark) ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark;
    final bg = _home ? c.brandNavy : c.surfaceWhite;

    Widget bar;
    if (_home) {
      bar = Padding(
        padding: const EdgeInsets.only(left: RwSpace.s16, right: RwSpace.s8),
        child: Row(
          children: [
            const RwLogo(),
            const Spacer(),
            if (onNotifications != null)
              RwIconButton(
                icon: RwIcons.bell,
                semanticLabel: 'Notifications',
                tone: RwIconButtonTone.dark,
                badgeCount: unreadCount,
                onPressed: onNotifications,
              ),
          ],
        ),
      );
    } else {
      final canPop = ModalRoute.of(context)?.canPop ?? false;
      final back = onBack ?? (canPop ? () => Navigator.of(context).maybePop() : null);
      bar = Padding(
        padding: const EdgeInsets.symmetric(horizontal: RwSpace.s8),
        child: Row(
          children: [
            if (back != null)
              RwIconButton(icon: RwIcons.arrowLeft, semanticLabel: 'Back', onPressed: back)
            else
              const SizedBox(width: RwSpace.s8),
            const SizedBox(width: RwSpace.s4),
            Expanded(
              child: Semantics(
                header: true,
                child: Text(
                  title!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: RwType.h3.copyWith(color: c.textPrimary),
                ),
              ),
            ),
            if (action != null)
              RwIconButton(
                icon: action!.icon,
                semanticLabel: action!.semanticLabel,
                onPressed: action!.onPressed,
              ),
          ],
        ),
      );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlay.copyWith(statusBarColor: Colors.transparent),
      child: Material(
        color: bg,
        child: Container(
          decoration: _home
              ? null
              : BoxDecoration(
                  border: Border(bottom: BorderSide(color: c.borderSubtle)),
                ),
          child: SafeArea(bottom: false, child: SizedBox(height: 64, child: bar)),
        ),
      ),
    );
  }
}
