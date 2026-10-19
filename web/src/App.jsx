import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './routes/RequireRole';
import { ROLES } from './lib/constants';
import StaffLayout from './layouts/StaffLayout';
import ReporterLayout from './layouts/ReporterLayout';
import Landing from './pages/public/Landing';
import StaffSignIn from './pages/auth/StaffSignIn';
import ReporterSignIn from './pages/auth/ReporterSignIn';
import ReporterRegister from './pages/auth/ReporterRegister';
import ReportWizard from './pages/reporter/ReportWizard';
import ReportConfirmation from './pages/reporter/ReportConfirmation';
import MyReports from './pages/reporter/MyReports';
import ReportTracking from './pages/reporter/ReportTracking';
import ReporterNotifications from './pages/reporter/ReporterNotifications';
import Dashboard from './pages/admin/Dashboard';
import ReportManagement from './pages/admin/ReportManagement';
import ReportDetails from './pages/admin/ReportDetails';
import Users from './pages/admin/Users';
import Summaries from './pages/admin/Summaries';
import OfficerQueue from './pages/officer/OfficerQueue';
import DemoVideo from './pages/staff/DemoVideo';
import ActionLog from './pages/staff/ActionLog';
import About from './pages/staff/About';

const STAFF = [ROLES.ADMIN, ROLES.OFFICER];

// Routes follow the Figma Flows page (B0, C0, R0-R6, F1, F2, E3).
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/staff/sign-in" element={<StaffSignIn />} />
      <Route path="/staff/sign-in/:role" element={<StaffSignIn />} />
      <Route path="/sign-in" element={<ReporterSignIn />} />
      <Route path="/register" element={<ReporterRegister />} />

      {/* Reporter (web path, #29) */}
      <Route
        element={
          <RequireRole roles={[ROLES.REPORTER]}>
            <ReporterLayout />
          </RequireRole>
        }
      >
        <Route path="/report" element={<Navigate to="/report/details" replace />} />
        <Route path="/report/:step" element={<ReportWizard />} />
        <Route path="/report/submitted/:id" element={<ReportConfirmation />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route path="/my-reports/:id" element={<ReportTracking />} />
        <Route path="/notifications" element={<ReporterNotifications />} />
      </Route>

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
        <Route path="/admin/reports/:id" element={<ReportDetails mode="admin" />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/summaries" element={<Summaries />} />
      </Route>

      {/* Traffic Officer */}
      <Route
        element={
          <RequireRole roles={[ROLES.OFFICER]}>
            <StaffLayout />
          </RequireRole>
        }
      >
        <Route path="/officer" element={<OfficerQueue />} />
        <Route path="/officer/reports/:id" element={<ReportDetails mode="officer" />} />
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
        <Route path="/about" element={<About />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
