# models/task.py
from pydantic import BaseModel
from typing import Optional

class Task(BaseModel):
    title: str
    start: str  # datetime string
    user_id: str
