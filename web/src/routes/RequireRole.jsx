import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, homePathFor } from '../lib/constants';

// Client-side guard for routing only; the API enforces roles on every endpoint.
export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    // One staff role: straight to its form; both: the role chooser (#52).
    const form = roles.length === 1 ? { [ROLES.ADMIN]: '/admin', [ROLES.OFFICER]: '/officer' }[roles[0]] : '';
    return <Navigate to={`/staff/sign-in${form}`} replace state={{ from: location }} />;
  }
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}
