# app/routers/tasks.py

from fastapi import APIRouter, Depends, HTTPException
from app.models.task import Task
from app.database.mongodb import db  # ✅ your existing db
from app.utils.helpers import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/tasks", tags=["Tasks"])

# ✅ Add task
@router.post("/add")
def add_task(task: Task, current_user=Depends(get_current_user)):
    task_data = {
        "title": task.title,
        "start": task.start,
        "user_id": current_user["email"],
        "created_at": datetime.utcnow()
    }
    result = db["tasks"].insert_one(task_data)  # ✅ no await
    return {"message": "Task added", "id": str(result.inserted_id)}

# ✅ Get all tasks
@router.get("/my-tasks")
def get_tasks(current_user=Depends(get_current_user)):
    tasks = list(db["tasks"].find(  # ✅ no await, wrap in list()
        {"user_id": current_user["email"]}
    ))
    for t in tasks:
        t["id"] = str(t["_id"])
        del t["_id"]
    return tasks

# ✅ Delete task
@router.delete("/delete/{task_id}")
def delete_task(task_id: str, current_user=Depends(get_current_user)):
    result = db["tasks"].delete_one({  # ✅ no await
        "_id": ObjectId(task_id),
        "user_id": current_user["email"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}