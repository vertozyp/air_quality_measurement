# Wrapper pro Sensirion SCD41 (NDIR CO₂ + T + RH) přes I²C
# Počítá s balíčky: adafruit-circuitpython-scd4x a adafruit-blinka
import time
import board, busio
import adafruit_scd4x

from ..config import ALTITUDE_M

class SCD41Sensor:
    def __init__(self):
        i2c = busio.I2C(board.SCL, board.SDA)
        self._scd = adafruit_scd4x.SCD4X(i2c)

        # volitelně: nadmořská výška kvůli tlaku
        if ALTITUDE_M is not None:
            try:
                self._scd.altitude = int(ALTITUDE_M)
            except Exception:
                pass

        # Spustíme periodická měření; self_test nepoužíváme
        self._scd.start_periodic_measurement()
        time.sleep(5)  # první platné vzorky

    def read(self):
        # pokud jsou data připravena, přečti je; jinak krátce počkej a vrať poslední
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
