// Nearby on-duty officers (#57): one short line about a report's nearby-officer path for staff screens
// (W3 status cell, W4 and W5). Returns null when there is nothing to say.
//   no_response: nobody answered in 10 minutes, so the report waits for the administrator.
const OPEN = ['Submitted', 'Under Review'];

export function dispatchTag(report) {
  const d = report?.dispatch;
  if (!d) return null;
  const who = d.responder?.full_name;
  switch (d.state) {
    case 'no_response':
      if (!OPEN.includes(report.report_status) || report.assigned_officer_id) return null;
      return { text: `No nearby officer responded · ${d.minutes_since_alert} min`, tone: 'text-text-blue' };
    case 'alerting':
      return { text: `Nearby officers alerted · ${d.alerted_count}`, tone: 'text-text-muted' };
    case 'responding':
      return { text: `Responding · ${who}`, tone: 'text-text-muted' };
    case 'confirmed':
      return { text: `Responded on scene · ${who}`, tone: 'text-text-muted' };
    case 'rejected_on_scene':
      return { text: `Rejected on scene · ${who}`, tone: 'text-text-danger' };
    default:
      return null;
  }
}
