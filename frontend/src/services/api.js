import axios from 'axios';

// Use relative URL so Vite proxy directs to backend at http://localhost:5000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Enables secure HttpOnly cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Request Interceptor: Attach JWT Bearer Token if present in localStorage as fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('cse_token');
        localStorage.removeItem('cse_user');
        window.dispatchEvent(new Event('auth-logout'));
      }
    }
    return Promise.reject(error);
  }
);

// 1. Auth Service
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// 2. Dashboard Service
export const dashboardService = {
  getDashboardData: () => api.get('/dashboard'),
};

// 3. Timetable Service
export const timetableService = {
  getSessions: (params) => api.get('/timetable', { params }),
  createSession: (data) => api.post('/timetable', data),
  updateSession: (id, data) => api.put(`/timetable/${id}`, data),
  deleteSession: (id) => api.delete(`/timetable/${id}`),
  toggleSession: (id) => api.patch(`/timetable/${id}/toggle`),
};

// 4. LeetCode Practice Service
export const leetcodeService = {
  getProblems: (params) => api.get('/leetcode', { params }),
  updateStatus: (id, data) => api.patch(`/leetcode/${id}/status`, data),
  addProblem: (data) => api.post('/leetcode', data),
  deleteProblem: (id) => api.delete(`/leetcode/${id}`),
};

// 5. Core Subjects Syllabus Service
export const subjectService = {
  getSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  updateTopicStatus: (subjectId, moduleId, topicId, data) =>
    api.patch(`/subjects/${subjectId}/modules/${moduleId}/topics/${topicId}`, data),
  addModule: (subjectId, data) => api.post(`/subjects/${subjectId}/modules`, data),
  addTopic: (subjectId, moduleId, data) =>
    api.post(`/subjects/${subjectId}/modules/${moduleId}/topics`, data),
  deleteTopic: (subjectId, moduleId, topicId) =>
    api.delete(`/subjects/${subjectId}/modules/${moduleId}/topics/${topicId}`),
};

// 6. Tasks Service
export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  toggleTask: (id) => api.patch(`/tasks/${id}/toggle`),
};

// 7. Focus Timer & Goals Service
export const focusService = {
  logSession: (data) => api.post('/focus/log', data),
  getStats: () => api.get('/focus/stats'),
};

// 8. Progress Overview Service
export const progressService = {
  getOverview: () => api.get('/progress'),
};

export default api;
