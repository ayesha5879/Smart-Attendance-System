import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchLogs(); }, [filter, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = `page=${page}&limit=50${filter ? `&severity=${filter}` : ''}`;
      const { data: res } = await axios.get(`/admin/audit-logs?${params}`);
      setLogs(res.data?.logs || []);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally { setLoading(false); }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-100 text-blue-700', warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700', critical: 'bg-red-200 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'info', 'warning', 'error'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
              <tr>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Resource</th>
                <th className="p-3 text-left">Severity</th>
                <th className="p-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="p-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">{log.user?.name || 'System'}</td>
                  <td className="p-3 font-medium">{log.action}</td>
                  <td className="p-3 text-gray-600">{log.resource} {log.resourceId ? `#${log.resourceId}` : ''}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-500">{log.ipAddress || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}