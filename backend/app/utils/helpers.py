# app/utils/helpers.py
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from app.database.mongodb import users_collection  # make sure this import exists

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

security = HTTPBearer()

# Get current logged-in user from JWT
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")
        role = payload.get("role")
        if email is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": email, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Admin role check
def require_admin(current_user: dict = Depends(get_current_user)):
    """
    Raises 403 if current user is not admin.
    Returns full admin user document from MongoDB.
    """
    user = users_collection.find_one({"email": current_user.get("email")})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user