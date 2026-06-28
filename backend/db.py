import sqlite3
import os
from datetime import datetime, timedelta
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

@contextmanager
def db_session():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with db_session() as conn:
        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON;")
        
        # Users Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                streak INTEGER DEFAULT 0,
                last_active_date TEXT
            );
        """)
        
        # Subjects Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                color TEXT NOT NULL,
                attended_classes INTEGER DEFAULT 0,
                total_classes INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        
        # Tasks Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                subject_id INTEGER,
                priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
                due_date TEXT,
                completed INTEGER DEFAULT 0,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
            );
        """)
        
        # DSA Tracker Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS dsa_problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                platform TEXT NOT NULL,
                difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
                solved_date TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        
        # CGPA Calculator Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sgpa_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                semester INTEGER NOT NULL,
                sgpa REAL NOT NULL,
                UNIQUE(user_id, semester),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        
        # Notes Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subject_id INTEGER,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
            );
        """)
        
        conn.commit()

CORE_SUBJECTS = [
    {
        "name": "Data Structures and Algorithms",
        "code": "DSA",
        "color": "#EF4444",
        "topics": [
            "Study Arrays, Linked Lists, Stack, and Queue basics",
            "Master Recursion, Backtracking, and Dynamic Programming",
            "Learn Sorting & Searching algorithms (Binary Search, Merge Sort)",
            "Understand Tree & Graph Traversals (BFS, DFS, Dijkstra's)"
        ]
    },
    {
        "name": "Database Management Systems",
        "code": "DBMS",
        "color": "#3B82F6",
        "topics": [
            "Understand ER Diagrams & Relational Algebra",
            "Master SQL Queries (Joins, Subqueries, Aggregations)",
            "Study Database Normalization (1NF, 2NF, 3NF, BCNF)",
            "Learn Transactions & ACID Properties (Concurrency Control)"
        ]
    },
    {
        "name": "Operating Systems",
        "code": "OS",
        "color": "#10B981",
        "topics": [
            "Learn Process Scheduling algorithms (FIFO, Round Robin, SRTF)",
            "Understand CPU Synchronization & Deadlocks (Banker's Algorithm)",
            "Study Memory Management (Paging, Segmentation, Page Replacement)",
            "Explore File Systems & Storage Structure"
        ]
    },
    {
        "name": "Computer Networks",
        "code": "CN",
        "color": "#F59E0B",
        "topics": [
            "Understand the OSI Model & TCP/IP Protocol Suite",
            "Learn IP Addressing, Subnetting, and Routing Protocols",
            "Study TCP vs UDP & Flow Control (Sliding Window)",
            "Explore Application Layer Protocols (HTTP, DNS, SMTP)"
        ]
    },
    {
        "name": "Object Oriented Programming",
        "code": "OOP",
        "color": "#8B5CF6",
        "topics": [
            "Learn Four Pillars: Encapsulation, Abstraction, Inheritance, Polymorphism",
            "Master Classes, Objects, Constructors, and Destructors",
            "Understand Interfaces, Abstract Classes, and Method Overriding",
            "Study Exception Handling and Memory Allocation"
        ]
    },
    {
        "name": "Artificial Intelligence",
        "code": "AI",
        "color": "#EC4899",
        "topics": [
            "Study Search Algorithms (Uninformed, Informed, A* Search)",
            "Learn Knowledge Representation and Propositional Logic",
            "Understand Machine Learning Basics (Supervised & Unsupervised)",
            "Explore Neural Networks & Deep Learning Concepts"
        ]
    }
]

def seed_core_subjects(conn, user_id):
    for sub in CORE_SUBJECTS:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO subjects (user_id, name, code, color, attended_classes, total_classes) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, sub["name"], sub["code"], sub["color"], 0, 0)
        )
        subject_id = cursor.lastrowid
        
        for topic in sub["topics"]:
            cursor.execute(
                "INSERT INTO tasks (user_id, title, subject_id, priority, due_date, completed, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, topic, subject_id, 'Medium', None, 0, None)
            )

def create_user(username, name, password_hash):
    try:
        with db_session() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, name, password_hash, last_active_date) VALUES (?, ?, ?, ?)",
                (username, name, password_hash, None)
            )
            user_id = cursor.lastrowid
            
            # Auto-seed core subjects and tasks
            seed_core_subjects(conn, user_id)
            
            conn.commit()
            return user_id
    except sqlite3.IntegrityError:
        return None

def get_user_by_username(username):
    with db_session() as conn:
        return conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

def get_user_by_id(user_id):
    with db_session() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

def record_user_activity(user_id):
    """
    Increments streak if active on consecutive days.
    Resets to 1 if streak is broken.
    No change if already active today.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    with db_session() as conn:
        user = conn.execute("SELECT streak, last_active_date FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return
            
        current_streak = user['streak']
        last_active = user['last_active_date']
        
        if last_active == today_str:
            # Already active today, streak stays same
            return
        elif last_active == yesterday_str:
            # Active on consecutive day, increment streak
            new_streak = current_streak + 1
        else:
            # Streak broken or first activity, set to 1
            new_streak = 1
            
        conn.execute(
            "UPDATE users SET streak = ?, last_active_date = ? WHERE id = ?",
            (new_streak, today_str, user_id)
        )
        conn.commit()

# --- Subjects Operations ---

def get_subjects(user_id):
    with db_session() as conn:
        return conn.execute("SELECT * FROM subjects WHERE user_id = ?", (user_id,)).fetchall()

def add_subject(user_id, name, code, color):
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO subjects (user_id, name, code, color) VALUES (?, ?, ?, ?)",
            (user_id, name, code, color)
        )
        conn.commit()
        return cursor.lastrowid

def update_subject(user_id, subject_id, name, code, color):
    with db_session() as conn:
        conn.execute(
            "UPDATE subjects SET name = ?, code = ?, color = ? WHERE id = ? AND user_id = ?",
            (name, code, color, subject_id, user_id)
        )
        conn.commit()

def delete_subject(user_id, subject_id):
    with db_session() as conn:
        conn.execute("DELETE FROM subjects WHERE id = ? AND user_id = ?", (subject_id, user_id))
        conn.commit()

def update_attendance(user_id, subject_id, attended, total):
    with db_session() as conn:
        conn.execute(
            "UPDATE subjects SET attended_classes = ?, total_classes = ? WHERE id = ? AND user_id = ?",
            (attended, total, subject_id, user_id)
        )
        conn.commit()

# --- Tasks Operations ---

def get_tasks(user_id):
    with db_session() as conn:
        return conn.execute("""
            SELECT t.*, s.name as subject_name, s.color as subject_color 
            FROM tasks t 
            LEFT JOIN subjects s ON t.subject_id = s.id 
            WHERE t.user_id = ?
            ORDER BY t.due_date ASC, t.id DESC
        """, (user_id,)).fetchall()

def add_task(user_id, title, subject_id, priority, due_date):
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (user_id, title, subject_id, priority, due_date) VALUES (?, ?, ?, ?, ?)",
            (user_id, title, subject_id, priority, due_date)
        )
        conn.commit()
        record_user_activity(user_id)
        return cursor.lastrowid

def update_task(user_id, task_id, title, subject_id, priority, due_date, completed):
    completed_at = None
    if completed:
        completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    with db_session() as conn:
        conn.execute(
            """UPDATE tasks 
               SET title = ?, subject_id = ?, priority = ?, due_date = ?, completed = ?, completed_at = ? 
               WHERE id = ? AND user_id = ?""",
            (title, subject_id, priority, due_date, completed, completed_at, task_id, user_id)
        )
        conn.commit()
        if completed:
            record_user_activity(user_id)

def delete_task(user_id, task_id):
    with db_session() as conn:
        conn.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
        conn.commit()

# --- DSA Tracker Operations ---

def get_dsa_problems(user_id):
    with db_session() as conn:
        return conn.execute(
            "SELECT * FROM dsa_problems WHERE user_id = ? ORDER BY solved_date DESC, id DESC",
            (user_id,)
        ).fetchall()

def add_dsa_problem(user_id, title, platform, difficulty, solved_date):
    if not solved_date:
        solved_date = datetime.now().strftime("%Y-%m-%d")
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO dsa_problems (user_id, title, platform, difficulty, solved_date) VALUES (?, ?, ?, ?, ?)",
            (user_id, title, platform, difficulty, solved_date)
        )
        conn.commit()
        record_user_activity(user_id)
        return cursor.lastrowid

def delete_dsa_problem(user_id, problem_id):
    with db_session() as conn:
        conn.execute("DELETE FROM dsa_problems WHERE id = ? AND user_id = ?", (problem_id, user_id))
        conn.commit()

# --- CGPA Calculator Operations ---

def get_sgpa_records(user_id):
    with db_session() as conn:
        return conn.execute("SELECT * FROM sgpa_records WHERE user_id = ? ORDER BY semester ASC", (user_id,)).fetchall()

def add_sgpa_record(user_id, semester, sgpa):
    with db_session() as conn:
        cursor = conn.cursor()
        # Insert or replace to handle updates
        cursor.execute(
            "INSERT OR REPLACE INTO sgpa_records (user_id, semester, sgpa) VALUES (?, ?, ?)",
            (user_id, semester, sgpa)
        )
        conn.commit()
        return cursor.lastrowid

def delete_sgpa_record(user_id, record_id):
    with db_session() as conn:
        conn.execute("DELETE FROM sgpa_records WHERE id = ? AND user_id = ?", (record_id, user_id))
        conn.commit()

# --- Notes Operations ---

def get_notes(user_id):
    with db_session() as conn:
        return conn.execute("""
            SELECT n.*, s.name as subject_name, s.color as subject_color 
            FROM notes n 
            LEFT JOIN subjects s ON n.subject_id = s.id 
            WHERE n.user_id = ?
            ORDER BY n.updated_at DESC
        """, (user_id,)).fetchall()

def add_note(user_id, subject_id, title, content):
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO notes (user_id, subject_id, title, content) VALUES (?, ?, ?, ?)",
            (user_id, subject_id, title, content)
        )
        conn.commit()
        return cursor.lastrowid

def update_note(user_id, note_id, subject_id, title, content):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with db_session() as conn:
        conn.execute(
            "UPDATE notes SET subject_id = ?, title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            (subject_id, title, content, now_str, note_id, user_id)
        )
        conn.commit()

def delete_note(user_id, note_id):
    with db_session() as conn:
        conn.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id))
        conn.commit()
