import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/constants.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';
import 'report_confirmation_screen.dart';
import 'report_details_screen.dart' show confirmCancelReport;
import 'report_draft.dart';

/// Report an accident, step 3 of 3. Figma (Mobile page 90:4): M4/Photos/Default 115:1010,
/// Too large 115:1118, Submitting 115:1231.
///
/// Up to 5 photos (JPG, PNG, WebP; 5 MB each) from the camera or gallery. Submit creates the
/// report (POST /reports), then uploads the photos (POST /reports/:id/photos) and opens M5.
class ReportPhotosScreen extends StatefulWidget {
  const ReportPhotosScreen({super.key, this.picker});

  /// Injected in tests.
  final ImagePicker? picker;

  @override
  State<ReportPhotosScreen> createState() => _ReportPhotosScreenState();
}

/// A picked file that was not added (too large or wrong type).
class _Rejected {
  const _Rejected(this.name, this.tileLabel, this.caption, this.reason);
  final String name;
  final String tileLabel;
  final String caption;
  final String reason;
}

enum _Phase { editing, creating, uploading }

class _ReportPhotosScreenState extends State<ReportPhotosScreen> {
  static const _maxPhotos = PhotoRules.maxPerUpload;

  late final ReportDraft _draft = context.read<ReportDraft>();
  late final ImagePicker _picker = widget.picker ?? ImagePicker();

  final List<_Rejected> _rejected = [];
  _Phase _phase = _Phase.editing;
  bool _picking = false;

  /// Upload progress: bytes per file and the share of the request sent so far (0..1).
  List<int> _sizes = const [];
  double _sentFraction = 0;

  bool get _busy => _phase != _Phase.editing;
  int get _remaining => _maxPhotos - _draft.photoPaths.length;

  static String _fileName(String path) => path.split(RegExp(r'[/\\]')).last;

  static String _mb(int bytes) => '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';

  Future<void> _pick(ImageSource source) async {
    if (_busy || _picking || _remaining <= 0) return;
    setState(() => _picking = true);
    try {
      List<XFile> files;
      if (source == ImageSource.camera) {
        // Downscale camera shots so a normal photo stays well under 5 MB.
        final shot = await _picker.pickImage(source: ImageSource.camera, maxWidth: 2560, imageQuality: 85);
        files = shot == null ? const [] : [shot];
      } else if (_remaining == 1) {
        final one = await _picker.pickImage(source: ImageSource.gallery);
        files = one == null ? const [] : [one];
      } else {
        files = await _picker.pickMultiImage(limit: _remaining);
      }
      await _add(files);
    } catch (_) {
      if (mounted) {
        showRwToast(
          context,
          type: RwToastType.error,
          title: "Couldn't open ${source == ImageSource.camera ? 'the camera' : 'your photos'}",
          message: 'Check the app permissions, then try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _add(List<XFile> files) async {
    if (files.isEmpty) return;
    final rejected = <_Rejected>[];
    final accepted = <String>[];
    var skipped = 0;
    for (final f in files) {
      final name = f.name.isNotEmpty ? f.name : _fileName(f.path);
      final ext = name.contains('.') ? name.split('.').last.toLowerCase() : '';
      final size = await f.length();
      if (!PhotoRules.extensions.contains(ext)) {
        rejected.add(
          _Rejected(name, 'Wrong type', 'Use JPG, PNG or WebP', '$name is not a JPG, PNG or WebP file.'),
        );
      } else if (size > PhotoRules.maxBytes) {
        rejected.add(
          _Rejected(
            name,
            'Too large',
            '${_mb(size)}, max 5 MB',
            '$name is ${_mb(size)}. The limit is 5 MB per photo.',
          ),
        );
      } else if (_draft.photoPaths.length + accepted.length >= _maxPhotos) {
        skipped++;
      } else if (!_draft.photoPaths.contains(f.path)) {
        accepted.add(f.path);
      }
    }
    if (!mounted) return;
    _draft.update((d) => d.photoPaths.addAll(accepted));
    setState(() {
      _rejected
        ..clear()
        ..addAll(rejected);
    });
    if (skipped > 0) {
      showRwToast(
        context,
        type: RwToastType.info,
        title: 'Only 5 photos per report',
        message: '$skipped ${skipped == 1 ? 'photo was' : 'photos were'} not added.',
      );
    }
  }

  void _remove(String path) {
    _draft.update((d) => d.photoPaths.remove(path));
    setState(() {});
  }

  Future<void> _submit() async {
    if (_busy) return;
    final d = _draft;
    if (d.accidentTypeId == null ||
        d.accidentDate == null ||
        d.accidentTime == null ||
        d.location.trim().length < 3) {
      showRwToast(
        context,
        type: RwToastType.error,
        title: 'Some details are missing',
        message: 'Go back to the earlier steps and fill in the required fields.',
      );
      return;
    }
    final api = context.read<RoadWatchApi>();
    final nav = Navigator.of(context);
    setState(() {
      _phase = _Phase.creating;
      _rejected.clear();
    });

    final int reportId;
    try {
      reportId = (await api.createReport(d.toNewReport(formatDate: apiDate))).reportId;
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _phase = _Phase.editing);
      showRwToast(context, type: RwToastType.error, title: "Couldn't send the report", message: e.message);
      return;
    }

    var failed = 0;
    final paths = List<String>.of(d.photoPaths);
    if (paths.isNotEmpty) {
      final sizes = <int>[];
      for (final p in paths) {
        try {
          sizes.add(await File(p).length());
        } catch (_) {
          sizes.add(1);
        }
      }
      if (mounted) {
        setState(() {
          _sizes = sizes;
          _sentFraction = 0;
          _phase = _Phase.uploading;
        });
      }
      try {
        await api.uploadPhotos(
          reportId,
          paths,
          onSendProgress: (sent, total) {
            if (mounted && total > 0) setState(() => _sentFraction = sent / total);
          },
        );
      } on ApiException {
        failed = paths.length;
      } catch (_) {
        failed = paths.length;
      }
    }

    // The report exists now: clear the form and show M5 on top of the tab shell.
    d.reset();
    nav.pushNamedAndRemoveUntil(
      Routes.reportConfirmation,
      (r) => r.isFirst,
      arguments: ReportConfirmationArgs(
        reportId: reportId,
        photoUploadFailed: failed > 0,
        failedPhotoCount: failed,
      ),
    );
  }

  /// Tile for photo [i] while uploading: done, in progress, or waiting.
  Widget _uploadTile(int i, String path) {
    final name = _fileName(path);
    if (_phase == _Phase.creating || _sizes.length != _draft.photoPaths.length) {
      return RwPhotoTile(state: RwPhotoTileState.uploaded, image: FileImage(File(path)), caption: name);
    }
    final total = _sizes.fold<int>(0, (a, b) => a + b);
    final sent = _sentFraction * total;
    var start = 0;
    for (var k = 0; k < i; k++) {
      start += _sizes[k];
    }
    final end = start + _sizes[i];
    if (sent >= end) {
      return RwPhotoTile(state: RwPhotoTileState.uploaded, image: FileImage(File(path)), caption: name);
    }
    final progress = sent <= start ? 0.0 : (sent - start) / _sizes[i];
    return RwPhotoTile(
      state: RwPhotoTileState.uploading,
      progress: progress,
      caption: 'Uploading ${i + 1} of ${_sizes.length}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final photos = _draft.photoPaths;
    final count = photos.length;
    final canAdd = !_busy && !_picking && _remaining > 0;

    return PopScope(
      canPop: !_busy,
      child: Scaffold(
        backgroundColor: c.surfaceWhite,
        appBar: RwTopBar.inner(
          title: 'Report an accident',
          action: RwTopBarAction(
            icon: RwIcons.x,
            semanticLabel: 'Cancel report',
            onPressed: _busy ? null : () => confirmCancelReport(context),
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(RwSpace.s16),
                children: [
                  const RwStepper(step: 3),
                  const SizedBox(height: RwSpace.s16),
                  Text(
                    'Add up to 5 photos (JPG, PNG or WebP, 5 MB each). Photos are optional but help '
                    'officers verify faster.',
                    style: RwType.body.copyWith(color: c.textPrimary),
                  ),
                  if (_rejected.isNotEmpty) ...[
                    const SizedBox(height: RwSpace.s16),
                    RwToast(
                      type: RwToastType.error,
                      title: _rejected.length == 1
                          ? '1 photo was not added'
                          : '${_rejected.length} photos were not added',
                      message: _rejected.map((r) => r.reason).join('\n'),
                      onClose: () => setState(_rejected.clear),
                    ),
                  ],
                  const SizedBox(height: RwSpace.s16),
                  Wrap(
                    spacing: RwSpace.s8,
                    runSpacing: RwSpace.s16,
                    children: [
                      for (var i = 0; i < count; i++)
                        _busy
                            ? _uploadTile(i, photos[i])
                            : RwPhotoTile(
                                state: RwPhotoTileState.uploaded,
                                image: FileImage(File(photos[i])),
                                caption: _fileName(photos[i]),
                                semanticLabel: 'Photo ${i + 1}, ${_fileName(photos[i])}',
                                onRemove: () => _remove(photos[i]),
                              ),
                      if (!_busy)
                        for (final r in _rejected)
                          RwPhotoTile(
                            state: RwPhotoTileState.error,
                            errorLabel: r.tileLabel,
                            caption: r.caption,
                          ),
                      if (canAdd || (_picking && _remaining > 0))
                        RwPhotoTile(
                          state: RwPhotoTileState.empty,
                          semanticLabel: 'Add photo from gallery',
                          onTap: canAdd ? () => _pick(ImageSource.gallery) : null,
                        ),
                    ],
                  ),
                  const SizedBox(height: RwSpace.s16),
                  Semantics(
                    liveRegion: true,
                    child: Text(
                      '$count of $_maxPhotos photos added',
                      style: RwType.label.copyWith(color: c.textPrimary),
                    ),
                  ),
                  if (!_busy) ...[
                    const SizedBox(height: RwSpace.s16),
                    Row(
                      children: [
                        Expanded(
                          child: RwButton.secondary(
                            label: 'Camera',
                            icon: RwIcons.camera,
                            semanticLabel: 'Take a photo with the camera',
                            onPressed: canAdd ? () => _pick(ImageSource.camera) : null,
                          ),
                        ),
                        const SizedBox(width: RwSpace.s12),
                        Expanded(
                          child: RwButton.secondary(
                            label: 'Gallery',
                            icon: RwIcons.image,
                            semanticLabel: 'Choose photos from the gallery',
                            onPressed: canAdd ? () => _pick(ImageSource.gallery) : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: RwSpace.s16),
                  Text(
                    'Stay safe: do not stop in live traffic to take photos.',
                    style: RwType.bodySm.copyWith(color: c.textMuted),
                  ),
                ],
              ),
            ),
            _ActionBar(
              children: _busy
                  ? [
                      Expanded(
                        child: RwButton(
                          label: 'Submitting…',
                          loading: true,
                          semanticLabel: _phase == _Phase.creating ? 'Sending report' : 'Uploading photos',
                          onPressed: null,
                        ),
                      ),
                    ]
                  : [
                      RwButton.secondary(
                        label: 'Back',
                        expand: false,
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                      const SizedBox(width: RwSpace.s12),
                      Expanded(
                        child: RwButton(label: 'Submit report', icon: RwIcons.send, onPressed: _submit),
                      ),
                    ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Sticky bottom action bar: white, top border, 16 px padding.
class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(top: BorderSide(color: c.borderSubtle)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(RwSpace.s16),
          child: Row(children: children),
        ),
      ),
    );
  }
}
