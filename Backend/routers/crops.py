from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_farmer, require_buyer
import models, schemas
from datetime import datetime
import sys
from pathlib import Path
 
# Fix: correct path to predict.py (AI/src/model/predict.py)
sys.path.append(str(Path(__file__).resolve().parents[2] / "AI" / "src" / "model"))
from predict import predict_harvest
 
router = APIRouter(prefix="/crops", tags=["Crops"])
 
# Maps (crop name, location) → (crop_type for AI model, season_start)
CROP_CONFIG = {
    ("Almonds", "Fresno, CA"): ("almonds", "2025-02-01"),
    ("Table grapes", "Bakersfield, CA"): ("table_grapes", "2025-04-01"),

    ("Corn", "Fresno, CA"): ("corn", "2025-03-15"),
    ("Corn", "Bakersfield, CA"): ("corn", "2025-03-15"),
    ("Corn", "Modesto, CA"): ("corn", "2025-03-15"),

    ("Wine grapes", "Fresno, CA"): ("wine_grapes", "2025-04-01"),
    ("Wine grapes", "Bakersfield, CA"): ("wine_grapes", "2025-04-01"),
    ("Wine grapes", "Modesto, CA"): ("wine_grapes", "2025-04-01"),
}
 
 
def get_weather_for_location(location: str, planting_date: str) -> list[dict]:
    """
    Placeholder — replace with a real weather API call.
    Returns fake weather data so the AI can run until a weather API is wired in.
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
    Falls back to a rough estimate if the crop/location combo is not supported.
    """
    key = (name, location)
    if key not in CROP_CONFIG:
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
 
 
def crop_to_response(crop: models.Crop) -> dict:
    """Serialize a Crop ORM object to the camelCase shape the frontend expects."""
    return {
        "id": crop.id,
        "name": crop.name,
        "plantingDate": crop.planting_date,
        "predictedHarvestDate": crop.predicted_harvest_date,
        "confidenceScore": crop.confidence_score,
        "price": crop.price,
        "quantity": crop.quantity,
        "status": crop.status,
        "location": crop.location,
        "description": crop.description,
    }
 
 
# ── GET /crops/ ──────────────────────────────────────────────────────────────
@router.get("/", response_model=list[schemas.CropResponse])
def get_crops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    farmer = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()
 
    if not farmer:
        raise HTTPException(status_code=404, detail="User not found")
 
    crops = db.query(models.Crop).filter(
        models.Crop.farmer_id == farmer.id
    ).all()
 
    return [crop_to_response(c) for c in crops]
 
 
# ── POST /crops/ ─────────────────────────────────────────────────────────────


# GET /crops/marketplace
@router.get("/marketplace", response_model=list[schemas.CropResponse])
def get_marketplace_crops(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crops = db.query(models.Crop).all()
    return [crop_to_response(c) for c in crops]

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
    db.commit()
    db.refresh(new_crop)
 
    return crop_to_response(new_crop)
 
 
# ── PUT /crops/{id} ──────────────────────────────────────────────────────────
@router.put("/{crop_id}", response_model=schemas.CropResponse)
def update_crop(
    crop_id: int,
    crop: schemas.CropCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_farmer),
):
    farmer = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()
 
    existing = db.query(models.Crop).filter(
        models.Crop.id == crop_id,
        models.Crop.farmer_id == farmer.id,
    ).first()
 
    if not existing:
        raise HTTPException(status_code=404, detail="Crop not found")
 
    harvest_date, confidence = calculate_harvest(
        crop.name, crop.plantingDate, crop.location
    )
    status = compute_status(harvest_date)
 
    existing.name = crop.name
    existing.planting_date = crop.plantingDate
    existing.predicted_harvest_date = harvest_date
    existing.confidence_score = confidence
    existing.price = crop.price
    existing.quantity = crop.quantity
    existing.description = crop.description
    existing.location = crop.location
    existing.status = status
 
    db.commit()
    db.refresh(existing)
 
    return crop_to_response(existing)
 
 
# ── POST /crops/{id}/purchase ────────────────────────────────────────────────
@router.post("/{crop_id}/purchase", response_model=schemas.CropResponse)
def purchase_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_buyer),
):
    """
    Decrements a crop's quantity by 1. Only buyers can call this.
    Returns 400 if the crop is out of stock.
    """
    crop = db.query(models.Crop).filter(models.Crop.id == crop_id).first()

    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    if crop.quantity < 1:
        raise HTTPException(status_code=400, detail="Crop is out of stock")

    crop.quantity -= 1
    db.commit()
    db.refresh(crop)

    return crop_to_response(crop)


# ── DELETE /crops/{id} ───────────────────────────────────────────────────────
@router.delete("/{crop_id}", status_code=204)
def delete_crop(
    crop_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_farmer),
):
    farmer = db.query(models.User).filter(
        models.User.email == current_user["email"]
    ).first()
 
    existing = db.query(models.Crop).filter(
        models.Crop.id == crop_id,
        models.Crop.farmer_id == farmer.id,
    ).first()
 
    if not existing:
        raise HTTPException(status_code=404, detail="Crop not found")
 
    db.delete(existing)
    db.commit()