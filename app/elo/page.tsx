'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type EloRow = {
  match_date: string;
  elo:        number;
  hard_elo:   number;
  clay_elo:   number;
  grass_elo:  number;
};

type Series = { key: keyof Omit<EloRow, 'match_date'>; label: string; color: string };

const SERIES: Series[] = [
  { key: 'elo',       label: 'Overall', color: '#2a78d6' },
  { key: 'hard_elo',  label: 'Hard',    color: '#eb6834' },
  { key: 'clay_elo',  label: 'Clay',    color: '#eda100' },
  { key: 'grass_elo', label: 'Grass',   color: '#1baf7a' },
];

type FilterMode = 'all' | 'overall' | 'hard' | 'clay' | 'grass';

const FILTERS: { mode: FilterMode; label: string }[] = [
  { mode: 'all',     label: 'All' },
  { mode: 'overall', label: 'Overall' },
  { mode: 'hard',    label: 'Hard' },
  { mode: 'clay',    label: 'Clay' },
  { mode: 'grass',   label: 'Grass' },
];

const FILTER_KEY: Record<Exclude<FilterMode, 'all'>, Series['key']> = {
  overall: 'elo',
  hard:    'hard_elo',
  clay:    'clay_elo',
  grass:   'grass_elo',
};

function seriesForFilter(filter: FilterMode): Series[] {
  if (filter === 'all') return SERIES;
  return SERIES.filter(s => s.key === FILTER_KEY[filter]);
}

export default function EloPage() {
  const [players, setPlayers]   = useState<string[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError]     = useState('');
  const [player,  setPlayer]    = useState('');
  const [history, setHistory]   = useState<EloRow[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');
  const [filter,  setFilter]    = useState<FilterMode>('all');

  const chartHostRef = useRef<HTMLDivElement>(null);

  const MAX_SUGGESTIONS = 8;
  const suggestionsFor = (query: string) =>
    query
      ? players.filter(p => p.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_SUGGESTIONS)
      : [];

  useEffect(() => {
    fetch(`${BACKEND_API}/all_players`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => setPlayers(data.players))
      .catch(() => setPlayersError(
        'Could not load the player list. The backend may still be starting up ' +
        '(can take up to a minute on first load) - try refreshing in a moment.'
      ))
      .finally(() => setPlayersLoading(false));
  }, []);

  const selectPlayer = (name: string) => {
    setPlayer(name);
    setHistory(null);
    setError('');
    if (!players.includes(name)) return;

    setLoading(true);
    fetch(`${BACKEND_API}/player_elo_history?player_name=${encodeURIComponent(name)}`)
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail || `Could not load Elo history (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then(data => setHistory(data.history))
      .catch(err => setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'))
      .finally(() => setLoading(false));
  };

  const visibleSeries = seriesForFilter(filter);

  useEffect(() => {
    if (history && history.length > 0 && chartHostRef.current) {
      buildChart(chartHostRef.current, history, visibleSeries);
    }
  }, [history, filter, visibleSeries]);

  const peaks: Record<string, EloRow> | null = history && history.length > 0
    ? Object.fromEntries(
        SERIES.map(s => [s.key, history.reduce((best, r) => (r[s.key] > best[s.key] ? r : best), history[0])])
      )
    : null;

  return (
    <main style={{ maxWidth: 760, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <Link href="/" style={{ color: '#0d8137', fontSize: 14, textDecoration: 'none' }}>
          &larr; Home
        </Link>
        <Link href="/predict" style={{ color: '#0d8137', fontSize: 14, textDecoration: 'none' }}>
          Make a prediction &rarr;
        </Link>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid grey', padding: 32 }}>

        <h1 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>Career Elo</h1>
        <p style={{ color: '#666' }}>
          Pick a player to see their overall and per-surface Elo rating over their whole tracked career.
        </p>

        <p style={{ fontSize: 13 ,color: '#727272' }}>
          <strong>Note: </strong><a href='https://en.wikipedia.org/wiki/Elo_rating_system'>Elo</a> is a relative skill rating — it doesn't measure how well someone plays in an absolute sense.
          It measures how good they are compared to everyone else at that time, 
          based purely on who they've beaten and lost to. It was originally designed for chess, but I'm borrowing it to use for tennis...
        </p>

        <p style={{ fontSize: 13 ,color: '#727272' }}>
          A higher Elo rating doesn't mean one player is better than the other player.
          Rather, it's more like one player was more dominant during that time, than the other.
        </p>

        <datalist id="players-list">
          {suggestionsFor(player).map(p => <option key={p} value={p} />)}
        </datalist>

        {playersLoading && (
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>
            Loading players - the backend is waking up...
          </p>
        )}
        {playersError && (
          <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{playersError}</p>
        )}

        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Player</label>
        <input
          list="players-list"
          value={player}
          onChange={e => selectPlayer(e.target.value)}
          placeholder={playersLoading ? 'Loading players...' : 'Type a player name...'}
          disabled={playersLoading}
          autoComplete="off"
          style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 14, opacity: playersLoading ? 0.6 : 1 }}
          className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
        />

        {error && (
          <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
        )}

        {loading && (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Loading Elo history...</p>
        )}

        {history && history.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {FILTERS.map(f => (
                <button
                  key={f.mode}
                  type="button"
                  onClick={() => setFilter(f.mode)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    borderRadius: 999,
                    border: '1px solid ' + (filter === f.mode ? '#0d8137' : '#d1d5db'),
                    background: filter === f.mode ? '#0d8137' : 'white',
                    color: filter === f.mode ? 'white' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16, fontSize: 13, color: '#666' }}>
              {visibleSeries.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 16, height: 2, background: s.color, display: 'inline-block' }} />
                  {s.label}
                </div>
              ))}
            </div>

            {peaks && (
              <div style={{ marginBottom: 8 }}>
                {visibleSeries.map(s => (
                  <p key={s.key} style={{ fontSize: 13, color: '#666', margin: '2px 0' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: s.color, marginRight: 6, verticalAlign: 'middle' }} />
                    {s.label} peak: <strong style={{ color: '#111827' }}>{peaks[s.key][s.key].toFixed(0)}</strong> on {peaks[s.key].match_date}
                  </p>
                ))}
              </div>
            )}

            <div ref={chartHostRef} />
          </div>
        )}
      </div>
    </main>
  );
}

function buildChart(host: HTMLDivElement, rows: EloRow[], series: Series[]) {
  host.innerHTML = '';

  const W = 680, H = 300, PAD_L = 44, PAD_R = 12, PAD_T = 12, PAD_B = 28;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;

  let yMin = Infinity, yMax = -Infinity;
  for (const r of rows) {
    for (const s of series) {
      if (r[s.key] < yMin) yMin = r[s.key];
      if (r[s.key] > yMax) yMax = r[s.key];
    }
  }
  yMin = Math.floor(yMin / 100) * 100;
  yMax = Math.ceil(yMax / 100) * 100;

  const dates = rows.map(r => new Date(r.match_date).getTime());
  const xMin = dates[0], xMax = dates[dates.length - 1];
  const xScale = (t: number) => PAD_L + ((t - xMin) / (xMax - xMin || 1)) * plotW;
  const yScale = (v: number) => PAD_T + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const peaks: Record<string, EloRow> = {};
  for (const s of series) {
    let best = rows[0];
    for (const r of rows) if (r[s.key] > best[s.key]) best = r;
    peaks[s.key] = best;
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.display = 'block';
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.overflow = 'visible';

  const yStep = 200;
  for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
    const y = yScale(v);
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', String(PAD_L)); line.setAttribute('x2', String(W - PAD_R));
    line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
    line.setAttribute('stroke', '#e5e7eb'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(PAD_L - 8)); label.setAttribute('y', String(y + 3));
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#9ca3af'); label.setAttribute('font-size', '11');
    label.textContent = String(v);
    svg.appendChild(label);
  }

  const startYear = new Date(xMin).getFullYear();
  const endYear = new Date(xMax).getFullYear();
  const span = endYear - startYear;
  const yearStep = span > 18 ? 4 : span > 9 ? 2 : 1;
  for (let y = Math.ceil(startYear / yearStep) * yearStep; y <= endYear; y += yearStep) {
    const t = new Date(y, 0, 1).getTime();
    if (t < xMin || t > xMax) continue;
    const x = xScale(t);
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(x)); label.setAttribute('y', String(H - 6));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#9ca3af'); label.setAttribute('font-size', '11');
    label.textContent = String(y);
    svg.appendChild(label);
  }

  const baseline = document.createElementNS(svgNS, 'line');
  baseline.setAttribute('x1', String(PAD_L)); baseline.setAttribute('x2', String(W - PAD_R));
  baseline.setAttribute('y1', String(PAD_T + plotH)); baseline.setAttribute('y2', String(PAD_T + plotH));
  baseline.setAttribute('stroke', '#c3c2b7'); baseline.setAttribute('stroke-width', '1');
  svg.appendChild(baseline);

  for (const s of series) {
    let d = '';
    rows.forEach((r, i) => {
      const x = xScale(new Date(r.match_date).getTime());
      const y = yScale(r[s.key]);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    });
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', d.trim());
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
  }

  for (const s of series) {
    const p = peaks[s.key];
    const x = xScale(new Date(p.match_date).getTime());
    const y = yScale(p[s.key]);
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y)); dot.setAttribute('r', '4.5');
    dot.setAttribute('fill', s.color);
    dot.setAttribute('stroke', 'white'); dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);

    if (s.key === 'elo') {
      const nearRight = x > W - 140;
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(x + (nearRight ? -8 : 8)));
      label.setAttribute('y', String(y - 8));
      label.setAttribute('text-anchor', nearRight ? 'end' : 'start');
      label.setAttribute('fill', '#9ca3af'); label.setAttribute('font-size', '11'); label.setAttribute('font-weight', '600');
      label.textContent = `Peak ${p[s.key].toFixed(0)} · ${p.match_date.slice(0, 7)}`;
      svg.appendChild(label);
    }
  }

  const crosshair = document.createElementNS(svgNS, 'line');
  crosshair.setAttribute('y1', String(PAD_T)); crosshair.setAttribute('y2', String(PAD_T + plotH));
  crosshair.setAttribute('stroke', '#9ca3af'); crosshair.setAttribute('stroke-width', '1');
  crosshair.setAttribute('stroke-dasharray', '3 3');
  crosshair.style.opacity = '0';
  crosshair.style.pointerEvents = 'none';
  svg.appendChild(crosshair);

  const hit = document.createElementNS(svgNS, 'rect');
  hit.setAttribute('x', String(PAD_L)); hit.setAttribute('y', String(PAD_T));
  hit.setAttribute('width', String(plotW)); hit.setAttribute('height', String(plotH));
  hit.setAttribute('fill', 'transparent');
  svg.appendChild(hit);

  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.appendChild(svg);

  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.opacity = '0';
  tooltip.style.background = 'white';
  tooltip.style.border = '1px solid #e5e7eb';
  tooltip.style.borderRadius = '8px';
  tooltip.style.padding = '8px 10px';
  tooltip.style.fontSize = '12px';
  tooltip.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
  tooltip.style.minWidth = '150px';
  tooltip.style.transition = 'opacity 0.1s ease';
  wrapper.appendChild(tooltip);

  function nearestRow(clientX: number) {
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    const t = xMin + ((svgX - PAD_L) / plotW) * (xMax - xMin);
    let lo = 0, hi = rows.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (new Date(rows[mid].match_date).getTime() < t) lo = mid + 1; else hi = mid;
    }
    return rows[lo];
  }

  function showTooltip(evt: PointerEvent) {
    const row = nearestRow(evt.clientX);
    const x = xScale(new Date(row.match_date).getTime());
    crosshair.setAttribute('x1', String(x)); crosshair.setAttribute('x2', String(x));
    crosshair.style.opacity = '1';

    tooltip.innerHTML = '';
    const dateEl = document.createElement('div');
    dateEl.style.fontWeight = '600'; dateEl.style.marginBottom = '4px'; dateEl.style.color = '#374151';
    dateEl.textContent = row.match_date;
    tooltip.appendChild(dateEl);
    for (const s of series) {
      const rowEl = document.createElement('div');
      rowEl.style.display = 'flex'; rowEl.style.justifyContent = 'space-between'; rowEl.style.gap = '12px';
      const labelEl = document.createElement('span');
      labelEl.style.color = '#666'; labelEl.style.display = 'flex'; labelEl.style.alignItems = 'center';
      const key = document.createElement('span');
      key.style.width = '10px'; key.style.height = '2px'; key.style.background = s.color;
      key.style.marginRight = '6px'; key.style.display = 'inline-block';
      labelEl.appendChild(key);
      labelEl.appendChild(document.createTextNode(s.label));
      const valueEl = document.createElement('span');
      valueEl.style.fontWeight = '600';
      valueEl.textContent = row[s.key].toFixed(0);
      rowEl.appendChild(labelEl);
      rowEl.appendChild(valueEl);
      tooltip.appendChild(rowEl);
    }

    const wrapperRect = wrapper.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const relX = (x / W) * svgRect.width;
    tooltip.style.left = Math.min(relX + 14, wrapperRect.width - 170) + 'px';
    tooltip.style.top = '10px';
    tooltip.style.opacity = '1';
  }

  function hideTooltip() {
    crosshair.style.opacity = '0';
    tooltip.style.opacity = '0';
  }

  hit.addEventListener('pointermove', showTooltip);
  hit.addEventListener('pointerleave', hideTooltip);

  host.appendChild(wrapper);
}
