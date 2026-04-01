# ⚡ OVN Board - THE Modern Productivity Workspace

Welcome to **OVN Board**! This is a high-performance, editorial-style Kanban board built for people who want to focus on their work, not on their project management tools.

> **"Built this in 2 hours? Yes. AI as my assistant? Definitely. Custom? Absolutely."**

---

## 🎨 Why I Built OVN Board
Instead of using bloated tools like **Jira, Trello, or Notion**, I built my own. I wanted a system that feels alive, moves fast, and looks premium. Best of all? It's **free**—deployed on **Vercel** serverless, giving me a solid platform with zero hosting costs. 

## 🚀 Key Features

### 📅 WORKSPACE
The heartbeat of the app. A clean, editorial-style board where I focus on today's goals. Move tasks between **Backlog**, **In Progress**, and **Completed** with smooth, responsive drag-and-drop. Focus is the name of the game.

### 🕒 TIMELINE (Gantt Chart)
A Jira-inspired timeline that stretches across the horizon. It helps me find my focus, discover deadlines, and visualize the roadmap of my projects over the coming weeks.

### 📊 INSIGHTS
How productive was I today? The Insights view uses real-time data to calculate my **Productivity Score** and task distribution. It tells me if I’m on fire or if I need to refocus my energy.

---

## 🏗️ The Stack
- **React**: For a lightning-fast, reactive UI.
- **FastAPI**: The robust backend engine.
- **Supabase**: Seamless Auth and real-time Database.
- **Vercel**: Global, serverless deployment.
- **Lucide-React**: Beautiful, modern iconography.

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- **Node.js**: (Version 16+)
- **OVN Board API**: Up and running at `localhost:8000`.

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/dionmadyasta/ovnboard-ui.git
cd ovnboard-ui

# Install dependencies
npm install

# Run the dev server
npm run dev
```

### 3. Environment Setup
Configure your `supabase.js` config with your:
- **SUPABASE_URL**
- **SUPABASE_ANON_KEY**

### 4. Running Locally
Navigate to `http://localhost:5173` to experience the board!

---

## ☁️ Deployment (Vercel)
This app is ready for Vercel. Since it’s purely client-side React, simply:
1. Connect your Github Repo to Vercel.
2. Ensure your Environment Variables match your Supabase config.
3. Deploy!

## 🤝 The Engine
This UI is powered by the **[OVN Board API Repo](https://github.com/dionmadyasta/ovnboard-api)**.

---

### 🔥 Follow the Journey
This is just the start. Because I built it from scratch, I can customize anything I want next. **The board was built for speed, the code was built for growth.**

Built with ⚡ and AI Assistant.
