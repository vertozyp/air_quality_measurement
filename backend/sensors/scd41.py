import time
import board, busio
import adafruit_scd4x

from ..config import ALTITUDE_M

class SCD41Sensor:
    def __init__(self):
        i2c = busio.I2C(board.SCL, board.SDA)
        self._scd = adafruit_scd4x.SCD4X(i2c)

        # setting altitude for more precise measurements
        if ALTITUDE_M is not None:
            try:
                self._scd.altitude = int(ALTITUDE_M)
            except Exception:
                pass

        # start periodic measurements
        self._scd.start_periodic_measurement()
        time.sleep(5)

    def read(self):
        # if data is ready, read it, otherwise wait a while and return last measured data
        if getattr(self._scd, "data_ready", False):
            return {
                "co2": float(self._scd.CO2),
                "temperature": float(self._scd.temperature),
                "humidity": float(self._scd.relative_humidity),
            }
        time.sleep(0.2)
        return {
            "co2": float(self._scd.CO2),
            "temperature": float(self._scd.temperature),
            "humidity": float(self._scd.relative_humidity),
        }
