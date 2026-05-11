"""
Corn harvest prediction model trainer.

Uses synthetic California Central Valley (Fresno) weather data because the
meteostat API is unreliable after recloning (known issue from Group 2 handoff).
Temperature profiles are derived from NOAA 30-year climate normals for Fresno, CA.

Corn GDD base: 10°C. Typical harvest threshold: ~1350 GDD (base 10) in the
Central Valley, reached late August to mid-September.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Fresno, CA monthly climate normals (tmin_c, tmax_c)
FRESNO_MONTHLY = {
    1:  (2.2,  13.3),
    2:  (4.0,  16.1),
    3:  (5.6,  19.4),
    4:  (8.3,  24.4),
    5:  (12.2, 29.4),
    6:  (16.7, 35.6),
    7:  (19.4, 38.9),
    8:  (18.9, 37.8),
    9:  (15.6, 33.9),
    10: (10.6, 27.2),
    11: (5.0,  18.3),
    12: (2.2,  13.3),
}

SEASON_START_MONTH = 4   # April 1
SEASON_START_DAY   = 1
GDD_BASE           = 10.0
GDD_HARVEST_MEAN   = 1350.0
GDD_HARVEST_STD    = 90.0
YEARS              = list(range(2010, 2025))

FEATURES = [
    "cumulative_gdd",
    "season_day",
    "temp_mean_7d",
    "temp_std_7d",
    "gdd_sum_7d",
]


def _generate_year_weather(year: int) -> pd.DataFrame:
    """Generate weather with a consistent year-level bias."""
    year_bias = np.random.normal(0, 1.0)
    dates, tmins, tmaxs = [], [], []
    for month in range(1, 13):
        base_tmin, base_tmax = FRESNO_MONTHLY[month]
        days_in_month = pd.Period(f"{year}-{month:02d}").days_in_month
        for day in range(1, days_in_month + 1):
            dates.append(pd.Timestamp(year, month, day))
            tmins.append(round(base_tmin + np.random.normal(0, 2.0) + year_bias, 2))
            tmaxs.append(round(base_tmax + np.random.normal(0, 2.5) + year_bias, 2))
    return pd.DataFrame({"date": dates, "tmin": tmins, "tmax": tmaxs})


def add_features(df: pd.DataFrame, season_start: pd.Timestamp) -> pd.DataFrame:
    df = df.copy()
    df["tavg"]      = (df["tmin"] + df["tmax"]) / 2.0
    df["daily_gdd"] = np.maximum(0.0, df["tavg"] - GDD_BASE)
    df["season_day"] = (df["date"] - season_start).dt.days
    df["daily_gdd_in_season"] = np.where(df["season_day"] >= 0, df["daily_gdd"], 0.0)
    df["cumulative_gdd"] = df["daily_gdd_in_season"].cumsum()
    df["temp_mean_7d"] = df["tavg"].rolling(7, min_periods=1).mean()
    df["temp_std_7d"]  = df["tavg"].rolling(7, min_periods=1).std().fillna(0.0)
    df["gdd_sum_7d"]   = df["daily_gdd"].rolling(7, min_periods=1).sum()
    return df


def build_training_rows(df: pd.DataFrame, harvest_doy: int, year: int) -> pd.DataFrame:
    """Build one training row per season day up to harvest."""
    harvest_date = pd.Timestamp(year, 1, 1) + pd.Timedelta(days=harvest_doy - 1)
    season = df[df["season_day"] >= 0].copy()
    season = season[season["date"] <= harvest_date].copy()
    season["days_to_harvest"] = (harvest_date - season["date"]).dt.days
    return season[FEATURES + ["days_to_harvest"]]


def simulate_harvest_doy(df: pd.DataFrame) -> int:
    """Find the calendar DOY when cumulative GDD crosses the harvest threshold."""
    threshold = np.random.normal(GDD_HARVEST_MEAN, GDD_HARVEST_STD)
    crossed = df[df["cumulative_gdd"] >= threshold]
    if crossed.empty:
        return df["date"].iloc[-1].timetuple().tm_yday
    return crossed.iloc[0]["date"].timetuple().tm_yday


def main():
    all_rows = []
    for year in YEARS:
        season_start = pd.Timestamp(year, SEASON_START_MONTH, SEASON_START_DAY)
        df = _generate_year_weather(year)
        df = add_features(df, season_start)
        harvest_doy = simulate_harvest_doy(df)
        rows = build_training_rows(df, harvest_doy, year)
        rows["year"] = year
        all_rows.append(rows)

    data = pd.concat(all_rows, ignore_index=True)
    data = data.dropna(subset=FEATURES + ["days_to_harvest"])

    test_years  = YEARS[-3:]
    train_years = [y for y in YEARS if y not in test_years]

    train = data[data["year"].isin(train_years)]
    test  = data[data["year"].isin(test_years)]

    X_train, y_train = train[FEATURES], train["days_to_harvest"]
    X_test,  y_test  = test[FEATURES],  test["days_to_harvest"]

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
    )
    model.fit(X_train, y_train)

    for yr in test_years:
        subset = test[test["year"] == yr]
        mae = mean_absolute_error(subset["days_to_harvest"], model.predict(subset[FEATURES]))
        print(f"  Year {yr} MAE: {mae:.1f} days")

    overall_mae = mean_absolute_error(y_test, model.predict(X_test))
    print(f"Overall test MAE: {overall_mae:.1f} days")

    importances = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)
    print("\nFeature importances:")
    print(importances.to_string())

    out_path = Path(__file__).resolve().parents[2] / "models" / "corn_rf.joblib"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES}, out_path)
    print(f"\nModel saved to {out_path}")


if __name__ == "__main__":
    main()
