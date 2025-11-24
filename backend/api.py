from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import os

from .db import get_latest, get_series, get_settings, set_settings

app = FastAPI(title="RPi CO2 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Thresholds(BaseModel):
    co2_ppm: float = Field(..., ge=300, le=5000)
    humidity_pct: float = Field(..., ge=0, le=100)

class ThresholdsIn(BaseModel):
    co2_ppm: Optional[float] = Field(None, ge=300, le=5000)
    humidity_pct: Optional[float] = Field(None, ge=0, le=100)


@app.get("/api/thresholds", response_model=Thresholds)
def api_get_thresholds() -> Dict:
    s = get_settings(["co2_threshold_ppm", "humidity_threshold_pct"])
    return {
        "co2_ppm": float(s.get("co2_threshold_ppm", "1000")),
        "humidity_pct": float(s.get("humidity_threshold_pct", "60")),
    }

@app.put("/api/thresholds", response_model=Thresholds)
def api_set_thresholds(patch: ThresholdsIn) -> Dict:
    # načti současné, přepiš patch hodnotami a ulož
    cur = api_get_thresholds()
    if patch.co2_ppm is not None:
        cur["co2_ppm"] = float(patch.co2_ppm)
    if patch.humidity_pct is not None:
        cur["humidity_pct"] = float(patch.humidity_pct)
    set_settings({
        "co2_threshold_ppm": str(cur["co2_ppm"]),
        "humidity_threshold_pct": str(cur["humidity_pct"]),
    })
    return cur

@app.get("/api/now")
def api_now() -> Dict:
    row = get_latest()
    if not row:
        raise HTTPException(status_code=404, detail="No data yet")
    ts, co2, t, rh = row
    thr = api_get_thresholds()
    return {
        "ts": ts,
        "ts_iso": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
        "co2_ppm": co2,
        "temperature_c": t,
        "humidity_rh": rh,
        "thresholds": thr,
        "alerts": {
            "co2_high": (co2 is not None) and (co2 >= thr["co2_ppm"]),
            "humidity_high": (rh is not None) and (rh >= thr["humidity_pct"]),
        },
    }

@app.get("/api/series")
def api_series(since_seconds: int = 86400) -> List[Dict]:
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

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

@app.get("/health")
def health():
    return {"status": "ok"}