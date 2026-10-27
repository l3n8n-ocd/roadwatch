import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/api/roadwatch_api.dart';
import '../../core/password_strength.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Forgot password (#37, DECISIONS #43), Reporter and Traffic Officer. Figma (Mobile page 90:4):
/// M0/Forgot password/Enter email 396:4056, Enter code 396:4169, Code wrong or expired 396:4309.
///
/// Step 1 asks for the email; the API answers the same way whether or not the email has an account,
/// so this screen never says whether one exists. Step 2 takes the 8-character code from the email and
/// the new password. On success it pops `true`, and Log in shows "Password changed" (396:4384).
/// Argument: the email typed on Log in (String), if any.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  final String initialEmail;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  late final _email = TextEditingController(text: widget.initialEmail);
  final _code = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  bool _codeStep = false;
  bool _submitted = false;
  bool _busy = false;
  bool _resending = false;
  String? _emailError;
  String? _serverCodeError;
  String? _serverNewError;
  String? _bannerTitle;
  String? _bannerMessage;
  RwToastType _bannerType = RwToastType.error;

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String? get _codeError =>
      _serverCodeError ?? (_submitted && _code.text.trim().isEmpty ? 'Enter the code from the email.' : null);

  /// While typing, the strength meter explains the rule; the error appears on Change password (#44).
  String? get _newError {
    if (_serverNewError != null) return _serverNewError;
    if (!_submitted) return null;
    if (_next.text.isEmpty) return 'Enter a new password.';
    return checkPassword(_next.text, email: _email.text.trim()).isStrong ? null : notStrongMessage;
  }

  String? get _confirmError {
    if (_confirm.text.isEmpty) return _submitted ? 'Type the new password again.' : null;
    return _confirm.text != _next.text ? "Passwords don't match." : null;
  }

  void _banner(String title, String? message, {RwToastType type = RwToastType.error}) => setState(() {
    _bannerTitle = title;
    _bannerMessage = message;
    _bannerType = type;
  });

  Future<void> _sendCode() async {
    if (_busy) return;
    final email = _email.text.trim();
    setState(() {
      _emailError = email.isEmpty
          ? 'Enter your email.'
          : (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)
                ? 'Enter a valid email, like name@example.com.'
                : null);
      _bannerTitle = null;
    });
    if (_emailError != null) return;
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);
    try {
      await context.read<RoadWatchApi>().forgotPassword(email: email);
      if (mounted) setState(() => _codeStep = true);
    } on ApiException catch (e) {
      if (!mounted) return;
      final field = e.fieldError('contact_email');
      if (field != null) {
        setState(() => _emailError = field);
      } else {
        _banner("Couldn't send the code", e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    if (_resending) return;
    setState(() {
      _resending = true;
      _bannerTitle = null;
    });
    try {
      await context.read<RoadWatchApi>().forgotPassword(email: _email.text.trim());
      if (!mounted) return;
      // Figma M0/Forgot password/New code sent (419:4438): the code field is empty for the new code.
      setState(() {
        _serverCodeError = null;
        _code.clear();
      });
      _banner('New code sent', 'Use the newest code. It works for 15 minutes.', type: RwToastType.success);
    } on ApiException catch (e) {
      if (mounted) _banner("Couldn't send the code", e.message);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _changePassword() async {
    if (_busy) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _submitted = true;
      _serverCodeError = _serverNewError = null;
      _bannerTitle = null;
    });
    if (_codeError != null || _newError != null || _confirmError != null) return;
    setState(() => _busy = true);
    try {
      await context.read<RoadWatchApi>().resetPassword(
        email: _email.text,
        code: _code.text,
        newPassword: _next.text,
      );
      TextInput.finishAutofillContext();
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      final code = e.fieldError('reset_code');
      final pw = e.fieldError('new_password');
      if (code != null || pw != null) {
        setState(() {
          _serverCodeError = code;
          _serverNewError = pw;
        });
      } else {
        _banner("Couldn't change the password", e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    final email = _email.text.trim();
    return Scaffold(
      backgroundColor: c.surfaceLightGray,
      appBar: const RwTopBar.inner(title: 'Forgot password'),
      body: AutofillGroup(
        child: ListView(
          padding: const EdgeInsets.all(RwSpace.s16),
          children: [
            if (_bannerTitle != null) ...[
              RwToast(
                type: _bannerType,
                title: _bannerTitle!,
                message: _bannerMessage,
                onClose: () => setState(() => _bannerTitle = null),
              ),
              const SizedBox(height: RwSpace.s16),
            ],
            if (!_codeStep) ...[
              Text(
                "Enter the email you registered with. We'll email you an 8-character code. "
                'It works for 15 minutes.',
                style: RwType.body.copyWith(color: c.textPrimary),
              ),
              const SizedBox(height: RwSpace.s16),
              RwTextField(
                label: 'Email',
                required: true,
                controller: _email,
                leadingIcon: RwIcons.user,
                hintText: 'you@example.com',
                errorText: _emailError,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.email, AutofillHints.username],
                onChanged: (_) => setState(() => _emailError = null),
                onSubmitted: (_) => _sendCode(),
              ),
              const SizedBox(height: RwSpace.s16),
              const _Note(
                icon: RwIcons.info,
                text: 'For your privacy, RoadWatch shows the same message whether or not this email has an account.',
              ),
            ] else ...[
              _Note(
                icon: RwIcons.mail,
                text:
                    'If $email has a RoadWatch account, we sent it a code. Check your inbox and spam folder.',
              ),
              const SizedBox(height: RwSpace.s16),
              RwTextField(
                label: 'Code',
                required: true,
                controller: _code,
                leadingIcon: RwIcons.shieldCheck,
                hintText: '8 letters and digits',
                helperText: '8 letters and digits, from the email.',
                errorText: _codeError,
                maxLength: 20,
                textCapitalization: TextCapitalization.characters,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.oneTimeCode],
                onChanged: (_) => setState(() => _serverCodeError = null),
              ),
              const SizedBox(height: RwSpace.s16),
              RwPasswordField(
                label: 'New password',
                required: true,
                controller: _next,
                errorText: _newError,
                showStrength: true,
                strengthEmail: _email.text.trim(),
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
                onSubmitted: (_) => _changePassword(),
              ),
              Align(
                alignment: Alignment.centerLeft,
                child: RwTextLink(
                  label: _resending ? 'Sending a new code…' : "Didn't get the code? Send a new one",
                  onTap: _resending ? null : _resend,
                ),
              ),
            ],
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
            child: _codeStep
                ? RwButton(label: 'Change password', loading: _busy, onPressed: _changePassword)
                : RwButton(label: 'Send code', loading: _busy, onPressed: _sendCode),
          ),
        ),
      ),
    );
  }
}

/// Figma "Note": blue-subtle box with an icon (info or mail).
class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.text});

  final String icon;
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
          RwIcon(icon, size: RwSize.iconMd, color: c.textBlue),
          const SizedBox(width: RwSpace.s8),
          Expanded(
            child: Text(text, style: RwType.bodySm.copyWith(color: c.textPrimary)),
          ),
        ],
      ),
    );
  }
}
