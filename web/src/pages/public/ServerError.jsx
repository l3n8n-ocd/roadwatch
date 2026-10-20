import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/constants';
import ErrorPage from './ErrorPage';
import { SleepingServerIllustration } from './ErrorIllustrations';

// W12 500 Something went wrong (Figma 347:16031, 390: 347:16084; #40). Shown by ErrorBoundary when
// a page crashes or its main request gets a 5xx (useServerError), and at /500.
export default function ServerError() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // On /500 itself a reload would show this page again, so go back to where the visitor came from.
  const reload = () => {
    if (pathname !== '/500') window.location.reload();
    else if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <ErrorPage
      code="500"
      illustration={<SleepingServerIllustration />}
      title="Something went wrong on our end"
      actions={
        <>
          <Button icon="refresh" onClick={reload} className="max-sm:h-12">
            Reload page
          </Button>
          <Button to="/" variant="secondary" icon="home" className="max-sm:h-12">
            Go back home
          </Button>
        </>
      }
      help={
        <p className="flex min-h-11 flex-wrap items-center justify-center gap-x-2 type-body-sm text-text-muted">
          Still not working? Email
          <a href={SUPPORT_MAILTO} className="rounded-rw-sm type-label text-text-blue underline underline-offset-2">
            {SUPPORT_EMAIL}
          </a>
        </p>
      }
    >
      The error was logged. Please try again in a moment.
    </ErrorPage>
  );
}
