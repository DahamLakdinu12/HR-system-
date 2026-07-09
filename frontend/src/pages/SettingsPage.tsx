import { ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <main className="dashboard module-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} /> Overview
      </button>
      <section className="module-hero">
        <span className="eyebrow">HR workspace</span>
        <h1>Settings</h1>
        <p>Manage system preferences and administrative options.</p>
      </section>
      <section className="panel empty-state">
        <span className="empty-state__icon"><Construction size={26} /></span>
        <h2>Settings module</h2>
        <p>The navigation is working. This business module is ready for its forms, tables and API integration.</p>
        <button className="primary-button" onClick={() => navigate('/dashboard')}>
          Return to overview
        </button>
      </section>
    </main>
  );
}
