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
        <div className="settings-grid">
          <section className="panel settings-card">
            <header>
              <span className="settings-card__icon"><Building2 size={19} /></span>
              <div>
                <h2>Organization</h2>
                <p>Details used throughout the HR workspace and documents.</p>
              </div>
            </header>
            <div className="settings-card__body settings-fields">
              <label className="settings-field settings-field--wide">
                <span>Organization name</span>
                <input
                  value={settings.organizationName}
                  onChange={(event) => update('organizationName', event.target.value)}
                  required
                />
              </label>
              <label className="settings-field">
                <span>Organization code</span>
                <input
                  value={settings.organizationCode}
                  onChange={(event) => update('organizationCode', event.target.value)}
                  maxLength={12}
                  required
                />
              </label>
              <label className="settings-field">
                <span>Currency</span>
                <select
                  value={settings.currency}
                  onChange={(event) => update('currency', event.target.value)}
                >
                  <option value="LKR">LKR - Sri Lankan Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
              </label>
              <label className="settings-field settings-field--wide">
                <span>Financial year starts</span>
                <select
                  value={settings.financialYearStartMonth}
                  onChange={(event) => update('financialYearStartMonth', Number(event.target.value))}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="panel settings-card">
            <header>
              <span className="settings-card__icon settings-card__icon--amber">
                <SlidersHorizontal size={19} />
              </span>
              <div>
                <h2>Increment processing</h2>
                <p>Set the defaults used when preparing increment assessments.</p>
              </div>
            </header>
            <div className="settings-card__body settings-fields">
              <label className="settings-field">
                <span>Default increment month</span>
                <select
                  value={settings.defaultIncrementMonth}
                  onChange={(event) => update('defaultIncrementMonth', Number(event.target.value))}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
              </label>
              <label className="settings-field">
                <span>Reminder period</span>
                <select
                  value={settings.assessmentReminderDays}
                  onChange={(event) => update('assessmentReminderDays', Number(event.target.value))}
                >
                  <option value={3}>3 days before</option>
                  <option value={7}>7 days before</option>
                  <option value={14}>14 days before</option>
                  <option value={30}>30 days before</option>
                </select>
              </label>
              <div className="settings-field settings-field--wide">
                <SettingToggle
                  checked={settings.requireApproval}
                  description="Require an authorized approver before an increment is finalized."
                  label="Approval required"
                  onChange={(checked) => update('requireApproval', checked)}
                />
              </div>
            </div>
          </section>
        </div>

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
