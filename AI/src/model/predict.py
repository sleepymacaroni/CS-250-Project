from pathlib import Path
import pandas as pd
import joblib
import numpy as np

# model features
FEATURES = [
    "cumulative_gdd",
    "season_day",
    "temp_mean_7d",
    "temp_std_7d",
    "gdd_sum_7d"
]

# tracking crop base temps (when over base temp = add gdd)
CROP_CONFIG = {
    "almonds": {
        "base_temp_c": 10.0,
    },
    "table_grapes": {
        "base_temp_c": 10.0,
    },
    "corn": {
        "base_temp_c": 10.0,
    },
    "wine_grapes": {
        "base_temp_c": 10.0,
    },
}

def add_gdd_columns(df: pd.DataFrame, base_temp_c: float = 10.0) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["tmin"] = pd.to_numeric(df["tmin"], errors="coerce")
    df["tmax"] = pd.to_numeric(df["tmax"], errors="coerce")

    df["tavg"] = (df["tmin"] + df["tmax"]) / 2.0
    df["daily_gdd"] = np.maximum(0.0, df["tavg"] - base_temp_c)

    return df

def add_cumulative_gdd(df: pd.DataFrame, season_start_date: str) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    season_start = pd.to_datetime(season_start_date)

    df = df.sort_values("date")
    df["season_day"] = (df["date"] - season_start).dt.days

    #only accumulate from season start onward
    df["daily_gdd_in_season"] = np.where(df["season_day"] >= 0, df["daily_gdd"], 0.0)
    df["cumulative_gdd"] = df["daily_gdd_in_season"].cumsum()
    df = df.drop(columns=["daily_gdd_in_season"])

    return df

def add_prediction_features(df: pd.DataFrame) -> pd.DataFrame:
 # add rolling 7 day features
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    df["temp_mean_7d"] = (
        df["tavg"]
        .rolling(7, min_periods=1)
        .mean()
    )

    df["temp_std_7d"] = (
        df["tavg"]
        .rolling(7, min_periods=1)
        .std()
        .fillna(0.0)
    )

    df["gdd_sum_7d"] = (
        df["daily_gdd"]
        .rolling(7, min_periods=1)
        .sum()
    )

    return df


def build_prediction_row(df: pd.DataFrame) -> pd.DataFrame:
    latest_row = df.sort_values("date").tail(1).copy()
    return latest_row[FEATURES]

def load_model_for_crop(crop_type: str):
    #choose the crop model based on inputted crop type
    project_root = Path(__file__).resolve().parents[2]
    model_map = {
        "almonds":      project_root / "models" / "almond_rf.joblib",
        "table_grapes": project_root / "models" / "table_grape_rf.joblib",
        "corn":         project_root / "models" / "corn_rf.joblib",
        "wine_grapes":  project_root / "models" / "wine_grape_rf.joblib",
    }
    if crop_type not in model_map:
        raise ValueError(f"Unsupported crop type: {crop_type}")

    model_path = model_map[crop_type]
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found for crop type '{crop_type}':{model_path}")
    saved = joblib. load(model_path)
    return saved["model"]

def predict_with_confidence(model, X_pred: pd.DataFrame):
    # get confidence score by looking at the disagreements between trees (how much they disagree)
    X_array = X_pred.values
    tree_preds = np.array([
        tree.predict(X_array)[0] for tree in model.estimators_
    ])

    predicted_days = float(tree_preds.mean())
    lower_days = float(np.percentile(tree_preds, 10))
    upper_days = float(np.percentile(tree_preds, 90))

    std = float(tree_preds.std())
    confidence = float(np.exp(-std / 10.0))

    return predicted_days, lower_days, upper_days, confidence

def predict_harvest(crop_type: str, daily_weather: list[dict], season_start_date: str) -> dict:
    # API function
    """
    Predict what day the plant should be harvested based on what crop it is

    Inputs:
        - crop_type supported crop name
        - daily_weather columns are date, tmin, tmax
        - season_start_date yyyy-mm-dd

    Returns: dictionary containing
        - crop type
        - current/ prediction date
        - predicted number of days to harvest
        - predicted harvest date
        - confidence
        - range start
        - range end
    """

    if not daily_weather:
        raise ValueError("daily_weather is empty")
    df = pd.DataFrame(daily_weather)
    df.columns = df.columns.astype(str).str.strip().str.lower()

    required_cols = {"date", "tmin", "tmax"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"daily_weather missing required columns: {missing}")

    if crop_type not in CROP_CONFIG:
        raise ValueError(f"Unsupported crop type: {crop_type}")

    # make base temp the correct degree based on crop type
    base_temp_c = CROP_CONFIG[crop_type]["base_temp_c"]
    df = add_gdd_columns(df, base_temp_c=base_temp_c)
    df = add_cumulative_gdd(df, season_start_date=season_start_date)
    df = add_prediction_features(df)

    #only use rows from season start onward
    df = df[df["season_day"] >= 0].copy()
    if df.empty:
        raise ValueError("No weather rows on or after season_start_date")

    X_pred = build_prediction_row(df)
    latest_date = pd.to_datetime(df["date"].max())

    model = load_model_for_crop(crop_type)
    predicted_days, lower_days, upper_days, confidence = predict_with_confidence(model, X_pred)

    predicted_harvest_date = latest_date + pd.Timedelta(days=predicted_days)
    earliest_date = latest_date + pd.Timedelta(days=lower_days)
    latest_range_date = latest_date + pd.Timedelta(days=upper_days)

    return {
    "crop_type": crop_type,
    "prediction_date": str(latest_date.date()),
    "predicted_days_to_harvest": round(predicted_days, 2),
    "predicted_harvest_date": str(predicted_harvest_date.date()),
    "confidence": round(confidence, 2),
    "range_start": str(earliest_date.date()),
    "range_end": str(latest_range_date.date())
}
