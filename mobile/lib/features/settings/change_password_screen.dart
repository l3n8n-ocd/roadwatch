import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Change password. Figma (Mobile page 90:4): Settings/Change password (validation) 162:2396.
///
/// RoadWatchApi.changePassword (PATCH /auth/me/password, #25). A wrong current password comes back as a
/// field error under that field. New password 8+ characters; the confirmation is checked here.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  static const _minLength = 8;

  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _submitted = false;
  bool _saving = false;
  String? _serverCurrentError;
  String? _serverNewError;
  String? _bannerTitle;
  String? _bannerMessage;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String? get _currentError =>
      _serverCurrentError ?? (_submitted && _current.text.isEmpty ? 'Enter your current password.' : null);

  /// Shown as soon as typing starts, like the Figma "(6 so far)" state.
  String? get _newError {
    if (_serverNewError != null) return _serverNewError;
    final n = _next.text.length;
    if (n == 0) return _submitted ? 'Enter a new password.' : null;
    if (n < _minLength) return 'Use at least $_minLength characters ($n so far).';
    return null;
  }

  String? get _confirmError {
    if (_confirm.text.isEmpty) return _submitted ? 'Type the new password again.' : null;
    return _confirm.text != _next.text ? "Passwords don't match." : null;
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _submitted = true;
      _serverCurrentError = _serverNewError = null;
      _bannerTitle = _bannerMessage = null;
    });
    if (_currentError != null || _newError != null || _confirmError != null) return;
    setState(() => _saving = true);
    try {
      await context.read<RoadWatchApi>().changePassword(
        currentPassword: _current.text,
        newPassword: _next.text,
      );
      if (!mounted) return;
      showRwToast(
        context,
        type: RwToastType.success,
        title: 'Password updated',
        message: 'You stay logged in on this phone.',
      );
      Navigator.of(context).maybePop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _serverCurrentError = e.fieldError('current_password');
        _serverNewError = e.fieldError('new_password');
        _bannerTitle = "Couldn't update your password";
        _bannerMessage = switch (e.kind) {
          ApiErrorKind.notFound =>
            'Changing your password is not available on the RoadWatch server yet. '
                'Your password was not changed. Try again after the next update.',
          ApiErrorKind.unauthorized => 'Your current password is incorrect.',
          _ => e.message,
        };
      });
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Change password'),
      body: AutofillGroup(
        child: ListView(
          padding: const EdgeInsets.all(RwSpace.s16),
          children: [
            if (_bannerTitle != null) ...[
              RwToast(type: RwToastType.error, title: _bannerTitle!, message: _bannerMessage),
              const SizedBox(height: RwSpace.s16),
            ],
            RwPasswordField(
              label: 'Current password',
              required: true,
              controller: _current,
              errorText: _currentError,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.password],
              onChanged: (_) => setState(() => _serverCurrentError = null),
            ),
            const SizedBox(height: RwSpace.s16),
            RwPasswordField(
              label: 'New password',
              required: true,
              controller: _next,
              errorText: _newError,
              helperText: 'Use at least $_minLength characters.',
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.newPassword],
              onChanged: (_) => setState(() => _serverNewError = null),
            ),
            const SizedBox(height: RwSpace.s16),
            RwPasswordField(
              label: 'Confirm new password',
              required: true,
              controller: _confirm,
              errorText: _confirmError,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.newPassword],
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => _save(),
            ),
            const SizedBox(height: RwSpace.s16),
            const _InfoNote('After a change you stay logged in on this phone.'),
          ],
        ),
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(
          color: c.surfaceWhite,
          border: Border(top: BorderSide(color: c.borderSubtle)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(RwSpace.s16),
            child: RwButton(label: 'Update password', loading: _saving, onPressed: _save),
          ),
        ),
      ),
    );
  }
}

/// Figma "Note": blue-subtle box with an info icon.
class _InfoNote extends StatelessWidget {
  const _InfoNote(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: const EdgeInsets.all(RwSpace.s12),
      decoration: BoxDecoration(color: c.surfaceBlueSubtle, borderRadius: RwRadius.smAll),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RwIcon(RwIcons.info, size: RwSize.iconMd, color: c.textBlue),
          const SizedBox(width: RwSpace.s8),
          Expanded(
            child: Text(text, style: RwType.bodySm.copyWith(color: c.textPrimary)),
          ),
        ],
      ),
    );
  }
}
