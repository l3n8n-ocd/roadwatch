import { Button } from '../../components/ui';
import { SUPPORT_MAILTO } from '../../lib/constants';
import ErrorPage from './ErrorPage';
import { LostPinIllustration } from './ErrorIllustrations';

// W11 404 Page not found (Figma 347:15949, 390: 347:15995; #40). Every unknown path lands here.
export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      illustration={<LostPinIllustration />}
      title="Page not found"
      actions={
        <>
          <Button to="/" icon="home" className="max-sm:h-12">
            Go back home
          </Button>
          <Button href={SUPPORT_MAILTO} variant="secondary" icon="mail" className="max-sm:h-12">
            Contact support
          </Button>
        </>
      }
    >
      The page you are looking for does not exist or may have moved. Check the address, or head back to the home page.
    </ErrorPage>
  );
}
