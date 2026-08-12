"""
PitcherIQ API — MLB pitcher comparison & arsenal analysis (2025 Statcast).
"""

from __future__ import annotations

import os
import sqlite3
import unicodedata
from pathlib import Path

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DB_PATH", BASE_DIR / "pitches.db"))

# Minimum pitches to appear in team/role dropdowns
MIN_PITCHES = 200
# Starter if games-started / appearances >= this threshold
STARTER_GS_RATIO = 0.5

TEAMS = [
    {"abbrev": "AZ", "name": "Arizona Diamondbacks"},
    {"abbrev": "ATH", "name": "Athletics"},
    {"abbrev": "ATL", "name": "Atlanta Braves"},
    {"abbrev": "BAL", "name": "Baltimore Orioles"},
    {"abbrev": "BOS", "name": "Boston Red Sox"},
    {"abbrev": "CHC", "name": "Chicago Cubs"},
    {"abbrev": "CWS", "name": "Chicago White Sox"},
    {"abbrev": "CIN", "name": "Cincinnati Reds"},
    {"abbrev": "CLE", "name": "Cleveland Guardians"},
    {"abbrev": "COL", "name": "Colorado Rockies"},
    {"abbrev": "DET", "name": "Detroit Tigers"},
    {"abbrev": "HOU", "name": "Houston Astros"},
    {"abbrev": "KC", "name": "Kansas City Royals"},
    {"abbrev": "LAA", "name": "Los Angeles Angels"},
    {"abbrev": "LAD", "name": "Los Angeles Dodgers"},
    {"abbrev": "MIA", "name": "Miami Marlins"},
    {"abbrev": "MIL", "name": "Milwaukee Brewers"},
    {"abbrev": "MIN", "name": "Minnesota Twins"},
    {"abbrev": "NYM", "name": "New York Mets"},
    {"abbrev": "NYY", "name": "New York Yankees"},
    {"abbrev": "PHI", "name": "Philadelphia Phillies"},
    {"abbrev": "PIT", "name": "Pittsburgh Pirates"},
    {"abbrev": "SD", "name": "San Diego Padres"},
    {"abbrev": "SF", "name": "San Francisco Giants"},
    {"abbrev": "SEA", "name": "Seattle Mariners"},
    {"abbrev": "STL", "name": "St. Louis Cardinals"},
    {"abbrev": "TB", "name": "Tampa Bay Rays"},
    {"abbrev": "TEX", "name": "Texas Rangers"},
    {"abbrev": "TOR", "name": "Toronto Blue Jays"},
    {"abbrev": "WSH", "name": "Washington Nationals"},
]

FREE_AGENT_STARTERS = [
    "Dylan Cease",
    "Framber Valdez",
    "Ranger Suárez",
    "Nick Martinez",
    "Chris Bassitt",
    "Michael King",
    "Zac Gallen",
    "Merrill Kelly",
    "Zack Littell",
    "Patrick Corbin",
    "Erick Fedde",
    "Justin Verlander",
    "Zach Eflin",
    "Miles Mikolas",
    "Nestor Cortes",
    "Adrian Houser",
    "Tyler Mahle",
    "Lucas Giolito",
    "Andrew Heaney",
    "Michael Lorenzen",
    "Jose Quintana",
    "Aaron Civale",
    "Chris Paddack",
    "Tyler Anderson",
    "Michael Soroka",
    "Jon Gray",
    "Martín Pérez",
    "Griffin Canning",
    "Chris Flexen",
    "Marcus Stroman",
    "Max Scherzer",
    "Austin Gomber",
    "Cal Quantrill",
    "Dustin May",
    "Paul Blackburn",
    "Jordan Montgomery",
    "JT Brubaker",
    "Germán Márquez",
    "Tomoyuki Sugano",
    "José Ureña",
    "José Urquidy",
    "Tony Gonsolin",
    "Kenta Maeda",
    "Mike Clevinger",
    "Wade Miley",
    "Walker Buehler",
    "Anthony DeSclafani",
]

FREE_AGENT_RELIEVERS = [
    "Edwin Díaz",
    "Robert Suarez",
    "Ryan Helsley",
    "Devin Williams",
    "Shawn Armstrong",
    "Kenley Jansen",
    "Hoby Milner",
    "Tyler Rogers",
    "Kirby Yates",
    "David Robertson",
    "Pete Fairbanks",
    "Sean Newcomb",
    "Emilio Pagán",
    "Jakob Junis",
    "Chris Martin",
    "Luke Weaver",
    "Caleb Thielbar",
    "Danny Coulombe",
    "Kyle Finnegan",
    "Hunter Harvey",
    "Steven Matz",
    "Gregory Soto",
    "Caleb Ferguson",
    "Justin Wilson",
    "Luis García",
    "Brad Keller",
    "Jalen Beeks",
    "Andrew Chafin",
    "Tyler Kinley",
    "Tyler Alexander",
    "Ryan Brasier",
    "Seranthony Domínguez",
    "Pierce Johnson",
    "Drew Pomeranz",
    "Joe Ross",
    "José Leclerc",
    "Jorge López",
    "Shelby Miller",
    "Ryan Pressly",
    "Michael Kopech",
    "Taylor Rashi",
    "Paul Sewald",
    "Josh Winckowski",
    "Taylor Clarke",
    "T.J. McFarland",
    "Taylor Rogers",
    "Hunter Strickland",
    "Brent Suter",
    "Scott Barlow",
    "Craig Kimbrel",
    "Evan Phillips",
    "Jorge Alcala",
    "Ryan Borucki",
    "José Castillo",
    "Omar Cruz",
    "Dugan Darnell",
    "Scott Effross",
    "Nic Enright",
    "Sean Guenther",
    "Ian Hamilton",
    "Liam Hendriks",
    "Colin Holderman",
    "John King",
    "Max Kranick",
    "Jack Little",
    "Joey Lucchesi",
    "Michael Mercado",
    "Dauri Moreta",
    "Eli Morgan",
    "Sean Reynolds",
    "Gregory Santos",
    "Tayler Saucedo",
    "Connor Seabold",
    "Trent Thornton",
    "Carson Ragsdale",
    "Tanner Rainey",
    "Daniel Robert",
    "Ryne Stanek",
    "Lou Trivino",
    "Jacob Webb",
    "Danny Young",
    "John Brebbia",
    "Tim Mayza",
    "Héctor Neris",
    "Kendall Graveman",
    "Tommy Kahnle",
    "Cam Booser",
    "Miguel Castro",
    "Luke Jackson",
    "Elvin Rodríguez",
    "Chris Stratton",
    "Jonathan Loáisiga",
    "Scott Alexander",
    "Chris Devenski",
    "Colin Poche",
    "Erasmo Ramírez",
    "Jordan Romano",
    "Nick Sandlin",
    "Scott McGough",
    "Rafael Montero",
    "Lucas Sims",
    "Chad Green",
    "Erik Swanson",
    "Génesis Cabrera",
    "Roddery Muñoz",
]

app = FastAPI(title="PitcherIQ", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> sqlite3.Connection:
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="pitches.db missing. Run: python scripts/build_db.py",
        )
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def normalize_name(s: str) -> str:
    s = strip_accents(s or "").lower().strip()
    for ch in ".'`-":
        s = s.replace(ch, "")
    return " ".join(s.split())


def has_pitcher_team_column(conn: sqlite3.Connection) -> bool:
    cols = {r[1] for r in conn.execute("PRAGMA table_info(pitches)")}
    return "pitcher_team_abbrev" in cols


def pitching_team_sql(conn: sqlite3.Connection, alias: str = "pt") -> str:
    """SQL expression for the pitcher's team on a given pitch."""
    if has_pitcher_team_column(conn):
        return f"{alias}.pitcher_team_abbrev"
    return f"""CASE
        WHEN {alias}.top_bottom = 'Top' THEN {alias}.home_team_abbrev
        ELSE {alias}.away_team_abbrev
    END"""


def resolve_names_to_ids(conn: sqlite3.Connection, names: list[str]) -> list[tuple[int, str]]:
    """Match display names to player IDs with accent-insensitive lookup."""
    cur = conn.cursor()
    cur.execute(
        """
        SELECT DISTINCT
            pl.player_id,
            pl.name_use || ' ' || pl.name_last AS name
        FROM players pl
        INNER JOIN pitches pt ON pl.player_id = pt.pitcher_id
        """
    )
    db_players = [(r[0], r[1]) for r in cur.fetchall()]
    by_norm = {normalize_name(name): (pid, name) for pid, name in db_players}

    found: list[tuple[int, str]] = []
    seen: set[int] = set()
    for wanted in names:
        hit = by_norm.get(normalize_name(wanted))
        if hit and hit[0] not in seen:
            found.append(hit)
            seen.add(hit[0])
    found.sort(key=lambda x: x[1])
    return found


def classify_pitchers(
    conn: sqlite3.Connection,
    pitcher_ids: list[int] | None = None,
    team: str | None = None,
    role: str | None = None,
    min_pitches: int = MIN_PITCHES,
) -> list[dict]:
    """
    Classify pitchers as starter/reliever.

    Game started = pitcher threw a pitch in inning 1 and was the first pitcher
    for their team in that game (lowest pitch_no among inning-1 pitches for that team).
    Starter if GS / appearances >= STARTER_GS_RATIO.
    """
    team_expr = pitching_team_sql(conn)
    cur = conn.cursor()

    filters = ["1=1"]
    params: list = []
    if pitcher_ids is not None:
        if not pitcher_ids:
            return []
        placeholders = ", ".join("?" for _ in pitcher_ids)
        filters.append(f"pt.pitcher_id IN ({placeholders})")
        params.extend(pitcher_ids)
    if team:
        filters.append(f"({team_expr}) = ?")
        params.append(team)

    where = " AND ".join(filters)

    # Appearances + pitch counts
    cur.execute(
        f"""
        WITH appearance AS (
            SELECT
                pt.pitcher_id,
                pt.game_pk,
                ({team_expr}) AS team_abbrev,
                COUNT(*) AS pitches,
                MIN(pt.inning) AS first_inning,
                MIN(CASE WHEN pt.inning = 1 THEN pt.pitch_no END) AS first_inn1_pitch_no
            FROM pitches pt
            WHERE {where}
            GROUP BY pt.pitcher_id, pt.game_pk
        ),
        first_pitchers AS (
            SELECT
                game_pk,
                team_abbrev,
                MIN(first_inn1_pitch_no) AS team_first_pitch_no
            FROM appearance
            WHERE first_inn1_pitch_no IS NOT NULL
            GROUP BY game_pk, team_abbrev
        ),
        labeled AS (
            SELECT
                a.pitcher_id,
                a.game_pk,
                a.team_abbrev,
                a.pitches,
                CASE
                    WHEN a.first_inning = 1
                     AND a.first_inn1_pitch_no IS NOT NULL
                     AND fp.team_first_pitch_no IS NOT NULL
                     AND a.first_inn1_pitch_no = fp.team_first_pitch_no
                    THEN 1 ELSE 0
                END AS is_start
            FROM appearance a
            LEFT JOIN first_pitchers fp
              ON a.game_pk = fp.game_pk AND a.team_abbrev = fp.team_abbrev
        ),
        agg AS (
            SELECT
                pitcher_id,
                -- primary team = most pitches
                (
                    SELECT team_abbrev FROM labeled l2
                    WHERE l2.pitcher_id = labeled.pitcher_id
                    GROUP BY team_abbrev
                    ORDER BY SUM(pitches) DESC
                    LIMIT 1
                ) AS team_abbrev,
                COUNT(*) AS appearances,
                SUM(is_start) AS games_started,
                SUM(pitches) AS pitch_count
            FROM labeled
            GROUP BY pitcher_id
        )
        SELECT
            agg.pitcher_id,
            pl.name_use || ' ' || pl.name_last AS name,
            agg.team_abbrev,
            agg.appearances,
            agg.games_started,
            agg.pitch_count,
            CASE
                WHEN agg.appearances > 0
                 AND (1.0 * agg.games_started / agg.appearances) >= {STARTER_GS_RATIO}
                THEN 'starter'
                ELSE 'reliever'
            END AS role
        FROM agg
        JOIN players pl ON pl.player_id = agg.pitcher_id
        WHERE agg.pitch_count >= ?
        ORDER BY name
        """,
        [*params, min_pitches],
    )

    rows = []
    for r in cur.fetchall():
        d = dict(r)
        if role and d["role"] != role:
            continue
        if team and d["team_abbrev"] != team:
            # Primary team filter (pitchers who also appeared elsewhere)
            continue
        gs = d["games_started"] or 0
        apps = d["appearances"] or 1
        d["gs_pct"] = round(100.0 * gs / apps, 1)
        rows.append(d)
    return rows


def pitcher_summary_rows(conn: sqlite3.Connection, pitcher_id: int) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        """
        WITH pitcher_pitches AS (
            SELECT * FROM pitches WHERE pitcher_id = :pitcher_id
        ),
        tot AS (
            SELECT COUNT(*) AS total_pitches FROM pitcher_pitches
        )
        SELECT
            pp.pitch_type,
            COUNT(*) AS pitch_count,
            ROUND(100.0 * COUNT(*) / tot.total_pitches, 1) AS usage_pct,
            ROUND(AVG(pp.release_speed), 1) AS avg_speed,
            ROUND(AVG(pp.horizontal_break), 2) AS avg_horizontal_break,
            ROUND(AVG(pp.induced_vertical_break), 2) AS avg_induced_vertical_break,
            ROUND(AVG(pp.spin_rate), 0) AS avg_spin_rate,
            ROUND(AVG(pp.hit_exit_speed), 1) AS avg_hit_exit_speed,
            ROUND(AVG(pp.hit_launch_angle), 1) AS avg_hit_launch_angle,
            ROUND(AVG(pp.plate_location_height), 2) AS avg_plate_location_height,
            ROUND(AVG(pp.plate_location_side), 2) AS avg_plate_location_side
        FROM pitcher_pitches pp
        CROSS JOIN tot
        GROUP BY pp.pitch_type, tot.total_pitches
        ORDER BY pitch_count DESC
        """,
        {"pitcher_id": pitcher_id},
    )
    return [dict(r) for r in cur.fetchall()]


def compute_stuff_score(conn: sqlite3.Connection, pitchers: list[tuple[int, str]]) -> dict:
    if len(pitchers) < 2:
        return {"error": "Need at least 2 pitchers for Stuff Score calculation"}

    ids = [pid for pid, _ in pitchers]
    name_by_id = {pid: name for pid, name in pitchers}
    placeholders = ", ".join("?" for _ in ids)

    # One pass: usage-weighted arsenal averages per pitcher
    cur = conn.cursor()
    cur.execute(
        f"""
        WITH pitcher_pitches AS (
            SELECT *
            FROM pitches
            WHERE pitcher_id IN ({placeholders})
        ),
        totals AS (
            SELECT pitcher_id, COUNT(*) AS total_pitches
            FROM pitcher_pitches
            GROUP BY pitcher_id
        ),
        by_type AS (
            SELECT
                pp.pitcher_id,
                COUNT(*) AS pitch_count,
                AVG(pp.release_speed) AS avg_speed,
                AVG(ABS(pp.horizontal_break)) AS avg_hb,
                AVG(ABS(pp.induced_vertical_break)) AS avg_ivb,
                AVG(pp.spin_rate) AS avg_spin,
                AVG(pp.hit_exit_speed) AS avg_ev,
                AVG(pp.hit_launch_angle) AS avg_la
            FROM pitcher_pitches pp
            GROUP BY pp.pitcher_id, pp.pitch_type
        )
        SELECT
            bt.pitcher_id,
            SUM(bt.pitch_count * bt.avg_speed) / SUM(bt.pitch_count) AS speed,
            SUM(bt.pitch_count * bt.avg_hb) / SUM(bt.pitch_count) AS hb,
            SUM(bt.pitch_count * bt.avg_ivb) / SUM(bt.pitch_count) AS ivb,
            SUM(bt.pitch_count * bt.avg_spin) / SUM(bt.pitch_count) AS spin,
            SUM(bt.pitch_count * COALESCE(bt.avg_ev, 0))
                / NULLIF(SUM(CASE WHEN bt.avg_ev IS NOT NULL THEN bt.pitch_count ELSE 0 END), 0) AS exit_velo,
            SUM(bt.pitch_count * COALESCE(bt.avg_la, 0))
                / NULLIF(SUM(CASE WHEN bt.avg_la IS NOT NULL THEN bt.pitch_count ELSE 0 END), 0) AS launch_angle
        FROM by_type bt
        GROUP BY bt.pitcher_id
        """,
        ids,
    )

    pitcher_stats = []
    for row in cur.fetchall():
        pitcher_id = row[0]
        pitcher_stats.append(
            {
                "pitcher_id": pitcher_id,
                "name": name_by_id.get(pitcher_id, str(pitcher_id)),
                "speed": row[1] or 0.0,
                "hb": row[2] or 0.0,
                "ivb": row[3] or 0.0,
                "spin": row[4] or 0.0,
                "exit_velo": row[5] or 0.0,
                "launch_angle": row[6] or 0.0,
            }
        )

    if len(pitcher_stats) < 2:
        return {"error": "Insufficient data for Stuff Score calculation"}

    def series(key: str, pred):
        vals = [p[key] for p in pitcher_stats if pred(p[key])]
        mean = float(np.mean(vals)) if vals else 0.0
        std = float(np.std(vals)) if vals and len(vals) > 1 else 1.0
        return mean, std if std > 0 else 1.0

    mean_speed, std_speed = series("speed", lambda v: v > 0)
    mean_hb, std_hb = series("hb", lambda v: v > 0)
    mean_ivb, std_ivb = series("ivb", lambda v: v != 0)
    mean_spin, std_spin = series("spin", lambda v: v > 0)
    mean_ev, std_ev = series("exit_velo", lambda v: v > 0)
    mean_la, std_la = series("launch_angle", lambda v: v != 0)

    result = []
    for p in pitcher_stats:
        z_speed = (p["speed"] - mean_speed) / std_speed if p["speed"] > 0 else 0
        z_hb = (p["hb"] - mean_hb) / std_hb if p["hb"] > 0 else 0
        z_ivb = (p["ivb"] - mean_ivb) / std_ivb if p["ivb"] != 0 else 0
        z_spin = (p["spin"] - mean_spin) / std_spin if p["spin"] > 0 else 0
        z_ev = (mean_ev - p["exit_velo"]) / std_ev if p["exit_velo"] > 0 else 0
        z_la = (mean_la - p["launch_angle"]) / std_la if p["launch_angle"] != 0 else 0
        stuff = (
            0.25 * z_speed
            + 0.20 * z_spin
            + 0.20 * z_ivb
            + 0.15 * z_hb
            + 0.10 * z_ev
            + 0.10 * z_la
        )
        result.append(
            {
                "pitcher_id": p["pitcher_id"],
                "name": p["name"],
                "stuff_score": round(stuff, 3),
                "z_speed": round(z_speed, 3),
                "z_spin": round(z_spin, 3),
                "z_ivb": round(z_ivb, 3),
                "z_hb": round(z_hb, 3),
                "z_ev": round(z_ev, 3),
                "z_la": round(z_la, 3),
            }
        )

    result.sort(key=lambda x: x["stuff_score"], reverse=True)
    avg = float(np.mean([r["stuff_score"] for r in result])) if result else 0.0
    return {
        "leaderboard": result,
        "average_stuff_score": round(avg, 3),
        "league_stats": {
            "mean_speed": round(mean_speed, 2),
            "std_speed": round(std_speed, 2),
            "mean_hb": round(mean_hb, 2),
            "std_hb": round(std_hb, 2),
            "mean_ivb": round(mean_ivb, 2),
            "std_ivb": round(std_ivb, 2),
            "mean_spin": round(mean_spin, 0),
            "std_spin": round(std_spin, 0),
            "mean_ev": round(mean_ev, 2),
            "std_ev": round(std_ev, 2),
            "mean_la": round(mean_la, 2),
            "std_la": round(std_la, 2),
        },
    }


# ------------------------- ENDPOINTS -------------------------


@app.get("/teams")
def list_teams():
    return TEAMS


@app.get("/teams/{team_abbrev}/pitchers")
def list_team_pitchers(
    team_abbrev: str,
    role: str = Query(..., pattern="^(starter|reliever)$"),
):
    team = team_abbrev.upper()
    if team not in {t["abbrev"] for t in TEAMS}:
        raise HTTPException(status_code=404, detail=f"Unknown team: {team_abbrev}")
    conn = get_db()
    try:
        rows = classify_pitchers(conn, team=team, role=role)
        return [
            {
                "pitcher_id": r["pitcher_id"],
                "name": r["name"],
                "team_abbrev": r["team_abbrev"],
                "role": r["role"],
                "appearances": r["appearances"],
                "games_started": r["games_started"],
                "gs_pct": r["gs_pct"],
                "pitch_count": r["pitch_count"],
            }
            for r in rows
        ]
    finally:
        conn.close()


@app.get("/free_agents")
def list_free_agent_starters():
    conn = get_db()
    try:
        found = resolve_names_to_ids(conn, FREE_AGENT_STARTERS)
        return [{"pitcher_id": pid, "name": name} for pid, name in found]
    finally:
        conn.close()


@app.get("/free_agents/relief")
def list_free_agent_relievers():
    conn = get_db()
    try:
        found = resolve_names_to_ids(conn, FREE_AGENT_RELIEVERS)
        return [{"pitcher_id": pid, "name": name} for pid, name in found]
    finally:
        conn.close()


@app.get("/pitchers/{pitcher_id}/summary")
def pitcher_summary(pitcher_id: int):
    conn = get_db()
    try:
        rows = pitcher_summary_rows(conn, pitcher_id)
        if not rows:
            raise HTTPException(status_code=404, detail="No pitch data for pitcher")
        return rows
    finally:
        conn.close()


@app.get("/free_agents/stuff_score")
def free_agent_starters_stuff_score():
    conn = get_db()
    try:
        return compute_stuff_score(conn, resolve_names_to_ids(conn, FREE_AGENT_STARTERS))
    finally:
        conn.close()


@app.get("/free_agents/relief/stuff_score")
def free_agent_relievers_stuff_score():
    conn = get_db()
    try:
        return compute_stuff_score(conn, resolve_names_to_ids(conn, FREE_AGENT_RELIEVERS))
    finally:
        conn.close()


@app.get("/mlb/starters/stuff_score")
def mlb_starters_stuff_score():
    conn = get_db()
    try:
        rows = classify_pitchers(conn, role="starter", min_pitches=MIN_PITCHES)
        pitchers = [(r["pitcher_id"], r["name"]) for r in rows]
        return compute_stuff_score(conn, pitchers)
    finally:
        conn.close()


@app.get("/mlb/relievers/stuff_score")
def mlb_relievers_stuff_score():
    conn = get_db()
    try:
        rows = classify_pitchers(conn, role="reliever", min_pitches=MIN_PITCHES)
        pitchers = [(r["pitcher_id"], r["name"]) for r in rows]
        return compute_stuff_score(conn, pitchers)
    finally:
        conn.close()


# Back-compat alias used by older Main tab wiring (optional sample list)
@app.get("/pitchers")
def list_sample_pitchers():
    """Return FA starters as a default list for simple repertoire browsing."""
    return list_free_agent_starters()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
