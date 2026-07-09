import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { EmployeesPage } from '../pages/EmployeesPage';
import { IncrementPage } from '../pages/IncrementPage';
import { AssessmentsPage } from '../pages/AssessmentsPage';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
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
        <Route path="increments" element={<IncrementPage />} />
        <Route path="promotion" element={<ModulePage title="Promotion" description="Manage employee promotion workflows and grade progression." />} />
        <Route path="salary-scales" element={<Navigate to="/promotion" replace />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<ModulePage title="Users & roles" description="Manage access, roles and permission assignments." />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit-logs" element={<ModulePage title="Activity log" description="Review auditable system and user activity." />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}
