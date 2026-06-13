import React, { useState, useEffect } from 'react';
import { courseAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiPlus, FiEdit2, FiTrash2, FiBook, FiUser, FiLayers, FiHash } from 'react-icons/fi';
import toast from 'react-hot-toast';

const COLORS = [
  { bg: 'bg-yellow-50',  border: 'border-yellow-200', title: 'text-yellow-800', sub: 'text-yellow-600', icon: 'bg-yellow-400', img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=60&auto=format&fit=crop' },
  { bg: 'bg-purple-50',  border: 'border-purple-200', title: 'text-purple-800', sub: 'text-purple-600', icon: 'bg-purple-400', img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&q=60&auto=format&fit=crop' },
  { bg: 'bg-blue-50',    border: 'border-blue-200',   title: 'text-blue-800',   sub: 'text-blue-600',   icon: 'bg-blue-400',   img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=60&auto=format&fit=crop' },
  { bg: 'bg-pink-50',    border: 'border-pink-200',   title: 'text-pink-800',   sub: 'text-pink-600',   icon: 'bg-pink-400',   img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=60&auto=format&fit=crop' },
  { bg: 'bg-green-50',   border: 'border-green-200',  title: 'text-green-800',  sub: 'text-green-600',  icon: 'bg-green-400',  img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=60&auto=format&fit=crop' },
];

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [formData, setFormData] = useState({ courseCode: '', courseName: '', instructor: '', semester: '', credits: 3 });

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const r = await courseAPI.getAll({ limit: 50 });
      setCourses(r.data.data.courses);
    } catch { toast.error('Failed to fetch courses'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditCourse(null);
    setFormData({ courseCode: '', courseName: '', instructor: '', semester: '', credits: 3 });
    setShowModal(true);
  };
  const openEdit = (c) => { setEditCourse(c); setFormData(c); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      editCourse ? await courseAPI.update(editCourse.id, formData) : await courseAPI.create(formData);
      toast.success(editCourse ? 'Course updated' : 'Course created');
      setShowModal(false);
      fetchCourses();
    } catch (err) { toast.error(err.message || 'Operation failed'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try { await courseAPI.delete(id); toast.success('Deleted'); fetchCourses(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageBanner
        image="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80&auto=format&fit=crop"
        title="Courses"
        subtitle="Manage courses and instructors"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-sub">Manage courses and instructors</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><FiPlus size={15} /> Add Course</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {courses.map((course, i) => {
            const c = COLORS[i % COLORS.length];
            return (
              <div key={course.id}
                className={`rounded-2xl border p-5 ${c.bg} ${c.border} transition-all duration-200 hover:-translate-y-0.5 animate-slide-up relative overflow-hidden`}
                style={{
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%), url(${c.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}>
                <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
                    <FiBook className="text-white" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-sm leading-tight ${c.title}`}>{course.courseName}</h3>
                    <span className={`text-xs font-semibold ${c.sub} mt-0.5 block`}>{course.courseCode}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center gap-1.5">
                    <FiUser size={12} className="text-gray-400 shrink-0" />
                    <span className="font-medium">{course.instructor}</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><FiLayers size={12} className="text-gray-400" /> Sem {course.semester}</span>
                    <span className="flex items-center gap-1"><FiHash size={12} className="text-gray-400" /> {course.credits} Credits</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center gap-1">
                  <button onClick={() => openEdit(course)}
                    className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(course.id, course.courseName)}
                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          {courses.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No courses yet. Click <strong>Add Course</strong> to get started.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editCourse ? 'Edit Course' : 'Add Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Course Code</label>
                <input name="courseCode" value={formData.courseCode}
                  onChange={e => setFormData({...formData, courseCode: e.target.value})}
                  placeholder="e.g. CS201" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Course Name</label>
                <input name="courseName" value={formData.courseName}
                  onChange={e => setFormData({...formData, courseName: e.target.value})}
                  placeholder="e.g. Data Structures" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instructor</label>
                <input name="instructor" value={formData.instructor}
                  onChange={e => setFormData({...formData, instructor: e.target.value})}
                  placeholder="e.g. Dr. Smith" className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Semester</label>
                  <select name="semester" value={formData.semester}
                    onChange={e => setFormData({...formData, semester: e.target.value})}
                    className="input-field" required>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Credits</label>
                  <input type="number" name="credits" value={formData.credits}
                    onChange={e => setFormData({...formData, credits: e.target.value})}
                    className="input-field" min="1" max="6" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">{editCourse ? 'Update' : 'Create Course'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
