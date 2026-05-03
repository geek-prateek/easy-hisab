const PRODUCTS_STORAGE_KEY = 'product-register-items';
const DAILY_ENTRIES_STORAGE_KEY = 'product-register-daily-entries';

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

export function loadProducts() {
  return loadArray(PRODUCTS_STORAGE_KEY);
}

export function saveProducts(products) {
  window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
}

export function loadDailyEntries() {
  return loadArray(DAILY_ENTRIES_STORAGE_KEY);
}

export function saveDailyEntries(entries) {
  window.localStorage.setItem(DAILY_ENTRIES_STORAGE_KEY, JSON.stringify(entries));
}
