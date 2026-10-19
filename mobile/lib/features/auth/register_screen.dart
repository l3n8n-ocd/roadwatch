import 'package:flutter/material.dart';

import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Create an account. Figma (Mobile page 90:4): M0/Register/Default 109:239, Validation 109:323.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: RwColors.of(context).surfaceWhite,
      appBar: const RwTopBar.inner(title: 'Create an account'),
      body: const TodoPlaceholder(
        screen: 'Create an account',
        figmaFrames: 'M0/Register/Default 109:239, Validation 109:323',
        notes: 'Fields: full_name, contact_email, password (8+), contact_phone (optional). Use AuthProvider.register; map AuthFailure.fieldError(\'contact_email\').',
      ),
    );
  }
}
