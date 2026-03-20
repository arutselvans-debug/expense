# app/routes/admin.py
from fastapi import APIRouter, Depends, HTTPException
from app.database.mongodb import users_collection, expenses_collection
from bson import ObjectId
from app.models.user_model import user_helper
from app.utils.helpers import require_admin

router = APIRouter(tags=["Admin"])

# Helper to convert expense documents
def expense_helper(expense) -> dict:
    return {
        "id": str(expense["_id"]),
        "user_email": expense["user_email"],
        "category": expense.get("category"),
        "amount": expense.get("amount"),
        "description": expense.get("description"),
        "date": expense.get("date"),
        "receipt": expense.get("receipt"),
    }

# Get all users (Admin only)
@router.get("/users")
def get_all_users(admin_user=Depends(require_admin)):
    users = users_collection.find()
    return [user_helper(user) for user in users]

# Get all expenses (Admin only)
@router.get("/all-expenses")
def get_all_expenses(admin_user=Depends(require_admin)):
    expenses = expenses_collection.find()
    return [expense_helper(exp) for exp in expenses]