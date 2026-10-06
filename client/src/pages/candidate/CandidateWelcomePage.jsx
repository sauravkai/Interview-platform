import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  Code2, 
  Bot, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Trophy, 
  Target,
  BookOpen,
  Zap,
  Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatsCharts from '../../components/common/StatsCharts';
import { getCanonicalSolvedCount } from '../../utils/dashboardStats';

export const CandidateWelcomePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // If no user, redirect to register
    if (!user) {
      navigate('/register');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!token || !user) return; // wait for authenticated user/token before fetching real data

    const fetchData = async () => {
      try {
        const API = (await import('../../services/api')).default;
        const [ivRes, sRes] = await Promise.all([
          API.get('/interviews/my').catch(() => ({ data: { success: true, data: [] } })),
          API.get('/sessions').catch(() => ({ data: { success: true, sessions: [] } })),
        ]);
        setInterviews(ivRes.data?.data || []);
        setSessions(sRes.data?.sessions || []);
      } catch (e) {
        // ignore network errors in demo
      }
    };
    fetchData();
  }, [token, user]);

  const features = [
    {
      icon: Code2,
      title: 'Practice Coding',
      description: 'Solve algorithmic problems with our built-in IDE',
      color: 'from-indigo-500 to-purple-500',
      link: '/practice'
    },
    {
      icon: Bot,
      title: 'AI Voice Interviews',
      description: 'Practice with AI-powered voice mock interviews',
      color: 'from-purple-500 to-pink-500',
      link: '/ai-interview/practice'
    },
    {
      icon: Video,
      title: 'Live Sessions',
      description: 'Join scheduled interviews with real interviewers',
      color: 'from-emerald-500 to-teal-500',
      link: '/dashboard'
    }
  ];

  const steps = [
    { icon: CheckCircle2, text: 'Complete your profile setup' },
    { icon: Target, text: 'Choose your first practice problem' },
    { icon: Flame, text: 'Build your learning streak' },
    { icon: Trophy, text: 'Track your progress and achievements' }
  ];

  const { isDark, toggleTheme } = useTheme();
  const solvedHistory = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  })();
  const displayedSolvedCount = getCanonicalSolvedCount({
    user,
    solvedHistory,
    localSolvedProgress: Number.parseInt(localStorage.getItem('solvedProgress') || '0', 10),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center p-6">
      <motion.div className="w-full max-w-6xl mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Hero */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="md:flex md:items-center md:gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
                  Welcome, <span className="text-indigo-600">{user?.name || 'Candidate'}</span>
                </h1>
                <div className="ml-2 text-sm text-slate-500 flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">Role: {user?.role || 'candidate'}</div>
                  <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-full bg-slate-50 border border-slate-200 hover:shadow">
                    {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  </button>
                </div>
              </div>
              <p className="text-lg text-slate-600 max-w-2xl">
                Practice, improve, and track your interview performance with AI-assisted coaching and real-time coding environments.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 justify-center md:justify-start">
                <Link to="/practice" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow hover:opacity-95">
                  Start Practicing <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 bg-white">
                  View My Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-6 md:mt-0 w-full md:w-80">
              <div className="bg-gradient-to-tr from-indigo-600 to-pink-500 rounded-2xl p-1 shadow-lg">
                <div className="bg-white rounded-[18px] p-6 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-purple-600 mb-3" />
                  <div className="text-sm text-slate-500">Profile Strength</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{Math.min(100, user?.stats?.profileStrength || 60)}%</div>
                  <div className="text-xs text-slate-400 mt-1">Complete your profile to get better matches</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats & Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <div className="text-sm text-slate-500">Problems Solved</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{displayedSolvedCount}</div>
            <div className="text-xs text-slate-400 mt-2">Keep practicing to increase this number</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <div className="text-sm text-slate-500">Average Score</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{user?.stats?.avgScore ?? 72}%</div>
            <div className="text-xs text-slate-400 mt-2">Improves with regular practice</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <div className="text-sm text-slate-500">Streak</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{user?.stats?.streak ?? 3} days</div>
            <div className="text-xs text-slate-400 mt-2">Maintain daily practice to build momentum</div>
          </div>
        </div>

        {/* Charts */}
        <StatsCharts user={user} interviews={interviews} sessions={sessions} />

        {/* Live Sessions & Recent Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Live / Upcoming Interviews</h3>
            {interviews.length === 0 ? (
              <div className="text-sm text-slate-500">No upcoming interviews found.</div>
            ) : (
              <ul className="space-y-3">
                {interviews.slice(0, 5).map((it) => (
                  <li key={it.roomId || it._id} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-900">{it.title || it.problemTitle || it.problemTitle}</div>
                      <div className="text-xs text-slate-500">{new Date(it.scheduledAt || it.scheduledAt || Date.now()).toLocaleString()} • {it.durationMinutes || 45} min</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-3 py-1 rounded-full ${it.status && it.status.toLowerCase().includes('in') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{it.status || 'scheduled'}</div>
                      {it.status && it.status.toLowerCase().includes('in') && (
                        <Link to={`/live-room/${it.roomId || it._id}`} className="text-indigo-600 text-sm font-medium">Join</Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-sm text-slate-500">No recent sessions.</div>
            ) : (
              <ul className="space-y-3">
                {sessions.slice(0, 8).map((s) => (
                  <li key={s._id || s.createdAt} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-900">{s.type}</div>
                      <div className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-full ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{s.isActive ? 'Active' : 'Offline'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow p-6">
              <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br ${feature.color}`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
              <p className="text-sm text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="text-center py-6">
          <Link to="/dashboard" className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold shadow-lg">
            View My Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
