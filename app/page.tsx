import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid grey', padding: 40 }}>
        

        <h1 className="font-display" style={{ fontSize: 32, marginBottom: 12 }}>Tennis Versus</h1>
        
        <p style={{ color: '#666', marginBottom: 32 }}>
          Pick two ATP players (even from different eras!), a surface, and get a win probability prediction - 
          powered by an XGBoost model trained on Elo, form, break-point stats, and more.
        </p>

        <p style={{ color: '#666', marginBottom: 32 }}>
          This uses <a href="https://stats.tennismylife.org/tennis-match-database">TennisMyLife&apos;s database</a>,
          with matches dating back to 1969. However, this app will only account for matches from 1991 to current,
          simply because of more consistent data.
        </p>

        <p style={{ color: '#666', marginBottom: 32 }}>
          For ideas on which players to match up against each other, 
          you can also view a player's Elo trajectory throughout their career. 
          Very fun to look at, IMO!
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/predict"
            className="springy-button"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              fontSize: 16,
              background: '#0d8137',
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
            }}
          >
            Make a prediction
          </Link>
          <Link
            href="/elo"
            className="springy-button"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              fontSize: 16,
              background: 'white',
              color: '#0d8137',
              border: '1px solid #0d8137',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            View career Elo
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', marginTop: '20px', borderRadius: 5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid grey', padding: 40 }}>
        <h4 style={{ fontSize: 13, marginBottom: 12, color: 'rgba(124, 12, 8, 0.59)' }}>Disclaimer</h4>
        <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>
          Comparing two tennis players from two different eras is impossible.
          There is no reasonable way to compare Federer 2006 and Sinner 2026 - 
          The competition was different. The equipment was different. Hell, sometimes even the rules were different.
        </p>

        <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>
          I am fully aware.

          This is just something fun I wanted to try and was curious about.
        </p>
        
      </div>

    </main>
  );
}
