# CSE Study Planner

A modern, responsive full-stack web application designed for Computer Science Engineering (CSE) students to streamline their academic life. It enables students to manage tasks, track subject attendance with warning indicators, log DSA problems, calculate semesters SGPA/CGPA, take subject-wise notes, and monitor study analytics.

## 🚀 Features

- **Authentication & Sessions**: Secure user registration, login, session cookies, and password hashing (`pbkdf2:sha256`).
- **Student Dashboard**: Animated study streak indicator, today's due tasks list, overall completion progress, and quick-access warnings for attendance.
- **Task Management**: CRUD operations for tasks with due dates, priority sorting (Low, Medium, High), and subject association.
- **Subject & Attendance Tracker**: Interactive cards for CSE subjects (DSA, DBMS, OS, CN, etc.) with quick-log attendance (`Present` / `Absent`) buttons. Shows warning tags when attendance drops below **75%**.
- **DSA Progress Tracker**: Curated roadmap containing essential Easy, Medium, and Hard coding questions (from LeetCode, CodeChef, HackerRank) to solve and check off, plus custom solves logging.
- **CGPA Calculator**: Academic semester recorder with a visual overall CGPA radial gauge and estimated percentage equivalents.
- **Study Notes Split-Pane**: Clean Notion-like editor to write markdown study notes, searchable by keywords and filterable by subjects.
- **Analytics & Charts**: Live-updating Chart.js line, bar, and doughnut visualizations showing weekly study activity, subject progress, and DSA metrics (adapts automatically to Light/Dark modes).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (React), Tailwind CSS, Lucide React, Chart.js, `react-chartjs-2`.
- **Backend**: Python Flask.
- **Database**: SQLite.
- **API Proxy**: Rewrites proxy configured in Next.js (`next.config.mjs`) to transparently route `/api/*` calls to the Flask backend, preventing CORS issues.

---

## 📂 Project Structure

```text
CSE-Study-Planner/
├── backend/
│   ├── .venv/              # Python virtual environment
│   ├── app.py              # Flask server and API endpoints
│   ├── db.py               # SQLite schema and CRUD database helper
│   ├── requirements.txt    # Python requirements (Flask, Flask-Cors)
│   └── test_app.py         # Backend integration test suite
└── frontend/
    ├── next.config.mjs     # API rewrites proxy configuration
    ├── package.json        # NPM dependencies (lucide-react, chart.js, react-chartjs-2)
    └── src/
        ├── components/
        │   └── AppShell.js # Sidebar, theme toggle, and auth route protection
        └── app/
            ├── layout.js   # Main App shell layout
            ├── globals.css # HSL Design System, Light/Dark styling, scrollbars
            ├── page.js     # Dashboard View
            ├── login/      # Auth screen (Login & Register toggles)
            ├── tasks/      # Task management page
            ├── subjects/   # Subject cards and attendance logs
            ├── dsa/        # DSA tracker page
            ├── cgpa/       # Academic CGPA average page
            ├── notes/      # Note taking editor page
            └── analytics/  # Analytics dashboard page
```

---

## ⚡ Getting Started & Installation

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.10.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Set Up the Backend
Open a terminal in the `backend/` directory:

1. **Create a virtual environment**:
   ```bash
   python -m venv .venv
   ```

2. **Activate the virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **Windows (cmd.exe)**:
     ```cmd
     .venv\Scripts\activate.bat
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend server**:
   ```bash
   python app.py
   ```
   *The Flask API server will start on `http://127.0.0.1:5000`.*

---

### 2. Set Up the Frontend
Open a separate terminal in the `frontend/` directory:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```
   *The Next.js frontend will start on `http://localhost:3000`.*

---

## 🧪 Running Tests

To verify that the database CRUD operations, auth flow, and REST API endpoints are functional, run the Python backend test suite:

Ensure your virtual environment is active in the `backend/` directory, then run:
```bash
python -m unittest test_app.py
```

---

## 💡 Port Map Summary

- **Frontend Application**: `http://localhost:3000`
- **Backend API Server**: `http://127.0.0.1:5000`
- **Database File**: `backend/database.db` (automatically generated on startup)
