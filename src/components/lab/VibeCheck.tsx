import { useState } from 'react';

type Result = {
  plain: string;
  subtext: string;
  reply: string;
};

export default function VibeCheck() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        if (res.status === 429) setRemaining(0);
      } else {
        setResult(data as Result);
        const rem = res.headers.get('X-Rate-Limit-Remaining');
        if (rem !== null) setRemaining(parseInt(rem, 10));
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const placeholder = `e.g. "Per our last conversation, let's circle back to ensure alignment on the path forward and leverage our collective bandwidth to move the needle on this initiative."`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={5}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem',
          color: 'var(--text)',
          fontSize: '0.9rem',
          lineHeight: '1.6',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />

      <button
        onClick={run}
        disabled={loading || !text.trim()}
        style={{
          alignSelf: 'flex-start',
          padding: '0.65rem 1.5rem',
          background: loading || !text.trim() ? 'var(--border)' : 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
          transition: 'background 0.15s ease',
        }}
      >
        {loading ? 'Reading the vibe…' : 'Check the vibe →'}
      </button>

      {remaining !== null && (
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0, fontFamily: 'var(--font-mono)', opacity: 0.6 }}>
          {remaining === 0 ? 'No requests remaining today.' : `${remaining} request${remaining === 1 ? '' : 's'} remaining today`}
        </p>
      )}

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{error}</p>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <ResultBlock label="Plain English" value={result.plain} />
          <ResultBlock label="What it actually means" value={result.subtext} accent />
          <ResultBlock label="Suggested reply" value={result.reply} mono />
        </div>
      )}
    </div>
  );
}

function ResultBlock({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--surface-2)',
        border: `1px solid ${accent ? 'color-mix(in srgb, var(--accent) 30%, var(--border))' : 'var(--border)'}`,
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: '0.9rem',
          color: 'var(--text)',
          lineHeight: '1.65',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          opacity: 0.9,
        }}
      >
        {value}
      </p>
    </div>
  );
}
