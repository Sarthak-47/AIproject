import { useEffect, useState } from 'react';

const scaleBar = (key, value) => {
  if (value === null || value === undefined) return 0;
  switch (key) {
    case 'revenue_growth':
      // -30% to +50% maps to 0-100%
      // -4.1% → ~32%, +15.7% → ~57%
      return Math.min(Math.max(((value + 30) / 80) * 100, 0), 100);
    case 'beat_rate':
      // already 0-100, direct map
      // 75% → 75% bar, 100% → 100% bar
      return Math.min(Math.max(value, 0), 100);
    case 'last_surprise':
      // -50% to +100% maps to 0-100%
      // +81.5% → ~88% bar
      return Math.min(Math.max(((value + 50) / 150) * 100, 0), 100);
    case 'sentiment':
      // -1 to +1 maps to 0-100%
      // Neutral (0.0) → 50%, Positive (0.3) → 65%
      return Math.min(Math.max(((value + 1) / 2) * 100, 0), 100);
    default:
      return 0;
  }
};

const formatValue = (key, data) => {
  switch (key) {
    case 'revenue_growth':
      return data.revenue_growth !== null && data.revenue_growth !== undefined
        ? `${data.revenue_growth > 0 ? '+' : ''}${data.revenue_growth}%`
        : 'N/A';
    case 'beat_rate':
      return data.beat_rate !== null && data.beat_rate !== undefined
        ? `${data.beat_rate}%`
        : 'N/A';
    case 'last_surprise':
      return data.last_surprise !== null && data.last_surprise !== undefined
        ? `${data.last_surprise > 0 ? '+' : ''}${data.last_surprise}%`
        : 'N/A';
    case 'sentiment':
      return data.sentiment_label ?? 'N/A';
    default:
      return 'N/A';
  }
};

const SIGNAL_CONFIG = [
  {
    key: 'revenue_growth',
    label: 'Revenue Growth',
    scaleKey: 'revenue_growth',
    color: () => '#2563eb',
  },
  {
    key: 'beat_rate',
    label: 'Historical Beat Rate',
    scaleKey: 'beat_rate',
    color: () => '#15803d',
  },
  {
    key: 'last_surprise',
    label: 'Last Earnings Surprise',
    scaleKey: 'last_surprise',
    color: (data) =>
      data.last_surprise !== null && data.last_surprise !== undefined
        ? data.last_surprise >= 0 ? '#15803d' : '#b91c1c'
        : '#94a3b8',
  },
  {
    key: 'sentiment',
    label: 'News Sentiment',
    scaleKey: 'sentiment',
    color: (data) =>
      data.sentiment_label === 'Positive' ? '#15803d' :
      data.sentiment_label === 'Negative' ? '#b91c1c' : '#f59e0b',
  },
];

export default function KeySignals({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [barWidths, setBarWidths] = useState({});

  useEffect(() => {
    setData(null);
    setLoading(true);
    setError(null);
    setBarWidths({});

    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    fetch(`${apiUrl}/signals/${ticker}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch signals');
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
        setTimeout(() => {
          setBarWidths({
            revenue_growth: scaleBar('revenue_growth', d.revenue_growth),
            beat_rate: scaleBar('beat_rate', d.beat_rate),
            last_surprise: scaleBar('last_surprise', d.last_surprise),
            sentiment: scaleBar('sentiment', d.sentiment_score),
          });
        }, 150);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [ticker]);

  if (loading) {
    return (
      <div style={{ padding: '8px 0' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div
              style={{
                height: '12px',
                background: '#e2e8f0',
                borderRadius: '4px',
                width: '45%',
                marginBottom: '8px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '8px 0', color: '#94a3b8', fontSize: '0.875rem' }}>
        Signals unavailable
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {SIGNAL_CONFIG.map((signal) => {
        const barWidth = barWidths[signal.scaleKey] ?? 0;
        const displayValue = formatValue(signal.key, data);
        const barColor = signal.color(data);

        return (
          <div key={signal.key} style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
                {signal.label}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {displayValue}
              </span>
            </div>
            {/* Track */}
            <div
              style={{
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              {/* Fill */}
              <div
                style={{
                  height: '100%',
                  width: `${barWidth}%`,
                  background: barColor,
                  borderRadius: '4px',
                  transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
