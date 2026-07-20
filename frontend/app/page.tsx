'use client';

import { useState, useEffect } from 'react';

const BACKEND_API = 'http://localhost:8000';

type Result = {
  player_a: string;
  player_b: string;
  surface:  string;
  prob_a:   number;
  prob_b:   number;
};

export default function Home() {
  const [players, setPlayers]   = useState<string[]>([]);
  const [playerA, setPlayerA]   = useState('');
  const [playerB, setPlayerB]   = useState('');
  const [surface, setSurface]   = useState('Grass');
  const [result,  setResult]    = useState<Result | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState('');

  const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

  // Load player list on mount
  useEffect(() => {
    fetch(`${BACKEND_API}/all_players`)
      .then(res => res.json())
      .then(data => setPlayers(data.players));
  }, []);

  const handlePredict = async () => {
    if (!playerA || !playerB || playerA === playerB) {
      setError('Please select two different players');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_API}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_a: playerA,
          player_b: playerB,
          surface:  surface,
        }),
      });

      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid grey', padding: 32, width: '100%', maxWidth: 480 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Tennis Match Predictor</h1>
      <p style={{ color: '#666'}}>
        Select two players and a surface to get a win probability prediction.
      </p>
      <p style={{ color: '#666', marginBottom: 32 }}>
        (using stats up to and including Halle and Queens 2026)
      </p>

      {/* Player A */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Player A</label>
      <select
        value={playerA}
        onChange={e => setPlayerA(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 14 }}
        className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
      >
        <option value="">Select player...</option>
        {players.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Player B */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Player B</label>
      <select
        value={playerB}
        onChange={e => setPlayerB(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 14 }}
        className="w-full border rounded px-3 py-2 mb-4 text-sm text-gray-900"
      >
        <option value="">Select player...</option>
        {players.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      {/* Surface */}
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Surface</label>
      <select
        value={surface}
        onChange={e => setSurface(e.target.value)}
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
        style={{
          width: '100%', padding: 12, fontSize: 16,
          background: '#2563eb', color: 'white',
          border: 'none', borderRadius: 6, cursor: 'pointer'
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
          <h2 style={{ fontWeight: 600, fontSize: 18, marginBottom: 16, color: '#111827' }}>
            Prediction — {surface}
          </h2>

          {/* Determine which player is favoured - blue bar is higher*/}
          {(() => {
            const aWinning = result.prob_a >= result.prob_b;
            const colourA = aWinning ? '#2563eb' : '#9ca3af';
            const colourB = aWinning ? '#9ca3af' : '#2563eb';

            return (
              <>
                {/* Player A */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{playerA}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{pct(result.prob_a)}</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: 999, height: 10 }}>
                    <div style={{ width: pct(result.prob_a), backgroundColor: colourA, height: 10, borderRadius: 999 }} />
                  </div>
                </div>

                {/* Player B */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{playerB}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{pct(result.prob_b)}</span>
                  </div>
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