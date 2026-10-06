import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, User, Mail, Lock, Shield, Video, UserCheck, ArrowRight, Eye, EyeOff, Sparkles, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const res = await register(formData);
    setIsLoading(false);
    if (res?.success) {
      if (formData.role === 'interviewer') navigate('/interviewer/welcome');
      else navigate('/candidate/welcome');
    } else {
      setError(res?.message || 'Registration failed');
    }
  };


  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-6 relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-24 right-12 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-200/60'}`}></div>
        <div className={`absolute -bottom-24 left-12 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-200/60'}`}></div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`w-full max-w-[25rem] p-5 rounded-[28px] border shadow-[0_18px_50px_rgba(15,23,42,0.08)] relative z-10 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <motion.div variants={itemVariants} className="text-center space-y-3">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`absolute top-4 right-4 p-2 rounded-lg border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex justify-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className={`w-full h-full rounded-[15px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <UserPlus className={`w-7 h-7 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              </div>
            </div>
          </div>

          <h2 className={`text-3xl font-bold tracking-[-0.05em] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Create Account
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Join the next-gen AI Interview Platform</p>
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isDark ? 'bg-rose-950/50 border border-rose-800/50 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}
          >
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
            {error}
          </motion.div>
        )}

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}></div>
            </div>
            <div className={`relative flex justify-center text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className={`px-2 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>Or register with email</span>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Select Account Persona</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'candidate' })}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'candidate'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-[0_16px_32px_rgba(99,102,241,0.3)]'
                    : isDark 
                      ? 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-100 hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Candidate
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'interviewer' })}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`py-3.5 px-4 rounded-2xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'interviewer'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-violet-500 text-white shadow-[0_16px_32px_rgba(168,85,247,0.28)]'
                    : isDark
                      ? 'bg-slate-950/60 border-slate-700/60 text-slate-400 hover:text-slate-100 hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Video className="w-4 h-4" /> Interviewer
              </motion.button>
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
            <div className="relative group">
              <User className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                className={`w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-sans transition-all shadow-sm ${isDark ? 'bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder-slate-500' : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
            <div className="relative group">
              <Mail className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="alex@example.com"
                className={`w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-sans transition-all shadow-sm ${isDark ? 'bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder-slate-500' : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium block mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
            <div className="relative group">
              <Lock className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={`w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-sans transition-all shadow-sm ${isDark ? 'bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder-slate-500' : 'bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:via-violet-500 hover:to-pink-500 text-sm font-bold text-white shadow-[0_18px_36px_rgba(99,102,241,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating account...
              </>
            ) : (
              <>
                Create Account & Join <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.form>

        <motion.div variants={itemVariants} className={`text-center text-sm pt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Already registered?{' '}
          <Link to="/login" className={`font-semibold underline decoration-indigo-400/30 hover:decoration-indigo-400 underline-offset-4 transition-all ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
            Sign in here
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};
