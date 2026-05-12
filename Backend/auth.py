from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
 
SECRET_KEY = "FarmSync"
ALGORITHM = "HS256"
 
pwd_Context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Fix: was tokenUr1 (number 1) instead of tokenUrl (letter l)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
 
def hash_password(password: str):
    return pwd_Context.hash(password)
 
def verify_password(plain, hashed):
    return pwd_Context.verify(plain, hashed)
 
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
 
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload.get("sub"), "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid Token")
 
def require_farmer(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Farmer":
        raise HTTPException(status_code=403, detail="Farmers Only")
    return current_user
 
def require_buyer(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Buyer":
        raise HTTPException(status_code=403, detail="Buyers Only")
    return current_user