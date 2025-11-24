import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable, Optional, Tuple, Dict
import time

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts_utc INTEGER NOT NULL,
    co2_ppm REAL NOT NULL,
    temperature_c REAL,
    humidity_rh REAL
);
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts_utc);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_agg (
    day_utc INTEGER PRIMARY KEY,
    avg_co2_ppm REAL NOT NULL,
    avg_temperature_c REAL,
    avg_humidity_rh REAL,
    samples INTEGER NOT NULL
);
"""

Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)

@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()

# DB initialization + default values
with get_conn() as conn:
    conn.executescript(SCHEMA)
    # default limits – CO₂ 1000 ppm, moisture 60 %
    conn.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('co2_threshold_ppm','1000')")
    conn.execute("INSERT OR IGNORE INTO settings(key,value) VALUES('humidity_threshold_pct','60')")
    conn.commit()


def insert_reading(ts_utc: int, co2: float, t: float, rh: float) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO readings(ts_utc, co2_ppm, temperature_c, humidity_rh) VALUES (?, ?, ?, ?)",
            (ts_utc, co2, t, rh),
        )
        conn.commit()


def get_latest() -> Optional[Tuple[int, float, float, float]]:
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT ts_utc, co2_ppm, temperature_c, humidity_rh FROM readings ORDER BY ts_utc DESC LIMIT 1"
        )
        row = cur.fetchone()
        return row if row else None


def get_series(since_seconds: int) -> Iterable[Tuple[int, float, float, float]]:
    cutoff = int(time.time()) - int(since_seconds)
    with get_conn() as conn:
        cur = conn.execute(
            "SELECT ts_utc, co2_ppm, temperature_c, humidity_rh FROM readings WHERE ts_utc >= ? ORDER BY ts_utc ASC",
            (cutoff,),
        )
        yield from cur.fetchall()

# ---------- settings ----------

def get_settings(keys: Optional[Iterable[str]] = None) -> Dict[str, str]:
    q = "SELECT key, value FROM settings"
    params: Tuple = ()
    if keys:
        placeholders = ",".join(["?"] * len(list(keys)))
        q += f" WHERE key IN ({placeholders})"
        params = tuple(keys)
    with get_conn() as conn:
        cur = conn.execute(q, params)
        return {k: v for k, v in cur.fetchall()}


def set_settings(updates: Dict[str, str]) -> None:
    if not updates:
        return
    with get_conn() as conn:
        conn.executemany(
            "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            list(updates.items()),
        )
        conn.commit()

def prune_readings_older_than(cutoff_ts_utc: int) -> int:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM readings WHERE ts_utc < ?", (cutoff_ts_utc,))
        conn.commit()
        return cur.rowcount

def aggregate_window(ts_from_utc: int, ts_to_utc: int):
    with get_conn() as conn:
        cur = conn.execute(
            """
            SELECT COUNT(*) AS n,
                   AVG(co2_ppm) AS a_co2,
                   AVG(temperature_c) AS a_t,
                   AVG(humidity_rh) AS a_rh
            FROM readings
            WHERE ts_utc >= ? AND ts_utc < ?
            """,
            (ts_from_utc, ts_to_utc),
        )
        n, a_co2, a_t, a_rh = cur.fetchone()
        if not n or a_co2 is None:
            return None
        return int(n), float(a_co2), (None if a_t is None else float(a_t)), (None if a_rh is None else float(a_rh))

def upsert_daily_agg(day_utc: int, samples: int, avg_co2: float, avg_t: float | None, avg_rh: float | None):
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO daily_agg(day_utc, avg_co2_ppm, avg_temperature_c, avg_humidity_rh, samples)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(day_utc) DO UPDATE SET
                avg_co2_ppm=excluded.avg_co2_ppm,
                avg_temperature_c=excluded.avg_temperature_c,
                avg_humidity_rh=excluded.avg_humidity_rh,
                samples=excluded.samples
            """,
            (day_utc, avg_co2, avg_t, avg_rh, samples),
        )
        conn.commit()