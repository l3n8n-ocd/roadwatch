import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_exception.dart';
import '../../core/state/auth_provider.dart';
import '../../core/theme/tokens.dart';
import '../../core/widgets/widgets.dart';

/// Edit profile. Figma (Mobile page 90:4): Settings/Edit profile 162:2322.
///
/// Saves name and mobile number with AuthProvider.updateProfile (PATCH /auth/me, #25); any API error
/// shows in the error banner.
/// The email is the login and is read-only here.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _email;
  String? _nameError;
  String? _phoneError;
  String? _bannerTitle;
  String? _bannerMessage;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _name = TextEditingController(text: user?.fullName ?? '');
    _phone = TextEditingController(text: user?.contactPhone ?? '');
    _email = TextEditingController(text: user?.contactEmail ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  bool _validate() {
    final name = _name.text.trim();
    final phone = _phone.text.trim();
    setState(() {
      _nameError = name.isEmpty
          ? 'Enter your full name.'
          : (name.length > 100 ? 'Use 100 characters or fewer.' : null);
      _phoneError = phone.length > 20 ? 'Use 20 characters or fewer.' : null;
    });
    return _nameError == null && _phoneError == null;
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    setState(() => _bannerTitle = _bannerMessage = null);
    if (!_validate()) return;
    setState(() => _saving = true);
    try {
      await context.read<AuthProvider>().updateProfile(fullName: _name.text, phone: _phone.text);
      if (!mounted) return;
      showRwToast(context, type: RwToastType.success, title: 'Profile saved');
      Navigator.of(context).maybePop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _nameError = e.fieldError('full_name');
        _phoneError = e.fieldError('contact_phone');
        _bannerTitle = "Couldn't save your changes";
        _bannerMessage = e.kind == ApiErrorKind.notFound
            ? 'Editing your profile is not available on the RoadWatch server yet. '
                  'Your details were not changed. Try again after the next update.'
            : e.message;
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
      appBar: const RwTopBar.inner(title: 'Edit profile'),
      body: ListView(
        padding: const EdgeInsets.all(RwSpace.s16),
        children: [
          if (_bannerTitle != null) ...[
            RwToast(type: RwToastType.error, title: _bannerTitle!, message: _bannerMessage),
            const SizedBox(height: RwSpace.s16),
          ],
          RwTextField(
            label: 'Full name',
            required: true,
            controller: _name,
            leadingIcon: RwIcons.user,
            errorText: _nameError,
            maxLength: 100,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.name],
          ),
          const SizedBox(height: RwSpace.s16),
          RwTextField(
            label: 'Email',
            controller: _email,
            enabled: false,
            helperText: "Your login email can't be changed here. Ask the administrator.",
          ),
          const SizedBox(height: RwSpace.s16),
          RwTextField(
            label: 'Mobile number (optional)',
            controller: _phone,
            keyboardType: TextInputType.phone,
            errorText: _phoneError,
            maxLength: 20,
            helperText: 'Only admins and your assigned officer can see it.',
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.telephoneNumber],
            onSubmitted: (_) => _save(),
          ),
        ],
      ),
      bottomNavigationBar: _ActionBar(
        child: RwButton(label: 'Save changes', loading: _saving, onPressed: _save),
      ),
    );
  }
}

/// Figma "Action bar (sticky)": white bar with a top border above the system navigation.
class _ActionBar extends StatelessWidget {
  const _ActionBar({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = RwColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surfaceWhite,
        border: Border(top: BorderSide(color: c.borderSubtle)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(padding: const EdgeInsets.all(RwSpace.s16), child: child),
      ),
    );
  }
}
