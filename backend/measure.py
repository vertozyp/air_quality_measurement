"""Collector – periodicky čte ze senzoru a ukládá do SQLite."""
import argparse, time, signal, sys
from datetime import datetime, timezone

from .config import SAMPLE_SECONDS
from .db import insert_reading
from .sensors import MockSensor, SCD41Sensor

RUNNING = True

def _handle_signal(signum, frame):
    global RUNNING
    RUNNING = False

signal.signal(signal.SIGINT, _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sensor", choices=["mock", "scd41"], default="mock")
    parser.add_argument("--interval", type=int, default=SAMPLE_SECONDS)
    args = parser.parse_args()

    if args.sensor == "scd41":
        if SCD41Sensor is None:
            print("SCD41 knihovna není dostupná – nainstaluj adafruit-circuitpython-scd4x a adafruit-blinka.")
            sys.exit(1)
        sensor = SCD41Sensor()
    else:
        sensor = MockSensor()

    print(f"Collector start – sensor={args.sensor}, interval={args.interval}s")

    while RUNNING:
        now_utc = int(time.time())
        data = sensor.read()
        insert_reading(now_utc, data["co2"], data["temperature"], data["humidity"])
        ts = datetime.fromtimestamp(now_utc, tz=timezone.utc).isoformat()
        print(f"{ts}  CO2={data['co2']:.0f}ppm  T={data['temperature']:.2f}°C  RH={data['humidity']:.1f}%")
        for _ in range(args.interval):
            if not RUNNING:
                break
            time.sleep(1)

if __name__ == "__main__":
    main()