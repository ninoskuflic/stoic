import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Quote from '../../components/Quote';
import { Arrow, Cog, Copy, Heart, Moon, Sun } from '../../components/Icons';
import {
  TOTAL, addDays, dateKey, parseKey, promptFor, quoteById, quoteForDate,
} from '../../lib/daily';
import { browser } from 'wxt/browser';
import {
  DEFAULT_SETTINGS, loadFirstDay, loadNotes, loadSaved, loadSettings,
  saveNote, saveSaved, saveSettings,
} from '../../lib/storage';
import { useResolvedTheme } from '../../lib/useTheme';
import { useToday } from '../../lib/useToday';

const VERSION = browser.runtime.getManifest().version;
const PRIVACY = 'https://go.skuflic.com/privacy';
const TERMS = 'https://go.skuflic.com/servicesagreement';

const fmtLong = (key) => {
  const d = parseKey(key);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
  return `${wd} ${key.slice(8, 10)}.${key.slice(5, 7)}.${key.slice(0, 4)}`;
};
const fmtShort = (key) => `${key.slice(8, 10)}.${key.slice(5, 7)}`;
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function App() {
  const today = useToday();
  const [view, setView] = useState('today');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState([]);
  const [notes, setNotes] = useState({});
  const [firstDay, setFirstDay] = useState(today);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  const theme = useResolvedTheme(settings.theme);
  const quote = useMemo(() => quoteForDate(today), [today]);
  const dayIndex = useMemo(() => {
    // Position in the yearly cycle, shown as "No. 043".
    const [y, m, d] = today.split('-').map(Number);
    const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2024, 0, 1)) / 86_400_000);
    return ((n % TOTAL) + TOTAL) % TOTAL + 1;
  }, [today]);

  useEffect(() => {
    (async () => {
      const [s, sv, n, f] = await Promise.all([loadSettings(), loadSaved(), loadNotes(), loadFirstDay(dateKey())]);
      setSettings(s);
      setSaved(sv);
      setNotes(n);
      setFirstDay(f);
      setReady(true);
    })();
  }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const updateSettings = useCallback(async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
  }, [settings]);

  const toggleSaved = async (id) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    await saveSaved(next);
  };

  const copyQuote = async (q) => {
    const line = `“${q.text}” — ${q.author}${q.source ? `, ${q.source}` : ''}`;
    try {
      await navigator.clipboard.writeText(line);
      flash('Copied');
    } catch {
      flash('Could not copy');
    }
  };

  const toggleTheme = () => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });

  const streak = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    return { days, count: days.filter((k) => notes[k]).length };
  }, [notes, today]);

  if (!ready) return <div className="shell" aria-busy="true" />;

  const tabs = [
    ['today', 'Today'],
    ['reflect', 'Reflect'],
    ['journal', 'Journal'],
  ];

  return (
    <div className="shell">
      <header className="top">
        {view === 'settings' ? (
          <span className="mono" style={{ color: 'var(--ink)' }}>Settings</span>
        ) : (
          <nav className="tabs mono" role="tablist" aria-label="Views">
            {tabs.map(([id, label]) => (
              <button key={id} role="tab" className="tab" aria-selected={view === id} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        <div className="icons">
          <button className="ib" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Theme">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button
            className="ib"
            aria-pressed={view === 'settings'}
            aria-label="Settings"
            title="Settings"
            onClick={() => setView(view === 'settings' ? 'today' : 'settings')}
          >
            <Cog />
          </button>
        </div>
      </header>

      {view === 'today' && (
        <Today
          quote={quote} today={today} dayIndex={dayIndex} saved={saved.includes(quote.id)}
          onSave={() => toggleSaved(quote.id)} onCopy={() => copyQuote(quote)} onReflect={() => setView('reflect')}
        />
      )}
      {view === 'reflect' && (
        <Reflect quote={quote} today={today} note={notes[today]?.text ?? ''} onChange={setNotes} />
      )}
      {view === 'journal' && (
        <Journal today={today} firstDay={firstDay} notes={notes} saved={saved} onToggleSaved={toggleSaved} />
      )}
      {view === 'settings' && (
        <Settings settings={settings} onChange={updateSettings} notes={notes} flash={flash} />
      )}

      <footer className="foot mono">
        {view === 'settings' ? (
          <>
            <span>v{VERSION}</span>
            <span>
              <a href={PRIVACY} target="_blank" rel="noreferrer">Privacy</a> ·{' '}
              <a href={TERMS} target="_blank" rel="noreferrer">Terms</a>
            </span>
          </>
        ) : (
          <>
            <span className="bars" aria-label={`Reflected on ${streak.count} of the last 7 days`}>
              {streak.days.map((k) => (
                <span key={k} className={notes[k] ? (k === today ? 't' : 'f') : ''} />
              ))}
            </span>
            <span>{view === 'today' ? 'Next · tomorrow' : `${streak.count} / 7 days`}</span>
          </>
        )}
      </footer>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Today({ quote, today, dayIndex, saved, onSave, onCopy, onReflect }) {
  return (
    <main className="body">
      <div className="meta mono">
        <span>{fmtLong(today)}</span>
        <span>No. {String(dayIndex).padStart(3, '0')}</span>
      </div>
      <Quote quote={quote} />
      <div className="actions">
        <button className="btn" onClick={onCopy}><Copy />Copy</button>
        <button className={`btn ${saved ? 'on' : ''}`} aria-pressed={saved} onClick={onSave}>
          <Heart />{saved ? 'Saved' : 'Save'}
        </button>
        <button className="btn right" onClick={onReflect}>Reflect<Arrow /></button>
      </div>
    </main>
  );
}

function Reflect({ quote, today, note, onChange }) {
  const [text, setText] = useState(note);
  const [status, setStatus] = useState(note ? 'Saved' : '');
  const timer = useRef();
  const latest = useRef(text);

  useEffect(() => {
    setText(note);
    latest.current = note;
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save on close too, in case the popup is dismissed mid-debounce.
  useEffect(() => {
    const flush = () => saveNote(today, latest.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [today]);

  const update = (value) => {
    setText(value);
    latest.current = value;
    setStatus('Saving…');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      onChange(await saveNote(today, value));
      setStatus('Autosaved');
    }, 400);
  };

  return (
    <main className="body">
      <p className="qs">{quote.text}</p>
      <span className="label mono">Prompt</span>
      <p className="ask">{promptFor(today)}</p>
      <label htmlFor="note" className="sr-only">Your reflection</label>
      <textarea
        id="note" className="ta" value={text} autoFocus
        placeholder="Write a few honest lines…" onChange={(e) => update(e.target.value)}
      />
      <div className="row mono">
        <span>{status || 'Stored on this device'}</span>
        <span>{words(text)} {words(text) === 1 ? 'word' : 'words'}</span>
      </div>
    </main>
  );
}

function Journal({ today, firstDay, notes, saved, onToggleSaved }) {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const days = useMemo(() => {
    const list = [];
    let k = today;
    for (let i = 0; i < 365 && k >= firstDay; i++) {
      list.push(k);
      k = addDays(k, -1);
    }
    // Notes written before firstDay (e.g. synced from another device) still appear.
    Object.keys(notes).forEach((n) => { if (!list.includes(n)) list.push(n); });
    return list.sort().reverse();
  }, [today, firstDay, notes]);

  const entries = days
    .map((k) => ({ key: k, quote: quoteForDate(k), note: notes[k]?.text }))
    .filter((e) => (filter === 'notes' ? e.note : true));

  const savedQuotes = saved.map(quoteById).filter(Boolean).reverse();

  return (
    <main className="body" style={{ paddingTop: 16 }}>
      <div className="filter mono" role="tablist" aria-label="Filter">
        {[['all', 'All'], ['saved', 'Saved'], ['notes', 'Notes']].map(([id, label]) => (
          <button key={id} role="tab" className="tab" aria-selected={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="list">
        {filter === 'saved' ? (
          savedQuotes.length ? savedQuotes.map((q) => (
            <article className="item" key={q.id}>
              <span className="d mono">No. {q.id}</span>
              <div className="t">{q.text}<span>{q.author}{q.source ? ` · ${q.source}` : ''}</span></div>
              <button className="heart" aria-pressed="true" aria-label="Remove from saved" onClick={() => onToggleSaved(q.id)}><Heart /></button>
            </article>
          )) : <p className="empty">Nothing saved yet. Tap Save on a quote you want to keep.</p>
        ) : entries.length ? entries.map((e) => (
          <article className="item" key={e.key}>
            <span className="d mono">{fmtShort(e.key)}</span>
            <div className="t">
              {e.quote.text}
              <span>
                {e.quote.author}
                {e.note && (
                  <> · <button className="link mono" onClick={() => setOpen(open === e.key ? null : e.key)} aria-expanded={open === e.key}>
                    {open === e.key ? 'Hide note' : 'Note'}
                  </button></>
                )}
              </span>
              {(open === e.key || filter === 'notes') && e.note && <p className="note">{e.note}</p>}
            </div>
            <button
              className="heart" aria-pressed={saved.includes(e.quote.id)}
              aria-label={saved.includes(e.quote.id) ? 'Remove from saved' : 'Save quote'}
              onClick={() => onToggleSaved(e.quote.id)}
            >
              <Heart />
            </button>
          </article>
        )) : <p className="empty">No reflections yet. Your notes will collect here, one per day.</p>}
      </div>
    </main>
  );
}

function Settings({ settings, onChange, notes, flash }) {
  const [shortcut, setShortcut] = useState('Alt+Shift+S');
  const isFirefox = import.meta.env.FIREFOX;

  useEffect(() => {
    browser.commands.getAll().then((cmds) => {
      const c = cmds.find((x) => x.name === '_execute_action');
      setShortcut(c?.shortcut || 'Not set');
    }).catch(() => {});
  }, []);

  const toggleReminder = async () => {
    if (!settings.reminder) {
      const ok = await browser.permissions.request({ permissions: ['notifications'] }).catch(() => false);
      if (!ok) {
        flash('Notifications not allowed');
        return;
      }
    }
    onChange({ reminder: !settings.reminder });
  };

  const exportJournal = () => {
    const keys = Object.keys(notes).sort();
    if (!keys.length) {
      flash('No notes to export yet');
      return;
    }
    const md = ['# Stoic journal', ''];
    keys.forEach((k) => {
      const q = quoteForDate(k);
      md.push(`## ${k}`, '', `> ${q.text}`, `> — ${q.author}${q.source ? `, ${q.source}` : ''}`, '', notes[k].text, '');
    });
    const url = URL.createObjectURL(new Blob([md.join('\n')], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `stoic-journal-${dateKey()}.md` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openShortcuts = () => {
    browser.tabs.create({ url: isFirefox ? 'about:addons' : 'chrome://extensions/shortcuts' });
  };

  return (
    <main className="body" style={{ paddingTop: 8 }}>
      <div className="set">
        <div><b>Theme</b><small>Follows your system by default</small></div>
        <div className="seg mono" role="group" aria-label="Theme">
          {['auto', 'light', 'dark'].map((t) => (
            <button key={t} aria-pressed={settings.theme === t} onClick={() => onChange({ theme: t })}>{t}</button>
          ))}
        </div>
      </div>
      <div className="set">
        <div><b>Quote on new tab</b><small>Show today’s quote when you open a tab</small></div>
        <button className="sw" role="switch" aria-checked={settings.newTab} aria-label="Quote on new tab" onClick={() => onChange({ newTab: !settings.newTab })} />
      </div>
      <div className="set">
        <div>
          <b>Morning reminder</b>
          <small>
            A quiet notification at
            <input
              className="time" type="time" value={settings.reminderTime} aria-label="Reminder time"
              onChange={(e) => e.target.value && onChange({ reminderTime: e.target.value })}
            />
          </small>
        </div>
        <button className="sw" role="switch" aria-checked={settings.reminder} aria-label="Morning reminder" onClick={toggleReminder} />
      </div>
      <div className="set">
        <div><b>Shortcut</b><small>Open from anywhere</small></div>
        <button className="link mono" onClick={openShortcuts} title="Change shortcut">{shortcut.replace(/\+/g, ' ')}</button>
      </div>
      <div className="set">
        <div><b>Export journal</b><small>Download your notes as Markdown</small></div>
        <button className="link mono" onClick={exportJournal}>Export</button>
      </div>
      <p className="about">
        {TOTAL} quotes, one a day for a year. Translations: Meditations by George Long (1862), Enchiridion by
        T. W. Higginson (1865), Golden Sayings by Hastings Crossley (1903), Letters by R. M. Gummere (1917–25),
        lightly modernised. Your notes never leave this browser.
      </p>
    </main>
  );
}
