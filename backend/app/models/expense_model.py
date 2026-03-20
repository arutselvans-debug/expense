# app/models/expense_model.py

from bson import ObjectId

def expense_helper(expense: dict) -> dict:
    """
    Converts MongoDB expense document into JSON-friendly dictionary
    """
    return {
        "id": str(expense["_id"]),
        "user_email": expense.get("user_email"),
        "category": expense.get("category"),
        "amount": expense.get("amount"),
        "date": expense.get("date")
    }