# app/models/user_model.py
from bson import ObjectId

def user_helper(user: dict) -> dict:
    """
    Converts MongoDB user document into JSON-safe dict.
    Includes phone number but not sensitive admin-only fields like salary or department.
    """
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "phone": user.get("phone"),
        "salary": user.get("salary", 0)  # new field
        
    }