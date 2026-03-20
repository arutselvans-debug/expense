# app/routes/users.py
from fastapi import APIRouter, Depends, HTTPException
from app.database.mongodb import users_collection
from app.models.user_model import user_helper
from app.utils.helpers import get_current_user
from app.schemas.user_schema import UpdateUserProfile

router = APIRouter(tags=["Users"])

# Get own profile
@router.get("/profile")
def get_profile(current_user=Depends(get_current_user)):
    user = users_collection.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_helper(user)


# Update own profile (e.g., add/edit phone)
@router.put("/profile")
def update_profile(
    update_data: UpdateUserProfile,
    current_user=Depends(get_current_user)
):
    update_fields = update_data.dict(exclude_unset=True)

    result = users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": update_fields}
    )

    updated_user = users_collection.find_one({"email": current_user["email"]})

    return user_helper(updated_user)