import { useEffect, useState } from 'react';

/** Resolves 'auto' against the system setting and keeps it in sync. */
export function useResolvedTheme(pref) {
  const query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  const [systemDark, setSystemDark] = useState(query ? query.matches : true);

  useEffect(() => {
    if (!query) return undefined;
    const onChange = (e) => setSystemDark(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = pref === 'auto' ? (systemDark ? 'dark' : 'light') : pref;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return theme;
}
