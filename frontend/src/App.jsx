import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import AddStudent from './pages/admin/AddStudent';
import Courses from './pages/admin/Courses';
import Sessions from './pages/admin/Sessions';
import FaceRegistration from './pages/admin/FaceRegistration';
import Reports from './pages/admin/Reports';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import InsightsPage from './pages/admin/InsightsPage';
import Notifications from './pages/admin/Notifications';
import AttendanceMonitor from './pages/admin/AttendanceMonitor';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import Corrections from './pages/admin/Corrections';
import AllReports from './pages/admin/AllReports';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';

// Theme Context
export const ThemeContext = React.createContext();

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="students" element={<Students />} />
        <Route path="students/add" element={<AddStudent />} />
        <Route path="students/edit/:id" element={<AddStudent />} />
        <Route path="courses" element={<Courses />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="face-registration" element={<FaceRegistration />} />
        <Route path="reports" element={<Reports />} />
        <Route path="all-reports" element={<AllReports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="monitor" element={<AttendanceMonitor />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="corrections" element={<Corrections />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<StudentDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <Router>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: darkMode ? '#1f2937' : '#363636',
                color: '#fff',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;