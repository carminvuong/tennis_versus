from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import pickle

PLAYER_STATS_PATH = "model/data/player_stats.csv"
MODEL_PATH = "model/tennis_model_xgb_wimbledon.pkl"


# input features for model
FEATURES = [
    'age_a', 'age_b',
    'form_a', 'form_b',
    'surface_form_a', 'surface_form_b',
    'bp_pressure_a', 'bp_pressure_b',
    'elo_a', 'elo_b',
    'surface_elo_a', 'surface_elo_b',
    'elo_diff', 'surface_elo_diff',
    'surface_Clay', 'surface_Grass', 'surface_Hard',
]

app = FastAPI()

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # will be default port for Next.js
    allow_methods=["*"],
    allow_headers=["*"],
)

# load players data + model
players = pd.read_csv(PLAYER_STATS_PATH)
model = pickle.load(open(MODEL_PATH, "rb")) # rb - read binary, Halle / Queens being the last tourney recorded (before Wimbledon)

@app.get("/")
def home():
    return {"status" : "Online!"}