import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config.dart';
import '../../core/constants.dart';
import '../../core/state/auth_provider.dart';
import '../../core/state/settings_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Settings. Figma (Mobile page 90:4): Settings/Main (Light) 161:2022, (Dark) 161:2285; officers:
/// O6/Settings/Main (Light) 323:3198.
///
/// Profile header from GET /auth/me, then the rows from docs/DECISIONS.md #25. Officers get the
/// "New assignments" alert instead of the reporter alerts and no "How to report". Preferences are
/// stored on this phone only (SettingsProvider). Tab body hosted by HomeShell (no back button).
class SettingsTab extends StatefulWidget {
  const SettingsTab({super.key});

  @override
  State<SettingsTab> createState() => _SettingsTabState();
}

class _SettingsTabState extends State<SettingsTab> {
  @override
  void initState() {
    super.initState();
    // Fresh name, email and role for the header; the cached user shows meanwhile.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      try {
        await context.read<AuthProvider>().refreshUser();
      } catch (_) {
        // Offline or server asleep: keep the cached profile.
      }
    });
  }

  void _push(String route) => Navigator.of(context).pushNamed(route);

  Future<void> _logout() async {
    final ok = await showRwConfirmDialog(
      context,
      // Figma Settings/Log out (347:36744, #40): primary Log out on top, Cancel below.
      title: 'Log out?',
      message:
          "You'll need your email and password to log in again. Your reports stay saved in your account.",
      confirmLabel: 'Log out',
      confirmIcon: RwIcons.logOut,
    );
    if (ok && mounted) await context.read<AuthProvider>().logout();
  }

  void _contactAdmin() {
    showDialog<void>(context: context, builder: (_) => const _ContactAdminDialog());
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final user = context.watch<AuthProvider>().user;
    final officer = user?.isOfficer ?? false;
    final settings = context.watch<SettingsProvider>();
    final themeLabel = switch (settings.themeMode) {
      ThemeMode.light => 'Light',
      ThemeMode.dark => 'Dark',
      ThemeMode.system => 'System',
    };

    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Settings'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          _ProfileCard(name: user?.fullName ?? '', email: user?.contactEmail ?? '', role: user?.role ?? ''),
          const _GroupLabel('Account'),
          _Group(
            children: [
              RwSettingsRow.navigation(
                icon: RwIcons.user,
                label: 'Edit profile',
                description: 'Name and mobile number',
                onTap: () => _push(Routes.editProfile),
              ),
              RwSettingsRow.navigation(
                icon: RwIcons.lock,
                label: 'Change password',
                onTap: () => _push(Routes.changePassword),
              ),
              RwSettingsRow.navigation(
                icon: RwIcons.eye,
                label: 'Privacy',
                description: officer
                    ? 'How reporter contact details are protected'
                    : 'Who can see your contact details',
                onTap: () => _push(Routes.privacy),
              ),
            ],
          ),
          const _GroupLabel('Preferences'),
          _Group(
            children: [
              RwSettingsRow.navigation(
                icon: settings.themeMode == ThemeMode.dark ? RwIcons.moon : RwIcons.sun,
                label: 'Appearance',
                value: themeLabel,
                onTap: () => _push(Routes.appearance),
              ),
              RwSettingsRow.navigation(
                icon: RwIcons.globe,
                label: 'Language',
                value: settings.language.label,
                onTap: () => _push(Routes.language),
              ),
            ],
          ),
          const _GroupLabel('Notifications (in-app)'),
          _Group(
            children: [
              if (officer)
                RwSettingsRow.toggle(
                  icon: RwIcons.bell,
                  label: 'New assignments',
                  description: 'When an administrator assigns a report to you',
                  switchValue: settings.alertNewAssignments,
                  onSwitchChanged: settings.setAlertNewAssignments,
                ),
              if (!officer) ...[
                RwSettingsRow.toggle(
                  icon: RwIcons.bell,
                  label: 'Status changes',
                  description: 'When a report you sent changes status',
                  switchValue: settings.alertStatusChanges,
                  onSwitchChanged: settings.setAlertStatusChanges,
                ),
                RwSettingsRow.toggle(
                  icon: RwIcons.message,
                  label: 'Requests for more information',
                  description: 'When an officer needs details from you',
                  switchValue: settings.alertInfoRequests,
                  onSwitchChanged: settings.setAlertInfoRequests,
                ),
              ],
            ],
          ),
          const _GroupLabel('Accessibility'),
          _Group(
            children: [
              // #56: the guide (a text tour) with optional Read aloud, and the reading speed.
              RwSettingsRow.navigation(
                icon: RwIcons.accessibility,
                label: 'Accessibility',
                description: 'Guide, Read aloud and captions',
                onTap: () => _push(Routes.accessibility),
              ),
              RwSettingsRow.toggle(
                icon: RwIcons.sliders,
                label: 'Reduce motion',
                description: 'Use fades instead of slides. Follows Android by default.',
                switchValue: settings.reduceMotion(context),
                onSwitchChanged: settings.setReduceMotion,
              ),
            ],
          ),
          const _GroupLabel('Help'),
          _Group(
            children: [
              RwSettingsRow.navigation(
                icon: RwIcons.phone,
                label: 'Emergency hotlines',
                description: '${Hotlines.emergency.number}, police (PNP) and fire (BFP)',
                onTap: () => _push(Routes.hotlines),
              ),
              if (!officer)
                RwSettingsRow.navigation(
                  icon: RwIcons.helpCircle,
                  label: 'How to report',
                  onTap: () => _push(Routes.howToReport),
                ),
              RwSettingsRow.navigation(
                icon: RwIcons.playCircle,
                label: 'Demo video',
                onTap: () => _push(Routes.demoVideo),
              ),
              RwSettingsRow.navigation(
                icon: RwIcons.mail,
                label: 'Contact the administrator',
                description: 'Account or password problems',
                onTap: _contactAdmin,
              ),
            ],
          ),
          const _GroupLabel('About'),
          _Group(
            children: [
              RwSettingsRow.navigation(
                icon: RwIcons.info,
                label: 'About RoadWatch',
                description: 'Version ${AppConfig.appVersion}',
                onTap: () => _push(Routes.about),
              ),
            ],
          ),
          const SizedBox(height: RwSpace.s16),
          _Group(
            children: [RwSettingsRow.destructive(icon: RwIcons.logOut, label: 'Log out', onTap: _logout)],
          ),
          const SizedBox(height: RwSpace.s16),
        ],
      ),
    );
  }
}

/// Figma "Profile (GET /auth/me)": initials avatar, name, email, role.
class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.name, required this.email, required this.role});

  final String name;
  final String email;
  final String role;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    final first = parts.first[0];
    final last = parts.length > 1 ? parts[1][0] : '';
    return (first + last).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Semantics(
      container: true,
      label: 'Signed in as $name, $email, $role',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.all(RwSpace.s16),
        decoration: BoxDecoration(
          color: c.surfaceWhite,
          borderRadius: RwRadius.mdAll,
          border: Border.all(color: c.borderSubtle),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.surfaceNavySubtle, shape: BoxShape.circle),
              child: Text(_initials, style: RwType.h3.copyWith(color: c.textPrimary)),
            ),
            const SizedBox(width: RwSpace.s16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: RwType.h3.copyWith(color: c.textPrimary)),
                  const SizedBox(height: 2),
                  Text(email, style: RwType.bodySm.copyWith(color: c.textMuted)),
                  const SizedBox(height: 2),
                  Text(role, style: RwType.caption.copyWith(color: c.textBlue)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Section label above a group ("ACCOUNT").
class _GroupLabel extends StatelessWidget {
  const _GroupLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: RwSpace.s16, bottom: RwSpace.s8),
      child: Semantics(
        header: true,
        child: Text(
          text.toUpperCase(),
          style: RwType.overline.copyWith(color: RwColors.of(context).textBlue),
        ),
      ),
    );
  }
}

/// Rounded white card holding settings rows.
class _Group extends StatelessWidget {
  const _Group({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        borderRadius: RwRadius.mdAll,
        border: Border.all(color: c.borderSubtle),
      ),
      child: Column(children: children),
    );
  }
}

/// Same wording as the web "Contact support" dialog: accounts are handled by the administrator.
class _ContactAdminDialog extends StatelessWidget {
  const _ContactAdminDialog();

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Dialog(
      backgroundColor: c.surfaceWhite,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(RwSpace.s16),
      shape: const RoundedRectangleBorder(borderRadius: RwRadius.mdAll),
      child: Padding(
        padding: const EdgeInsets.all(RwSpace.s24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Semantics(
                header: true,
                child: Text('Contact the administrator', style: RwType.h2.copyWith(color: c.textPrimary)),
              ),
              const SizedBox(height: RwSpace.s8),
              Text(
                'RoadWatch accounts are managed by the system administrator. Contact them for a '
                'forgotten password, a deactivated account or details you cannot change yourself.',
                style: RwType.body.copyWith(color: c.textMuted),
              ),
              const SizedBox(height: RwSpace.s16),
              Text(
                'In an emergency, do not wait for RoadWatch: call ${Hotlines.emergency.number}.',
                style: RwType.body.copyWith(color: c.textPrimary),
              ),
              const SizedBox(height: RwSpace.s24),
              RwButton(label: 'Close', onPressed: () => Navigator.of(context).pop()),
            ],
          ),
        ),
      ),
    );
  }
}
