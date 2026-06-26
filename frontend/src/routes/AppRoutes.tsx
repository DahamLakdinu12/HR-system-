import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { ModulePage } from '../pages/ModulePage';

export function AppRoutes() {
  const { isAuthenticated, login } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={login} />}
      />
      <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="increments" element={<ModulePage title="Increment processing" description="Calculate, review and process scheduled salary increments." />} />
        <Route path="salary-scales" element={<ModulePage title="Salary scales" description="Manage gazette salary scales, points and effective dates." />} />
        <Route path="assessments" element={<ModulePage title="Performance assessments" description="Prepare and track annual employee assessment forms." />} />
        <Route path="approvals" element={<ModulePage title="Approvals" description="Review increment and assessment decisions awaiting authorization." />} />
        <Route path="reports" element={<ModulePage title="Reports" description="View operational summaries and export approved HR records." />} />
        <Route path="users" element={<ModulePage title="Users & roles" description="Manage access, roles and permission assignments." />} />
        <Route path="settings" element={<ModulePage title="Settings" description="Configure integrations, notifications and organization preferences." />} />
        <Route path="audit-logs" element={<ModulePage title="Activity log" description="Review auditable system and user activity." />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
