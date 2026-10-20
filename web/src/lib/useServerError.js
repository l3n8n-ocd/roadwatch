import { useCallback, useState } from 'react';

// #40: when a page's main request fails with a 5xx, the page shows the 500 screen (W12).
// Call the returned function from the request's catch: it returns true for a 5xx and re-throws it
// during the next render, so the nearest ErrorBoundary takes over. Other errors stay with the page.
export default function useServerError() {
  const [error, setError] = useState(null);
  const raise = useCallback((err) => {
    if (err?.status >= 500) {
      setError(err);
      return true;
    }
    return false;
  }, []);
  if (error) throw error;
  return raise;
}
