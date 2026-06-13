import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InsightsPage() {
  const [insights, setInsights] = useState({ atRisk: [], predictions: null, absenteeism: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('at-risk');

  useEffect(() => { fetchAllInsights(); }, []);

  const fetchAllInsights = async () => {
    try {
      setLoading(true);
      const [atRiskRes, absenteeismRes] = await Promise.all([
        axios.get('/insights/at-risk'),
        axios.get('/insights/absenteeism')
      ]);
      setInsights({
        atRisk: atRiskRes.data.data || [],
        absenteeism: absenteeismRes.data.data || []
      });
    } catch (err) {
      toast.error('Failed to load insights');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
          AI Powered
        </span>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {['at-risk', 'absenteeism', 'predictions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium capitalize ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'at-risk' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">Critical Risk Students</p>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                    {insights.atRisk.filter(s => s.riskLevel === 'critical').length}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Warning Level Students</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                    {insights.atRisk.filter(s => s.riskLevel === 'warning').length}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-600 dark:text-purple-400">AI Recommendation</p>
                  <p className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    {insights.atRisk.length > 10 ? `${insights.atRisk.length} students need attention` : 'Low risk levels'}
                  </p>
                </div>
              </div>

              {/* At Risk Students List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold">Students at Risk of Falling Below 75%</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="p-3 text-left font-medium text-gray-500">Student</th>
                        <th className="p-3 text-left font-medium text-gray-500">Department</th>
                        <th className="p-3 text-left font-medium text-gray-500">Attendance</th>
                        <th className="p-3 text-left font-medium text-gray-500">Deficit</th>
                        <th className="p-3 text-left font-medium text-gray-500">Risk Level</th>
                        <th className="p-3 text-left font-medium text-gray-500">Classes Needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {insights.atRisk.map((student, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600">
                                {student.student?.fullName?.charAt(0)}
                              </span>
                              {student.student?.fullName}
                            </div>
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{student.student?.department}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full ${student.overallAttendance < 60 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${Math.min(100, student.overallAttendance)}%` }} />
                              </div>
                              <span className="font-semibold">{student.overallAttendance}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-red-600 font-medium">{student.deficit}%</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              student.riskLevel === 'critical' 
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {student.riskLevel}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{student.coursesNeeded}</td>
                        </tr>
                      ))}
                      {insights.atRisk.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">No students at risk detected</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'absenteeism' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold">Absenteeism Pattern Detection</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="p-3 text-left font-medium text-gray-500">Student</th>
                      <th className="p-3 text-left font-medium text-gray-500">Total Absences</th>
                      <th className="p-3 text-left font-medium text-gray-500">Consecutive</th>
                      <th className="p-3 text-left font-medium text-gray-500">Pattern</th>
                      <th className="p-3 text-left font-medium text-gray-500">Risk</th>
                      <th className="p-3 text-left font-medium text-gray-500">Last Absence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {insights.absenteeism.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-3 font-medium">{item.student?.fullName}</td>
                        <td className="p-3">{item.totalAbsences}</td>
                        <td className="p-3 font-bold text-red-600">{item.consecutiveAbsences}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.pattern === 'chronic' ? 'bg-red-100 text-red-700' :
                            item.pattern === 'frequent' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{item.pattern}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.risk === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.risk}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500 text-xs">{new Date(item.lastAbsence).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {insights.absenteeism.length === 0 && (
                      <tr><td colSpan="6" className="p-8 text-center text-gray-500">No absenteeism patterns detected</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4">Attendance Predictions</h3>
              <p className="text-gray-500 text-center py-8">Enter a Student ID to generate individual attendance predictions</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input type="number" placeholder="Enter Student ID..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                  Predict
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}