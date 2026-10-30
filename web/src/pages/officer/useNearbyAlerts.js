import { useCallback, useEffect, useRef, useState } from 'react';
import { officer } from '../../api/endpoints';

// Nearby on-duty officers (#57). While On duty, the officer's location is sent with every check (latest point
// only) and open alerts are fetched every 30 seconds. Going off duty clears the location on the server.
const CHECK_MS = 30000;

function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser cannot share your location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Allow location for this site to go on duty. Nearby alerts need to know where you are.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export default function useNearbyAlerts() {
  const [onDuty, setOnDuty] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef(null);

  const check = useCallback(async () => {
    try {
      const pos = await currentPosition();
      await officer.setDuty({ on_duty: true, ...pos });
    } catch {
      // Keep the last known location; alerts still load below.
    }
    try {
      setAlerts((await officer.nearby()) || []);
    } catch {
      // A failed check is retried on the next tick.
    }
  }, []);

  useEffect(() => {
    officer
      .duty()
      .then((d) => setOnDuty(Boolean(d?.on_duty)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!onDuty) {
      setAlerts([]);
      return undefined;
    }
    check();
    timer.current = setInterval(check, CHECK_MS);
    return () => clearInterval(timer.current);
  }, [onDuty, check]);

  const toggle = async (next) => {
    setBusy(true);
    setError('');
    try {
      if (next) {
        const pos = await currentPosition();
        await officer.setDuty({ on_duty: true, ...pos });
      } else {
        await officer.setDuty({ on_duty: false });
      }
      setOnDuty(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const dismiss = (reportId) => setAlerts((list) => list.filter((a) => a.report_id !== reportId));

  return { onDuty, alerts, busy, error, toggle, dismiss, refresh: check };
}
