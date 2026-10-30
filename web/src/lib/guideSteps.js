// Accessibility guide (#56, DECISIONS #49; Figma W2 543:26679): a step-by-step tour of the current staff page, all in
// text (nothing depends on sound), with optional Read aloud. Each step points at an element with data-guide="<key>";
// a step whose element is hidden at this width (the sidebar on phones) is shown in the middle of the screen.

const NAV = {
  target: 'sidebar',
  title: 'Navigation',
  text: 'Use these links to move between the pages of your console. The page you are on is highlighted. On a phone, open them with the menu button.',
};
const TOP_BAR = {
  target: 'top-bar',
  title: 'Top bar',
  text: 'Guide starts a tour of the page you are on (on a phone, it is in the menu under your name). The switch changes between Light and Dark. Your name opens Edit profile, Change password, Action log, Contact support and About. Log out is on the right.',
};

const ADMIN_PAGES = {
  '/admin': [
    NAV,
    {
      target: 'stats',
      title: 'Summary cards',
      text: 'These four cards count every report: all of them, those still waiting for a review, the verified records, and the closed cases. Select a card to open Reports already filtered to it.',
    },
    {
      target: 'trend',
      title: 'Reports over time',
      text: 'This chart shows how many reports came in each day. View as table gives the same numbers as text.',
    },
    {
      target: 'types',
      title: 'By accident type',
      text: 'Each bar is one accident type with its number of reports, so you can see which kinds of accidents happen most.',
    },
    {
      target: 'hotspots',
      title: 'Accident hotspots',
      text: 'Circles on the map show where reports cluster; a bigger circle means more reports. The list beside the map gives the same places as text.',
    },
    {
      target: 'recent',
      title: 'Recent reports',
      text: 'The newest reports with their status and record type. Select a row to open the report and review it.',
    },
  ],
  '/admin/reports': [
    {
      target: 'filters',
      title: 'Search and filters',
      text: 'Search by Report ID, place or words in the description, then narrow the list by status, priority, accident type, record type, place or dates.',
    },
    {
      target: 'results',
      title: 'Reports list',
      text: 'Reports are sorted by priority, Urgent first, then newest. Each row shows the priority, status and record type in words. A line under the status tells you when no nearby officer responded, so the report waits for you.',
    },
    {
      target: 'export',
      title: 'Export',
      text: 'Export CSV or Export PDF downloads the reports that match your filters.',
    },
  ],
  '/admin/users': [
    {
      target: 'users-tabs',
      title: 'Three sections',
      text: 'Accounts, Accident types and Nearby officers. Accounts opens first; choose a tab (or use the arrow keys) to switch. Nearby officers sets how far new reports alert on-duty officers.',
    },
    {
      target: 'accounts-toolbar',
      title: 'Create officer and Edit',
      text: 'Create officer adds a Traffic Officer account. Select an account in the table, then Edit changes its name, phone and role, resets its password, or deactivates it.',
    },
    {
      target: 'accounts-table',
      title: 'Accounts',
      text: 'Every account with its role and whether it is active. Use the round button at the start of a row to select it.',
    },
  ],
};

const REPORT_ADMIN = [
  {
    target: 'report-header',
    title: 'The report',
    text: 'The Report ID, accident type, status, priority and record type. Public submission means not verified yet; Verified record means an official record.',
  },
  {
    target: 'priority',
    title: 'Priority',
    text: 'Set automatically from the accident type and injuries. Change it if the scene needs a faster or slower response; every change is in the action log.',
  },
  {
    target: 'status',
    title: 'Update status',
    text: 'Verify the report to make it an official record, ask for more information, or reject it with a reason the reporter can read.',
  },
  {
    target: 'assign',
    title: 'Assign officer',
    text: 'Once the report is Verified, choose an active Traffic Officer. The officer is notified at once.',
  },
  {
    target: 'history',
    title: 'Status history',
    text: 'Every status change with who made it and when, newest first.',
  },
];

const OFFICER_PAGES = {
  '/officer': [
    {
      target: 'duty',
      title: 'On duty',
      text: 'Switch On duty to get nearby reports. Your location is shared only while it is on. When an accident is reported near you, Respond takes it; the first officer to respond gets it.',
    },
    {
      target: 'queue-summary',
      title: 'Your queue',
      text: 'How many of your reports need a first visit, are in progress, or wait for the reporter.',
    },
    {
      target: 'queue-filters',
      title: 'Search and sort',
      text: 'Find a report by ID or place, filter by status, and sort by priority (Urgent first) or oldest first.',
    },
    {
      target: 'queue',
      title: 'Assigned to you',
      text: 'Only reports assigned to you are listed, with their priority and status in words. Select a row to open the report.',
    },
  ],
};

const REPORT_OFFICER = [
  {
    target: 'report-header',
    title: 'The report',
    text: 'The Report ID, accident type, status, priority and record type of a report assigned to you.',
  },
  {
    target: 'officer-actions',
    title: 'Your actions',
    text: 'If you responded to a nearby alert, confirm the accident on scene or reject the report with a reason. Otherwise set In Progress, Additional Information Required or Resolved/Closed and add official remarks.',
  },
  {
    target: 'history',
    title: 'Status history',
    text: 'Every status change with who made it and when, newest first.',
  },
];

export function guideStepsFor(pathname, role) {
  const isOfficer = role === 'Traffic Officer';
  let steps;
  if (/^\/admin\/reports\/\d+/.test(pathname)) steps = REPORT_ADMIN;
  else if (/^\/officer\/reports\/\d+/.test(pathname)) steps = REPORT_OFFICER;
  else steps = (isOfficer ? OFFICER_PAGES : ADMIN_PAGES)[pathname] || [NAV, TOP_BAR];
  return steps;
}
