
# Tennis Match Predictor

A machine learning pipeline that predicts ATP tennis match outcomes, initially built for Wimbledon. Built with XGBoost trained on historical match data, featuring a FastAPI backend and Next.js frontend for live match predictions.

The model achieves **70.2% accuracy** on general 2026 ATP data and **63.2% accuracy on Wimbledon 2026** — comparable to IBM SlamTracker's 63.7% on the same tournament.

---

## How it works

A user selects two players and a surface. The app looks up each player's pre-computed stats (Elo rating, recent form, surface win rate, break point pressure) from a lookup table generated from data, builds a feature vector, and runs it through a trained XGBoost model to produce a win probability for each player.


## ML

### Jupyter Notebooks

I have documented my whole process via multiple Jupyter Notebooks. From feature engineering to training the model, it is all written down inside ```backend/model/```.


## Wimbledon 2026 evaluation

The model was evaluated on Wimbledon 2026 specifically by looking up pre-match stats for each player from the lookup table and comparing predictions against actual results.

IBM SlamTracker accuracy was obtained by me manually going through the Wimbledon website and looking at all the pre-match predictions...

| Model | Wimbledon 2026 Accuracy |
|---|---|
| This model | 63.2% |
| IBM SlamTracker | 63.7% |
| Naive baseline | 60.2% |

Both models performed below their typical accuracy due to a high number of upsets in the 2026 Wimbledon tournament, probably because of the unpredictability of the grassy surface.

---

## Web app

### Backend — FastAPI

Endpoints:

**`GET /all_players`** — returns a sorted list of all player names in the lookup table, used to populate the frontend dropdowns.

**`POST /predict`** — accepts `player_a`, `player_b`, and `surface`, looks up each player's stats, builds the feature vector, and returns a win probability using the model.

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# runs on http://localhost:8000
# built-in interactive docs at http://localhost:8000/docs
```

### Frontend — Next.js

Simple prediction interface with dropdowns for both players and surface selection, displaying win probabilities as percentage bars.

```bash
cd frontend
npm install
npm run dev
# runs on http://localhost:3000
```

---

## Data source

[TennisMyLife dataset](https://stats.tennismylife.org/tennis-match-database) — historical ATP match results dating back to 1968 including player rankings, serve statistics, and tournament metadata.

---

## Tech stack

| Layer | Technology |
|---|---|
| Data processing | Python, pandas, numpy |
| Machine learning | XGBoost, scikit-learn |
| Notebook pipeline | Jupyter |
| Intermediate storage | Parquet |
| Backend API | FastAPI, uvicorn |
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Model serialization | pickle |
