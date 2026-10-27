import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import RequireRole from './routes/RequireRole';
import { ROLES } from './lib/constants';
import StaffLayout from './layouts/StaffLayout';
import Landing from './pages/public/Landing';
import AboutPage from './pages/public/AboutPage';
import NotFound from './pages/public/NotFound';
import ServerError from './pages/public/ServerError';
import StaffSignIn from './pages/auth/StaffSignIn';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/admin/Dashboard';
import ReportManagement from './pages/admin/ReportManagement';
import ReportDetails from './pages/admin/ReportDetails';
import OfficerQueue from './pages/officer/OfficerQueue';
import Users from './pages/admin/Users';
import Summaries from './pages/admin/Summaries';
import DemoVideo from './pages/staff/DemoVideo';
import ActionLog from './pages/staff/ActionLog';
import About from './pages/staff/About';

// Routes follow the Figma Flows page (0, B, C, D, E2, F). The web is for staff: Administrators and, since
// #52, Traffic Officers (who can also use the Android app). Reporters use the app; their old web routes end
// on the 404 page. /staff/sign-in asks for the role first (Figma 465:17813).
// A page that crashes, or whose main request gets a 5xx, shows the 500 page (#40).
const STAFF = [ROLES.ADMIN, ROLES.OFFICER];

export default function App() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/500" element={<ServerError />} />
        <Route path="/staff/sign-in" element={<StaffSignIn />} />
        <Route path="/staff/forgot-password" element={<ForgotPassword />} />
        <Route path="/staff/sign-in/:role" element={<StaffSignIn />} />
        <Route path="/staff/sign-in/*" element={<Navigate to="/staff/sign-in" replace />} />

        {/* Administrator */}
        <Route
          element={
            <RequireRole roles={[ROLES.ADMIN]}>
              <StaffLayout />
            </RequireRole>
          }
        >
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/reports" element={<ReportManagement />} />
          <Route path="/admin/reports/:id" element={<ReportDetails />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/summaries" element={<Summaries />} />
          <Route path="/admin/about" element={<About />} />
        </Route>

        {/* Traffic Officer (#52) */}
        <Route
          element={
            <RequireRole roles={[ROLES.OFFICER]}>
              <StaffLayout />
            </RequireRole>
          }
        >
          <Route path="/officer" element={<OfficerQueue />} />
          <Route path="/officer/reports/:id" element={<ReportDetails mode="officer" />} />
          <Route path="/officer/about" element={<About />} />
        </Route>

        {/* Both staff roles */}
        <Route
          element={
            <RequireRole roles={STAFF}>
              <StaffLayout />
            </RequireRole>
          }
        >
          <Route path="/demo-video" element={<DemoVideo />} />
          <Route path="/action-log" element={<ActionLog />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
