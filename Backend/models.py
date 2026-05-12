from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="customer")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    planting_date = Column(String, nullable=False)
    predicted_harvest_date = Column(String, nullable=True)
    confidence_score = Column(Float, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)        # added
    status = Column(String, default="FUTURE")       # fixed: was "Future", should match FUTURE/HARVEST_SOON/AVAILABLE
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # fixed: was missing ()