import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../utils/axios';
import { FiUser, FiMail, FiHash, FiBook, FiLayers, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AddStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentId: '', fullName: '', email: '', department: '', semester: '', password: 'student123'
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      if (file) form.append('profileImage', file);
      await studentAPI.create(form);
      toast.success('Student created successfully');
      navigate('/admin/students');
    } catch (error) {
      toast.error(error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Add Student</h1>
        <p className="page-sub">Register a new student in the system</p>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Student ID</label>
            <div className="relative"><FiHash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} className="input-field pl-10" required placeholder="e.g. STU006" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
            <div className="relative"><FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field pl-10" required placeholder="John Doe" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field pl-10" required placeholder="john@example.com" /></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department</label>
            <div className="relative"><FiBook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <select name="department" value={formData.department} onChange={handleChange} className="input-field pl-10" required>
                <option value="">Select Department</option>
                <option>Computer Science</option><option>Electrical Engineering</option>
                <option>Mechanical Engineering</option><option>Civil Engineering</option>
                <option>Business Administration</option>
              </select></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Semester</label>
            <div className="relative"><FiLayers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <select name="semester" value={formData.semester} onChange={handleChange} className="input-field pl-10" required>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(s=><option key={s} value={s}>Semester {s}</option>)}
              </select></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Profile Image</label>
            <div className="relative"><FiUpload className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files[0])}
                className="input-field pl-10 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:text-xs cursor-pointer" /></div>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">{loading?'Creating...':'Create Student'}</button>
          <button type="button" onClick={()=>navigate('/admin/students')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;