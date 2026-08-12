# PitcherIQ

**MLB Pitcher Comparison & Arsenal Analysis**

Compare pitch arsenals, movement profiles, locations, and key metrics across MLB pitchers and the 2025 free-agent class — built on public Statcast data.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- SQLite database built from public Statcast (`backend/pitches.db`)

## Database setup (public Statcast)

Build `backend/pitches.db` from the public Hugging Face Statcast dump:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r ../scripts/requirements-build.txt
python ../scripts/build_db.py
```

This downloads [Jensen-holm/statcast-era-pitches](https://huggingface.co/datasets/Jensen-holm/statcast-era-pitches), keeps 2025 regular-season pitches (`game_type = R`), dedupes rows, and writes `backend/pitches.db`.

## Installation

### Backend

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Running

Terminal 1 — API:

```bash
cd backend
source venv/bin/activate
python main.py
```

API: `http://127.0.0.1:8000`

Terminal 2 — UI:

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## What it does

| Tab | Purpose |
|-----|---------|
| **Team Pitchers** | Pick any of 30 teams → starter or reliever → view repertoire; compare to another MLB starter/reliever or a free-agent SP/RP |
| **FA Starters** | Compare a free-agent starter to another FA starter or a team starter |
| **FA Relievers** | Same for relievers |
| **Stuff Score** | Leaderboards for FA SP, FA RP, MLB SP, MLB RP |

### Starter vs reliever

A pitcher is a **starter** if at least **50%** of 2025 appearances were games started (first pitcher for their team in that game). Otherwise they are a **reliever**. Dropdowns require at least **200** pitches.

## API

- `GET /teams`
- `GET /teams/{abbrev}/pitchers?role=starter|reliever`
- `GET /free_agents` / `GET /free_agents/relief`
- `GET /pitchers/{id}/summary`
- `GET /free_agents/stuff_score` / `GET /free_agents/relief/stuff_score`
- `GET /mlb/starters/stuff_score` / `GET /mlb/relievers/stuff_score`

## Dependencies

**Backend:** fastapi, uvicorn, numpy (+ polars / pyarrow / huggingface_hub for the DB build script)

**Frontend:** react, react-dom, recharts, vite
