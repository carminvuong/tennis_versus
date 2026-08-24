'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Result = {
  player_a: string;
  player_b: string;
  surface:  string;
  prob_a:   number;
  prob_b:   number;
  last_played_a?: string;
  last_played_b?: string;
};

type CareerRange = {
  first_match_date: string;
  last_match_date:  string;
};

export default function PredictPage() {
  const [players, setPlayers]   = useState<string[]>([]);
  const [playerA, setPlayerA]   = useState('');
  const [playerB, setPlayerB]   = useState('');
  const [dateA,   setDateA]     = useState('');
  const [dateB,   setDateB]     = useState('');
  const [rangeA,  setRangeA]    = useState<CareerRange | null>(null);
  const [rangeB,  setRangeB]    = useState<CareerRange | null>(null);
  const [surface, setSurface]   = useState('Grass');
  const [result,  setResult]    = useState<Result | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');

  // animation for button
  const [pressing, setPressing] = useState(false);

  const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

  // Datalists filter poorly on their own with 1000+ options (some browsers show
  // everything unfiltered) - filter and cap suggestions ourselves instead
  const MAX_SUGGESTIONS = 8;
  const suggestionsFor = (query: string) =>
    query
      ? players.filter(p => p.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_SUGGESTIONS)
      : [];

  // Load player list on mount
  useEffect(() => {
    fetch(`${BACKEND_API}/all_players`)
      .then(res => res.json())
      .then(data => setPlayers(data.players));
  }, []);

  // Bound a player's date picker to their tracked career range once a full, valid
  // player name has been typed or picked from the datalist suggestions
  const selectPlayer = (
    name: string,
    setPlayer: (v: string) => void,
    setDate: (v: string) => void,
    setRange: (v: CareerRange | null) => void,
  ) => {
    setPlayer(name);
    setDate('');
    setRange(null);
    setResult(null);
    if (!players.includes(name)) return;
    fetch(`${BACKEND_API}/player_career_range?player_name=${encodeURIComponent(name)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setRange(data))
      .catch(() => setRange(null));
  };

  const handlePredict = async () => {
    if (!playerA || !playerB || playerA === playerB) {
      setError('Please select two different players');
      return;
    }
    if (!players.includes(playerA) || !players.includes(playerB)) {
      setError('Please pick players from the suggestions list');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let res;
      try {
        res = await fetch(`${BACKEND_API}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_a: playerA,
            ...(dateA ? { date_a: dateA } : {}),
            player_b: playerB,
            ...(dateB ? { date_b: dateB } : {}),
            surface:  surface,
          }),
        });
      } catch {
        throw new Error('Could not reach the server. Please check your connection and try again.');
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Prediction failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <main style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: 16, color: '#0d8137', fontSize: 14, textDecoration: 'none' }}>
        &larr; Home
      </Link>
      <div style={{ backgroundColor: 'white', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid grey', padding: 32, width: '100%', maxWidth: 480 }}>
      
      
      <h1 className="font-display" style={{ fontSize: 26, marginBottom: 8 }}>Cross-era Tennis Match Predictor</h1>
      
      
      <p style={{ color: '#666'}}>
        Select two players, two dates, and a surface to get a prediction.
      </p>

      <datalist id="players-list-a">
        {suggestionsFor(playerA).map(p => <option key={p} value={p} />)}
      </datalist>
      <datalist id="players-list-b">
        {suggestionsFor(playerB).map(p => <option key={p} value={p} />)}
      </datalist>

      {/* Player A */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Player A</label>
      <input
        list="players-list-a"
        value={playerA}
        onChange={e => selectPlayer(e.target.value, setPlayerA, setDateA, setRangeA)}
        placeholder="Type a player name..."
        autoComplete="off"
        style={{ width: '100%', padding: 8, marginBottom: 8, fontSize: 14 }}
        className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
      />
      {rangeA && (
        <input
          type="date"
          value={dateA}
          min={rangeA.first_match_date}
          max={rangeA.last_match_date}
          onChange={e => { setDateA(e.target.value); setResult(null); }}
          style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 14, color: '#374151' }}
        />
      )}

      {/* Player B */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Player B</label>
      <input
        list="players-list-b"
        value={playerB}
        onChange={e => selectPlayer(e.target.value, setPlayerB, setDateB, setRangeB)}
        placeholder="Type a player name..."
        autoComplete="off"
        style={{ width: '100%', padding: 8, marginBottom: 8, fontSize: 14 }}
        className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
      />
      {rangeB && (
        <input
          type="date"
          value={dateB}
          min={rangeB.first_match_date}
          max={rangeB.last_match_date}
          onChange={e => { setDateB(e.target.value); setResult(null); }}
          style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 14, color: '#374151' }}
        />
      )}

      {(rangeA || rangeB) && (
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: -4, marginBottom: 16 }}>
          Leave a date blank to use a player&apos;s current stats.
        </p>
      )}

      {/* Surface */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Surface</label>
      <select
        value={surface}
        onChange={e => { setSurface(e.target.value); setResult(null); }}
        style={{ width: '100%', padding: 8, marginBottom: 24, fontSize: 14 }}
        className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
      >
        <option value="Grass">Grass</option>
        <option value="Clay">Clay</option>
        <option value="Hard">Hard</option>
      </select>

      {/* Predict button */}
      <button
        onClick={handlePredict}
        disabled={loading}
        onMouseDown={() => setPressing(true)}
        onMouseUp={() => setPressing(false)}
        onMouseLeave={() => setPressing(false)}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          background: '#0d8137',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          transform: pressing ? 'scale(0.96)' : 'scale(1)',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          boxShadow: pressing
            ? '0 1px 4px rgba(0,0,0,0.2)'
            : '0 4px 12px rgba(22,163,74,0.4)',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Predicting...' : 'Predict'}
      </button>

      {/* Error */}
      {error && (
        <p style={{ color: 'red', marginTop: 16 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 32, padding: 20, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <h2 className="font-display" style={{ fontWeight: 600, fontSize: 20, marginBottom: 16, color: '#111827' }}>
            Prediction — {surface}
          </h2>

          {/* Determine which player is favoured - green bar is higher*/}
          {(() => {
            const aWinning = result.prob_a >= result.prob_b;
            const colourA = aWinning ? '#16a34a' : '#9ca3af';
            const colourB = aWinning ? '#9ca3af' : '#16a34a';

            return (
              <>
                {/* Player A */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{result.player_a}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{pct(result.prob_a)}</span>
                  </div>
                  {result.last_played_a && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      As of {result.last_played_a}
                    </div>
                  )}
                  <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 999, height: 10 }}>
                    <div style={{ width: pct(result.prob_a), backgroundColor: colourA, height: 10, borderRadius: 999 }} />
                  </div>
                </div>

                {/* Player B */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{result.player_b}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{pct(result.prob_b)}</span>
                  </div>
                  {result.last_played_b && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      As of {result.last_played_b}
                    </div>
                  )}
                  <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 999, height: 10 }}>
                    <div style={{ width: pct(result.prob_b), backgroundColor: colourB, height: 10, borderRadius: 999 }} />
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
      </div>
    </main>

  );
}
