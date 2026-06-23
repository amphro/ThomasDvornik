import { useState } from 'react';

type Result = {
  steelman: string;
  weaknesses: string[];
  score: number;
  scoreReason: string;
};

export default function Steelman() {
  const [position, setPosition] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function run() {
    if (!position.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/steelman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
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

  function toMarkdown(r: Result): string {
    const weaknesses = r.weaknesses.map(w => `- ${w}`).join('\n');
    return [
      `# Steelman Analysis`,
      ``,
      `**Position:** ${position.trim()}`,
      ``,
      `## Defensibility Score: ${r.score}/10`,
      ``,
      r.scoreReason,
      ``,
      `## Strongest Counterargument`,
      ``,
      r.steelman,
      ``,
      `## Weaknesses`,
      ``,
      weaknesses,
    ].join('\n');
  }

  async function copyMarkdown() {
    if (!result) return;
    await navigator.clipboard.writeText(toMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const placeholder = `e.g. "We should rewrite the legacy billing system from scratch rather than refactoring incrementally."`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <textarea
        value={position}
        onChange={e => setPosition(e.target.value)}
        placeholder={placeholder}
        rows={4}
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
        disabled={loading || !position.trim()}
        style={{
          alignSelf: 'flex-start',
          padding: '0.65rem 1.5rem',
          background: loading || !position.trim() ? 'var(--border)' : 'var(--accent)',
          color: 'var(--on-accent)',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: loading || !position.trim() ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
          transition: 'background 0.15s ease',
        }}
      >
        {loading ? 'Steelmanning…' : 'Steelman it →'}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Results
            </span>
            <button
              onClick={copyMarkdown}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.75rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: copied ? '#4ade80' : 'var(--muted)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                }
              }}
              onMouseLeave={e => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                }
              }}
            >
              {copied ? '✓ Copied' : '⎘ Copy as markdown'}
            </button>
          </div>

          <ScoreBlock score={result.score} reason={result.scoreReason} />

          <div
            style={{
              padding: '1.25rem',
              background: 'var(--surface-2)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
              borderRadius: '8px',
            }}
          >
            <div style={labelStyle}>Strongest counterargument</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)', lineHeight: '1.65', opacity: 0.9 }}>
              {result.steelman}
            </p>
          </div>

          <div
            style={{
              padding: '1.25rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          >
            <div style={labelStyle}>Weaknesses in your position</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {result.weaknesses.map((w, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--muted)',
                    lineHeight: '1.6',
                    paddingLeft: '1.25rem',
                    position: 'relative',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>
                    —
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'var(--accent)',
  fontFamily: 'var(--font-mono)',
  marginBottom: '0.5rem',
};

function ScoreBlock({ score, reason }: { score: number; reason: string }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? '#4ade80' : score >= 4 ? 'var(--accent)' : '#f87171';

  return (
    <div
      style={{
        padding: '1.25rem',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={labelStyle}>Defensibility score</div>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.02em',
          }}
        >
          {score}<span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 400 }}>/10</span>
        </span>
      </div>
      <div style={{ height: '4px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: '999px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.55' }}>{reason}</p>
    </div>
  );
}
