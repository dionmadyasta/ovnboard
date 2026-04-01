from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment configurations
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not found in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI(title="OVN Board API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    due_date: str  # Format: YYYY-MM-DD
    status: str    # Options: 'backlog', 'in-progress', 'completed'
    position: Optional[int] = 0
    created_at: Optional[str] = None
    moved_to_progress_at: Optional[str] = None
    moved_to_completed_at: Optional[str] = None

class ReorderItem(BaseModel):
    id: str
    position: int

@app.get("/")
async def root():
    return {"message": "OVN Board API is active"}

@app.get("/tasks")
async def get_tasks():
    try:
        # Fetch tasks sorted by position for consistent ordering
        response = supabase.table("tasks").select("*").order("position").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks")
async def create_task(task: Task):
    try:
        task_data = task.model_dump(exclude_none=True)
        response = supabase.table("tasks").insert(task_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create task")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: dict):
    try:
        # Fetch current record for timestamp logic
        current = supabase.table("tasks").select("*").eq("id", task_id).execute()
        if not current.data:
            raise HTTPException(status_code=404, detail="Task not found")

        old_task = current.data[0]
        update_data = payload.copy()

        if "status" in payload:
            new_status = payload.get("status")
            now = datetime.now(timezone.utc).isoformat()

            if new_status == "backlog":
                update_data["moved_to_progress_at"] = None
                update_data["moved_to_completed_at"] = None
            elif new_status == "in-progress":
                if not old_task.get("moved_to_progress_at"):
                    update_data["moved_to_progress_at"] = now
                update_data["moved_to_completed_at"] = None
            elif new_status == "completed":
                update_data["moved_to_completed_at"] = now

        response = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/reorder")
async def reorder_tasks(payload: list[ReorderItem]):
    try:
        results = []
        for item in payload:
            res = supabase.table("tasks").update({"position": item.position}).eq("id", item.id).execute()
            if res.data:
                results.append(res.data[0])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    try:
        supabase.table("tasks").delete().eq("id", task_id).execute()
        return {"status": "success", "message": "Task deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
