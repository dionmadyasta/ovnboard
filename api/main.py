from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
MY_USER_ID = os.getenv("MY_USER_ID") # UUID milikmu saja (Ambil di Auth > Users)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not found in environment!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
app = FastAPI(title="OVN Board API")

# Security setup
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifikasi token lewat Supabase Auth Server secara langsung (Native Method)."""
    token = credentials.credentials
    try:
        # Nanya langsung ke Supabase: "Ini token valid nggak?"
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        user_id = user_response.user.id
        
        # Proteksi extra: Hanya ID milikmu yang boleh lewat (Single User App)
        if MY_USER_ID and user_id != MY_USER_ID:
            raise HTTPException(status_code=403, detail="Forbidden: You are not the owner of this workspace")
            
        return user_id
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials via Supabase")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ovnboard-ui.vercel.app", # Replace with your actual prod URL later
    ],
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
    return {"message": "OVN Board API is secure and active"}

@app.get("/tasks")
async def get_tasks(user_id: str = Depends(get_current_user)):
    try:
        # Ambil tasks milik user yang login saja
        response = supabase.table("tasks").select("*").eq("user_id", user_id).order("position").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks")
async def create_task(task: Task, user_id: str = Depends(get_current_user)):
    try:
        # Pastikan user_id di body sama dengan user yang login
        task_data = task.model_dump(exclude_none=True)
        task_data["user_id"] = user_id 
        
        response = supabase.table("tasks").insert(task_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create task")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: dict, user_id: str = Depends(get_current_user)):
    try:
        # Pastikan task yang di-update milik user yang login
        current = supabase.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        if not current.data:
            raise HTTPException(status_code=404, detail="Task not found or unauthorized")

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

        response = supabase.table("tasks").update(update_data).eq("id", task_id).eq("user_id", user_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/reorder")
async def reorder_tasks(payload: list[ReorderItem], user_id: str = Depends(get_current_user)):
    try:
        results = []
        for item in payload:
            res = supabase.table("tasks").update({"position": item.position}).eq("id", item.id).eq("user_id", user_id).execute()
            if res.data:
                results.append(res.data[0])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
        return {"status": "success", "message": "Task deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
