import {
  ArrowLeft,
  Bell,
  Building2,
  Database,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingToggle } from '../components/forms/SettingToggle';
import {
  loadApplicationSettings,
  resetApplicationSettings,
  saveApplicationSettings,
} from '../services/settingsStorage';
import { ApplicationSettings } from '../types/settings';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadApplicationSettings);
  const [message, setMessage] = useState('');

  const update = <K extends keyof ApplicationSettings>(
    key: K,
    value: ApplicationSettings[K],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveApplicationSettings(settings);
    setMessage('Settings saved successfully.');
  };

  const reset = () => {
    setSettings(resetApplicationSettings());
    setMessage('Default settings restored.');
  };

  return (
    <main className="dashboard settings-page">
      <button className="back-button" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} /> Overview
      </button>

      <section className="settings-hero">
        <div>
          <span className="eyebrow">System administration</span>
          <h1>Settings</h1>
          <p>Configure organization, increment and workspace preferences.</p>
        </div>
      </section>

      <form onSubmit={submit}>
        <div className="settings-grid" />

        <footer className="settings-actions">
          <span role="status">{message}</span>
          <button className="secondary-button" onClick={reset} type="button">
            <RotateCcw size={16} /> Restore defaults
          </button>
          <button className="primary-button" type="submit">
            <Save size={16} /> Save settings
          </button>
        </footer>
      </form>
    </main>
  );
}

