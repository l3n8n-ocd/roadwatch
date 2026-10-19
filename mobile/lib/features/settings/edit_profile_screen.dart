import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Edit profile. Figma (Mobile page 90:4): Settings/Edit profile 162:2322.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Edit profile'),
      body: const TodoPlaceholder(
        screen: 'Edit profile',
        figmaFrames: 'Settings/Edit profile 162:2322',
        notes: 'AuthProvider.updateProfile (PATCH /auth/me, not built on the API yet: show the ApiException message). Email is read-only.',
      ),
    );
  }
}
