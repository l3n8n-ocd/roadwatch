// Values fixed by the approved schema (database/schema.sql, docs/DECISIONS.md #19).
// Mirrors web/src/lib/constants.js; keep both in sync.

abstract final class Roles {
  static const reporter = 'Reporter';
  static const admin = 'Administrator';
  static const officer = 'Traffic Officer';
}

/// The 8 report statuses, in workflow order (#30).
abstract final class Statuses {
  static const submitted = 'Submitted';
  static const underReview = 'Under Review';
  static const additionalInfo = 'Additional Information Required';
  static const verified = 'Verified';
  static const assigned = 'Assigned';
  static const inProgress = 'In Progress';
  static const resolved = 'Resolved/Closed';
  static const rejected = 'Rejected';

  static const all = [
    submitted,
    underReview,
    additionalInfo,
    verified,
    assigned,
    inProgress,
    resolved,
    rejected,
  ];
}

class InjuryOption {
  const InjuryOption(this.value, this.label);
  final String value;
  final String label;
}

const injuryOptions = [
  InjuryOption('none', 'None'),
  InjuryOption('injuries', 'Injuries'),
  InjuryOption('fatalities', 'Fatalities'),
  InjuryOption('unknown', 'Unknown'),
];

String injuryLabel(String? value) => injuryOptions
    .firstWhere((o) => o.value == value, orElse: () => const InjuryOption('unknown', 'Unknown'))
    .label;

abstract final class RecordTypes {
  static const publicSubmission = 'public_submission';
  static const verifiedRecord = 'verified_record';

  static String label(String? value) => value == verifiedRecord ? 'Verified record' : 'Public submission';
}

/// Photo rules enforced by the API (POST /reports/:id/photos).
abstract final class PhotoRules {
  static const maxBytes = 5 * 1024 * 1024;
  static const maxPerUpload = 5;
  static const maxPerReport = 10;
  static const extensions = ['jpg', 'jpeg', 'png', 'webp'];
}

class Hotline {
  const Hotline(this.number, this.tel, {this.label});
  final String number;
  final String tel;
  final String? label;
}

/// Official hotlines (docs/ui-design/hotlines.md, #31). Each number gets an accessible name
/// such as "Call PNP, 117".
abstract final class Hotlines {
  static const emergency = Hotline('911', 'tel:911', label: 'Emergency');
  static const pnp = [
    Hotline('117', 'tel:117'),
    Hotline('(02) 8722-0650', 'tel:+63287220650'),
    Hotline('(02) 8723-0401 to 0420', 'tel:+63287230401'),
  ];
  static const bfp = [
    Hotline('(02) 8426-0219', 'tel:+63284260219'),
    Hotline('(02) 8426-0246', 'tel:+63284260246'),
  ];
}

/// Bundled images (mobile/assets/images).
abstract final class RwImages {
  static const emblem = 'assets/images/emblem.png';
  static const heroStreet = 'assets/images/hero-street.jpg';
  static const pnpSeal = 'assets/images/pnp-seal.png';
  static const bfpSeal = 'assets/images/bfp-seal.png';
}
