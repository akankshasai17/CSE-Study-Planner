# CSE Study Planner 🎓

A full-stack web application designed for Computer Science & Engineering (CSE) students to organize their study timetable, track core subject syllabi, practice curated LeetCode problems, manage personal study tasks, and maintain study focus with an interactive Pomodoro timer.

Built strictly with the specified technology stack: **React.js, HTML, CSS, JavaScript, Node.js, Express.js, MongoDB Atlas (with Mongoose), JWT authentication with HttpOnly cookies, and bcrypt password hashing**.

> **Note on Architecture**: The project is entirely independent of Python, Machine Learning, Flask, or external AI/ML services. The stack is 100% JavaScript/Node.js MERN.

---

## 🌟 Key Application Features

1. **Authentication & Data Isolation**
   - Sign up with validation (matching passwords, minimum 6 characters, valid email).
   - Sign in with password verification via `bcryptjs`.
   - JWT authentication stored in secure `HttpOnly` cookies (with bearer token fallback).
   - Complete multi-user data privacy: all study sessions, tasks, LeetCode records, and syllabus progress belong exclusively to the authenticated student.

2. **Student Dashboard**
   - Personalized welcome message and current date.
   - Quick stat cards: Pending Tasks, Solved LeetCode Questions, Syllabus Completion %, and Weekly Study Hours Goal Progress.
   - Today's timetable sessions with clear identification of the next upcoming session.
   - Quick navigation links to Add Session, View LeetCode Questions, and View Core Syllabus.
   - Integrated 25-minute Pomodoro focus timer with instant session logging.

3. **Study Timetable**
   - Schedule study sessions by subject, topic, date, start time, end time, and optional notes.
   - End-time after start-time validation.
   - Flexible view modes: **Day View**, **Week View**, and **All Sessions**.
   - Chronological sorting and "Next Session" identification.
   - Mark sessions as Completed or Pending, edit existing sessions, or delete them.
   - Add custom subjects or select from standard CSE courses.

4. **Curated LeetCode Practice Tracker**
   - Curated starter library of 55+ fundamental DSA questions across all **14 key topics**:
     *Arrays, Strings, Hashing, Two Pointers, Sliding Window, Binary Search, Linked Lists, Stack, Queue, Trees, Graphs, Recursion, Backtracking, Dynamic Programming.*
   - Categorized by difficulty: **Easy**, **Medium**, and **Hard**.
   - Direct, authentic links to LeetCode problems (e.g., `https://leetcode.com/problems/two-sum/`).
   - Mark questions as **Not Started**, **Attempted**, or **Solved**.
   - Filter by Topic, Difficulty, Status, or keyword search.
   - Option to add custom LeetCode questions.

5. **Core Subjects Syllabus Tracker**
   - Complete starter syllabus for the **7 essential CSE Core Subjects**:
     1. Data Structures and Algorithms (DSA)
     2. Database Management Systems (DBMS)
     3. Operating Systems (OS)
     4. Computer Networks (CN)
     5. Design and Analysis of Algorithms (DAA)
     6. Computer Organization and Architecture (COA)
     7. Object-Oriented Programming (OOP)
   - Detailed modules and individual subtopics.
   - Mark topics as **Pending**, **In Progress**, or **Completed**.
   - Dynamic real-time calculation of subject-wise completion percentage.
   - Fully customizable: students can add custom modules, add topics, or delete topics according to their university curriculum.

6. **Personal Study Tasks**
   - Create tasks with title, description, priority (**Low**, **Medium**, **High**), and due dates.
   - Filter tasks by status and priority or search by keyword.
   - Toggle completion status or edit/delete tasks.

7. **25-Minute Focus Timer & Weekly Study Goals**
   - Standard 25-minute Pomodoro timer with start, pause, and reset controls.
   - "Log Session" button saves completed study blocks directly to the database.
   - Set weekly study hour targets (e.g. 15 hours/week) in student profile and track progress.

8. **Progress Overview**
   - Visual breakdown of study sessions and total hours logged.
   - LeetCode solve rate and difficulty distribution (Easy, Medium, Hard).
   - Core subjects syllabus completion progress matrix.
   - Task completion rate.

---

## 📁 Clean Project Architecture

```
study-planner/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection with local/Atlas fallback
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Logout, Profile update
│   │   ├── dashboardController.js# Dashboard statistics and summary
│   │   ├── focusController.js    # 25-minute focus session logging
│   │   ├── leetcodeController.js # Curated & custom LeetCode questions
│   │   ├── progressController.js # Learning analytics and breakdown
│   │   ├── subjectController.js  # 7 Core CSE subjects & syllabus CRUD
│   │   ├── taskController.js     # Personal study tasks CRUD
│   │   └── timetableController.js# Study sessions with time validation
│   ├── data/
│   │   └── starterData.js        # Curated LeetCode questions & 7 Core Subjects
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification from HttpOnly cookie or Bearer
│   │   └── errorMiddleware.js    # Not found and error handlers
│   ├── models/
│   │   ├── FocusSession.js       # Focus log schema
│   │   ├── LeetCodeProblem.js    # LeetCode question and progress schema
│   │   ├── StudySession.js       # Timetable study session schema
│   │   ├── Subject.js            # Core subject, modules, and topics schema
│   │   ├── Task.js               # Personal study task schema
│   │   └── User.js               # Student authentication schema with bcrypt
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── focusRoutes.js
│   │   ├── leetcodeRoutes.js
│   │   ├── progressRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── timetableRoutes.js
│   ├── server.js                 # Express application entry point
│   ├── test_api.js               # End-to-end verification test suite
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── FocusTimer.jsx# Reusable 25-minute focus timer
│   │   │   └── layout/
│   │   │       └── Layout.jsx    # Sidebar navigation, top header, user badge
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication context & session persistence
│   │   ├── pages/
│   │   │   ├── CoreSubjects.jsx  # 7 Core CSE Subjects Syllabus page
│   │   │   ├── Dashboard.jsx     # Main student dashboard
│   │   │   ├── LeetCodePractice.jsx # LeetCode questions practice page
│   │   │   ├── Login.jsx         # Sign In page
│   │   │   ├── Profile.jsx       # Student profile & goal setting
│   │   │   ├── Progress.jsx      # Progress overview page
│   │   │   ├── Register.jsx      # Sign Up page
│   │   │   ├── Tasks.jsx         # Personal study tasks page
│   │   │   └── Timetable.jsx     # Study timetable (day & week view)
│   │   ├── services/
│   │   │   └── api.js            # Axios client with credentials & API methods
│   │   ├── App.jsx               # React Router routes setup
│   │   ├── index.css             # Pure vanilla CSS styles (No Tailwind)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js            # Vite configuration with proxy to backend
│   └── package.json
│
├── start-backend.bat             # 1-click backend launcher for Windows
├── start-frontend.bat            # 1-click frontend launcher for Windows
├── package.json
└── README.md
```

---

## 🚀 Setup & Local Development Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Either local MongoDB server (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.

### 2. Environment Variables Configuration
In `backend/.env` (see `backend/.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/cse_study_planner?retryWrites=true&w=majority
JWT_SECRET=your_secret_jwt_key_here
NODE_ENV=development
```
*(If you are running MongoDB locally on port 27017, set `MONGODB_URI=mongodb://127.0.0.1:27017/cse_study_planner`)*

### 3. Installation
Open a terminal in the root directory and install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Running the Application
Run backend and frontend in separate terminals:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Backend runs at: http://localhost:5000
```
*(On Windows, you can also double-click `start-backend.bat`)*

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Frontend runs at: http://localhost:5173
```
*(On Windows, you can also double-click `start-frontend.bat`)*

---

## 🌐 Localhost URLs

| Component | URL | Notes |
|---|---|---|
| **Frontend Application** | `http://localhost:5173` | Main user interface |
| **Backend REST API** | `http://localhost:5000` | Express REST server |
| **API Health Check** | `http://localhost:5000/api/health` | Live server & DB health monitor |

---

## 🧪 Automated End-to-End Verification

To re-run the complete verification suite:
```bash
node backend/test_api.js
```
All tests run natively in Node.js without any Python or ML dependencies.
#   C S E - S t u d y - P l a n n e r  
 #   C S E - S t u d y - P l a n n e r  
 