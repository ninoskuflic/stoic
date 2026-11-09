import { browser } from 'wxt/browser';

// Settings and saved quotes are small, so they sync across the reader's browsers.
// Journal notes can outgrow sync quotas, so they stay on this device.

async function get(area, key) {
  try {
    const res = await browser.storage[area].get(key);
    return res[key];
  } catch {
    return undefined;
  }
}

async function set(area, items) {
  try {
    await browser.storage[area].set(items);
  } catch (err) {
    // Sync quota exceeded or sync unavailable: keep a local copy instead.
    if (area === 'sync') await browser.storage.local.set(items);
    else throw err;
  }
}

export const DEFAULT_SETTINGS = {
  theme: 'auto', // auto | light | dark
  newTab: true,
  reminder: false,
  reminderTime: '08:00',
};

export async function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...((await get('sync', 'settings')) || {}) };
}

export async function saveSettings(settings) {
  await set('sync', { settings });
  browser.runtime.sendMessage({ type: 'settings-changed' }).catch(() => {});
}

export async function loadSaved() {
  const saved = await get('sync', 'saved');
  return Array.isArray(saved) ? saved : [];
}

export async function saveSaved(saved) {
  await set('sync', { saved });
}

export async function loadNotes() {
  const notes = await get('local', 'notes');
  return notes && typeof notes === 'object' ? notes : {};
}

export async function saveNote(key, text) {
  const notes = await loadNotes();
  if (text.trim()) notes[key] = { text, updated: Date.now() };
  else delete notes[key];
  await set('local', { notes });
  return notes;
}

/** First day the reader opened the extension; the journal starts here. */
export async function loadFirstDay(today) {
  const firstDay = await get('sync', 'firstDay');
  if (firstDay) return firstDay;
  await set('sync', { firstDay: today });
  return today;
}
