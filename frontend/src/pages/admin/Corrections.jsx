import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Corrections() {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchCorrections(); }, [filter]);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const params = filter ? `?status=${filter}` : '';
      const { data: res } = await axios.get(`/corrections${params}`);
      setCorrections(res.data || []);
    } catch (err) {
      toast.error('Failed to load corrections');
    } finally { setLoading(false); }
  };

  const reviewCorrection = async (id, status) => {
    try {
      await axios.put(`/corrections/${id}/review`, { status, reviewerRemarks: status === 'approved' ? 'Approved by admin' : 'Rejected by admin' });
      toast.success(`Correction ${status}`);
      fetchCorrections();
    } catch (err) {
      toast.error(`Failed to ${status} correction`);
    }
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Correction Requests</h1>

      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Current</th>
                <th className="p-3 text-left">Requested</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {corrections.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="p-3 font-medium">{c.student?.fullName}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.currentStatus === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.currentStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.requestedStatus === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.requestedStatus}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 max-w-xs truncate">{c.reason}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => reviewCorrection(c.id, 'approved')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
                          Approve
                        </button>
                        <button onClick={() => reviewCorrection(c.id, 'rejected')}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition">
                          Reject
                        </button>
                      </div>
                    )}
                    {c.status !== 'pending' && (
                      <span className="text-xs text-gray-400">{c.reviewerRemarks}</span>
                    )}
                  </td>
                </tr>
              ))}
              {corrections.length === 0 && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No correction requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}