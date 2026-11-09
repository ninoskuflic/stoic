import { LIFESPANS } from '../lib/daily';

export function sizeClass(text) {
  const n = text.length;
  if (n > 190) return 'xlong';
  if (n > 120) return 'long';
  return '';
}

export default function Quote({ quote }) {
  return (
    <figure style={{ margin: 0 }}>
      <blockquote className={`q ${sizeClass(quote.text)}`}>{quote.text}</blockquote>
      <figcaption className="cite">
        <span className="who">{quote.author}</span>
        <span className="src mono">
          {quote.source ? `${quote.source}` : LIFESPANS[quote.author]}
        </span>
      </figcaption>
    </figure>
  );
}
