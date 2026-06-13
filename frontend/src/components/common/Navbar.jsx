import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiBell } from 'react-icons/fi';

const titles = {
  '/admin/dashboard':          'Dashboard',
  '/admin/students':           'Students',
  '/admin/students/add':       'Add Student',
  '/admin/courses':            'Courses',
  '/admin/sessions':           'Sessions',
  '/admin/face-registration':  'Face Registration',
  '/admin/reports':            'Reports',
  '/admin/analytics':          'Analytics',
  '/admin/insights':           'Insights',
  '/admin/monitor':            'Live Monitor',
  '/admin/notifications':      'Notifications',
  '/admin/audit-logs':         'Audit Logs',
  '/admin/corrections':        'Attendance Corrections',
  '/admin/all-reports':        'All Reports',
  '/student/dashboard':        'Dashboard',
};

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const location = useLocation();
  const title = titles[location.pathname] || 'Portal';

  return (
    <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between sticky top-0 z-30"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-gray-800 transition-colors p-1">
          <FiMenu size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
          <FiBell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100 ml-1">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
