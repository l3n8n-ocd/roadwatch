import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import '../todo_placeholder.dart';

/// Log in. Figma (Mobile page 90:4): M0/Login/Default 109:5, Error 109:79, Deactivated account 109:164.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RwColors.of(context).surfaceWhite,
      appBar: const RwTopBar.inner(title: 'Log in'),
      body: const TodoPlaceholder(
        screen: 'Log in',
        figmaFrames: 'M0/Login/Default 109:5, Error 109:79, Deactivated account 109:164',
        notes: 'Use AuthProvider.login; show AuthFailure title/message in an inline RwToast(error). Show AuthProvider.notice once (deactivated / session ended). Emergency note: Call 911 first.',
        links: {'Create an account': Routes.register},
      ),
    );
  }
}
