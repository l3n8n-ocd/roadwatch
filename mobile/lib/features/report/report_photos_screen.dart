import 'package:flutter/material.dart';

import '../../core/widgets/widgets.dart';
import '../todo_placeholder.dart';

/// Photos. Figma (Mobile page 90:4): M4/Photos/Default 115:1010, Too large 115:1118, Submitting 115:1231.
///
/// TODO: replace the TodoPlaceholder body with the real screen built from get_design_context
/// on the frames above, using the widgets in lib/core/widgets.
class ReportPhotosScreen extends StatelessWidget {
  const ReportPhotosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const RwTopBar.inner(title: 'Photos'),
      body: const TodoPlaceholder(
        screen: 'Photos',
        figmaFrames: 'M4/Photos/Default 115:1010, Too large 115:1118, Submitting 115:1231',
        notes: 'Step 3 of 3. image_picker, RwPhotoTile, max 5 MB each (PhotoRules). Submit: createReport, then uploadPhotos, then /report/confirmation.',
      ),
    );
  }
}
