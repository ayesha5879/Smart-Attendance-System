import React, { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { attendanceAPI, courseAPI, faceAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiPlus, FiPlay, FiStopCircle, FiCalendar, FiClock, FiCamera, FiX } from 'react-icons/fi';
import { MdFaceUnlock } from 'react-icons/md';
import toast from 'react-hot-toast';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ courseId: '', sessionDate: new Date().toISOString().split('T')[0], startTime: '' });

  const openModal = () => {
    const now = new Date();
    setFormData({ courseId: '', sessionDate: now.toISOString().split('T')[0], startTime: now.toTimeString().slice(0, 5) });
    setShowModal(true);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, coursesRes] = await Promise.all([
        attendanceAPI.getSessions({}),
        courseAPI.getAll({ limit: 100 })
      ]);
      setSessions(sessionsRes.data.data);
      setCourses(coursesRes.data.data.courses);
    } catch { toast.error('Failed to fetch data'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await attendanceAPI.createSession(formData);
      toast.success('Session created');
      setShowModal(false);
      fetchData();
    } catch (error) { toast.error(error.message || 'Failed to create session'); }
  };

  const handleEndSession = async (id) => {
    try {
      await attendanceAPI.endSession(id);
      toast.success('Session ended');
      fetchData();
    } catch { toast.error('Failed to end session'); }
  };

  // Face Recognition
  const webcamRef = useRef(null);
  const [scanSession, setScanSession] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const openScanner = (session) => { setScanSession(session); setScanResult(null); };
  const closeScanner = () => { setScanSession(null); setScanResult(null); };

  const handleScan = useCallback(async () => {
    if (!webcamRef.current || !scanSession) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) { toast.error('Could not capture image'); return; }
    setScanning(true);
    setScanResult(null);
    try {
      const blob = await fetch(imageSrc).then(r => r.blob());
      const fd = new FormData();
      fd.append('image', blob, 'face.jpg');
      fd.append('sessionId', scanSession.id);
      const response = await faceAPI.recognize(fd);
      const data = response.data.data;
      setScanResult(data);
      if (data.recognized && data.attendanceMarked) {
        toast.success(`✅ ${data.student.fullName} marked present!`);
        fetchData();
      } else if (data.recognized && !data.attendanceMarked) {
        toast(`${data.student.fullName} already marked`, { icon: 'ℹ️' });
      } else {
        toast.error('Face not recognized. Try again.');
      }
    } catch (error) {
      toast.error(error.message || 'Recognition failed');
    } finally {
      setScanning(false);
    }
  }, [webcamRef, scanSession]);

  const statusColor = (s) => s === 'active' ? 'border-l-emerald-500' : s === 'completed' ? 'border-l-primary-500' : 'border-l-gray-600';

  return (
    <div className="space-y-5 animate-fade-in">
      <PageBanner
        image="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=1200&q=80&auto=format&fit=crop"
        title="Attendance Sessions"
        subtitle="Start sessions and mark attendance with face recognition"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Attendance Sessions</h1>
          <p className="page-sub">Manage and monitor attendance sessions</p>
        </div>
        <button onClick={openModal} className="btn-primary">
          <FiPlus size={16} /> New Session
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session, i) => {
            const colors = [
              { bg:'bg-yellow-50', border:'border-yellow-200', title:'text-yellow-800', sub:'text-yellow-600', bar:'bg-yellow-400', img:'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=60&auto=format&fit=crop' },
              { bg:'bg-purple-50', border:'border-purple-200', title:'text-purple-800', sub:'text-purple-600', bar:'bg-purple-400', img:'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&q=60&auto=format&fit=crop' },
              { bg:'bg-blue-50',   border:'border-blue-200',   title:'text-blue-800',   sub:'text-blue-600',   bar:'bg-blue-400',   img:'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=60&auto=format&fit=crop' },
              { bg:'bg-pink-50',   border:'border-pink-200',   title:'text-pink-800',   sub:'text-pink-600',   bar:'bg-pink-400',   img:'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=60&auto=format&fit=crop' },
              { bg:'bg-green-50',  border:'border-green-200',  title:'text-green-800',  sub:'text-green-600',  bar:'bg-green-400',  img:'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&q=60&auto=format&fit=crop' },
            ];
            const c = session.status === 'active' ? colors[i % colors.length] : { bg:'bg-white', border:'border-gray-200', title:'text-gray-800', sub:'text-gray-500', bar:'bg-gray-300' };
            return (
            <div key={session.id} className={`rounded-2xl border p-5 ${c.bg} ${c.border} transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden`}
              style={{
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                ...(session.status === 'active' && c.img ? { backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%), url(${c.img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
              }}>
              <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className={`font-bold text-sm leading-tight ${c.title}`}>{session.course?.courseName}</h3>
                  <p className={`text-xs mt-0.5 font-semibold ${c.sub}`}>{session.course?.courseCode}</p>
                </div>
                <span className={`badge-${session.status === 'active' ? 'success' : session.status === 'completed' ? 'info' : 'warning'} shrink-0`}>
                  {session.status}
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <p className="flex items-center gap-1.5"><FiCalendar size={12}/> {session.sessionDate}</p>
                <p className="flex items-center gap-1.5"><FiClock size={12}/> {session.startTime}{session.endTime ? ` — ${session.endTime}` : ''}</p>
                <p>Present: <span className="font-bold text-gray-800">{session.presentCount}</span>/{session.totalStudents}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className={`h-full ${c.bar} rounded-full transition-all`}
                    style={{ width:`${session.totalStudents > 0 ? (session.presentCount/session.totalStudents)*100 : 0}%` }} />
                </div>
                {session.status === 'active' && (
                  <>
                    <button onClick={() => openScanner(session)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Scan Face">
                      <MdFaceUnlock size={18} />
                    </button>
                    <button onClick={() => handleEndSession(session.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="End Session">
                      <FiStopCircle size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
            </div>
          )})}
          {sessions.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No sessions yet. Click <strong>New Session</strong> to get started.</div>
          )}
        </div>
      )}

      {/* New Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 w-full max-w-md animate-scale-in">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Create New Session</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Course</label>
                <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} className="input-field" required>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.courseName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                <input type="date" value={formData.sessionDate} onChange={e => setFormData({...formData, sessionDate: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Time</label>
                <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="input-field" required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="btn-primary flex-1"><FiPlay size={14}/> Start Session</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face Scanner Modal */}
      {scanSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Face Recognition</h2>
                <p className="text-sm text-gray-500">{scanSession.course?.courseName} — {scanSession.sessionDate}</p>
              </div>
              <button onClick={closeScanner} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] mb-4 border border-white/10">
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" mirrored />
              {scanning && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Scanning...</p>
                  </div>
                </div>
              )}
              {/* Corner guides */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary-400/60 rounded-2xl" />
              </div>
            </div>

            {scanResult && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-semibold border ${
                scanResult.recognized
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {scanResult.recognized
                  ? `✅ ${scanResult.student.fullName} (${scanResult.student.studentId}) — ${Math.round(scanResult.confidence * 100)}% match`
                  : '❌ Face not recognized — please try again'}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleScan} disabled={scanning} className="btn-primary flex-1">
                <FiCamera size={16} />{scanning ? 'Scanning...' : 'Scan Face'}
              </button>
              <button onClick={closeScanner} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
