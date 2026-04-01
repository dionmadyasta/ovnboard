# ⚡ OVN BOARD — Productivity Workspace

Welcome to **OVN Board**! Why settle for bloated, slow, and expensive project management tools when you can build a faster, sleek, editorial-style workspace tailored exactly to your flow?

Built from scratch during a late-night sprint with an **AI assistant**, OVN Board is a high-end Kanban ecosystem designed for creators who value speed and focus over complex menus.

---

## 🎨 The Philosophy
Instead of fighting with Jira, Trello, or Notion, I wanted a system that feels **alive**. I built this for myself to track high-stakes goals without the noise. 

> *"Built this in 2 hours? Yes. AI as my navigator? Definitely. Custom? Absolutely."*

### 🚀 Key Features
*   **📅 Workspace**: A distraction-free Kanban board with buttery-smooth drag-and-drop actions. Move tasks from *Backlog* to *Completed* seamlessly. 
*   **🕒 Timeline**: Visualizing the road ahead. A Jira-inspired Gantt chart that helps you spot deadlines and plan your week at a glance.
*   **📊 Insights**: The analytical hub. Real-time data processing to calculate your *Productivity Score* and task distribution—telling you if you're on fire or need to refocus.

---

## 🏗️ The Stack (The Avengers)
This is a modern full-stack application built for performance and global scale:
*   **Frontend**: React + Lucide-React (Fast, reactive, and beautiful UI).
*   **Backend**: FastAPI (A high-performance Python engine for the logic).
*   **Database & Auth**: Supabase (Real-time SQL storage with secure Row Level Security).
*   **Deployment**: Vercel (Global, serverless, and low-latency).

---

## 📁 Project Structure
Clean and modular. This monorepo is easy to navigate:
```bash
ovnboard/
├── api/   # FastAPI Backend (The Engine)
└── ui/    # React Frontend (The Face)
```

---

## 🏗️ Database Setup
To get OVN Board running, you need to set up your **Supabase** database. Open your Supabase SQL Editor and run the following command to create the tasks table with Row Level Security:

```sql
-- 1. Create the Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'backlog',
    position INTEGER DEFAULT 0, -- Used for custom task ordering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    moved_to_progress_at TIMESTAMPTZ,
    moved_to_completed_at TIMESTAMPTZ
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create a Policy: Users can only manage their own tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);
```

---

## 🛠️ Quick Start

### 1. The Engine (Backend)
```bash
# Configure .env in /api with your SUPABASE_URL & KEY
cd api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 2. The Face (Frontend)
```bash
# Ensure the API is running on localhost:8000
cd ui
npm install
npm run dev
```
Navigate to `http://localhost:5173` and get into the flow! 🚀

---

### 🔥 The Journey Continues
This is just the foundation. Because I built this from the ground up, I can customize anything I want next. **The board was built for speed, the code was built for growth.**


