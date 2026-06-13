import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import { Doughnut } from 'react-chartjs-2';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (user?.id) fetchSummary();
  }, [user]);

  const fetchSummary = async () => {
    try {
      const studentId = user.id;
      const response = await attendanceAPI.getSummary(studentId);
      setSummary(response.data.data);
    } catch (error) { console.error('Failed to fetch summary'); }
  };

  const statCards = [
    { label: 'Attendance Percentage', value: `${summary?.percentage || 0}%`, icon: FiTrendingUp, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Classes', value: summary?.totalClasses || 0, icon: FiCalendar, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: 'Present', value: summary?.presentClasses || 0, icon: FiCheckCircle, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Absent', value: summary?.absentClasses || 0, icon: FiXCircle, color: 'bg-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`${card.color.replace('bg-', 'text-')}`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          <div className="flex justify-center">
            <Doughnut
              data={{
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                  data: [summary?.presentClasses || 0, summary?.absentClasses || 0, summary?.lateClasses || 0],
                  backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                cutout: '65%',
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-green-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Present - Data Structures</p>
                  <p className="text-xs text-gray-500">{item} day{item > 1 ? 's' : ''} ago</p>
                </div>
                <span className="badge-success">Present</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;