from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta

import db

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'cse-study-planner-secret-key-1234')
app.config.update(
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_COOKIE_HTTPONLY=True,
)

# Enable CORS for local testing if frontend is run separately directly (though Next.js rewrites proxy avoids this)
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# Initialize database
db.init_db()

# Decorator to check authentication
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized. Please login.'}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Authentication APIs ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get('username')
    name = data.get('name')
    password = data.get('password')
    
    if not username or not name or not password:
        return jsonify({'error': 'All fields (username, name, password) are required.'}), 400
        
    password_hash = generate_password_hash(password)
    user_id = db.create_user(username, name, password_hash)
    
    if not user_id:
        return jsonify({'error': 'Username already exists.'}), 400
        
    session['user_id'] = user_id
    db.record_user_activity(user_id)
    
    return jsonify({
        'message': 'Registration successful.',
        'user': {
            'id': user_id,
            'username': username,
            'name': name,
            'streak': 1
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400
        
    user = db.get_user_by_username(username)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid username or password.'}), 401
        
    session['user_id'] = user['id']
    db.record_user_activity(user['id'])
    
    # Reload user to get updated streak
    updated_user = db.get_user_by_id(user['id'])
    
    return jsonify({
        'message': 'Login successful.',
        'user': {
            'id': updated_user['id'],
            'username': updated_user['username'],
            'name': updated_user['name'],
            'streak': updated_user['streak']
        }
    }), 200

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully.'}), 200

@app.route('/api/user', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in.'}), 401
        
    user = db.get_user_by_id(session['user_id'])
    if not user:
        session.pop('user_id', None)
        return jsonify({'error': 'User not found.'}), 401
        
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'name': user['name'],
        'streak': user['streak']
    }), 200

# --- Dashboard API ---

@app.route('/api/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    user_id = session['user_id']
    user = db.get_user_by_id(user_id)
    
    # Get all tasks
    tasks = db.get_tasks(user_id)
    completed_tasks = [t for t in tasks if t['completed']]
    pending_tasks = [t for t in tasks if not t['completed']]
    
    # Calculate tasks completion pct
    total_tasks_count = len(tasks)
    progress_pct = 0
    if total_tasks_count > 0:
        progress_pct = round((len(completed_tasks) / total_tasks_count) * 100)
        
    # Get today's tasks (due today, e.g. YYYY-MM-DD)
    today_str = datetime.now().strftime("%Y-%m-%d")
    todays_tasks = [
        {
            'id': t['id'],
            'title': t['title'],
            'subject_id': t['subject_id'],
            'subject_name': t['subject_name'],
            'subject_color': t['subject_color'],
            'priority': t['priority'],
            'due_date': t['due_date'],
            'completed': t['completed']
        }
        for t in tasks if t['due_date'] == today_str
    ]
    
    # Get subjects for attendance warnings (< 75%)
    subjects = db.get_subjects(user_id)
    attendance_warnings = []
    for s in subjects:
        total = s['total_classes']
        attended = s['attended_classes']
        pct = 100.0
        if total > 0:
            pct = round((attended / total) * 100, 1)
            
        if pct < 75.0:
            attendance_warnings.append({
                'id': s['id'],
                'name': s['name'],
                'code': s['code'],
                'color': s['color'],
                'attendance_pct': pct,
                'attended': attended,
                'total': total
            })
            
    # DSA stats
    dsa_problems = db.get_dsa_problems(user_id)
    total_dsa_solved = len(dsa_problems)
    
    return jsonify({
        'student_name': user['name'],
        'streak': user['streak'],
        'total_tasks': total_tasks_count,
        'completed_tasks_count': len(completed_tasks),
        'pending_tasks_count': len(pending_tasks),
        'progress_percentage': progress_pct,
        'todays_tasks': todays_tasks,
        'attendance_warnings': attendance_warnings,
        'total_dsa_solved': total_dsa_solved
    }), 200

# --- Subjects APIs ---

@app.route('/api/subjects', methods=['GET', 'POST'])
@login_required
def manage_subjects():
    user_id = session['user_id']
    if request.method == 'GET':
        subjects = db.get_subjects(user_id)
        result = []
        for s in subjects:
            total = s['total_classes']
            attended = s['attended_classes']
            pct = 100.0
            if total > 0:
                pct = round((attended / total) * 100, 1)
            result.append({
                'id': s['id'],
                'name': s['name'],
                'code': s['code'],
                'color': s['color'],
                'attended_classes': attended,
                'total_classes': total,
                'attendance_pct': pct
            })
        return jsonify(result), 200
        
    elif request.method == 'POST':
        data = request.json or {}
        name = data.get('name')
        code = data.get('code')
        color = data.get('color', '#3B82F6') # default tailwind blue
        
        if not name or not code:
            return jsonify({'error': 'Subject name and code are required.'}), 400
            
        subject_id = db.add_subject(user_id, name, code, color)
        return jsonify({'message': 'Subject added successfully.', 'id': subject_id}), 201

@app.route('/api/subjects/<int:subject_id>', methods=['PUT', 'DELETE'])
@login_required
def subject_detail(subject_id):
    user_id = session['user_id']
    if request.method == 'PUT':
        data = request.json or {}
        name = data.get('name')
        code = data.get('code')
        color = data.get('color', '#3B82F6')
        
        if not name or not code:
            return jsonify({'error': 'Subject name and code are required.'}), 400
            
        db.update_subject(user_id, subject_id, name, code, color)
        return jsonify({'message': 'Subject updated successfully.'}), 200
        
    elif request.method == 'DELETE':
        db.delete_subject(user_id, subject_id)
        return jsonify({'message': 'Subject deleted successfully.'}), 200

@app.route('/api/subjects/<int:subject_id>/attendance', methods=['POST'])
@login_required
def log_attendance(subject_id):
    user_id = session['user_id']
    data = request.json or {}
    attended = data.get('attended_classes')
    total = data.get('total_classes')
    
    if attended is None or total is None:
        return jsonify({'error': 'Attended and total classes are required.'}), 400
        
    if attended < 0 or total < 0 or attended > total:
        return jsonify({'error': 'Invalid class counts. Attended classes cannot exceed total classes.'}), 400
        
    db.update_attendance(user_id, subject_id, attended, total)
    return jsonify({'message': 'Attendance updated successfully.'}), 200

# --- Tasks APIs ---

@app.route('/api/tasks', methods=['GET', 'POST'])
@login_required
def manage_tasks():
    user_id = session['user_id']
    if request.method == 'GET':
        tasks = db.get_tasks(user_id)
        result = []
        for t in tasks:
            result.append({
                'id': t['id'],
                'title': t['title'],
                'subject_id': t['subject_id'],
                'subject_name': t['subject_name'],
                'subject_color': t['subject_color'],
                'priority': t['priority'],
                'due_date': t['due_date'],
                'completed': bool(t['completed']),
                'completed_at': t['completed_at']
            })
        return jsonify(result), 200
        
    elif request.method == 'POST':
        data = request.json or {}
        title = data.get('title')
        subject_id = data.get('subject_id') # Can be None/Null
        priority = data.get('priority', 'Medium')
        due_date = data.get('due_date') # YYYY-MM-DD
        
        if not title:
            return jsonify({'error': 'Task title is required.'}), 400
            
        task_id = db.add_task(user_id, title, subject_id, priority, due_date)
        return jsonify({'message': 'Task created successfully.', 'id': task_id}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
def task_detail(task_id):
    user_id = session['user_id']
    if request.method == 'PUT':
        data = request.json or {}
        title = data.get('title')
        subject_id = data.get('subject_id')
        priority = data.get('priority', 'Medium')
        due_date = data.get('due_date')
        completed = data.get('completed', False)
        
        if not title:
            return jsonify({'error': 'Task title is required.'}), 400
            
        db.update_task(user_id, task_id, title, subject_id, priority, due_date, int(completed))
        return jsonify({'message': 'Task updated successfully.'}), 200
        
    elif request.method == 'DELETE':
        db.delete_task(user_id, task_id)
        return jsonify({'message': 'Task deleted successfully.'}), 200

# --- DSA Tracker APIs ---

@app.route('/api/dsa', methods=['GET', 'POST'])
@login_required
def manage_dsa():
    user_id = session['user_id']
    if request.method == 'GET':
        problems = db.get_dsa_problems(user_id)
        
        # Aggregate statistics
        total = len(problems)
        by_platform = {}
        by_difficulty = {'Easy': 0, 'Medium': 0, 'Hard': 0}
        
        problems_list = []
        for p in problems:
            problems_list.append({
                'id': p['id'],
                'title': p['title'],
                'platform': p['platform'],
                'difficulty': p['difficulty'],
                'solved_date': p['solved_date']
            })
            
            by_platform[p['platform']] = by_platform.get(p['platform'], 0) + 1
            if p['difficulty'] in by_difficulty:
                by_difficulty[p['difficulty']] += 1
                
        return jsonify({
            'problems': problems_list,
            'total_solved': total,
            'by_platform': by_platform,
            'by_difficulty': by_difficulty
        }), 200
        
    elif request.method == 'POST':
        data = request.json or {}
        title = data.get('title')
        platform = data.get('platform')
        difficulty = data.get('difficulty', 'Medium')
        solved_date = data.get('solved_date') # YYYY-MM-DD
        
        if not title or not platform:
            return jsonify({'error': 'Title and Platform are required.'}), 400
            
        problem_id = db.add_dsa_problem(user_id, title, platform, difficulty, solved_date)
        return jsonify({'message': 'DSA Problem logged successfully.', 'id': problem_id}), 201

@app.route('/api/dsa/<int:problem_id>', methods=['DELETE'])
@login_required
def delete_dsa(problem_id):
    user_id = session['user_id']
    db.delete_dsa_problem(user_id, problem_id)
    return jsonify({'message': 'DSA Problem log deleted successfully.'}), 200

# --- CGPA Calculator APIs ---

@app.route('/api/cgpa', methods=['GET', 'POST'])
@login_required
def manage_cgpa():
    user_id = session['user_id']
    if request.method == 'GET':
        records = db.get_sgpa_records(user_id)
        
        # Calculate overall CGPA (simple average of semester SGPAs)
        records_list = []
        total_sgpa = 0.0
        for r in records:
            records_list.append({
                'id': r['id'],
                'semester': r['semester'],
                'sgpa': r['sgpa']
            })
            total_sgpa += r['sgpa']
            
        cgpa = 0.0
        if len(records) > 0:
            cgpa = round(total_sgpa / len(records), 2)
            
        return jsonify({
            'records': records_list,
            'cgpa': cgpa
        }), 200
        
    elif request.method == 'POST':
        data = request.json or {}
        semester = data.get('semester')
        sgpa = data.get('sgpa')
        
        if semester is None or sgpa is None:
            return jsonify({'error': 'Semester and SGPA values are required.'}), 400
            
        try:
            semester = int(semester)
            sgpa = float(sgpa)
        except ValueError:
            return jsonify({'error': 'Invalid format. Semester must be integer and SGPA a float.'}), 400
            
        if semester < 1 or semester > 10 or sgpa < 0.0 or sgpa > 10.0:
            return jsonify({'error': 'Invalid ranges. Semester 1-10, SGPA 0-10.'}), 400
            
        record_id = db.add_sgpa_record(user_id, semester, sgpa)
        return jsonify({'message': 'SGPA recorded successfully.', 'id': record_id}), 201

@app.route('/api/cgpa/<int:record_id>', methods=['DELETE'])
@login_required
def delete_cgpa(record_id):
    user_id = session['user_id']
    db.delete_sgpa_record(user_id, record_id)
    return jsonify({'message': 'SGPA record deleted successfully.'}), 200

# --- Notes APIs ---

@app.route('/api/notes', methods=['GET', 'POST'])
@login_required
def manage_notes():
    user_id = session['user_id']
    if request.method == 'GET':
        notes = db.get_notes(user_id)
        result = []
        for n in notes:
            result.append({
                'id': n['id'],
                'title': n['title'],
                'content': n['content'],
                'subject_id': n['subject_id'],
                'subject_name': n['subject_name'],
                'subject_color': n['subject_color'],
                'updated_at': n['updated_at']
            })
        return jsonify(result), 200
        
    elif request.method == 'POST':
        data = request.json or {}
        title = data.get('title')
        content = data.get('content', '')
        subject_id = data.get('subject_id')
        
        if not title:
            return jsonify({'error': 'Note title is required.'}), 400
            
        note_id = db.add_note(user_id, subject_id, title, content)
        return jsonify({'message': 'Note created successfully.', 'id': note_id}), 201

@app.route('/api/notes/<int:note_id>', methods=['PUT', 'DELETE'])
@login_required
def note_detail(note_id):
    user_id = session['user_id']
    if request.method == 'PUT':
        data = request.json or {}
        title = data.get('title')
        content = data.get('content', '')
        subject_id = data.get('subject_id')
        
        if not title:
            return jsonify({'error': 'Note title is required.'}), 400
            
        db.update_note(user_id, note_id, subject_id, title, content)
        return jsonify({'message': 'Note updated successfully.'}), 200
        
    elif request.method == 'DELETE':
        db.delete_note(user_id, note_id)
        return jsonify({'message': 'Note deleted successfully.'}), 200

# --- Analytics API ---

@app.route('/api/analytics', methods=['GET'])
@login_required
def get_analytics_data():
    user_id = session['user_id']
    
    # 1. Subject-wise tasks statistics
    subjects = db.get_subjects(user_id)
    tasks = db.get_tasks(user_id)
    
    subject_stats = {}
    for s in subjects:
        subject_stats[s['id']] = {
            'name': s['name'],
            'code': s['code'],
            'color': s['color'],
            'completed': 0,
            'total': 0
        }
    
    # Track tasks with no subject (uncategorized)
    uncategorized = {
        'name': 'Uncategorized',
        'code': 'MISC',
        'color': '#9CA3AF', # Gray
        'completed': 0,
        'total': 0
    }
    
    for t in tasks:
        sub_id = t['subject_id']
        is_completed = bool(t['completed'])
        
        if sub_id in subject_stats:
            subject_stats[sub_id]['total'] += 1
            if is_completed:
                subject_stats[sub_id]['completed'] += 1
        else:
            uncategorized['total'] += 1
            if is_completed:
                uncategorized['completed'] += 1
                
    subject_list = list(subject_stats.values())
    if uncategorized['total'] > 0:
        subject_list.append(uncategorized)
        
    # 2. Weekly activity graph (last 7 days completed tasks)
    today = datetime.now().date()
    weekly_labels = []
    weekly_task_counts = []
    
    # Initialize counts for last 7 days
    days_data = {}
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        # Label as E.g., "Mon", "Tue"
        label = day.strftime("%a")
        weekly_labels.append(label)
        days_data[day_str] = 0
        
    # Count tasks completed on these days
    for t in tasks:
        if t['completed'] and t['completed_at']:
            # t['completed_at'] is 'YYYY-MM-DD HH:MM:SS'
            comp_date = t['completed_at'].split(' ')[0]
            if comp_date in days_data:
                days_data[comp_date] += 1
                
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        weekly_task_counts.append(days_data[day_str])
        
    # 3. Weekly DSA activity (problems solved per day in last 7 days)
    weekly_dsa_counts = []
    dsa_days_data = {}
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        dsa_days_data[day_str] = 0
        
    dsa_problems = db.get_dsa_problems(user_id)
    for p in dsa_problems:
        # solved_date is 'YYYY-MM-DD'
        if p['solved_date'] in dsa_days_data:
            dsa_days_data[p['solved_date']] += 1
            
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        weekly_dsa_counts.append(dsa_days_data[day_str])
        
    return jsonify({
        'subject_task_stats': subject_list,
        'weekly_study_activity': {
            'labels': weekly_labels,
            'completed_tasks': weekly_task_counts,
            'dsa_solved': weekly_dsa_counts
        }
    }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
