# Tennis Match Predictor

A machine learning pipeline that predicts ATP tennis match outcomes, including **cross-era match-ups**, like peak Federer vs. current Sinner. Built with XGBoost trained on historical match data, featuring a FastAPI backend and this Next.js frontend for live match predictions and career Elo exploration.

**Live app:** https://tennis-versus.vercel.app/

**Backend repo:** https://github.com/carminvuong/tennis_backend

---

## How it works

A user selects two players, an optional date for each, and a surface. The backend resolves each player's stats — Elo, recent form, break-point pressure — as of the requested date (or their current stats, if no date is given) from a point-in-time snapshot table in Postgres, builds a feature vector, and runs it through a trained XGBoost model to produce a win probability for each player.

A separate page lets you explore a player's Elo rating over their whole tracked career (overall and per surface) with each series' peak highlighted, and filters to isolate just one surface at a time.

## Pages

- **`/`** — landing page, links to the two tools below.
- **`/predict`** — pick two players (and optionally a date for each) and a surface, get a win probability.
- **`/elo`** — pick a player, see their career Elo trajectory (overall/Hard/Clay/Grass), with peaks marked.

## ML

### Jupyter Notebooks

The original feature engineering and model-selection process is documented via Jupyter notebooks in `tennis_backend/model/notebooks/` — data exploration, restructuring, the move from logistic regression to XGBoost, and adding Elo as a feature. That exploration produced the current model; training itself has since moved to a reproducible `.py` script (`train_model.py`, in the backend repo) so retraining doesn't require Jupyter.

### Wimbledon 2026 evaluation

An earlier version of the model was evaluated on Wimbledon 2026 by looking up pre-match stats for each player and comparing predictions against actual results, benchmarked against IBM SlamTracker's own pre-match predictions (gathered manually from the Wimbledon website) and a naive "higher-ranked player wins" baseline:

| Model | Wimbledon 2026 Accuracy |
|---|---|
| This model | 63.2% |
| IBM SlamTracker | 63.7% |
| Naive baseline | 60.2% |

Both models kind of underperformed, most likely due to a high number of upsets in the 2026 tournament.

---

## Web app

### Backend — FastAPI + Postgres

Deployed on Render, backed by a Supabase Postgres database (`player_ratings_history` — one row per player per tracked match, 1991–present). Full endpoint docs: see the [backend README](https://github.com/carminvuong/tennis_backend).

```bash
cd tennis_backend
pip install -r requirements.txt
uvicorn main:app --reload
# runs on http://localhost:8000
# built-in interactive docs at http://localhost:8000/docs
```

### Frontend — Next.js

```bash
cd tennis_versus
npm install
npm run dev
# runs on http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point at the backend (defaults to `http://localhost:8000`).

---

## Data source

[TennisMyLife dataset](https://stats.tennismylife.org/tennis-match-database) — historical ATP match results dating back to 1968, including player rankings, serve statistics, and tournament metadata. This app uses matches from 1991 onward, since shot-level stats (aces, double faults, break points) aren't reliably recorded before then.

---

## Tech stack

| Layer | Technology |
|---|---|
| Data processing | Python, pandas, numpy |
| Machine learning | XGBoost, scikit-learn |
| Database | Postgres (Supabase) |
| Backend API | FastAPI, uvicorn, deployed on Render |
| Frontend | Next.js 16, React 19, TypeScript |
| Fonts | Geist Sans (UI), Playfair Display (headings) |
