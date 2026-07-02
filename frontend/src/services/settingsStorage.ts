import {
  ApplicationSettings,
  defaultApplicationSettings,
} from '../types/settings';

const SETTINGS_STORAGE_KEY = 'hr-increment-settings';

export function loadApplicationSettings(): ApplicationSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return defaultApplicationSettings;

    return {
      ...defaultApplicationSettings,
      ...JSON.parse(stored) as Partial<ApplicationSettings>,
    };
  } catch {
    return defaultApplicationSettings;
  }
}

export function saveApplicationSettings(settings: ApplicationSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('application-settings-updated', {
    detail: settings,
  }));
}

export function resetApplicationSettings() {
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('application-settings-updated', {
    detail: defaultApplicationSettings,
  }));
  return defaultApplicationSettings;
}
