from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "buyer"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    id: int
    full_name: str
    email: str


class CropCreate(BaseModel):
    name: str
    plantingDate: str
    location: str
    price: float
    quantity: int
    description: Optional[str] = None


class CropResponse(BaseModel):
    id: int
    name: str
    plantingDate: str
    predictedHarvestDate: Optional[str] = None
    confidenceScore: Optional[float] = None
    price: float
    quantity: int
    status: str
    location: str
    description: Optional[str] = None

    class Config:
        from_attributes = True