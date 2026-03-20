# app/database/mongodb.py

from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URL)
db = client["expense_app"]

users_collection = db["users"]
expenses_collection = db["expenses"]

# ---------------------------
# MongoDB helper functions
# ---------------------------

def fetch_all_expenses():
    """Return all expenses in the DB as a list of dicts"""
    return list(expenses_collection.find({}))

def get_user_expenses(user_id: str, expense_id: str = None):
    """
    Return user's expense(s). If expense_id is given, return single expense.
    """
    if expense_id:
        return expenses_collection.find_one({"_id": ObjectId(expense_id), "user_id": user_id})
    else:
        return list(expenses_collection.find({"user_id": user_id}))

def fetch_user_profile(user_email: str):
    """Fetch user profile including salary"""
    return users_collection.find_one({"email": user_email})

def fetch_expenses_by_user(user_email: str):
    """Return all expenses for a specific user by email"""
    expenses = list(expenses_collection.find({"user_email": user_email}))
    for e in expenses:
        e["_id"] = str(e["_id"])  # convert ObjectId to string
    return expenses

