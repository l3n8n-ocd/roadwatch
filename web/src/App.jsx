import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './routes/RequireRole';
import { ROLES } from './lib/constants';
import StaffLayout from './layouts/StaffLayout';
import Landing from './pages/public/Landing';
import StaffSignIn from './pages/auth/StaffSignIn';
import Dashboard from './pages/admin/Dashboard';
import ReportManagement from './pages/admin/ReportManagement';
import ReportDetails from './pages/admin/ReportDetails';
import Users from './pages/admin/Users';
import Summaries from './pages/admin/Summaries';
import DemoVideo from './pages/staff/DemoVideo';
import ActionLog from './pages/staff/ActionLog';
import About from './pages/staff/About';

// Routes follow the Figma Flows page (0, B, D, E2, F). The web is for Administrators only (#36):
// Reporters and Traffic Officers use the Android app, so their old web routes fall through to "/".
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/staff/sign-in" element={<StaffSignIn />} />
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
        <Route path="/demo-video" element={<DemoVideo />} />
        <Route path="/action-log" element={<ActionLog />} />
        <Route path="/about" element={<About />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
