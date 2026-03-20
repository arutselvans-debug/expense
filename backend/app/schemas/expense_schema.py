# app/schemas/expense_schema.py
from pydantic import BaseModel
from typing import Optional

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None
    date: str  # can also use datetime.date if you parse dates
    receipt: Optional[str] = None

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = None
    receipt: Optional[str] = None