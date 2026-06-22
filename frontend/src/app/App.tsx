import { useState } from 'react';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return isAuthenticated ? (
    <DashboardPage onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <LoginPage onLogin={() => setIsAuthenticated(true)} />
  );
}
