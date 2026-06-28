import unittest
import json
import os
import sqlite3
import tempfile
import app
import db

class CSEStudyPlannerTestCase(unittest.TestCase):
    def setUp(self):
        # Set up a temporary database file
        self.db_fd, self.db_path = tempfile.mkstemp()
        db.DB_PATH = self.db_path
        
        # Configure app for testing
        app.app.config['TESTING'] = True
        app.app.config['SECRET_KEY'] = 'test-secret-key'
        app.app.config['WTF_CSRF_ENABLED'] = False
        
        self.client = app.app.test_client()
        
        # Re-initialize the database schema
        db.init_db()
        
    def tearDown(self):
        # Close and remove the temporary database
        os.close(self.db_fd)
        os.unlink(self.db_path)
        
    # --- Auth Tests ---
    
    def test_auth_flow(self):
        # Register new user
        reg_response = self.client.post('/api/register', json={
            'username': 'teststudent',
            'name': 'Test Student',
            'password': 'password123'
        })
        self.assertEqual(reg_response.status_code, 201)
        reg_data = json.loads(reg_response.data)
        self.assertEqual(reg_data['user']['username'], 'teststudent')
        self.assertEqual(reg_data['user']['name'], 'Test Student')
        
        # Get current user session
        user_response = self.client.get('/api/user')
        self.assertEqual(user_response.status_code, 200)
        
        # Logout
        logout_response = self.client.post('/api/logout')
        self.assertEqual(logout_response.status_code, 200)
        
        # Get user after logout -> Unauthorized
        user_response2 = self.client.get('/api/user')
        self.assertEqual(user_response2.status_code, 401)
        
        # Login again
        login_response = self.client.post('/api/login', json={
            'username': 'teststudent',
            'password': 'password123'
        })
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        self.assertEqual(login_data['user']['username'], 'teststudent')
        
    # --- Subject & Attendance Tests ---
    
    def test_subject_and_attendance(self):
        # Register and login
        self.client.post('/api/register', json={
            'username': 'stud',
            'name': 'Student',
            'password': 'pwd'
        })
        
        # Add subject
        sub_resp = self.client.post('/api/subjects', json={
            'name': 'Data Structures and Algorithms',
            'code': 'DSA',
            'color': '#ff0000'
        })
        self.assertEqual(sub_resp.status_code, 201)
        sub_id = json.loads(sub_resp.data)['id']
        
        # Get subjects
        get_resp = self.client.get('/api/subjects')
        self.assertEqual(get_resp.status_code, 200)
        subjects = json.loads(get_resp.data)
        self.assertEqual(len(subjects), 7)
        added_sub = next(s for s in subjects if s['id'] == sub_id)
        self.assertEqual(added_sub['name'], 'Data Structures and Algorithms')
        self.assertEqual(added_sub['attendance_pct'], 100.0) # no classes yet
        
        # Update attendance
        att_resp = self.client.post(f'/api/subjects/{sub_id}/attendance', json={
            'attended_classes': 8,
            'total_classes': 10
        })
        self.assertEqual(att_resp.status_code, 200)
        
        # Verify updated attendance percentage (8 / 10 = 80%)
        get_resp2 = self.client.get('/api/subjects')
        subjects2 = json.loads(get_resp2.data)
        added_sub2 = next(s for s in subjects2 if s['id'] == sub_id)
        self.assertEqual(added_sub2['attendance_pct'], 80.0)
        
        # Dashboard warning check (warning if attendance is below 75%)
        # Let's drop attendance to 7/10 = 70%
        self.client.post(f'/api/subjects/{sub_id}/attendance', json={
            'attended_classes': 7,
            'total_classes': 10
        })
        dash_resp = self.client.get('/api/dashboard')
        self.assertEqual(dash_resp.status_code, 200)
        dash_data = json.loads(dash_resp.data)
        self.assertEqual(len(dash_data['attendance_warnings']), 1)
        self.assertEqual(dash_data['attendance_warnings'][0]['code'], 'DSA')
        self.assertEqual(dash_data['attendance_warnings'][0]['attendance_pct'], 70.0)
        
    # --- Tasks & Streak Tests ---
    
    def test_tasks_and_streaks(self):
        # Register/login
        self.client.post('/api/register', json={
            'username': 'streakuser',
            'name': 'Streak User',
            'password': 'pwd'
        })
        
        # Add a task
        task_resp = self.client.post('/api/tasks', json={
            'title': 'Revise Binary Trees',
            'priority': 'High',
            'due_date': '2026-06-21'
        })
        self.assertEqual(task_resp.status_code, 201)
        task_id = json.loads(task_resp.data)['id']
        
        # Get tasks
        get_resp = self.client.get('/api/tasks')
        tasks = json.loads(get_resp.data)
        self.assertEqual(len(tasks), 25)
        added_task = next(t for t in tasks if t['id'] == task_id)
        self.assertFalse(added_task['completed'])
        
        # Verify dashboard progress % is 0%
        dash_resp = self.client.get('/api/dashboard')
        dash_data = json.loads(dash_resp.data)
        self.assertEqual(dash_data['progress_percentage'], 0)
        self.assertEqual(dash_data['streak'], 1) # active today because registered
        
        # Complete the task
        complete_resp = self.client.put(f'/api/tasks/{task_id}', json={
            'title': 'Revise Binary Trees',
            'completed': True
        })
        self.assertEqual(complete_resp.status_code, 200)
        
        # Verify dashboard progress % is 4% (1 completed out of 25)
        dash_resp2 = self.client.get('/api/dashboard')
        dash_data2 = json.loads(dash_resp2.data)
        self.assertEqual(dash_data2['progress_percentage'], 4)
        
    # --- DSA Problems Tracker Tests ---
    
    def test_dsa_tracker(self):
        self.client.post('/api/register', json={
            'username': 'dsauser',
            'name': 'DSA Solver',
            'password': 'pwd'
        })
        
        # Log DSA problem
        dsa_resp = self.client.post('/api/dsa', json={
            'title': 'Two Sum',
            'platform': 'LeetCode',
            'difficulty': 'Easy',
            'solved_date': '2026-06-21'
        })
        self.assertEqual(dsa_resp.status_code, 201)
        
        # Get DSA data
        get_resp = self.client.get('/api/dsa')
        self.assertEqual(get_resp.status_code, 200)
        dsa_data = json.loads(get_resp.data)
        self.assertEqual(dsa_data['total_solved'], 1)
        self.assertEqual(dsa_data['by_platform']['LeetCode'], 1)
        self.assertEqual(dsa_data['by_difficulty']['Easy'], 1)
        
    # --- CGPA Calculator Tests ---
    
    def test_cgpa_calculator(self):
        self.client.post('/api/register', json={
            'username': 'cgpauser',
            'name': 'Academic Star',
            'password': 'pwd'
        })
        
        # Add Sem 1 and Sem 2 SGPAs
        self.client.post('/api/cgpa', json={'semester': 1, 'sgpa': 9.2})
        self.client.post('/api/cgpa', json={'semester': 2, 'sgpa': 8.8})
        
        # Check overall CGPA (simple average: 9.0)
        cgpa_resp = self.client.get('/api/cgpa')
        self.assertEqual(cgpa_resp.status_code, 200)
        cgpa_data = json.loads(cgpa_resp.data)
        self.assertEqual(len(cgpa_data['records']), 2)
        self.assertEqual(cgpa_data['cgpa'], 9.0)
        
    # --- Notes Tests ---
    
    def test_notes(self):
        self.client.post('/api/register', json={
            'username': 'notesuser',
            'name': 'Note Taker',
            'password': 'pwd'
        })
        
        # Add note
        note_resp = self.client.post('/api/notes', json={
            'title': 'Compiler Design Notes',
            'content': 'Syntax analysis using LL(1) and LR(1) parsers.'
        })
        self.assertEqual(note_resp.status_code, 201)
        note_id = json.loads(note_resp.data)['id']
        
        # Get notes
        get_resp = self.client.get('/api/notes')
        notes = json.loads(get_resp.data)
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]['title'], 'Compiler Design Notes')
        
        # Edit note
        edit_resp = self.client.put(f'/api/notes/{note_id}', json={
            'title': 'Compiler Design Rev 1',
            'content': 'Syntax analysis and semantic analysis.'
        })
        self.assertEqual(edit_resp.status_code, 200)
        
        # Verify update
        get_resp2 = self.client.get('/api/notes')
        notes2 = json.loads(get_resp2.data)
        self.assertEqual(notes2[0]['title'], 'Compiler Design Rev 1')
        self.assertEqual(notes2[0]['content'], 'Syntax analysis and semantic analysis.')

if __name__ == '__main__':
    unittest.main()
