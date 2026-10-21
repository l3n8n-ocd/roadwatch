import 'package:flutter/material.dart';

import 'core/widgets/rw_bottom_nav.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/home/home_shell.dart';
import 'features/my_reports/tracking_screen.dart';
import 'features/officer/officer_report_screen.dart';
import 'features/report/report_confirmation_screen.dart';
import 'features/report/report_details_screen.dart';
import 'features/report/report_location_screen.dart';
import 'features/report/report_photos_screen.dart';
import 'features/settings/about_screen.dart';
import 'features/settings/appearance_screen.dart';
import 'features/settings/change_password_screen.dart';
import 'features/settings/demo_video_screen.dart';
import 'features/settings/edit_profile_screen.dart';
import 'features/settings/hotlines_screen.dart';
import 'features/settings/how_to_report_screen.dart';
import 'features/settings/language_screen.dart';
import 'features/settings/privacy_screen.dart';

/// Named routes (plain Navigator). Tabs (/home, /my-reports, /notifications, /settings) all
/// open the HomeShell on that tab (/home is Assigned for officers); inside the shell, switch tabs
/// with HomeShell.selectTab.
abstract final class Routes {
  static const login = '/login';
  static const register = '/register';
  static const home = '/home';
  static const reportDetails = '/report/details';
  static const reportLocation = '/report/location';
  static const reportPhotos = '/report/photos';

  /// Argument: [ReportConfirmationArgs].
  static const reportConfirmation = '/report/confirmation';
  static const myReports = '/my-reports';

  /// Argument: the report_id (int).
  static const tracking = '/tracking';

  /// Traffic Officer report details (O2). Argument: the report_id (int).
  static const officerReport = '/officer/report';
  static const notifications = '/notifications';
  static const settings = '/settings';
  static const editProfile = '/settings/edit-profile';
  static const changePassword = '/settings/change-password';
  static const appearance = '/settings/appearance';
  static const language = '/settings/language';
  static const howToReport = '/settings/how-to-report';
  static const about = '/settings/about';
  static const privacy = '/settings/privacy';
  static const hotlines = '/settings/hotlines';
  static const demoVideo = '/settings/demo-video';

  /// Reachable without signing in.
  static const public = {login, register};

  /// Builds the page for [settings]. [signedIn] guards private routes (they fall back to login).
  static Route<dynamic> onGenerateRoute(RouteSettings settings, {required bool signedIn}) {
    final name = settings.name ?? home;
    if (!signedIn && !public.contains(name)) {
      return _page(const LoginScreen(), settings);
    }
    final Widget page = switch (name) {
      login => const LoginScreen(),
      register => const RegisterScreen(),
      home || '/' => const HomeShell(initialTab: RwTab.home),
      myReports => const HomeShell(initialTab: RwTab.myReports),
      notifications => const HomeShell(initialTab: RwTab.notifications),
      Routes.settings => const HomeShell(initialTab: RwTab.settings),
      reportDetails => const ReportDetailsScreen(),
      reportLocation => const ReportLocationScreen(),
      reportPhotos => const ReportPhotosScreen(),
      reportConfirmation => ReportConfirmationScreen(
        args: settings.arguments is ReportConfirmationArgs
            ? settings.arguments as ReportConfirmationArgs
            : const ReportConfirmationArgs(reportId: 0),
      ),
      tracking => TrackingScreen(reportId: settings.arguments is int ? settings.arguments as int : 0),
      officerReport => OfficerReportScreen(
        reportId: settings.arguments is int ? settings.arguments as int : 0,
      ),
      editProfile => const EditProfileScreen(),
      changePassword => const ChangePasswordScreen(),
      appearance => const AppearanceScreen(),
      language => const LanguageScreen(),
      howToReport => const HowToReportScreen(),
      about => const AboutScreen(),
      privacy => const PrivacyScreen(),
      hotlines => const HotlinesScreen(),
      demoVideo => const DemoVideoScreen(),
      _ => const HomeShell(initialTab: RwTab.home),
    };
    return _page(page, settings);
  }

  static Route<dynamic> _page(Widget page, RouteSettings settings) =>
      MaterialPageRoute<dynamic>(builder: (_) => page, settings: settings);
}
