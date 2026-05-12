from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_farmer
import models, schemas
from datetime import datetime
import sys
from pathlib import Path

# Import the AI prediction function
sys.path.append(str(Path(__file__).resolve().parents[1] / "AI"))
from predict import predict_harvest

router = APIRouter(prefix="/crops", tags=["Crops"])

# Maps crop name and location to the crop_type and season_start
# the AI model expects
CROP_CONFIG = {
    ("Almonds", "Fresno, CA"):        ("almonds",      "2025-02-01"),
    ("Table grapes", "Bakersfield, CA"): ("table_grapes", "2025-04-01"),
}

def get_weather_for_location(location: str, planting_date: str) -> list[dict]:
    """
    Placeholder - replace with a real weather API call.
    Returns fake weather data so the AI can run until
    a weather API is wired in.
    """
    from datetime import date, timedelta
    start = datetime.strptime(planting_date, "%Y-%m-%d").date()
    today = date.today()
    days = (today - start).days + 1
    return [
        {
            "date": str(start + timedelta(days=i)),
            "tmin": 15.0,
            "tmax": 32.0,
        }
        for i in range(max(days, 30))
    ]


def calculate_harvest(name: str, planting_date: str, location: str):
    """
    Calls the AI model to get predicted harvest date and confidence.
    Falls back to a simple estimate if the crop/location combo
    is not supported yet.
    """
    key = (name, location)
    if key not in CROP_CONFIG:
        # Unsupported combo — return a rough estimate and low confidence
        from datetime import date, timedelta
        fallback_date = (
            datetime.strptime(planting_date, "%Y-%m-%d").date()
            + timedelta(days=180)
        )
        return str(fallback_date), 0.50

    crop_type, season_start = CROP_CONFIG[key]
    daily_weather = get_weather_for_location(location, planting_date)

    result = predict_harvest(crop_type, daily_weather, season_start)
    return result["predicted_harvest_date"], result["confidence"]


def compute_status(predicted_harvest_date: str) -> str:
    today = datetime.today().date()
    harvest = datetime.strptime(predicted_harvest_date, "%Y-%m-%d").date()
    days_away = (harvest - today).days

    if days_away <= 14:
        return "AVAILABLE"
    elif days_away <= 60:
        return "HARVEST_SOON"
    else:
        return "FUTURE"


@router.post("/", response_model=schemas.CropResponse)
def create_crop(
    crop: schemas.CropCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_farmer),
):
    farmer = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()

    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    harvest_date, confidence = calculate_harvest(
        crop.name, crop.plantingDate, crop.location
    )
    status = compute_status(harvest_date)

    new_crop = models.Crop(
        farmer_id=farmer.id,
        name=crop.name,
        planting_date=crop.plantingDate,
        predicted_harvest_date=harvest_date,
        confidence_score=confidence,
        price=crop.price,
        quantity=crop.quantity,
        description=crop.description,
        location=crop.location,
        status=status,
    )
    db.add(new_crop)
    db.commit()           # fixed: was missing ()
    db.refresh(new_crop)

    return {
        "id": new_crop.id,
        "name": new_crop.name,
        "plantingDate": new_crop.planting_date,
        "predictedHarvestDate": new_crop.predicted_harvest_date,
        "confid