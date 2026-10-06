import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Video, 
  Calendar, 
  Users, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Plus,
  Settings,
  FileText,
  Award,
  Sparkles,
  Target,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatsCharts from '../../components/common/StatsCharts';

export const InterviewerWelcomePage = () => {
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
    if (!token || !user) return;

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
        // ignore
      }
    };
    fetchData();
  }, [token, user]);

  const features = [
    {
      icon: Calendar,
      title: 'Schedule Interviews',
      description: 'Create and manage interview sessions with candidates',
      color: 'from-indigo-500 to-blue-500',
      link: '/interviewer/dashboard'
    },
    {
      icon: Video,
      title: 'Live Interview Rooms',
      description: 'Conduct real-time coding interviews with built-in IDE',
      color: 'from-purple-500 to-pink-500',
      link: '/interviewer/dashboard'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'View detailed performance reports and candidate evaluations',
      color: 'from-emerald-500 to-teal-500',
      link: '/interviewer/dashboard'
    }
  ];

  const steps = [
    { icon: CheckCircle2, text: 'Set up your interviewer profile' },
    { icon: Plus, text: 'Schedule your first interview session' },
    { icon: Users, text: 'Invite candidates to interview rooms' },
    { icon: Award, text: 'Review AI-assisted evaluation reports' }
  ];

  const quickActions = [
    {
      icon: Plus,
      title: 'Schedule New Interview',
      description: 'Create a new interview session',
      action: 'schedule'
    },
    {
      icon: Users,
      title: 'View Candidates',
      description: 'See all scheduled candidates',
      action: 'candidates'
    },
    {
      icon: FileText,
      title: 'Problem Bank',
      description: 'Browse coding problems',
      action: 'problems'
    }
  ];

  const interviewerStats = user?.stats || {};
  const interviewsConducted = Number(interviewerStats.interviewsCompleted ?? interviews.filter((it) => String(it.status || '').toLowerCase() === 'completed').length ?? 0);
  const interviewHours = Number(interviewerStats.totalHours ?? interviews.reduce((sum, it) => sum + (Number(it.durationMinutes || 0) || 0), 0) / 60);

  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center p-6">
      <motion.div className="w-full max-w-6xl mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Hero */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-slate-200">
          <div className="md:flex md:items-center md:gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
                  Hello, <span className="text-indigo-600">{user?.name || 'Interviewer'}</span>
                </h1>
                <div className="ml-2 text-sm text-slate-500 flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">Role: {user?.role || 'interviewer'}</div>
                  <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2 rounded-full bg-slate-50 border border-slate-200 hover:shadow">
                    {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  </button>
                </div>
              </div>
              <p className="text-lg text-slate-600 max-w-2xl">
                Manage interviews, review AI-assisted reports, and get insights to hire faster and fairer.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 justify-center md:justify-start">
                <Link to="/interviewer/dashboard" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold shadow">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 md:mt-0 w-full md:w-80">
              <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl p-1 shadow-lg">
                <div className="bg-white rounded-[18px] p-6 text-center">
                  <Video className="w-12 h-12 mx-auto text-indigo-600 mb-3" />
                  <div className="text-sm text-slate-500">Active Rooms</div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">{user?.stats?.activeRooms ?? 2}</div>
                  <div className="text-xs text-slate-400 mt-1">Start a session or join scheduled interviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <div className="text-sm text-slate-500">Interviews Conducted</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{interviewsConducted}</div>
            <div className="text-xs text-slate-400 mt-2">Sessions completed</div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <div className="text-sm text-slate-500">Interview Hours</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{interviewHours}</div>
            <div className="text-xs text-slate-400 mt-2">Total time spent interviewing</div>
          </div>
        </div>

        {/* Charts */}
        <StatsCharts user={user} interviews={interviews} sessions={sessions} />

        {/* Live Sessions & Recent Interviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Active / Scheduled Interviews</h3>
            {interviews.length === 0 ? (
              <div className="text-sm text-slate-500">No interviews scheduled or active.</div>
            ) : (
              <ul className="space-y-3">
                {interviews.slice(0, 6).map((it) => (
                  <li key={it.roomId || it._id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{it.title || it.problemTitle || it.problemTitle}</div>
                      <div className="text-xs text-slate-500">{new Date(it.scheduledAt || Date.now()).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-3 py-1 rounded-full ${it.status && it.status.toLowerCase().includes('in') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{it.status || 'scheduled'}</div>
                      {it.status && it.status.toLowerCase().includes('in') && (
                        <Link to={`/live-room/${it.roomId || it._id}`} className="text-indigo-600 text-sm font-medium">Open Room</Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Activity</h3>
            {sessions.length === 0 ? (
              <div className="text-sm text-slate-500">No recent login sessions.</div>
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
          <Link to="/interviewer/dashboard" className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-semibold shadow-lg">
            View Interview Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
