import { ROLES } from '../../lib/constants';

// The two staff sign-in forms (#52): copy for the form card and the brand panel, keyed by the
// /staff/sign-in/:role segment. Forgot password uses the same brand panel copy.
export const FORMS = {
  admin: {
    role: ROLES.ADMIN,
    heading: 'Administrator sign-in',
    intro: 'Use the email registered for your administrator account.',
    title: 'Review, verify and assign accident reports everywhere.',
    mobileTitle: 'Review, verify and assign accident reports.',
    subtitle: 'Administrator console',
  },
  officer: {
    role: ROLES.OFFICER,
    heading: 'Traffic Officer sign-in',
    intro: 'Use the email your administrator registered for you.',
    title: 'See the reports assigned to you and record what you find on site.',
    mobileTitle: 'See your assigned reports and record what you find.',
    subtitle: 'Traffic Officer console',
  },
};
