from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
from typing import List, Dict
import os

from .db import get_latest, get_series

app = FastAPI(title="RPi CO2 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/now")
def api_now() -> Dict:
    row = get_latest()
    if not row:
        raise HTTPException(status_code=404, detail="No data yet")
    ts, co2, t, rh = row
    return {
        "ts": ts,
        "ts_iso": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
        "co2_ppm": co2,
        "temperature_c": t,
        "humidity_rh": rh,
    }

@app.get("/api/series")
def api_series(since_seconds: int = 86400) -> List[Dict]:  # default 24 h
    out = []
    for ts, co2, t, rh in get_series(since_seconds):
        out.append({
            "ts": ts,
            "ts_iso": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
            "co2_ppm": co2,
            "temperature_c": t,
            "humidity_rh": rh,
        })
    return out

# Statická složka s React buildem
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

# Volitelný healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}