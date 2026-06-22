import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_BASE_URL && !API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/')) {
  API_BASE_URL = API_BASE_URL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return Promise.reject({
        status,
        message: data.message || 'An error occurred',
        errors: data.errors || [],
      });
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 0,
        message: 'Request timeout. Please try again.',
        errors: [],
      });
    }

    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your connection.',
      errors: [],
    });
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Student APIs
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/students/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/students/${id}`),
  enroll: (data) => api.post('/students/enroll', data),
  getAttendance: (id) => api.get(`/students/${id}/attendance`),
};

// Course APIs
export const courseAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  getSessions: (params) => api.get('/attendance/sessions', { params }),
  getSessionById: (id) => api.get(`/attendance/sessions/${id}`),
  createSession: (data) => api.post('/attendance/sessions', data),
  endSession: (id) => api.put(`/attendance/sessions/${id}/end`),
  markAttendance: (data) => api.post('/attendance/mark', data),
  getAttendance: (params) => api.get('/attendance', { params }),
  getReport: (params) => api.get('/attendance/report', { params }),
  exportReport: (params) => api.get('/attendance/export', { params, responseType: 'blob' }),
  getSummary: (studentId) => api.get(`/attendance/summary/${studentId}`),
  getDashboardStats: () => api.get('/attendance/stats/dashboard'),
};

// Face Recognition APIs
export const faceAPI = {
  register: (data) => api.post('/face/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  recognize: (data) => api.post('/face/recognize', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  checkRegistered: (studentId) => api.get(`/face/check/${studentId}`),
};

export default api;