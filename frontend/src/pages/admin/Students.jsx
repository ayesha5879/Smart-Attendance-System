import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll({ page, limit: 10, search });
      setStudents(response.data.data.students);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await studentAPI.delete(id);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageBanner
        image="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&auto=format&fit=crop"
        title="Students"
        subtitle="Manage all registered students"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-sub">Manage all registered students</p>
        </div>
        <button onClick={() => navigate('/admin/students/add')} className="btn-primary">
          <FiPlus size={15} /> Add Student
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative max-w-xs">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" placeholder="Search students..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Student ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Department</th>
                <th className="table-header">Semester</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell"><span className="badge-info">{student.studentId}</span></td>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                        {student.fullName.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-800">{student.fullName}</span>
                    </div>
                  </td>
                  <td className="table-cell text-gray-500">{student.email}</td>
                  <td className="table-cell">{student.department}</td>
                  <td className="table-cell">Sem {student.semester}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(student.id, student.fullName)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary">Previous</button>
            <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;