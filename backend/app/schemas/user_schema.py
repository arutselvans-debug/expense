from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UpdateUserProfile(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = 0