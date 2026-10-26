# CSE Study Planner — Complete Academic & Coding Productivity Web Application

**CSE Study Planner** is a full-stack web application built specifically for **Computer Science & Engineering (CSE)** students to manage their semester subjects, syllabus topics, regular college class timetable, personal study schedule, rule-based automatic study schedule generation, assignments/tasks, examinations, 19-topic DSA practice tracker, Pomodoro focus sessions, and real-time study analytics.

---

## 1. Technology Stack

### Frontend
- **React 18** + **Vite 6** + **TypeScript 5.6**
- **Tailwind CSS 3.4** (with Light & Dark Engineering themes)
- **Lucide React** icons
- **Recharts** for interactive analytics charts
- **React Router v6** for protected & public routing
- **Axios** API client with JWT authentication interceptors
- **React Hook Form** + **Zod** for schema-based form validation

### Backend
- **Python 3.13** + **FastAPI**
- **SQLAlchemy 2.x** ORM with **SQLite** database (`cse_study_planner.db`)
- **Pydantic v2** + **pydantic-settings** for request/response validation & environment configuration
- **bcrypt** for salted password hashing + **PyJWT** (`HS256`) for bearer token authentication
- **Pytest** + **HTTPX** for automated API & integration testing

---

## 2. Project Folder Structure

```text
CSE study planner/
├── backend/
│   ├── .venv/                         # Local Python virtual environment
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Environment variable settings
│   │   │   ├── deps.py                # Auth bearer guard & user ownership dependency
│   │   │   └── security.py            # bcrypt password hashing & JWT token utilities
│   │   ├── models/
│   │   │   └── models.py              # 14 Relational SQLAlchemy models & indexes
│   │   ├── routers/
│   │   │   ├── auth.py                # Register, Login, Profile, Password, Notifications
│   │   │   ├── subjects.py            # Subjects CRUD, 12 CSE defaults, Syllabus Topics, Hours logging
│   │   │   ├── timetable.py           # Weekly/Day/Agenda views, College & Personal CRUD, Recurrence, Conflict Check, Rule-Based Schedule Generator
│   │   │   ├── study_planner.py       # Study Plans, Goals, Exam-to-Plan generator, Timetable linking
│   │   │   ├── tasks.py               # Tasks & Assignments CRUD, Overdue detection, Timetable session scheduling
│   │   │   ├── exams.py               # Exams CRUD, Conflict detection, Countdown, Revision Schedule Generator
│   │   │   ├── dsa.py                 # 19-Topic DSA Tracker CRUD, Weak topic radar, Activity chart
│   │   │   ├── pomodoro.py            # Focus session saving & Subject/Task hour auto-increment
│   │   │   └── analytics.py           # Real-time Dashboard, 9-Chart Analytics Report, Unified Calendar, Alerts
│   │   ├── schemas/
│   │   │   └── schemas.py             # Pydantic v2 validation schemas
│   │   ├── services/
│   │   │   ├── analytics_service.py   # Real database calculations, streaks, daily/weekly/monthly aggregations
│   │   │   ├── conflict_service.py    # Time-overlap detection & recurring event expansion
│   │   │   └── scheduler_service.py   # Deterministic Rule-Based Study Schedule Generator
│   │   ├── database.py                # SQLAlchemy engine, session factory, SQLite FK pragma
│   │   └── main.py                    # FastAPI app, CORS configuration, lifespan table creation
│   ├── tests/
│   │   └── test_api.py                # Automated Pytest suite covering all modules & user isolation
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/ui/             # Reusable Modal and ConfirmDialog components
│   │   ├── context/                   # AuthContext, ThemeContext, ToastContext, PomodoroContext
│   │   ├── features/
│   │   │   ├── auth/                  # LoginPage & RegisterPage
│   │   │   ├── dashboard/             # DashboardPage (8 summary cards, charts, today's schedule & tasks)
│   │   │   ├── subjects/              # SubjectsPage (CRUD, 12 default CSE courses, syllabus tracker)
│   │   │   ├── timetable/             # TimetablePage (Week/Day/Agenda/College views, Conflict modal, Generator)
│   │   │   ├── study-planner/         # StudyPlannerPage (Daily/Weekly/Custom/Exam plans & goals)
│   │   │   ├── tasks/                 # TasksPage (List & Kanban Board views, overdue alerts)
│   │   │   ├── exams/                 # ExamsPage (Countdowns, conflict warnings, revision generator)
│   │   │   ├── dsa/                   # DsaTrackerPage (19 CSE topics, complexity notes, weak topics)
│   │   │   ├── pomodoro/              # PomodoroPage (Persistent focus timer, subject/task linking)
│   │   │   ├── analytics/             # AnalyticsPage (9 Recharts charts, streaks, date range filters)
│   │   │   └── settings/              # SettingsPage (Profile, study preferences, notifications, password)
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx          # Responsive sidebar, top bar, notifications popover, Master Calendar modal
│   │   ├── services/
│   │   │   └── api.ts                 # Axios client with Bearer token interceptor
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 3. Windows Setup & Running Instructions (PowerShell)

### Prerequisites
- **Python 3.11+** (verified with Python 3.13.7) — [Download Python](https://www.python.org/downloads/)
- **Node.js 18+** (verified with Node.js v22.20.0 & npm 11.7.0) — [Download Node.js](https://nodejs.org/)

### Step 1: Set Up and Run the Backend (Terminal 1)

Open a **Windows PowerShell** terminal in the project root (`c:\Users\Akanksha Sai\OneDrive\Documents\CSE study planner`):

```powershell
# 1. Navigate to the backend directory
cd "c:\Users\Akanksha Sai\OneDrive\Documents\CSE study planner\backend"

# 2. Create the Python virtual environment (if not already created)
python -m venv .venv

# 3. Install backend dependencies inside the virtual environment
.\.venv\Scripts\pip.exe install -r requirements.txt

# 4. Copy .env.example to .env if .env does not exist
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 5. Start the FastAPI backend server on http://localhost:8000
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API Base URL**: `http://localhost:8000`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- **SQLite Database**: Automatically initialized at `backend/cse_study_planner.db` on startup while preserving all existing records across restarts.

### Step 2: Set Up and Run the Frontend (Terminal 2)

Open a **second Windows PowerShell** terminal in the project root:

```powershell
# 1. Navigate to the frontend directory
cd "c:\Users\Akanksha Sai\OneDrive\Documents\CSE study planner\frontend"

# 2. Install frontend npm dependencies
npm install

# 3. Copy .env.example to .env if .env does not exist
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 4. Start the Vite development server on http://localhost:5173
npm run dev
```

- **Frontend Application URL**: `http://localhost:5173`

---

## 4. Running Automated Tests & Production Builds

```powershell
# Run the Backend Pytest Suite (from the workspace root)
.\backend\.venv\Scripts\pytest.exe backend\tests\test_api.py -v

# Run the Frontend TypeScript & Vite Production Build
npm --prefix frontend run build
```

---

## 5. Creating Your First Account & Using the Timetable

1. Open **`http://localhost:5173`** in your browser.
2. Click **"Create a student account"** (`/register`), enter your **Full Name**, **Email**, **College Name**, **Semester**, and **Password**, and click **Create Account**.
3. On the **Dashboard** (or **My Subjects** page), click **"Import Default CSE Subjects"** to select from 12 pre-configured CSE courses (*Data Structures and Algorithms, DBMS, Operating Systems, Computer Networks, DAA, OOP, Software Engineering, Computer Organization, Web Development, AI, Machine Learning, Mathematics*) complete with chapters and syllabus topics—or create your own custom subjects.
4. Go to **Timetable** (`/timetable`):
   - Click **"College Setup"** or **"+ Add College Class"** to add your regular weekly lectures and labs.
   - Click **"+ Add Study Session"** to add one-time or recurring personal study sessions (*Daily, Weekdays, Selected Days, or Weekly*). Overlapping times automatically trigger the **Conflict Detection Warning** with details of the conflicting slot.
   - Click **"Auto-Generate Study Schedule"** to run the **Deterministic Rule-Based Study Schedule Generator**, preview the proposed conflict-free study blocks, and click **Accept & Save to Timetable**.

---

## 6. Troubleshooting Common Errors on Windows

1. **`Unable to reach backend server at http://localhost:8000`**:
   - Ensure Terminal 1 is running `.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload` inside the `backend` folder.
   - Check that `frontend/.env` contains `VITE_API_BASE_URL=http://localhost:8000`.
2. **PowerShell Execution Policy blocks `Activate.ps1`**:
   - You do not need to run `Activate.ps1`; invoke binaries directly using `.\.venv\Scripts\python.exe`, `.\.venv\Scripts\pip.exe`, `.\.venv\Scripts\uvicorn.exe`, and `.\.venv\Scripts\pytest.exe`.
3. **Port 8000 or 5173 already in use**:
   - Check running processes with `Get-NetTCPConnection -LocalPort 8000,5173` and stop any old process before restarting.

---

## 7. Deploying to Render and Vercel

The repository includes a Render Blueprint at `render.yaml` and Vercel SPA routing in `frontend/vercel.json`.

### Deploy the backend to Render

1. In Render, create a new **Blueprint** and select this GitHub repository. Render reads `render.yaml` from the repository root.
2. When prompted for `FRONTEND_ORIGIN`, enter a temporary value such as `https://example.com`. Replace it with the Vercel production origin after deploying the frontend.
3. The Blueprint creates a Python web service with a persistent disk mounted at `/var/data`; the SQLite database is stored on that disk so it survives deploys and restarts. The persistent disk requires Render's paid Starter plan.
4. After the service is live, verify `https://<your-render-service>.onrender.com/api/health` and copy the service's base URL.

### Deploy the frontend to Vercel

1. Import this GitHub repository as a new Vercel project.
2. Set **Root Directory** to `frontend`.
3. Add the environment variable `VITE_API_BASE_URL` with the Render service base URL, for example `https://cse-study-planner-api.onrender.com` (do not add `/api`).
4. Deploy the project. Vercel uses `frontend/vercel.json` to serve the app correctly on direct navigation to client-side routes.

### Connect the deployments

1. Copy the Vercel production origin (for example, `https://cse-study-planner.vercel.app`, without a trailing slash).
2. In Render, open the backend service's environment settings and set `FRONTEND_ORIGIN` to that origin. Multiple origins can be comma-separated.
3. Save the environment change and let Render redeploy. Register an account and test the app against the deployed API.

Keep the generated Render `SECRET_KEY` private. Do not commit production environment values to the repository.
