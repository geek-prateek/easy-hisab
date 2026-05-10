const DAILY_ENTRIES_STORAGE_KEY = 'product-register-daily-entries';
const AUDIT_ENTRIES_STORAGE_KEY = 'product-register-audit-entries';

function loadArray(storageKey) {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function loadDailyEntries() {
  return loadArray(DAILY_ENTRIES_STORAGE_KEY);
}

export function saveDailyEntries(entries) {
  window.localStorage.setItem(DAILY_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
}

export function loadAuditEntries() {
  return loadArray(AUDIT_ENTRIES_STORAGE_KEY);
}

export function saveAuditEntries(entries) {
  window.localStorage.setItem(AUDIT_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
}
