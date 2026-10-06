import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy,
  Code2,
  Bot,
  Video,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Flame,
  Target,
  Zap,
  BookOpen,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import API from '../../services/api';
import { buildCategoryDistribution, getCanonicalSolvedCount, normalizeLearningStreak } from '../../utils/dashboardStats';

export const CandidateDashboard = () => {
  const { user, setUser } = useAuth();
  const [problems, setProblems] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [editorHeight, setEditorHeight] = useState(60); // percentage of right panel
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [streakData, setStreakData] = useState({ currentStreak: 0, weeklyProgress: [false, false, false, false, false, false, false] });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [solvedHistory, setSolvedHistory] = useState([]);

  // Calculate learning streak from localStorage
  const calculateStreak = () => {
    const streakStorage = localStorage.getItem('learningStreak');

    if (streakStorage) {
      try {
        const parsed = JSON.parse(streakStorage);
        const normalized = normalizeLearningStreak(parsed);

        const lastActiveDate = normalized.lastActiveDate ? new Date(normalized.lastActiveDate) : null;
        if (!normalized.lastActiveDate || Number.isNaN(lastActiveDate?.getTime())) {
          const nextStreak = { ...normalized, currentStreak: 1, lastActiveDate: new Date().toISOString() };
          localStorage.setItem('learningStreak', JSON.stringify(nextStreak));
          return nextStreak;
        }

        const diffDays = Math.round((new Date() - lastActiveDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          const resetStreak = { currentStreak: 0, weeklyProgress: [false, false, false, false, false, false, false], lastActiveDate: new Date().toISOString() };
          localStorage.setItem('learningStreak', JSON.stringify(resetStreak));
          return resetStreak;
        }

        if (normalized.currentStreak === 0 && !diffDays) {
          const repairedStreak = { ...normalized, currentStreak: 1 };
          localStorage.setItem('learningStreak', JSON.stringify(repairedStreak));
          return repairedStreak;
        }

        return normalized;
      } catch (e) {
        console.error('Error parsing streak data:', e);
      }
    }

    const freshStreak = { currentStreak: 0, weeklyProgress: [false, false, false, false, false, false, false], lastActiveDate: new Date().toISOString() };
    localStorage.setItem('learningStreak', JSON.stringify(freshStreak));
    return freshStreak;
  };

  const resetProgressToZero = () => {
    const freshStreak = {
      currentStreak: 0,
      weeklyProgress: [false, false, false, false, false, false, false],
      lastActiveDate: new Date().toISOString(),
    };

    const resetAt = new Date().toISOString();
    localStorage.setItem('learningStreak', JSON.stringify(freshStreak));
    localStorage.setItem('solvedProgress', '0');
    localStorage.setItem('solvedQuestionHistory', JSON.stringify([]));
    localStorage.setItem('solvedHistoryResetAt', resetAt);
    localStorage.setItem('lastSolvedMonth', '');

    const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (cachedUser && typeof cachedUser === 'object') {
      const nextUser = {
        ...cachedUser,
        stats: {
          ...(cachedUser.stats || {}),
          problemsSolved: 0,
          solvedProblems: 0,
          averageScore: 0,
        },
      };
      localStorage.setItem('user', JSON.stringify(nextUser));
      setUser(nextUser);
    }

    setSolvedHistory([]);
    setStreakData(freshStreak);
  };

  useEffect(() => {
    // Load streak data on mount
    setStreakData(calculateStreak());
    
    async function loadDashboardData() {
      try {
        const [probRes, intRes] = await Promise.allSettled([
          API.get('/problems'),
          API.get('/interviews/my'),
        ]);

        if (probRes.status === 'fulfilled' && probRes.value.data.success) {
          setProblems(probRes.value.data.data);
        }
        if (intRes.status === 'fulfilled' && intRes.value.data.success && intRes.value.data.data.length > 0) {
          setInterviews(intRes.value.data.data);
        }
      } catch (e) {
        console.warn('API connection offline, utilizing initial seed problem set.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const performanceMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const firstName = user?.name?.split(' ')[0] || 'Candidate';
  const readinessScore = user?.stats?.averageScore ?? 0;
  const canonicalSolvedEntries = Array.isArray(solvedHistory) && solvedHistory.length > 0
    ? solvedHistory
    : (() => {
        try {
          const storedHistory = JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
          return Array.isArray(storedHistory) ? storedHistory : [];
        } catch {
          return [];
        }
      })();
  const solvedCount = getCanonicalSolvedCount({
    user,
    solvedHistory: canonicalSolvedEntries,
    localSolvedProgress: Number(localStorage.getItem('solvedProgress') || 0),
  });
  const interviewCount = user?.stats?.interviewsCompleted ?? 0;
  const completionPercent = Math.min(100, Math.max(0, readinessScore));
  const categoryDistribution = buildCategoryDistribution({ solvedCount: canonicalSolvedEntries.length || solvedCount, solvedHistory: canonicalSolvedEntries, problems });

  useEffect(() => {
    let isMounted = true;

    const loadSolvedHistory = async () => {
      const resetAt = localStorage.getItem('solvedHistoryResetAt');
      const localHistory = (() => {
        try {
          return JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
        } catch {
          return [];
        }
      })();

      if (resetAt) {
        if (isMounted) { setSolvedHistory(localHistory); }
        return;
      }

      try {
        const res = await API.get('/submissions/my');
        const acceptedEntries = Array.isArray(res?.data?.data)
          ? res.data.data.filter((item) => item.status === 'Accepted')
          : [];

        const history = acceptedEntries
          .map((item) => {
            const createdAt = item.createdAt ? new Date(item.createdAt) : null;
            if (!createdAt || Number.isNaN(createdAt.getTime())) return null;

            return {
              date: createdAt.toISOString().slice(0, 10),
              problemTitle: item.problemId?.title || item.problemTitle || 'Solved Problem',
              solvedAt: createdAt.toISOString(),
            };
          })
          .filter(Boolean);

        const mergedHistory = [...localHistory, ...history].filter((entry) => entry?.date && entry?.problemTitle);
        const canonicalTotal = Math.max(mergedHistory.length, Number(user?.stats?.problemsSolved ?? 0), Number(localStorage.getItem('solvedProgress') || 0));

        if (canonicalTotal > 0) {
          localStorage.setItem('solvedProgress', String(canonicalTotal));
        }

        if (isMounted) { setSolvedHistory(mergedHistory); }
      } catch (error) {
        try {
          const storedHistory = JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
          const canonicalTotal = Math.max(Array.isArray(storedHistory) ? storedHistory.length : 0, Number(user?.stats?.problemsSolved ?? 0), Number(localStorage.getItem('solvedProgress') || 0));

          if (canonicalTotal > 0) {
            localStorage.setItem('solvedProgress', String(canonicalTotal));
          }

          if (isMounted) setSolvedHistory(Array.isArray(storedHistory) ? storedHistory : []);
        } catch {
          if (isMounted) setSolvedHistory([]);
        }
      }
    };

    loadSolvedHistory();
    return () => { isMounted = false; };
  }, [user?.id, user?.stats?.problemsSolved]);

  const getMonthSolvedMap = (entries = canonicalSolvedEntries) => {
    const map = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const solvedAt = entry?.solvedAt || entry?.date;
      const date = solvedAt ? new Date(solvedAt) : null;
      if (!date || Number.isNaN(date.getTime())) continue;

      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const currentCount = map.get(monthName) || 0;
      map.set(monthName, currentCount + 1);
    }
    return map;
  };

  const performanceData = performanceMonths.map((month) => {
    const monthSolvedCount = getMonthSolvedMap().get(month) || 0;

    return {
      month,
      questionsAttempted: monthSolvedCount,
      questionTag: monthSolvedCount > 0 ? `Solved ${monthSolvedCount} problem${monthSolvedCount > 1 ? 's' : ''} in ${month}` : 'No activity',
    };
  });

  const getCurrentMonthSolvedData = (entries = canonicalSolvedEntries) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const toLocalDateKey = (date) => {
      const d = new Date(date);
      const localYear = d.getFullYear();
      const localMonth = String(d.getMonth() + 1).padStart(2, '0');
      const localDay = String(d.getDate()).padStart(2, '0');
      return `${localYear}-${localMonth}-${localDay}`;
    };

    const groupedByDate = new Map();
    for (const entry of Array.isArray(entries) ? entries : []) {
      const entryDate = entry?.date ? new Date(`${entry.date}T12:00:00`) : (entry?.solvedAt ? new Date(entry.solvedAt) : null);
      if (!entryDate || Number.isNaN(entryDate.getTime())) continue;
      if (entryDate.getFullYear() !== year || entryDate.getMonth() !== month) continue;

      const key = toLocalDateKey(entryDate);
      const existing = groupedByDate.get(key) || [];
      const problemTitle = entry.problemTitle || 'Solved Problem';
      existing.push(problemTitle);
      groupedByDate.set(key, existing);
    }

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month, index + 1);
      const key = toLocalDateKey(date);
      const questions = groupedByDate.get(key) || [];

      return {
        dateKey: key,
        day: String(date.getDate()),
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        solved: questions.length,
        questions,
      };
    });
  };

  const currentMonthSolvedData = getCurrentMonthSolvedData(canonicalSolvedEntries);

  const problemCategories = [
    { id: 'All', name: 'All Problems', icon: Code2 },
    { id: 'Arrays', name: 'Arrays & Hashing', icon: BarChart3 },
    { id: 'Strings', name: 'Strings', icon: BookOpen },
    { id: 'Linked Lists', name: 'Linked Lists', icon: Target },
    { id: 'Trees', name: 'Trees & Graphs', icon: Zap },
    { id: 'DP', name: 'Dynamic Programming', icon: Sparkles },
  ];

  const filteredProblems = selectedCategory === 'All'
    ? problems
    : problems.filter((problem) => problem.category === selectedCategory);

  return (
    <div className={`space-y-8 w-full px-0 py-8 min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Welcome Banner */}
      <div className={`p-8 rounded-3xl border relative overflow-hidden ${isDark ? 'glass-panel bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-lg'}`}>
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`absolute top-4 right-4 p-2 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'} transition-colors`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' : 'bg-indigo-100 border border-indigo-200 text-indigo-700'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} /> Candidate Mastery Portal
            </div>
            <h1 className={`text-3xl font-heading font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, <span className={`gradient-text ${isDark ? '' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>{firstName}</span>!
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Your overall readiness score is <strong className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{readinessScore || 0} / 100</strong>. Continue building momentum with AI-led practice and interview prep.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/ai-interview/practice"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all"
            >
              <Bot className="w-4 h-4" /> AI Voice Practice
            </Link>
            <Link
              to="/practice"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}
            >
              <Code2 className="w-4 h-4" /> Coding IDE
            </Link>
          </div>
        </div>
      </div>

      {/* Performance Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Over Time Chart */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <h3 className={`text-base font-heading font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} /> Performance Progress
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} label={{ value: 'Questions Attempted', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [
                  `${value} questions`,
                  props.payload.questionTag
                ]}
              />
              <Line type="monotone" dataKey="questionsAttempted" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2} dot={{ fill: isDark ? '#818cf8' : '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Solved Problems By Date Chart */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <h3 className={`text-base font-heading font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Target className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} /> Solved Problems This Month
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={currentMonthSolvedData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="day" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <YAxis allowDecimals={false} stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(124, 58, 237, 0.08)' }}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                }}
                labelFormatter={(_, payload) => {
                  const item = payload?.[0]?.payload;
                  return item ? item.label : 'Date';
                }}
                formatter={(value, name, props) => {
                  const questions = props.payload?.questions || [];
                  if (!questions.length) {
                    return [`0 problems`, 'Solved'];
                  }

                  const questionText = questions.join(', ');
                  return [`${value} problem${value === 1 ? '' : 's'}: ${questionText}`, 'Solved'];
                }}
              />
              <Bar dataKey="solved" radius={[8, 8, 0, 0]} fill={isDark ? '#a855f7' : '#7c3aed'} />
            </BarChart>
          </ResponsiveContainer>

          <div className={`mt-4 space-y-2 max-h-32 overflow-y-auto pr-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {currentMonthSolvedData.filter((entry) => entry.solved > 0).length > 0 ? (
              currentMonthSolvedData
                .filter((entry) => entry.solved > 0)
                .map((entry) => (
                  <div key={entry.dateKey} className={`flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 ${isDark ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                    <span className="font-medium">{entry.label}</span>
                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {entry.solved} solved • {entry.questions.join(', ')}
                    </span>
                  </div>
                ))
            ) : (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No problems solved yet this month.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution & Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <h3 className={`text-base font-heading font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <PieChart className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} /> Problem Categories
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RechartsPieChart>
              <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                  border: isDark ? '#334155' : '#e2e8f0',
                  borderRadius: '8px'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {categoryDistribution.slice(0, 3).map((cat) => (
              <div key={cat.name} className="text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: cat.color }}></div>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Streak */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <h3 className={`text-base font-heading font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Flame className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} /> Learning Streak
          </h3>
          <div className="text-center">
            <div className={`text-5xl font-heading font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{streakData.currentStreak}</div>
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Day Streak 🔥</div>
            <div className={`mt-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {streakData.currentStreak > 0 ? 'Keep it up! You\'re on fire!' : 'Start solving problems to build your streak!'}
            </div>
          </div>
          <div className="flex justify-center gap-1 mt-4">
            {streakData.weeklyProgress.map((completed, i) => (
              <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${completed ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600') : (isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400')}`}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <h3 className={`text-base font-heading font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Zap className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} /> Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Problems Solved</span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{solvedCount}</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, solvedCount * 2)}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interviews Attended</span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{interviewCount}</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, interviewCount * 10)}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Readiness</span>
              <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{completionPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Scheduled Interviews & Recommended Practice Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Scheduled & Past Interviews */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className={`flex items-center justify-between pb-3 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-200'}`}>
              <h3 className={`text-base font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Calendar className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} /> Upcoming & Live Interviews
              </h3>
            </div>

            <div className="space-y-3">
              {interviews.length === 0 ? (
                <div className={`p-4 rounded-xl border border-dashed ${isDark ? 'border-slate-700 bg-slate-900/60 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                  No interviews are scheduled yet. Your upcoming sessions will appear here.
                </div>
              ) : (
                interviews.map((item, idx) => {
                  const roomId = item.roomId || item.room || `room-${idx + 1}`;
                  const titleStr = item.title || 'Interview Session';
                  const interviewerStr = item.interviewer || item.candidateName || 'Interview Team';
                  const durationStr = item.durationMinutes ? `${item.durationMinutes} Mins` : 'Scheduled';
                  const sessionId = item.sessionId || `sess_${item._id?.slice(-8) || 'pending'}`;
                  const isCompleted = item.status?.toLowerCase() === 'completed';
                  const timerDisplay = isCompleted ? item.completedDuration || 'Completed' : item.demoTimer || 'Scheduled';
                  const timerLabel = isCompleted ? 'Duration' : 'Starts in';

                  return (
                    <div key={item._id || idx} className={`p-4 rounded-xl border hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isCompleted ? (isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-slate-100 text-slate-600') : (isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')}`}>
                            {item.status || 'Scheduled'}
                          </span>
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{durationStr}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                            Session ID: {sessionId}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{titleStr}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{timerLabel}:</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            {timerDisplay}
                          </span>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interviewer / Participant: {interviewerStr}</p>
                      </div>

                      {isCompleted ? (
                        <button
                          disabled
                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all cursor-not-allowed ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-300 text-slate-500'}`}
                        >
                          <Video className="w-3.5 h-3.5" /> View Recording
                        </button>
                      ) : (
                        <Link
                          to={`/live-room/${roomId}`}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Live Room
                        </Link>
                      )}
                    </div>
                  );
                })
              )}

              <div className={`p-4 rounded-xl border hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200 hover:border-purple-300'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                      AI Practice
                    </span>
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ready</span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{firstName ? `${firstName}'s Interview Practice` : 'Interview Practice'}</h4>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Use the practice workspace to continue improving your readiness.</p>
                </div>

                <Link
                  to="/ai-interview/practice"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" /> Start Practice
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Problem Bank List */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className={`flex items-center justify-between pb-3 ${isDark ? 'border-b border-slate-800' : 'border-b border-slate-200'}`}>
              <h3 className={`text-base font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Code2 className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} /> Recommended Problems
              </h3>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {problemCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredProblems.length === 0 ? (
                <div className={`p-3.5 rounded-xl border border-dashed ${isDark ? 'border-slate-700 bg-slate-900/60 text-slate-400' : 'border-slate-300 bg-slate-50 text-slate-600'}`}>
                  No recommended problems are available yet.
                </div>
              ) : (
                filteredProblems.map((prob) => (
                  <Link
                    key={prob._id}
                    to={`/practice?problem=${prob.slug}`}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all group ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}
                  >
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700 group-hover:text-indigo-600'}`}>
                        {prob.title}
                      </h4>
                      <span className={`text-[10px] font-mono mt-0.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{prob.category}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        prob.difficulty === 'Easy'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          : prob.difficulty === 'Medium'
                          ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                          : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {prob.difficulty}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
