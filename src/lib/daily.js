import quotes from '../data/quotes.json';

export const LIFESPANS = {
  'Marcus Aurelius': '121–180 AD',
  Seneca: 'c. 4 BC – 65 AD',
  Epictetus: 'c. 50–135 AD',
  'Zeno of Citium': 'c. 334–262 BC',
};

const DAY_MS = 86_400_000;

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days since 1 Jan 2024, based on the local calendar (DST-safe). */
function dayNumber(key) {
  const [y, m, d] = key.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2024, 0, 1)) / DAY_MS);
}

// Fixed shuffle so every reader sees the same quote on the same day
// and nothing repeats until the whole collection has been shown.
function seededOrder(n, seed) {
  const order = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const ORDER = seededOrder(quotes.length, 20260101);

export function quoteForDate(key = dateKey()) {
  const n = dayNumber(key);
  const idx = ((n % quotes.length) + quotes.length) % quotes.length;
  return quotes[ORDER[idx]];
}

export function quoteById(id) {
  return quotes.find((q) => q.id === id);
}

export const TOTAL = quotes.length;

/** Milliseconds until the next local midnight. */
export function msUntilMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

export function addDays(key, delta) {
  const d = parseKey(key);
  d.setDate(d.getDate() + delta);
  return dateKey(d);
}

const PROMPTS = [
  'What is worrying you today that is outside your control?',
  'If today were a whole life, what would you not postpone?',
  'Where did you react today when you could have chosen?',
  'What would you do differently if no one were watching?',
  'What do you already have that you once only hoped for?',
  'Which small discomfort could you accept today without complaint?',
  'Whose behaviour bothered you, and what might they have believed was right?',
  'What did you spend time on today that will not matter in a year?',
  'What is one thing you can do today simply because it is right?',
  'What are you afraid of losing, and is it truly yours?',
  'Where are you suffering in imagination rather than in reality?',
  'What would the best version of you do in the next hour?',
  'What did you learn today, and from whom?',
  'Which opinion of yours deserves to be questioned?',
];

export function promptFor(key = dateKey()) {
  const n = dayNumber(key);
  return PROMPTS[((n * 7) % PROMPTS.length + PROMPTS.length) % PROMPTS.length];
}

export function citation(q) {
  return q?.source ?? '';
}
