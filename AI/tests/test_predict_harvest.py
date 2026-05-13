"""
Test harness for FarmSync AI harvest prediction models.

Calls predict_harvest() from AI/src/model/predict.py and verifies two
behaviors:

  (1) STABILITY — for a fixed planting date, the model's predicted harvest
      date should stay roughly consistent as the prediction is run at
      different points during the growing season. A model that wildly
      changes its forecast as more weather arrives is not trustworthy.

  (2) PER-CROP SANITY — each trained crop (corn, wine_grapes, almonds,
      table_grapes) should predict harvest within its real-world California
      Central Valley harvest window when planted at a realistic time.

Weather inputs are synthetic daily Fresno temperatures generated from NOAA
30-year monthly climate normals plus Gaussian noise, matching the
distribution the models were trained on (see AI/src/model/train_corn.py).

How to run:
    AI/.venv/bin/python -W ignore AI/tests/test_predict_harvest.py 2>/dev/null
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

# Resolve project paths from this file's location, so the test works
# regardless of where the repo is cloned.
PROJECT_AI = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_AI / "src" / "model"))
from predict import predict_harvest  # noqa: E402

# Fresno, CA monthly climate normals (tmin_c, tmax_c) - NOAA 30-yr
FRESNO_MONTHLY = {
    1:  (2.2,  13.3),  2:  (4.0,  16.1),  3:  (5.6,  18.9),  4:  (7.8,  22.8),
    5:  (10.6, 27.8),  6:  (13.9, 32.8),  7:  (16.7, 36.7),  8:  (15.6, 35.6),
    9:  (13.3, 32.2), 10: (8.9,  25.6), 11: (4.4,  18.3), 12: (2.2,  13.3),
}


def synth_weather(start_date: str, end_date: str, seed: int = 42) -> list[dict]:
    """Generate daily weather rows from start_date to end_date inclusive."""
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start=start_date, end=end_date, freq="D")
    rows = []
    for d in dates:
        m = d.month
        tmin_base, tmax_base = FRESNO_MONTHLY[m]
        tmin = tmin_base + rng.normal(0, 2.0)
        tmax = tmax_base + rng.normal(0, 2.5)
        rows.append({"date": d.strftime("%Y-%m-%d"),
                     "tmin": float(tmin),
                     "tmax": float(tmax)})
    return rows


EXPECTED_HARVEST_WINDOW = {
    "corn":         "late Jul - early Aug",
    "wine_grapes":  "mid Jul - early Sep",
    "almonds":      "Aug - early Oct",
    "table_grapes": "Jul - early Oct",
}


def run_one(crop: str, planting_date: str, prediction_date: str) -> dict:
    """Run predict_harvest and return its result dict."""
    weather = synth_weather(planting_date, prediction_date)
    return predict_harvest(crop, weather, planting_date)


def print_row(crop, planting, predict_at, r):
    rng_s = f"{r['range_start']} -> {r['range_end']}"
    print(f"{crop:<14}{planting:<13}{predict_at:<18}"
          f"{r['predicted_harvest_date']:<15}"
          f"{r['predicted_days_to_harvest']:>6.1f} {r['confidence']:>6.2f}   "
          f"{rng_s:<26}{EXPECTED_HARVEST_WINDOW[crop]:<22}")


def header():
    h = (f"{'CROP':<14}{'PLANTED':<13}{'PREDICTED ON':<18}"
         f"{'PRED HARVEST':<15}"
         f"{'DAYS':>6} {'CONF':>6}   {'HARVEST RANGE':<26}{'EXPECTED IRL':<22}")
    print(h)
    print("-" * len(h))


def main() -> int:
    print("=" * 120)
    print("FarmSync AI Model Test Harness  -  predict_harvest()")
    print("Weather: synthetic Fresno NOAA climate normals + Gaussian noise (seed=42)")
    print("=" * 120)

    # ============================================================
    # TEST 1: STABILITY
    # Plant corn April 1. Run prediction at June 15, July 15, and
    # August 5. Predicted harvest date should be roughly the same
    # in all three runs.
    # ============================================================
    print()
    print("TEST 1 - Stability across the season (same planting date, 3 prediction times)")
    print("Expected: predicted harvest date stays roughly constant; DAYS shrinks toward 0")
    print()
    header()
    for predict_at in ("2026-06-15", "2026-07-15", "2026-08-05"):
        r = run_one("corn", "2026-04-01", predict_at)
        print_row("corn", "2026-04-01", predict_at, r)

    # ============================================================
    # TEST 2: PER-CROP SANITY
    # Plant each of the 4 supported crops on April 1 and predict
    # at mid-July (mid-season). Each predicted harvest date should
    # fall in that crop's real-world Central Valley window.
    # ============================================================
    print()
    print("TEST 2 - All 4 crops, planted Apr 1, predicted mid-season")
    print("Expected: each prediction lands inside the EXPECTED IRL column")
    print()
    header()
    for crop in ("corn", "wine_grapes", "almonds", "table_grapes"):
        r = run_one(crop, "2026-04-01", "2026-07-15")
        print_row(crop, "2026-04-01", "2026-07-15", r)

    print()
    print("Legend:")
    print("  PLANTED       = season start date passed to predict_harvest()")
    print("  PREDICTED ON  = the last day of weather data fed to the model")
    print("                  (treated as 'today' for the prediction)")
    print("  PRED HARVEST  = model's predicted harvest date")
    print("  DAYS          = predicted days from PREDICTED ON until harvest")
    print("  CONF          = confidence 0.00-1.00, from inter-tree agreement")
    print("                  in the random forest")
    print("  HARVEST RANGE = 10th-90th percentile harvest dates across the trees")
    print("  EXPECTED IRL  = real-world harvest window for that crop in the")
    print("                  California Central Valley")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
