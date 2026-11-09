import { useEffect, useState } from 'react';
import { dateKey, msUntilMidnight } from './daily';

/** Re-renders at local midnight so an open popup or tab rolls over to the new quote. */
export function useToday() {
  const [today, setToday] = useState(dateKey());
  useEffect(() => {
    const t = setTimeout(() => setToday(dateKey()), msUntilMidnight() + 500);
    return () => clearTimeout(t);
  }, [today]);
  return today;
}
