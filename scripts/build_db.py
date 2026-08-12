#!/usr/bin/env python3
"""
Build backend/pitches.db from public 2025 MLB Statcast pitch data.

Source: Hugging Face dataset Jensen-holm/statcast-era-pitches
(weekly Baseball Savant scrapes — free / public).

Usage (from repo root, with backend venv active):
  pip install -r scripts/requirements-build.txt
  python scripts/build_db.py
"""

from __future__ import annotations

import sqlite3
import unicodedata
from datetime import date, datetime
from pathlib import Path

import polars as pl
from huggingface_hub import hf_hub_download

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DB = REPO_ROOT / "backend" / "pitches.db"
HF_REPO = "Jensen-holm/statcast-era-pitches"
HF_FILE = "data/statcast_era_pitches.parquet"
SEASON_START = date(2025, 3, 18)
SEASON_END = date(2025, 10, 5)

# Statcast / Savant abbrev → display name
PITCH_TYPE_NAMES = {
    "FF": "4-Seam Fastball",
    "FA": "Fastball",
    "SI": "Sinker",
    "FT": "2-Seam Fastball",
    "FC": "Cutter",
    "SL": "Slider",
    "ST": "Sweeper",
    "SV": "Slurve",
    "CU": "Curveball",
    "KC": "Knuckle Curve",
    "CS": "Slow Curve",
    "CH": "Changeup",
    "FS": "Splitter",
    "FO": "Forkball",
    "SC": "Screwball",
    "KN": "Knuckleball",
    "EP": "Eephus",
    "PO": "Pitch Out",
    "IN": "Intentional Ball",
    "UN": "Unspecified",
}

# Normalize Savant team codes to a single 30-team set
TEAM_ABBREV_MAP = {
    "ARI": "AZ",
    "AZ": "AZ",
    "ATH": "ATH",
    "OAK": "ATH",
    "CHW": "CWS",
    "CWS": "CWS",
    "WAS": "WSH",
    "WSH": "WSH",
    "SFG": "SF",
    "SF": "SF",
    "SDP": "SD",
    "SD": "SD",
    "TBR": "TB",
    "TB": "TB",
    "KCR": "KC",
    "KC": "KC",
    "ANA": "LAA",
    "LAA": "LAA",
    "FLA": "MIA",
    "MIA": "MIA",
    "NYM": "NYM",
    "NYY": "NYY",
    "LAD": "LAD",
    "LAN": "LAD",
    "BOS": "BOS",
    "BAL": "BAL",
    "TOR": "TOR",
    "CLE": "CLE",
    "DET": "DET",
    "MIN": "MIN",
    "CHC": "CHC",
    "CIN": "CIN",
    "MIL": "MIL",
    "PIT": "PIT",
    "STL": "STL",
    "COL": "COL",
    "HOU": "HOU",
    "TEX": "TEX",
    "SEA": "SEA",
    "PHI": "PHI",
    "ATL": "ATL",
}

TEAM_NAMES = {
    "AZ": "Arizona Diamondbacks",
    "ATH": "Athletics",
    "ATL": "Atlanta Braves",
    "BAL": "Baltimore Orioles",
    "BOS": "Boston Red Sox",
    "CHC": "Chicago Cubs",
    "CWS": "Chicago White Sox",
    "CIN": "Cincinnati Reds",
    "CLE": "Cleveland Guardians",
    "COL": "Colorado Rockies",
    "DET": "Detroit Tigers",
    "HOU": "Houston Astros",
    "KC": "Kansas City Royals",
    "LAA": "Los Angeles Angels",
    "LAD": "Los Angeles Dodgers",
    "MIA": "Miami Marlins",
    "MIL": "Milwaukee Brewers",
    "MIN": "Minnesota Twins",
    "NYM": "New York Mets",
    "NYY": "New York Yankees",
    "PHI": "Philadelphia Phillies",
    "PIT": "Pittsburgh Pirates",
    "SD": "San Diego Padres",
    "SF": "San Francisco Giants",
    "SEA": "Seattle Mariners",
    "STL": "St. Louis Cardinals",
    "TB": "Tampa Bay Rays",
    "TEX": "Texas Rangers",
    "TOR": "Toronto Blue Jays",
    "WSH": "Washington Nationals",
}


def normalize_team(abbr: str | None) -> str | None:
    if abbr is None:
        return None
    return TEAM_ABBREV_MAP.get(str(abbr).upper(), str(abbr).upper())


def split_player_name(player_name: str | None) -> tuple[str, str]:
    """Statcast player_name is usually 'Last, First'."""
    if not player_name or not str(player_name).strip():
        return ("Unknown", "Unknown")
    name = str(player_name).strip()
    if "," in name:
        last, first = name.split(",", 1)
        return (first.strip() or "Unknown", last.strip() or "Unknown")
    parts = name.split()
    if len(parts) == 1:
        return (parts[0], parts[0])
    return (" ".join(parts[:-1]), parts[-1])


def create_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        DROP TABLE IF EXISTS pitches;
        DROP TABLE IF EXISTS players;

        CREATE TABLE players (
            player_id INTEGER PRIMARY KEY,
            name_use TEXT,
            name_last TEXT
        );

        CREATE TABLE pitches (
            game_pk INTEGER,
            game_date INTEGER,
            home_team_id INTEGER,
            away_team_id INTEGER,
            home_team_name TEXT,
            home_team_abbrev TEXT,
            away_team_name TEXT,
            away_team_abbrev TEXT,
            venue_id INTEGER,
            venue_name TEXT,
            pitch_uid TEXT,
            pitcher_id INTEGER,
            pitcher_throws TEXT,
            batter_id INTEGER,
            batter_side TEXT,
            pitch_no INTEGER,
            inning INTEGER,
            top_bottom TEXT,
            outs INTEGER,
            balls INTEGER,
            strikes INTEGER,
            pitch_type TEXT,
            pitch_type_abbrev TEXT,
            pitch_call TEXT,
            k_or_bb TEXT,
            hit_type TEXT,
            play_result TEXT,
            release_speed REAL,
            spin_rate REAL,
            spin_axis REAL,
            tilt TEXT,
            horizontal_break REAL,
            induced_vertical_break REAL,
            plate_location_height REAL,
            plate_location_side REAL,
            hit_exit_speed REAL,
            hit_launch_angle REAL,
            hit_launch_direction REAL,
            hit_landing_distance REAL,
            hit_landing_angle REAL,
            hit_hang_time REAL,
            video_url TEXT,
            pitcher_team_abbrev TEXT
        );

        CREATE INDEX idx_pitches_pitcher ON pitches(pitcher_id);
        CREATE INDEX idx_pitches_team ON pitches(pitcher_team_abbrev);
        CREATE INDEX idx_pitches_game ON pitches(game_pk, pitcher_id);
        """
    )
    conn.commit()


def load_2025_statcast() -> pl.DataFrame:
    print(f"Downloading {HF_FILE} from {HF_REPO} (this can take a few minutes)...")
    local_path = hf_hub_download(repo_id=HF_REPO, filename=HF_FILE, repo_type="dataset")
    print(f"Cached at {local_path}")
    print("Scanning parquet and filtering to 2025 regular-season window...")

    lf = pl.scan_parquet(local_path)
    schema_names = lf.collect_schema().names()
    print(f"Columns available: {len(schema_names)}")

    # game_date may be Utf8 or Date/Datetime depending on dataset version
    date_expr = pl.col("game_date")
    if "game_date" in schema_names:
        dtype = lf.collect_schema()["game_date"]
        if dtype == pl.Utf8:
            date_expr = pl.col("game_date").str.to_date(strict=False)
        elif dtype in (pl.Datetime, pl.Datetime("us"), pl.Datetime("ns"), pl.Datetime("ms")):
            date_expr = pl.col("game_date").cast(pl.Date)

    needed = [
        c
        for c in [
            "game_pk",
            "game_date",
            "game_type",
            "home_team",
            "away_team",
            "pitcher",
            "player_name",
            "p_throws",
            "batter",
            "stand",
            "pitch_number",
            "at_bat_number",
            "inning",
            "inning_topbot",
            "outs_when_up",
            "balls",
            "strikes",
            "pitch_type",
            "pitch_name",
            "description",
            "release_speed",
            "release_spin_rate",
            "spin_axis",
            "pfx_x",
            "pfx_z",
            "plate_x",
            "plate_z",
            "launch_speed",
            "launch_angle",
            "launch_speed_angle",
            "hc_x",
            "hc_y",
            "hit_distance_sc",
        ]
        if c in schema_names
    ]

    filtered = (
        lf.select(needed)
        .with_columns(date_expr.alias("game_date_parsed"))
        .filter(
            (pl.col("game_date_parsed") >= SEASON_START)
            & (pl.col("game_date_parsed") <= SEASON_END)
            & pl.col("pitcher").is_not_null()
        )
    )
    if "game_type" in needed:
        filtered = filtered.filter(pl.col("game_type") == "R")

    df = filtered.collect(engine="streaming")
    print(f"Loaded {df.height:,} pitches before dedupe")

    # HF dump can contain near-duplicate pitch rows
    dedupe_keys = [
        c
        for c in ["game_pk", "at_bat_number", "pitch_number"]
        if c in df.columns
    ]
    if len(dedupe_keys) == 3:
        before = df.height
        df = df.unique(subset=dedupe_keys, keep="first")
        print(f"Deduped on {dedupe_keys}: {before:,} → {df.height:,}")
    else:
        print("Warning: could not dedupe on at-bat keys; using all rows")

    return df


def _col_or_null(df: pl.DataFrame, name: str, dtype) -> pl.Expr:
    if name in df.columns:
        return pl.col(name).cast(dtype)
    return pl.lit(None).cast(dtype)


def transform(df: pl.DataFrame) -> tuple[pl.DataFrame, pl.DataFrame]:
    """Return (players_df, pitches_df) ready for SQLite insert."""

    work = df.with_columns(
        [
            pl.col("home_team")
            .cast(pl.Utf8)
            .str.to_uppercase()
            .replace(TEAM_ABBREV_MAP)
            .alias("home_team_abbrev"),
            pl.col("away_team")
            .cast(pl.Utf8)
            .str.to_uppercase()
            .replace(TEAM_ABBREV_MAP)
            .alias("away_team_abbrev"),
        ]
    )

    # Pitching team: Top = home pitches, Bottom = away pitches
    topbot = pl.col("inning_topbot").cast(pl.Utf8).str.to_lowercase()
    pitch_abbrev = _col_or_null(df, "pitch_type", pl.Utf8)
    pitch_name = _col_or_null(df, "pitch_name", pl.Utf8)
    mapped_name = pitch_abbrev.replace_strict(PITCH_TYPE_NAMES, default=None)

    work = work.with_columns(
        [
            pl.when(topbot.str.starts_with("top"))
            .then(pl.col("home_team_abbrev"))
            .otherwise(pl.col("away_team_abbrev"))
            .alias("pitcher_team_abbrev"),
            pl.when(pitch_name.is_not_null() & (pitch_name != ""))
            .then(pitch_name)
            .otherwise(mapped_name)
            .alias("pitch_type"),
            (_col_or_null(df, "pfx_x", pl.Float64) * 12.0).alias("horizontal_break"),
            (_col_or_null(df, "pfx_z", pl.Float64) * 12.0).alias(
                "induced_vertical_break"
            ),
            (pl.col("game_date_parsed") - pl.lit(date(1970, 1, 1)))
            .dt.total_days()
            .cast(pl.Int64)
            .alias("game_date"),
            pl.when(pl.col("p_throws").cast(pl.Utf8).str.to_uppercase() == "L")
            .then(pl.lit("Left"))
            .when(pl.col("p_throws").cast(pl.Utf8).str.to_uppercase() == "R")
            .then(pl.lit("Right"))
            .otherwise(pl.col("p_throws").cast(pl.Utf8))
            .alias("pitcher_throws"),
            pl.when(pl.col("stand").cast(pl.Utf8).str.to_uppercase() == "L")
            .then(pl.lit("Left"))
            .when(pl.col("stand").cast(pl.Utf8).str.to_uppercase() == "R")
            .then(pl.lit("Right"))
            .otherwise(pl.col("stand").cast(pl.Utf8))
            .alias("batter_side"),
            pl.when(topbot.str.starts_with("top"))
            .then(pl.lit("Top"))
            .otherwise(pl.lit("Bottom"))
            .alias("top_bottom"),
            pitch_abbrev.alias("pitch_type_abbrev"),
            pl.col("pitcher").cast(pl.Int64).alias("pitcher_id"),
            _col_or_null(df, "batter", pl.Int64).alias("batter_id"),
            _col_or_null(df, "pitch_number", pl.Int64).alias("pitch_no"),
            _col_or_null(df, "inning", pl.Int64).alias("inning"),
            _col_or_null(df, "outs_when_up", pl.Int64).alias("outs"),
            _col_or_null(df, "balls", pl.Int64).alias("balls"),
            _col_or_null(df, "strikes", pl.Int64).alias("strikes"),
            _col_or_null(df, "release_speed", pl.Float64).alias("release_speed"),
            _col_or_null(df, "release_spin_rate", pl.Float64).alias("spin_rate"),
            _col_or_null(df, "spin_axis", pl.Float64).alias("spin_axis"),
            _col_or_null(df, "plate_z", pl.Float64).alias("plate_location_height"),
            _col_or_null(df, "plate_x", pl.Float64).alias("plate_location_side"),
            _col_or_null(df, "launch_speed", pl.Float64).alias("hit_exit_speed"),
            _col_or_null(df, "launch_angle", pl.Float64).alias("hit_launch_angle"),
            _col_or_null(df, "hit_distance_sc", pl.Float64).alias(
                "hit_landing_distance"
            ),
            _col_or_null(df, "description", pl.Utf8).alias("pitch_call"),
            pl.col("game_pk").cast(pl.Int64).alias("game_pk"),
            _col_or_null(df, "player_name", pl.Utf8).alias("player_name"),
            _col_or_null(df, "at_bat_number", pl.Int64).alias("at_bat_number"),
        ]
    )

    # Team display names
    home_name_expr = pl.col("home_team_abbrev")
    away_name_expr = pl.col("away_team_abbrev")
    for abbr, name in TEAM_NAMES.items():
        home_name_expr = (
            pl.when(pl.col("home_team_abbrev") == abbr)
            .then(pl.lit(name))
            .otherwise(home_name_expr)
        )
        away_name_expr = (
            pl.when(pl.col("away_team_abbrev") == abbr)
            .then(pl.lit(name))
            .otherwise(away_name_expr)
        )

    work = work.with_columns(
        [
            home_name_expr.alias("home_team_name"),
            away_name_expr.alias("away_team_name"),
            (
                pl.col("game_pk").cast(pl.Utf8)
                + "-"
                + pl.col("at_bat_number").cast(pl.Utf8)
                + "-"
                + pl.col("pitch_no").cast(pl.Utf8)
            ).alias("pitch_uid")
            if "at_bat_number" in work.columns
            else (
                pl.col("game_pk").cast(pl.Utf8)
                + "-"
                + pl.col("pitcher_id").cast(pl.Utf8)
                + "-"
                + pl.col("pitch_no").cast(pl.Utf8)
                + "-"
                + pl.col("inning").cast(pl.Utf8)
            ).alias("pitch_uid"),
        ]
    )

    # Players from distinct pitcher_id + player_name
    players_raw = (
        work.select(["pitcher_id", "player_name"])
        .drop_nulls("pitcher_id")
        .unique(subset=["pitcher_id"], keep="first")
    )
    names = [split_player_name(n) for n in players_raw["player_name"].to_list()]
    players_df = pl.DataFrame(
        {
            "player_id": players_raw["pitcher_id"].to_list(),
            "name_use": [n[0] for n in names],
            "name_last": [n[1] for n in names],
        }
    )

    pitch_cols = [
        "game_pk",
        "game_date",
        "home_team_name",
        "home_team_abbrev",
        "away_team_name",
        "away_team_abbrev",
        "pitch_uid",
        "pitcher_id",
        "pitcher_throws",
        "batter_id",
        "batter_side",
        "pitch_no",
        "inning",
        "top_bottom",
        "outs",
        "balls",
        "strikes",
        "pitch_type",
        "pitch_type_abbrev",
        "pitch_call",
        "release_speed",
        "spin_rate",
        "spin_axis",
        "horizontal_break",
        "induced_vertical_break",
        "plate_location_height",
        "plate_location_side",
        "hit_exit_speed",
        "hit_launch_angle",
        "hit_landing_distance",
        "pitcher_team_abbrev",
    ]
    pitches_df = work.select(pitch_cols)
    return players_df, pitches_df


def write_db(players_df: pl.DataFrame, pitches_df: pl.DataFrame) -> None:
    OUT_DB.parent.mkdir(parents=True, exist_ok=True)
    if OUT_DB.exists():
        backup = OUT_DB.with_suffix(".db.bak")
        print(f"Backing up existing DB to {backup}")
        OUT_DB.replace(backup)

    print(f"Writing {OUT_DB}...")
    conn = sqlite3.connect(OUT_DB)
    create_schema(conn)

    conn.executemany(
        "INSERT INTO players (player_id, name_use, name_last) VALUES (?, ?, ?)",
        players_df.iter_rows(),
    )

    # Add nullable columns not always present with defaults
    insert_sql = """
        INSERT INTO pitches (
            game_pk, game_date, home_team_name, home_team_abbrev,
            away_team_name, away_team_abbrev, pitch_uid, pitcher_id,
            pitcher_throws, batter_id, batter_side, pitch_no, inning,
            top_bottom, outs, balls, strikes, pitch_type, pitch_type_abbrev,
            pitch_call, release_speed, spin_rate, spin_axis,
            horizontal_break, induced_vertical_break,
            plate_location_height, plate_location_side,
            hit_exit_speed, hit_launch_angle, hit_landing_distance,
            pitcher_team_abbrev
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
    """
    rows = list(pitches_df.iter_rows())
    batch = 20_000
    for i in range(0, len(rows), batch):
        conn.executemany(insert_sql, rows[i : i + batch])
        conn.commit()
        print(f"  inserted {min(i + batch, len(rows)):,} / {len(rows):,} pitches")

    conn.execute("ANALYZE")
    conn.commit()
    conn.close()
    print("Done.")
    print(f"  players: {players_df.height:,}")
    print(f"  pitches: {pitches_df.height:,}")


def main() -> None:
    print(f"Build started at {datetime.now().isoformat(timespec='seconds')}")
    df = load_2025_statcast()
    if df.height == 0:
        raise SystemExit("No 2025 pitches found in the Hugging Face dataset.")
    players_df, pitches_df = transform(df)
    write_db(players_df, pitches_df)
    print(f"Build finished at {datetime.now().isoformat(timespec='seconds')}")


if __name__ == "__main__":
    main()
