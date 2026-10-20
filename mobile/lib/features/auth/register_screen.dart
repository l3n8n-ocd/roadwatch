import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/state/auth_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';
import '../../routes.dart';

/// Create an account. Figma (Mobile page 90:4): M0/Register/Default 109:239, Validation 109:323.
///
/// Fields map to POST /auth/register: full_name (2+), contact_email (unique), contact_phone
/// (optional), password (8+). The API always creates a Reporter. On success AuthProvider signs
/// in and the app switches to /home.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();

  String? _nameError;
  String? _emailError;
  String? _phoneError;
  String? _passwordError;
  AuthFailure? _failure;
  bool _obscure = true;
  bool _busy = false;
  bool _tried = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  bool _validate() {
    final name = _name.text.trim();
    final email = _email.text.trim();
    final phone = _phone.text.trim();
    final pw = _password.text;
    setState(() {
      _nameError = name.isEmpty
          ? 'Enter your full name.'
          : (name.length < 2 ? 'Use at least 2 characters.' : null);
      _emailError = email.isEmpty
          ? 'Enter your email.'
          : (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)
                ? 'Enter a valid email, like name@example.com.'
                : null);
      _phoneError = phone.length > 20 ? 'Use at most 20 characters.' : null;
      _passwordError = pw.isEmpty
          ? 'Enter a password.'
          : (pw.length < 8 ? 'Use at least 8 characters (${pw.length} so far).' : null);
    });
    return _nameError == null && _emailError == null && _phoneError == null && _passwordError == null;
  }

  Future<void> _submit() async {
    if (_busy) return;
    _tried = true;
    if (!_validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _busy = true;
      _failure = null;
    });
    try {
      await context.read<AuthProvider>().register(
        fullName: _name.text,
        email: _email.text,
        password: _password.text,
        phone: _phone.text,
      );
      TextInput.finishAutofillContext();
    } on AuthFailure catch (f) {
      if (!mounted) return;
      setState(() {
        if (f.kind == AuthFailureKind.emailTaken) {
          // Figma 109:323 shows this inline under Email, no banner.
          _emailError = 'An account with this email already exists. Log in instead.';
        } else {
          _nameError = f.fieldError('full_name') ?? _nameError;
          _emailError = f.fieldError('contact_email') ?? _emailError;
          _phoneError = f.fieldError('contact_phone') ?? _phoneError;
          _passwordError = f.fieldError('password') ?? _passwordError;
          _failure = f;
        }
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toLogin() {
    final nav = Navigator.of(context);
    if (nav.canPop()) {
      nav.pop();
    } else {
      nav.pushReplacementNamed(Routes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    void revalidate(String _) => _tried ? _validate() : null;
    return Scaffold(
      backgroundColor: c.surfaceWhite,
      appBar: const RwTopBar.inner(title: 'Create account'),
      body: AutofillGroup(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: RwSpace.s16, vertical: RwSpace.s24),
          children: [
            Text(
              // Sign-up is Reporter-only (#40): no role choice, by design (security rule).
              "You'll be registered as a Reporter. Traffic Officer accounts are created by the "
              'RoadWatch administrator.',
              style: RwType.body.copyWith(color: c.textMuted),
            ),
            if (_failure != null) ...[
              const SizedBox(height: RwSpace.s16),
              RwToast(
                type: RwToastType.error,
                title: _failure!.title,
                message: _failure!.message,
                onClose: () => setState(() => _failure = null),
              ),
            ],
            const SizedBox(height: RwSpace.s16),
            RwTextField(
              label: 'Full name',
              required: true,
              controller: _name,
              leadingIcon: RwIcons.user,
              hintText: 'Juan Dela Cruz',
              errorText: _nameError,
              maxLength: 100,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.name],
              onChanged: revalidate,
            ),
            const SizedBox(height: RwSpace.s16),
            RwTextField(
              label: 'Email',
              required: true,
              controller: _email,
              hintText: 'you@example.com',
              errorText: _emailError,
              maxLength: 120,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.email],
              onChanged: revalidate,
            ),
            const SizedBox(height: RwSpace.s16),
            _OptionalTag(
              child: RwTextField(
                label: 'Mobile number',
                controller: _phone,
                hintText: '09XX XXX XXXX',
                helperText: 'Only shown to admins and your assigned officer.',
                errorText: _phoneError,
                maxLength: 20,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.telephoneNumber],
                onChanged: revalidate,
              ),
            ),
            const SizedBox(height: RwSpace.s16),
            RwTextField(
              label: 'Password',
              required: true,
              controller: _password,
              leadingIcon: RwIcons.lock,
              helperText: 'At least 8 characters.',
              errorText: _passwordError,
              obscureText: _obscure,
              maxLength: 128,
              textInputAction: TextInputAction.done,
              autofillHints: const [AutofillHints.newPassword],
              onChanged: revalidate,
              onSubmitted: (_) => _submit(),
              trailing: RwIconButton(
                icon: RwIcons.eye,
                semanticLabel: _obscure ? 'Show password' : 'Hide password',
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
            const SizedBox(height: RwSpace.s16),
            RwButton(label: 'Create account', loading: _busy, onPressed: _submit),
            const SizedBox(height: RwSpace.s8),
            Align(
              alignment: Alignment.centerLeft,
              child: _TextLink(label: 'Already registered? Log in', onTap: _busy ? null : _toLogin),
            ),
          ],
        ),
      ),
    );
  }
}

/// Puts the Figma "Optional" caption at the end of a field's label row (RwTextField only draws
/// "Required"). Screen readers get the optional state from the field's missing "required".
class _OptionalTag extends StatelessWidget {
  const _OptionalTag({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return Stack(
      children: [
        child,
        PositionedDirectional(
          top: 2,
          end: 0,
          child: ExcludeSemantics(
            child: Text('Optional', style: RwType.caption.copyWith(color: c.textMuted)),
          ),
        ),
      ],
    );
  }
}

/// Underlined text/blue link with a 48 px touch target.
class _TextLink extends StatelessWidget {
  const _TextLink({required this.label, required this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return RwPressable(
      onTap: onTap,
      borderRadius: RwRadius.smAll,
      isButton: false,
      builder: (context, s) => Container(
        constraints: const BoxConstraints(minHeight: RwSize.touch),
        alignment: Alignment.centerLeft,
        child: Semantics(
          link: true,
          child: Text(
            label,
            style: RwType.label.copyWith(
              color: c.textBlue,
              decoration: TextDecoration.underline,
              decorationColor: c.textBlue,
            ),
          ),
        ),
      ),
    );
  }
}
