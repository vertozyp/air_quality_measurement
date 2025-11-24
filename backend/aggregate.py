from datetime import datetime, timezone, timedelta
from .db import aggregate_window, upsert_daily_agg

def run_once(now_utc: datetime | None = None):
    now_utc = now_utc or datetime.now(timezone.utc)
    day_midnight = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    end_ts = int(day_midnight.timestamp())            # (day, 00:00 UTC)
    start_ts = end_ts - 24*3600

    agg = aggregate_window(start_ts, end_ts)
    if agg is None:
        print("[aggregate] no data in last 24h, skipping")
        return False

    samples, avg_co2, avg_t, avg_rh = agg
    upsert_daily_agg(day_utc=end_ts, samples=samples, avg_co2=avg_co2, avg_t=avg_t, avg_rh=avg_rh)
    print(f"[aggregate] stored daily avg for {day_midnight.date()} UTC: n={samples}, co2={avg_co2:.1f}")
    return True

if __name__ == "__main__":
    run_once()
