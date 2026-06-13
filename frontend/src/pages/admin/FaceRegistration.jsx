import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { faceAPI, studentAPI } from '../../utils/axios';
import PageBanner from '../../components/common/PageBanner';
import { FiCamera, FiRefreshCw, FiCheck, FiSearch } from 'react-icons/fi';
import { MdFace } from 'react-icons/md';
import toast from 'react-hot-toast';

const FaceRegistration = () => {
  const webcamRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [search, setSearch] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (search.length > 0) {
      studentAPI.getAll({ search, limit: 20 })
        .then(r => setStudents(r.data.data.students))
        .catch(() => {});
    } else {
      setStudents([]);
    }
  }, [search]);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) { setCapturedImage(imageSrc); toast.success('Face captured!'); }
  }, [webcamRef]);

  const retake = () => { setCapturedImage(null); setRegistered(false); };

  const handleRegister = async () => {
    if (!selectedStudent || !capturedImage) {
      toast.error('Please select a student and capture their face');
      return;
    }
    setLoading(true);
    try {
      const blob = await fetch(capturedImage).then(r => r.blob());
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('studentId', selectedStudent);
      await faceAPI.register(formData);
      toast.success('Face registered successfully!');
      setRegistered(true);
    } catch (error) {
      toast.error(error.message || 'Failed to register face');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <PageBanner
        image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop"
        title="Face Registration"
        subtitle="Register student faces for AI-powered attendance recognition"
        height="h-32"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Webcam */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Capture Face</h3>
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] border border-white/10">
            {!capturedImage ? (
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" mirrored />
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
            {/* Face guide overlay */}
            {!capturedImage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary-400/50 rounded-full" />
              </div>
            )}
            {capturedImage && registered && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <FiCheck className="text-white" size={32} />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {!capturedImage ? (
              <button onClick={capture} className="btn-primary flex-1">
                <FiCamera size={16} /> Capture Face
              </button>
            ) : (
              <>
                <button onClick={retake} className="btn-secondary flex-1">
                  <FiRefreshCw size={16} /> Retake
                </button>
                <button onClick={handleRegister} disabled={loading || registered}
                  className={registered ? 'btn-success flex-1' : 'btn-primary flex-1'}>
                  {loading ? 'Registering...' : registered ? <><FiCheck size={16} /> Registered</> : 'Register Face'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Student Selection */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Select Student</h3>
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
            <input type="text" placeholder="Search by name or ID..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10" />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {students.map(student => (
              <button key={student.id}
                onClick={() => { setSelectedStudent(student.id); setRegistered(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedStudent === student.id
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                  {student.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{student.fullName}</p>
                  <p className="text-xs text-gray-400">{student.studentId} · {student.department}</p>
                </div>
                {selectedStudent === student.id && <FiCheck className="text-green-600 shrink-0" size={18} />}
              </button>
            ))}
            {students.length === 0 && search && (
              <div className="flex flex-col items-center py-10 text-gray-500">
                <MdFace size={36} className="mb-2 opacity-30" />
                <p className="text-sm">No students found</p>
              </div>
            )}
            {students.length === 0 && !search && (
              <div className="flex flex-col items-center py-10 text-gray-500">
                <FiSearch size={30} className="mb-2 opacity-30" />
                <p className="text-sm">Search for a student above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
