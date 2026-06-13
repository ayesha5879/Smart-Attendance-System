import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid, FiUsers, FiBook, FiCalendar,
  FiCamera, FiLogOut, FiX, FiBarChart2, FiSearch, FiHelpCircle,
  FiMonitor, FiShield, FiCheckCircle, FiBell, FiActivity, FiClipboard
} from 'react-icons/fi';
import { MdFaceUnlock } from 'react-icons/md';

const adminLinks = [
  { to: '/admin/dashboard',         icon: FiGrid,      label: 'Dashboard'         },
  { to: '/admin/students',          icon: FiUsers,     label: 'Students'          },
  { to: '/admin/courses',           icon: FiBook,      label: 'Courses'           },
  { to: '/admin/sessions',          icon: FiCalendar,  label: 'Sessions'          },
  { to: '/admin/face-registration', icon: FiCamera,    label: 'Face Registration' },
  { to: '/admin/reports',           icon: FiBarChart2, label: 'Reports'           },
  { to: '/admin/analytics',         icon: FiActivity,  label: 'Analytics'         },
  { to: '/admin/insights',          icon: FiClipboard, label: 'Insights'          },
  { to: '/admin/monitor',           icon: FiMonitor,   label: 'Live Monitor'      },
  { to: '/admin/notifications',     icon: FiBell,      label: 'Notifications'     },
  { to: '/admin/audit-logs',        icon: FiShield,    label: 'Audit Logs'        },
  { to: '/admin/corrections',       icon: FiCheckCircle, label: 'Corrections'     },
];

const studentLinks = [
  { to: '/student/dashboard', icon: FiGrid, label: 'Dashboard' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const [search, setSearch] = useState('');
  const links = isAdmin ? adminLinks : studentLinks;
  const filtered = links.filter(l => l.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={onClose} />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-56 flex flex-col bg-white border-r border-gray-100
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
                <MdFaceUnlock className="text-white" size={18} />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-sm leading-tight">GIT Portal</p>
                <p className="text-gray-400 text-[10px]">Student Portal</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 outline-none focus:border-green-400 transition-colors"
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {filtered.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <link.icon size={16} className="shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-2 py-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="sidebar-link text-gray-400 hover:text-gray-600 cursor-default">
            <FiHelpCircle size={16} />
            <span>Help</span>
          </button>
          <button onClick={logout} className="sidebar-link text-gray-400 hover:text-red-500 hover:bg-red-50 w-full">
            <FiLogOut size={16} className="shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
