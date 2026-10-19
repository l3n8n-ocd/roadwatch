import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, homePathFor } from '../lib/constants';

// Client-side guard for routing only; the API enforces roles on every endpoint.
export default function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) {
    const staff = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.OFFICER);
    return <Navigate to={staff && !roles.includes(ROLES.REPORTER) ? '/staff/sign-in' : '/sign-in'} replace state={{ from: location }} />;
  }
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return children;
}
