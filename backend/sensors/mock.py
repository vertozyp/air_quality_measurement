import math, random, time

class MockSensor:
    def __init__(self):
        self._t0 = time.time()
        self._base_co2 = 800.0
        self._base_rh = 45.0
        self._base_t = 22.0

    def read(self):
        t = time.time() - self._t0
        co2 = self._base_co2 + 150 * math.sin(t / 300) + random.uniform(-20, 20)
        rh = self._base_rh + 5 * math.sin(t / 600) + random.uniform(-2, 2)
        temp = self._base_t + 0.5 * math.sin(t / 900) + random.uniform(-0.2, 0.2)
        return {
            "co2": max(400.0, co2),
            "temperature": temp,
            "humidity": max(20.0, min(80.0, rh)),
        }