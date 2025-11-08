const STORAGE_KEY = 'smart_parking_data_v1';

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse storage', e);
    return [];
  }
}

export function saveData(lots) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lots));
}

export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}
