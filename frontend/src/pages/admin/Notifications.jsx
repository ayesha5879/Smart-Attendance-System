import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { toast.error('Failed to mark as read'); }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) { toast.error('Failed to mark all as read'); }
  };

  const getTypeIcon = (type) => {
    const icons = {
      warning: '⚠️', success: '✅', error: '❌', info: 'ℹ️',
      action_required: '🔔', attendance: '📋', correction: '✏️'
    };
    return icons[type] || '📌';
  };

  const getTypeColor = (type) => {
    const colors = {
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      action_required: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  const filtered = filter === 'all' ? notifications : 
    filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'unread', 'warning', 'action_required'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🔔</p>
            <p>No notifications</p>
          </div>
        ) : (
          filtered.map((notif, i) => (
            <motion.div key={notif.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${getTypeColor(notif.type)} ${!notif.isRead ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''}`}
              onClick={() => !notif.isRead && markAsRead(notif.id)}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{getTypeIcon(notif.type)}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{notif.title}</h4>
                    <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notif.message}</p>
                  {!notif.isRead && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      New
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}