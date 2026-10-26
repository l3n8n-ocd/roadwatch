import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/constants.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Log in. Figma (Mobile page 90:4): M0/Login/Default 109:5, Error 109:79, Deactivated account 109:164,
/// Password changed 396:4384 (after Forgot password, #37).
///
/// Navy hero with the street photo at 15 % opacity, then the form. Failed logins and the
/// one-time AuthProvider.notice (deactivated, session ended, staff account) show in an inline
/// error banner above the fields. On success AuthProvider switches the app to /home.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _passwordFocus = FocusNode();

  AuthFailure? _failure;
  String? _emailError;
  String? _passwordError;
  bool _busy = false;
  bool _tried = false;
  bool _passwordChanged = false;

  @override
  void initState() {
    super.initState();
    // Show the "Account deactivated" / "Signed out" notice once, then clear it.
    final auth = context.read<AuthProvider?>();
    _failure = auth?.notice;
    if (_failure != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => auth?.clearNotice());
    }
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  bool _validate() {
    final email = _email.text.trim();
    setState(() {
      _emailError = email.isEmpty
          ? 'Enter your email.'
          : (!_looksLikeEmail(email) ? 'Enter a valid email, like name@example.com.' : null);
      _passwordError = _password.text.isEmpty ? 'Enter your password.' : null;
    });
    return _emailError == null && _passwordError == null;
  }

  Future<void> _submit() async {
    if (_busy) return;
    _tried = true;
    if (!_validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _failure = null;
      _passwordChanged = false;
    });
    try {
      await context.read<AuthProvider>().login(email: _email.text, password: _password.text);
      TextInput.finishAutofillContext();
      // The app root replaces this route with /home.
    } on AuthFailure catch (f) {
      if (mounted) setState(() => _failure = f);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _forgotPassword() async {
    final changed = await Navigator.of(context)
        .pushNamed(Routes.forgotPassword, arguments: _email.text.trim());
    if (changed == true && mounted) {
      setState(() {
        _passwordChanged = true;
        _failure = null;
        _password.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent),
      child: Scaffold(
        backgroundColor: c.surfaceWhite,
        body: AutofillGroup(
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              const _Hero(),
              Padding(
                padding: const EdgeInsets.fromLTRB(RwSpace.s16, 20, RwSpace.s16, RwSpace.s16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Semantics(
                      header: true,
                      child: Text('Log in', style: RwType.h2.copyWith(color: c.textPrimary)),
                    ),
                    if (_passwordChanged) ...[
                      const SizedBox(height: RwSpace.s12),
                      RwToast(
                        type: RwToastType.success,
                        title: 'Password changed',
                        message: 'Log in with your new password.',
                        onClose: () => setState(() => _passwordChanged = false),
                      ),
                    ],
                    if (_failure != null) ...[
                      const SizedBox(height: RwSpace.s12),
                      RwToast(
                        type: RwToastType.error,
                        title: _failure!.title,
                        message: _failure!.message,
                        onClose: () => setState(() => _failure = null),
                      ),
                    ],
                    const SizedBox(height: RwSpace.s12),
                    RwTextField(
                      label: 'Email',
                      required: true,
                      controller: _email,
                      leadingIcon: RwIcons.user,
                      hintText: 'you@example.com',
                      errorText: _emailError,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email, AutofillHints.username],
                      onChanged: (_) => _tried ? _validate() : null,
                      onSubmitted: (_) => _passwordFocus.requestFocus(),
                    ),
                    const SizedBox(height: RwSpace.s12),
                    RwPasswordField(
                      label: 'Password',
                      required: true,
                      controller: _password,
                      focusNode: _passwordFocus,
                      hintText: 'At least 8 characters',
                      errorText: _passwordError,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      onChanged: (_) => _tried ? _validate() : null,
                      onSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: RwSpace.s12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: RwTextLink(
                        label: 'Forgot password?',
                        alignment: Alignment.topRight,
                        onTap: _busy ? null : _forgotPassword,
                      ),
                    ),
                    RwButton(label: 'Log in', loading: _busy, onPressed: _submit),
                    const SizedBox(height: RwSpace.s12),
                    RwButton.secondary(
                      label: 'Create an account',
                      onPressed: _busy ? null : () => Navigator.of(context).pushNamed(Routes.register),
                    ),
                    const SizedBox(height: RwSpace.s12),
                    const _EmergencyNote(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

bool _looksLikeEmail(String v) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v);

/// Navy band with the decorative street photo (15 %), logo and the tagline (Heading/H1).
class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      color: c.brandNavy,
      child: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.15,
              child: Image.asset(RwImages.heroStreet, fit: BoxFit.cover, excludeFromSemantics: true),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(RwSpace.s24, RwSpace.s16, RwSpace.s24, RwSpace.s24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const RwLogo(),
                  const SizedBox(height: RwSpace.s16),
                  Text(
                    'Report road accidents. Follow every update.',
                    style: RwType.h1.copyWith(color: c.textInverse),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// "Injuries or danger? Call 911 first, then report." on amber-subtle (navy text).
class _EmergencyNote extends StatelessWidget {
  const _EmergencyNote();

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Container(
      padding: const EdgeInsets.all(RwSpace.s12),
      decoration: BoxDecoration(color: c.surfaceAmberSubtle, borderRadius: RwRadius.mdAll),
      child: Row(
        children: [
          RwIcon(RwIcons.alertTriangle, size: RwSize.iconMd, color: c.textPrimary),
          const SizedBox(width: RwSpace.s8),
          Expanded(
            child: Text(
              'Injuries or danger? Call 911 first, then report.',
              style: RwType.label.copyWith(color: c.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}
