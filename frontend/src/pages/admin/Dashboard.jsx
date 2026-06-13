import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiUsers, FiBook, FiCheckCircle, FiTrendingUp, FiCalendar, FiClock } from 'react-icons/fi';
import { MdFaceUnlock } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const COLORS = [
  { bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-800',  code: 'text-yellow-500',  img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=60&auto=format&fit=crop'  },
  { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-800',  code: 'text-purple-500',  img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&q=60&auto=format&fit=crop'  },
  { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    code: 'text-blue-500',    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=60&auto=format&fit=crop'  },
  { bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-800',    code: 'text-pink-500',    img: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=60&auto=format&fit=crop'  },
  { bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-800',   code: 'text-green-500',   img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=60&auto=format&fit=crop'  },
];

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const MiniCalendar = () => {
  const now  = new Date();
  const year = now.getFullYear();
  const month= now.getMonth();
  const today= now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const cells = Array(firstDay).fill(null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{monthName} {year}</p>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map(d => <p key={d} className="text-[10px] font-semibold text-gray-400 py-1">{d}</p>)}
        {cells.map((d, i) => (
          <div key={i} className={`text-xs py-1.5 rounded-lg transition-colors ${
            d === today ? 'bg-green-600 text-white font-bold' :
            d ? 'text-gray-600 hover:bg-gray-100 cursor-pointer' : ''
          }`}>{d || ''}</div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    attendanceAPI.getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total Students',  value: stats?.totalStudents  ?? '—', icon: FiUsers,        color: 'text-blue-500',   bg: 'bg-blue-50'   },
    { label: 'Total Courses',   value: stats?.totalCourses   ?? '—', icon: FiBook,         color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Present Today',   value: stats?.presentToday   ?? '—', icon: FiCheckCircle,  color: 'text-green-500',  bg: 'bg-green-50'  },
    { label: 'Attendance Rate', value: stats ? `${stats.attendanceRate}%` : '—', icon: FiTrendingUp, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const sessions = [
    { name: 'Data Structures',    code: 'CS 201', time: '8am – 10am',   instructor: 'Dr. Williams', color: COLORS[0], status: 'ongoing' },
    { name: 'Database Systems',   code: 'CS 202', time: '11am – 12pm',  instructor: 'Prof. Davis',  color: COLORS[1], status: 'upcoming'},
    { name: 'Neural Networks',    code: 'CS 231', time: '2pm – 3pm',    instructor: 'Dr. Cynthia',  color: COLORS[2], status: 'later'   },
    { name: 'Applied Statistics', code: 'CS 231', time: '11am – 12pm',  instructor: 'Dr. Cynthia',  color: COLORS[3], status: 'later'   },
  ];

  const ongoing  = sessions.filter(s => s.status === 'ongoing');
  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const later    = sessions.filter(s => s.status === 'later');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageBanner
        image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80&auto=format&fit=crop"
        title="Admin Dashboard"
        subtitle="Overview of attendance and activity — Greenfield Institute of Technology"
      />
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={s.color} size={18} />
              </div>
              <span className="text-xs text-gray-400 font-medium">This semester</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Sessions */}
        <div className="lg:col-span-2 space-y-5">

          {/* Ongoing */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Sessions</h2>
                <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider font-medium">Ongoing Now</p>
              </div>
              <button onClick={() => navigate('/admin/sessions')} className="btn-primary text-xs px-3 py-1.5">
                + New Session
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {ongoing.map((s, i) => (
                <div key={i} className={`${s.color.bg} border ${s.color.border} rounded-xl p-4 transition-all hover:-translate-y-0.5 relative overflow-hidden`}
                  style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.04)', backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%), url(${s.color.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <h3 className={`font-bold text-sm ${s.color.text} leading-tight`}>{s.name}</h3>
                      <span className={`text-[10px] font-bold ${s.color.code}`}>{s.code}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FiClock size={11}/>{s.time}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.instructor}</p>
                    <div className="flex gap-2 mt-3">
                      <button className="btn-primary text-xs px-3 py-1">
                        <MdFaceUnlock size={13}/> Scan
                      </button>
                      <button className="btn-secondary text-xs px-3 py-1">Share</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Up next */}
            {upcoming.length > 0 && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Up Next</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {upcoming.map((s, i) => (
                    <div key={i} className={`${s.color.bg} border ${s.color.border} rounded-xl p-4 relative overflow-hidden`}
                      style={{ backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%), url(${s.color.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <h3 className={`font-bold text-sm ${s.color.text} leading-tight`}>{s.name}</h3>
                          <span className={`text-[10px] font-bold ${s.color.code}`}>{s.code}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FiClock size={11}/>{s.time}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.instructor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Later */}
            {later.length > 0 && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Happening Later Today</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {later.map((s, i) => (
                    <div key={i} className={`${s.color.bg} border ${s.color.border} rounded-xl p-4 relative overflow-hidden`}
                      style={{ backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%), url(${s.color.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <h3 className={`font-bold text-sm ${s.color.text} leading-tight`}>{s.name}</h3>
                          <span className={`text-[10px] font-bold ${s.color.code}`}>{s.code}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FiClock size={11}/>{s.time}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.instructor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent attendance */}
          <div className="card">
            <h2 className="font-bold text-gray-900 text-base mb-4">Recent Attendance</h2>
            <div className="space-y-2">
              {[
                { name:'John Doe',      course:'Data Structures',   time:'2 hrs ago', status:'present' },
                { name:'Jane Smith',    course:'Database Systems',  time:'3 hrs ago', status:'present' },
                { name:'Bob Johnson',   course:'Neural Networks',   time:'5 hrs ago', status:'present' },
                { name:'Alice Brown',   course:'Statistics',        time:'6 hrs ago', status:'present' },
              ].map((r,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.course} · {r.time}</p>
                  </div>
                  <span className="badge-success">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Calendar + Courses */}
        <div className="space-y-5">

          {/* Calendar */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FiCalendar className="text-green-600" size={16} />
              <h2 className="font-bold text-gray-900 text-base">Calendar</h2>
            </div>
            <MiniCalendar />
          </div>

          {/* Courses */}
          <div className="card">
            <h2 className="font-bold text-gray-900 text-base mb-4">Courses</h2>
            <div className="space-y-2">
              {[
                { name:'Data Structures',    freq:'4 hours · Weekly',  color: COLORS[0] },
                { name:'Database Systems',   freq:'3 hours · Weekly',  color: COLORS[1] },
                { name:'Neural Networks',    freq:'3 hours · Twice wk',color: COLORS[2] },
                { name:'Applied Statistics', freq:'2 hours · Weekly',  color: COLORS[3] },
              ].map((c, i) => (
                <div key={i} className={`flex items-center justify-between p-3 ${c.color.bg} border ${c.color.border} rounded-xl relative overflow-hidden`}
                  style={{ backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%), url(${c.color.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div className="relative z-10 flex items-center justify-between w-full">
                    <div>
                      <p className={`text-xs font-bold ${c.color.text}`}>{c.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.freq}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Courseware</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <h2 className="font-bold text-gray-900 text-base mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/admin/students/add')}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors">
                + Add Student
              </button>
              <button onClick={() => navigate('/admin/face-registration')}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors">
                Register Face
              </button>
              <button onClick={() => navigate('/admin/reports')}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;