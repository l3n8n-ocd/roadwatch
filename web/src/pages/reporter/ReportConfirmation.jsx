import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Button, Icon, RecordBadge, StatusChip, Toast } from '../../components/ui';
import { reports } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { reportCode } from '../../lib/format';

// R4 Report confirmation (Figma 232:6397). The wizard passes the new report and the number of
// photos that failed to upload in the navigation state; after a refresh the report is fetched.
// The photo warning follows the mobile frame M5/Confirmation/Photo upload failed (115:1364).

const NEXT_STEPS = [
  'An administrator reviews and verifies your report (Under Review, then Verified).',
  'A traffic officer is assigned and follows it up on site.',
  'You get a notification and an email at every status change.',
];

export default function ReportConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [report, setReport] = useState(state?.report || null);
  const [showPhotoWarning, setShowPhotoWarning] = useState(Boolean(state?.photoFailed));
  const headingRef = useRef(null);
  const photoFailed = state?.photoFailed || 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (report) return undefined;
    let cancelled = false;
    reports
      .get(id)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        // The ID from the URL is still shown; the status chips are left out.
      });
    return () => {
      cancelled = true;
    };
  }, [id, report]);

  const firstName = (user?.full_name || '').trim().split(/\s+/)[0];

  return (
    <div className="mx-auto flex w-full max-w-172 flex-col px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      {/* Focus moves to the heading on arrival (instead of a role="status" live region, so the
          whole card is not read twice). */}
      <section
        aria-labelledby="confirmation-title"
        className="flex flex-col items-center gap-5 rounded-rw-md border border-border-subtle bg-surface-white p-4 text-center sm:p-8"
      >
        <span aria-hidden="true" className="flex size-18 items-center justify-center rounded-full bg-surface-success-subtle text-text-success">
          <Icon name="check-circle" size={40} />
        </span>
        <h1 id="confirmation-title" ref={headingRef} tabIndex={-1} className="type-h1 text-text-primary focus-visible:shadow-none">
          Report sent
        </h1>
        <p className="type-body text-text-muted">
          Thank you{firstName ? `, ${firstName}` : ''}. We also emailed you a copy. An administrator will review it soon.
        </p>

        {showPhotoWarning && (
          <Toast
            type="warning"
            title={photoFailed === 1 ? "1 photo didn't upload" : `${photoFailed} photos didn't upload`}
            onClose={() => setShowPhotoWarning(false)}
            className="max-w-none text-left shadow-rw-md"
          >
            Your report is saved. Add the {photoFailed === 1 ? 'photo' : 'photos'} again from the tracking screen.
          </Toast>
        )}

        <div className="flex w-full flex-col items-center gap-1 rounded-[12px] bg-surface-light-gray px-6 py-4">
          <p className="type-caption text-text-muted">Your Report ID</p>
          <p className="type-h2 text-text-primary">{reportCode(id)}</p>
          {report && (
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <StatusChip status={report.report_status} />
              <RecordBadge type={report.record_type} />
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 text-left">
          <h2 id="next-title" className="type-label text-text-primary">
            What happens next
          </h2>
          <ol aria-labelledby="next-title" className="flex flex-col gap-3">
            {NEXT_STEPS.map((text, i) => (
              <li key={text} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-navy-subtle type-label text-text-primary"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 type-body text-text-primary">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button to={`/my-reports/${id}`} icon="search" className="sm:flex-1">
            Track this report
          </Button>
          <Button to="/report/details" variant="secondary" className="sm:flex-1">
            Report another accident
          </Button>
        </div>
      </section>
    </div>
  );
}
