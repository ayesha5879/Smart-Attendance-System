import React, { useState, useEffect } from 'react';
import { attendanceAPI, courseAPI, studentAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiDownload, FiSearch, FiCalendar, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Reports = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({ type: 'daily', courseId: '', studentId: '', startDate: '', endDate: '' });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchStudents();
  }, []);

  const fetchCourses = async () => {
    try { const res = await courseAPI.getAll({ limit: 100 }); setCourses(res.data.data.courses); }
    catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try { const res = await studentAPI.getAll({ limit: 100 }); setStudents(res.data.data.students); }
    catch (e) { console.error(e); }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.studentId) params.studentId = filters.studentId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await attendanceAPI.getReport(params);
      setReportData(response.data.data);
    } catch (error) { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const handleExport = async (format) => {
    try {
      const params = { format };
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.studentId) params.studentId = filters.studentId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const response = await attendanceAPI.exportReport(params);
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) { toast.error('Failed to export report'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-500 mt-1">Generate and export attendance reports</p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select value={filters.courseId} onChange={e => setFilters({...filters, courseId: e.target.value})} className="input-field">
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select value={filters.studentId} onChange={e => setFilters({...filters, studentId: e.target.value})} className="input-field">
              <option value="">All Students</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="input-field" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generateReport} disabled={loading} className="btn-primary flex items-center gap-2">
            <FiSearch size={18} /> {loading ? 'Generating...' : 'Generate Report'}
          </button>
          <button onClick={() => handleExport('csv')} className="btn-secondary flex items-center gap-2">
            <FiDownload size={18} /> CSV
          </button>
          <button onClick={() => handleExport('excel')} className="btn-secondary flex items-center gap-2">
            <FiDownload size={18} /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="btn-secondary flex items-center gap-2">
            <FiDownload size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Course</th>
                <th className="table-header">Date</th>
                <th className="table-header">Time</th>
                <th className="table-header">Status</th>
                <th className="table-header">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">{record.student?.fullName}</td>
                  <td className="table-cell">{record.course?.courseCode}</td>
                  <td className="table-cell">{record.session?.sessionDate}</td>
                  <td className="table-cell">{record.session?.startTime}</td>
                  <td className="table-cell">
                    <span className={`badge-${record.status === 'present' ? 'success' : record.status === 'late' ? 'warning' : 'danger'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="badge-info">{record.markedBy}</span>
                  </td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No records found. Generate a report.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;