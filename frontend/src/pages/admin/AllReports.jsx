import React, { useState } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';

export default function AllReports() {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'attendance', format: 'pdf', startDate: '', endDate: '',
    courseId: '', studentId: ''
  });
  const [reportData, setReportData] = useState(null);

  const handleDownload = async (format) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ ...filters, format });
      
      if (format === 'csv') {
        const { data } = await axios.get(`/reports/download?${params}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([data]));
        const a = document.createElement('a');
        a.href = url; a.download = `${filters.type}-report.csv`; a.click();
      } else if (format === 'excel') {
        const { data } = await axios.get(`/reports/download?${params}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([data]));
        const a = document.createElement('a');
        a.href = url; a.download = `${filters.type}-report.xlsx`; a.click();
      } else {
        const { data } = await axios.get(`/reports/download?${params}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([data]));
        const a = document.createElement('a');
        a.href = url; a.download = `${filters.type}-report.pdf`; a.click();
      }
      toast.success(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error('Failed to download report');
    } finally { setLoading(false); }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const { data: res } = await axios.get(`/reports?${params}`);
      setReportData(res.data);
      toast.success('Report data loaded');
    } catch (err) {
      toast.error('Failed to load report');
    } finally { setLoading(false); }
  };

  const reportTypes = [
    'attendance', 'daily', 'weekly', 'monthly', 'student', 'course', 'faculty', 'defaulter'
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Exports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold">Report Configuration</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
              {reportTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
            <div className="flex gap-2">
              {[
                { value: 'pdf', icon: FiFileText, label: 'PDF' },
                { value: 'excel', icon: FiFile, label: 'Excel' },
                { value: 'csv', icon: FiFile, label: 'CSV' },
              ].map(fmt => (
                <button key={fmt.value} onClick={() => handleDownload(fmt.value)} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-sm font-medium disabled:opacity-50">
                  <fmt.icon className="text-blue-600" size={18} />
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePreview} disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Loading...' : 'Preview Report'}
          </button>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4">Report Preview</h3>
          
          {reportData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Records</p>
                  <p className="text-xl font-bold">{reportData.summary?.totalRecords || 0}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-green-600">Present</p>
                  <p className="text-xl font-bold text-green-700">{reportData.summary?.presentCount || 0}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs text-red-600">Absent</p>
                  <p className="text-xl font-bold text-red-700">{reportData.summary?.absentCount || 0}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-blue-600">Rate</p>
                  <p className="text-xl font-bold text-blue-700">{reportData.summary?.attendanceRate || 0}%</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Student</th>
                      <th className="p-2 text-left">Course</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.records?.slice(0, 50).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-2">{r['Student Name']}</td>
                        <td className="p-2">{r['Course Code']}</td>
                        <td className="p-2 text-xs">{r['Date']}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r['Status'] === 'present' ? 'bg-green-100 text-green-700' : r['Status'] === 'late' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {r['Status']}
                          </span>
                        </td>
                        <td className="p-2 text-xs">{r['Confidence']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.records?.length > 50 && (
                  <p className="text-center text-sm text-gray-500 py-3">Showing 50 of {reportData.records.length} records</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FiDownload size={48} className="mx-auto mb-4 opacity-30" />
              <p>Configure filters and click "Preview Report"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}