import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MdFaceUnlock } from 'react-icons/md';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(result.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">

      {/* Full background image */}
      <img
        src="https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=85&auto=format&fit=crop"
        alt="Campus"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay — no green, just a clean dark tint */}
      <div className="absolute inset-0" style={{ background: 'rgba(10,15,30,0.55)' }} />

      {/* Login card — centered, frosted glass */}
      <div className="relative z-10 w-full max-w-sm animate-fade-in">

        {/* School branding above card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <MdFaceUnlock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Greenfield Institute</h1>
          <p className="text-white/60 text-sm mt-0.5">of Technology — Student Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7"
          style={{
            background: 'rgba(255,255,255,0.97)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-gray-400 text-sm mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="your@email.com" className="input-field pl-10" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                  placeholder="••••••••" className="input-field pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Demo Access</p>
            <div className="space-y-1.5">
              <button onClick={() => setFormData({ email: 'admin@attendance.com', password: 'admin123' })}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 border border-green-100 hover:bg-green-100 transition-colors text-xs">
                <span className="font-semibold text-green-700">Admin</span>
                <span className="text-gray-400">admin@attendance.com</span>
              </button>
              <button onClick={() => setFormData({ email: 'john@example.com', password: 'student123' })}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-xs">
                <span className="font-semibold text-blue-700">Student</span>
                <span className="text-gray-400">john@example.com</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-5">© 2024 Greenfield Institute of Technology</p>
      </div>
    </div>
  );
};

export default Login;
