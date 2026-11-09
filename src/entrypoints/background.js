import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { dateKey, quoteForDate } from '../lib/daily';

// Background: the optional morning reminder.
const ALARM = 'stoic-morning';

export default defineBackground(() => {
  async function getSettings() {
    const { settings } = await browser.storage.sync.get('settings');
    return { reminder: false, reminderTime: '08:00', ...(settings || {}) };
  }

  function nextOccurrence(time) {
    const [h, m] = time.split(':').map(Number);
    const now = new Date();
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
    if (at <= now) at.setDate(at.getDate() + 1);
    return at.getTime();
  }

  async function schedule() {
    const { reminder, reminderTime } = await getSettings();
    await browser.alarms.clear(ALARM);
    // Re-armed after every firing so it follows local time and DST changes.
    if (reminder) browser.alarms.create(ALARM, { when: nextOccurrence(reminderTime) });
  }

  async function notify() {
    const allowed = await browser.permissions.contains({ permissions: ['notifications'] });
    if (!allowed) return;
    const q = quoteForDate(dateKey());
    await browser.notifications.create(`stoic-${dateKey()}`, {
      type: 'basic',
      iconUrl: browser.runtime.getURL('/icon/128.png'),
      title: q.author,
      message: q.text,
    });
  }

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== ALARM) return;
    await notify();
    await schedule();
  });

  browser.runtime.onInstalled.addListener(schedule);
  browser.runtime.onStartup.addListener(schedule);
  browser.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'settings-changed') schedule();
  });
});
