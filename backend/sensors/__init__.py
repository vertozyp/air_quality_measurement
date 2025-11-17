from .mock import MockSensor

try:
    from .scd41 import SCD41Sensor
except Exception as e:
    import sys, traceback
    print("SCD41 import error:", e, file=sys.stderr)
    traceback.print_exc()
    SCD41Sensor = None  # type: ignore
