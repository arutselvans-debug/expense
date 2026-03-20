# app/routes/expense_routes.py
from fastapi import APIRouter, Depends, HTTPException
from app.database.mongodb import expenses_collection
from bson import ObjectId
from app.utils.helpers import get_current_user
from app.schemas.expense_schema import ExpenseCreate, ExpenseUpdate

router = APIRouter(tags=["Expenses"])


# Helper to convert MongoDB document to JSON-safe dict
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


# Add a new expense

@router.post("/add")
def add_expense(expense: ExpenseCreate, current_user=Depends(get_current_user)):
    data = expense.dict()
    data["user_email"] = current_user["email"]
    result = expenses_collection.insert_one(data)
    created_expense = expenses_collection.find_one({"_id": result.inserted_id})
    return expense_helper(created_expense)

# Get all expenses for current user
@router.get("/my-expenses")
def get_my_expenses(current_user=Depends(get_current_user)):
    expenses = expenses_collection.find({"user_email": current_user["email"]})
    return [expense_helper(exp) for exp in expenses]


# Update an expense (only if owned by current user)
@router.put("/update/{expense_id}")
def update_expense(expense_id: str, update_data: ExpenseUpdate, current_user=Depends(get_current_user)):
    expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Cannot edit others' expenses")

    # Only update fields that are provided
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        expenses_collection.update_one({"_id": ObjectId(expense_id)}, {"$set": update_dict})

    updated_expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})
    return expense_helper(updated_expense)


# Delete an expense (only if owned by current user)
@router.delete("/delete/{expense_id}")
def delete_expense(expense_id: str, current_user=Depends(get_current_user)):
    expense = expenses_collection.find_one({"_id": ObjectId(expense_id)})

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense["user_email"] != current_user["email"]:
        raise HTTPException(status_code=403, detail="Cannot delete others' expenses")

    expenses_collection.delete_one({"_id": ObjectId(expense_id)})
    return {"message": "Expense deleted"}