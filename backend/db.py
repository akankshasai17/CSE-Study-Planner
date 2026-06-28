import requests
import os
from datetime import datetime, timedelta

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://nhtvfrpvpucdiwpdbzmk.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odHZmcnB2cHVjZGl3cGRiem1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MDI4NzEsImV4cCI6MjA5ODE3ODg3MX0.n9dAr7MccbQmVEUxS_s_2UzQltoJbDsyRzkdg7qaej0")

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

def supabase_request(method, path, params=None, json_data=None, headers=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    default_headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if headers:
        default_headers.update(headers)
    
    response = requests.request(method, url, params=params, json=json_data, headers=default_headers)
    response.raise_for_status()
    return response.json()

def init_db():
    # Clears user tables to provide a clean database state for test isolation
    try:
        supabase_request("DELETE", "users", params={"id": "gt.0"})
    except Exception:
        pass

# --- Auth Operations ---

def seed_core_subjects(user_id):
    for sub in CORE_SUBJECTS:
        res = supabase_request("POST", "subjects", json_data={
            "user_id": user_id,
            "name": sub["name"],
            "code": sub["code"],
            "color": sub["color"],
            "attended_classes": 0,
            "total_classes": 0
        })
        if not res:
            continue
        subject_id = res[0]["id"]
        
        tasks_payload = [
            {
                "user_id": user_id,
                "title": topic,
                "subject_id": subject_id,
                "priority": "Medium",
                "due_date": None,
                "completed": False,
                "completed_at": None
            }
            for topic in sub["topics"]
        ]
        supabase_request("POST", "tasks", json_data=tasks_payload)

def create_user(username, name, password_hash):
    try:
        res = supabase_request("POST", "users", json_data={
            "username": username,
            "name": name,
            "password_hash": password_hash,
            "streak": 0,
            "last_active_date": None
        })
        if not res:
            return None
        user_id = res[0]["id"]
        
        # Auto-seed core subjects and tasks
        seed_core_subjects(user_id)
        return user_id
    except Exception:
        return None

def get_user_by_username(username):
    res = supabase_request("GET", "users", params={"username": f"eq.{username}"})
    return res[0] if res else None

def get_user_by_id(user_id):
    res = supabase_request("GET", "users", params={"id": f"eq.{user_id}"})
    return res[0] if res else None

def record_user_activity(user_id):
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    user = get_user_by_id(user_id)
    if not user:
        return
        
    current_streak = user.get('streak', 0)
    last_active = user.get('last_active_date')
    
    if last_active == today_str:
        return
    elif last_active == yesterday_str:
        new_streak = current_streak + 1
    else:
        new_streak = 1
        
    supabase_request("PATCH", "users", params={"id": f"eq.{user_id}"}, json_data={
        "streak": new_streak,
        "last_active_date": today_str
    })

# --- Subjects Operations ---

def get_subjects(user_id):
    res = supabase_request("GET", "subjects", params={"user_id": f"eq.{user_id}"})
    return res

def add_subject(user_id, name, code, color):
    res = supabase_request("POST", "subjects", json_data={
        "user_id": user_id,
        "name": name,
        "code": code,
        "color": color,
        "attended_classes": 0,
        "total_classes": 0
    })
    return res[0]["id"] if res else None

def update_subject(user_id, subject_id, name, code, color):
    supabase_request(
        "PATCH", 
        "subjects", 
        params={"id": f"eq.{subject_id}", "user_id": f"eq.{user_id}"},
        json_data={"name": name, "code": code, "color": color}
    )

def delete_subject(user_id, subject_id):
    supabase_request(
        "DELETE", 
        "subjects", 
        params={"id": f"eq.{subject_id}", "user_id": f"eq.{user_id}"}
    )

def update_attendance(user_id, subject_id, attended, total):
    supabase_request(
        "PATCH", 
        "subjects", 
        params={"id": f"eq.{subject_id}", "user_id": f"eq.{user_id}"},
        json_data={"attended_classes": attended, "total_classes": total}
    )

# --- Tasks Operations ---

def get_tasks(user_id):
    res = supabase_request(
        "GET", 
        "tasks", 
        params={
            "user_id": f"eq.{user_id}",
            "select": "*,subjects(name,color)",
            "order": "due_date.asc.nullslast,id.desc"
        }
    )
    for item in res:
        item['completed'] = 1 if item.get('completed') else 0
        subject = item.pop('subjects', None)
        if subject and isinstance(subject, dict):
            item['subject_name'] = subject.get('name')
            item['subject_color'] = subject.get('color')
        else:
            item['subject_name'] = None
            item['subject_color'] = None
    return res

def add_task(user_id, title, subject_id, priority, due_date):
    res = supabase_request("POST", "tasks", json_data={
        "user_id": user_id,
        "title": title,
        "subject_id": subject_id if subject_id else None,
        "priority": priority,
        "due_date": due_date if due_date else None,
        "completed": False,
        "completed_at": None
    })
    record_user_activity(user_id)
    return res[0]["id"] if res else None

def update_task(user_id, task_id, title, subject_id, priority, due_date, completed):
    completed_at = None
    if completed:
        completed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
    supabase_request(
        "PATCH", 
        "tasks", 
        params={"id": f"eq.{task_id}", "user_id": f"eq.{user_id}"},
        json_data={
            "title": title,
            "subject_id": subject_id if subject_id else None,
            "priority": priority,
            "due_date": due_date if due_date else None,
            "completed": bool(completed),
            "completed_at": completed_at
        }
    )
    if completed:
        record_user_activity(user_id)

def delete_task(user_id, task_id):
    supabase_request(
        "DELETE", 
        "tasks", 
        params={"id": f"eq.{task_id}", "user_id": f"eq.{user_id}"}
    )

# --- DSA Tracker Operations ---

def get_dsa_problems(user_id):
    res = supabase_request(
        "GET", 
        "dsa_problems", 
        params={
            "user_id": f"eq.{user_id}",
            "order": "solved_date.desc,id.desc"
        }
    )
    return res

def add_dsa_problem(user_id, title, platform, difficulty, solved_date):
    if not solved_date:
        solved_date = datetime.now().strftime("%Y-%m-%d")
    res = supabase_request("POST", "dsa_problems", json_data={
        "user_id": user_id,
        "title": title,
        "platform": platform,
        "difficulty": difficulty,
        "solved_date": solved_date
    })
    record_user_activity(user_id)
    return res[0]["id"] if res else None

def delete_dsa_problem(user_id, problem_id):
    supabase_request(
        "DELETE", 
        "dsa_problems", 
        params={"id": f"eq.{problem_id}", "user_id": f"eq.{user_id}"}
    )

# --- CGPA Calculator Operations ---

def get_sgpa_records(user_id):
    res = supabase_request(
        "GET", 
        "sgpa_records", 
        params={
            "user_id": f"eq.{user_id}",
            "order": "semester.asc"
        }
    )
    return res

def add_sgpa_record(user_id, semester, sgpa):
    res = supabase_request(
        "POST", 
        "sgpa_records", 
        params={"on_conflict": "user_id,semester"},
        json_data={
            "user_id": user_id,
            "semester": semester,
            "sgpa": sgpa
        },
        headers={"Prefer": "resolution=merge-duplicates, return=representation"}
    )
    return res[0]["id"] if res else None

def delete_sgpa_record(user_id, record_id):
    supabase_request(
        "DELETE", 
        "sgpa_records", 
        params={"id": f"eq.{record_id}", "user_id": f"eq.{user_id}"}
    )

# --- Notes Operations ---

def get_notes(user_id):
    res = supabase_request(
        "GET", 
        "notes", 
        params={
            "user_id": f"eq.{user_id}",
            "select": "*,subjects(name,color)",
            "order": "updated_at.desc"
        }
    )
    for item in res:
        subject = item.pop('subjects', None)
        if subject and isinstance(subject, dict):
            item['subject_name'] = subject.get('name')
            item['subject_color'] = subject.get('color')
        else:
            item['subject_name'] = None
            item['subject_color'] = None
    return res

def add_note(user_id, subject_id, title, content):
    res = supabase_request("POST", "notes", json_data={
        "user_id": user_id,
        "subject_id": subject_id if subject_id else None,
        "title": title,
        "content": content
    })
    return res[0]["id"] if res else None

def update_note(user_id, note_id, subject_id, title, content):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    supabase_request(
        "PATCH", 
        "notes", 
        params={"id": f"eq.{note_id}", "user_id": f"eq.{user_id}"},
        json_data={
            "subject_id": subject_id if subject_id else None,
            "title": title,
            "content": content,
            "updated_at": now_str
        }
    )

def delete_note(user_id, note_id):
    supabase_request(
        "DELETE", 
        "notes", 
        params={"id": f"eq.{note_id}", "user_id": f"eq.{user_id}"}
    )
