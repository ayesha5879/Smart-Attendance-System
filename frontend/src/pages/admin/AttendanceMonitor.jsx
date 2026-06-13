import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AttendanceMonitor() {
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSessions(); }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get(`/attendance/sessions?status=${activeTab}`);
      setSessions(res.data || []);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Monitoring Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600">Active Sessions</p>
          <p className="text-2xl font-bold text-green-700">{sessions.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Today's Sessions</p>
          <p className="text-2xl font-bold text-blue-700">{sessions.filter(s => s.sessionDate === new Date().toISOString().split('T')[0]).length}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Present</p>
          <p className="text-2xl font-bold">{sessions.reduce((sum, s) => sum + (s.presentCount || 0), 0)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Enrolled</p>
          <p className="text-2xl font-bold">{sessions.reduce((sum, s) => sum + (s.totalStudents || 0), 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
          {['active', 'completed', 'scheduled'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Present</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="p-3 font-medium">{session.course?.courseCode} - {session.course?.courseName}</td>
                  <td className="p-3">{session.sessionDate}</td>
                  <td className="p-3">{session.startTime} - {session.endTime || 'Ongoing'}</td>
                  <td className="p-3 font-semibold text-green-600">{session.presentCount || 0}</td>
                  <td className="p-3">{session.totalStudents || 0}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{session.status}</span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No sessions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}