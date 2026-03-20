# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import routers
from app.routes import auth, admin, users, expenses, chatbot
from app.routes import tasks

app = FastAPI(title="Expense Management API")

# Allow CORS for frontend (React, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(expenses.router, prefix="/expenses", tags=["Expenses"])
app.include_router(chatbot.router, prefix="/chatbot",tags=["Chatbot"])
app.include_router(tasks.router)

# Optional root route
@app.get("/")
def root():
    return {"message": "Expense Management API is running"}

 

