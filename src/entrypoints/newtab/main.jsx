import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import '../../styles.css';
import Quote from '../../components/Quote';
import { TOTAL, dateKey, parseKey, quoteForDate } from '../../lib/daily';
import { browser } from 'wxt/browser';
import { loadSettings } from '../../lib/storage';
import { useResolvedTheme } from '../../lib/useTheme';
import { useToday } from '../../lib/useToday';

const isFirefox = import.meta.env.FIREFOX;

function NewTab() {
  const today = useToday();
  const [settings, setSettings] = useState(null);
  const theme = useResolvedTheme(settings?.theme ?? 'auto');
  const quote = useMemo(() => quoteForDate(today), [today]);

  useEffect(() => {
    loadSettings().then((s) => {
      // When the reader turned the new tab quote off, hand over to the browser's own page (Chrome).
      if (!s.newTab && !isFirefox && browser.tabs) {
        browser.tabs.update({ url: 'chrome://new-tab-page' });
        return;
      }
      setSettings(s);
    });
  }, []);

  useEffect(() => {
    document.title = 'New Tab';
  }, []);

  if (!settings) return null;
  if (!settings.newTab) return <main className="nt" data-theme={theme} />;

  const d = parseKey(today);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const [y, m, dd] = today.split('-').map(Number);
  const n = Math.round((Date.UTC(y, m - 1, dd) - Date.UTC(2024, 0, 1)) / 86_400_000);
  const no = (((n % TOTAL) + TOTAL) % TOTAL) + 1;

  return (
    <main className="nt">
      <div className="corner c1 mono">
        <span>{wd} {today.slice(8, 10)}.{today.slice(5, 7)}.{today.slice(0, 4)}</span>
        <span>No. {String(no).padStart(3, '0')}</span>
      </div>
      <Quote quote={quote} />
      <div className="corner c2 mono">
        <span>Stoic Quotes</span>
        <span>{dateKey() === today ? 'Next · tomorrow' : ''}</span>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<NewTab />);
