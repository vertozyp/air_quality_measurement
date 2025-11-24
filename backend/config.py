import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / ".." / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = os.getenv("CO2_DB_PATH", str(DATA_DIR / "co2.sqlite"))
SAMPLE_SECONDS = int(os.getenv("CO2_SAMPLE_SECONDS", "30"))
SENSOR_KIND = os.getenv("CO2_SENSOR", "mock")  # "mock" or "scd41"

ALTITUDE_M = os.getenv("CO2_ALTITUDE_M")  # např. "250"
ALTITUDE_M = int(ALTITUDE_M) if ALTITUDE_M else None