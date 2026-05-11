from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_farmer
import models, schemas
from datetime import datetime, timedelta

router = APIRouter(prefix="/crops", tags=["Crops"])

def calculate_harvest(name: str, planting_date:str):
    """Simple"""

@router.post("/",response_model=schemas.CropResponse)
def create_crop(
        crop: schemas.CropCreate,
        db: Session = Depends(get_db),
        current_user: dict = Depends(require_farmer)
):

    farmer = db.query(models.User).filter(models.User.email == current_user["email"]).first()
    harvest_date, confidence = calculate_harvest(crop.name, crop.planting_date)

    new_crop = models.Crop(
        farmer_id=farmer.id,
        name=crop.name,
        planting_date=crop.plantingDate,
        predicted_harvest_date=harvest_date,
        confidence_score=confidence,
        price=crop.price,
        quantity=crop.quantity,
        description=crop.description,
        status="FUTURE"
    )
    db.add(new_crop)
    db.commit()
    db.refresh(new_crop)
    return {
        "id": new_crop.id,
        "name": new_crop.name,
        "plantingDate": new_crop.planting_date,
        "confidence_score": new_crop.confidence_score,
        "price": new_crop.price,
        "quantity": new_crop.quantity,
        "status": new_crop.status,
        "description": new_crop.description
    }

@router.get("/", response_model=list[schemas.CropResponse])
def get_crops(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    crops = db.query(models.Crop).all()
    return [
        {
            "id": c.id, "name": c.name, "plantingDate": c.planting_date,
            "predictedHarvestDate": c.predicted_harvest_date, "confidenceScore": c.confidence_score,
            "price": c.price, "quantity": c.quantity, "status": c.status, "description": c.description
        } for c in crops
    ]