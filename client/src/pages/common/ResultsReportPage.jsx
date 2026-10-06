import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Award, Trophy, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Printer, FileText, Clock, BarChart3, Target, Tag, Sun, Moon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import API from '../../services/api';

const printStyles = `
  @media print {
    body {
      background: #fff !important;
      color: #0f172a !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    a, button, .print-hidden, .no-print {
      display: none !important;
      visibility: hidden !important;
    }

    .print-card {
      box-shadow: none !important;
      border: 1px solid #e2e8f0 !important;
    }

    .scorecard-page {
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #fff !important;
    }
  }
`;

const defaultReport = {
  technicalScore: 0,
  communicationScore: 0,
  problemSolvingScore: 0,
  codeQualityScore: 0,
  overallScore: 0,
  hiringRecommendation: 'Pending Evaluation',
  aiSummary: 'No evaluation data available. Please complete an interview session to generate a detailed report.',
  strengths: [],
  improvements: [],
  feedback: 'Complete an interview session to receive detailed AI-powered feedback and recommendations.',
  interviewerNotes: '',
  questionMetrics: [],
  chatMessages: [],
  transcriptHistory: [],
  totalSessionTime: 0,
  avgTimePerQuestion: 0,
  difficultyBreakdown: { easy: [], medium: [], hard: [] },
  avgScoreByDifficulty: { easy: 0, medium: 0, hard: 0 },
  tagPerformance: [],
  topic: 'Unknown',
};

const averageScores = (values = []) => {
  const safeValues = Array.isArray(values) ? values : [];
  if (safeValues.length === 0) return 0;
  return Math.round(safeValues.reduce((sum, value) => sum + Number(value ?? 0), 0) / safeValues.length);
};

const deriveCategoryScores = (metrics = []) => {
  const allScores = metrics.map((metric) => Number(metric?.score ?? 0));
  const codingScores = metrics
    .filter((metric) => String(metric?.questionType || '').toLowerCase() === 'coding')
    .map((metric) => Number(metric?.score ?? 0));
  const textScores = metrics
    .filter((metric) => String(metric?.questionType || '').toLowerCase() === 'text')
    .map((metric) => Number(metric?.score ?? 0));
  const mcqScores = metrics
    .filter((metric) => String(metric?.questionType || '').toLowerCase() === 'mcq')
    .map((metric) => Number(metric?.score ?? 0));

  const technicalScore = Math.max(0, Math.min(100, averageScores(allScores)));
  const communicationScore = Math.max(0, Math.min(100, textScores.length ? averageScores(textScores) : technicalScore));
  const problemSolvingScore = Math.max(0, Math.min(100, codingScores.length ? averageScores(codingScores) : (mcqScores.length ? averageScores(mcqScores) : technicalScore)));
  const codeQualityScore = Math.max(0, Math.min(100, codingScores.length ? averageScores(codingScores) : (mcqScores.length ? averageScores(mcqScores) : Math.max(0, technicalScore - 5))));
  const overallScore = Math.max(0, Math.min(100, Math.round((technicalScore + communicationScore + problemSolvingScore + codeQualityScore) / 4)));

  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    codeQualityScore,
    overallScore,
  };
};

const normalizeReportData = (incoming = {}) => {
  const difficultyBreakdown = incoming.difficultyBreakdown || {};
  const avgScoreByDifficulty = incoming.avgScoreByDifficulty || {};
  const questionMetrics = Array.isArray(incoming.questionMetrics) ? incoming.questionMetrics : [];
  const derivedScores = deriveCategoryScores(questionMetrics);

  const normalizeMessage = (message = {}) => ({
    ...message,
    sender: message?.sender || message?.speaker || message?.role || message?.author || 'Participant',
    role: message?.role || message?.sender || 'participant',
    text: message?.text || message?.message || message?.content || '',
    timestamp: message?.timestamp || message?.time || new Date().toISOString(),
  });

  const normalizeQuestionMetric = (metric = {}) => ({
    ...metric,
    question: typeof metric?.question === 'string'
      ? metric.question
      : (typeof metric?.title === 'string' ? metric.title : (typeof metric?.prompt === 'string' ? metric.prompt : '')),
    answer: typeof metric?.answer === 'string'
      ? metric.answer
      : (typeof metric?.candidateAnswer === 'string'
        ? metric.candidateAnswer
        : (typeof metric?.code === 'string'
          ? metric.code
          : (typeof metric?.response === 'string' ? metric.response : (typeof metric?.solution === 'string' ? metric.solution : '')))),
    tags: Array.isArray(metric?.tags) ? metric.tags : [],
    keyPointsCovered: Array.isArray(metric?.keyPointsCovered) ? metric.keyPointsCovered : [],
    candidateAnswer: typeof metric?.candidateAnswer === 'string'
      ? metric.candidateAnswer
      : (typeof metric?.answer === 'string' ? metric.answer : (typeof metric?.response === 'string' ? metric.response : '')),
    selectedOption: metric?.selectedOption ?? null,
  });

  const normalizedChatMessages = Array.isArray(incoming.chatMessages)
    ? incoming.chatMessages.map(normalizeMessage)
    : (Array.isArray(incoming.transcriptHistory) ? incoming.transcriptHistory.map(normalizeMessage) : defaultReport.chatMessages);

  return {
    ...defaultReport,
    ...incoming,
    ...derivedScores,
    strengths: Array.isArray(incoming.strengths) ? incoming.strengths : defaultReport.strengths,
    improvements: Array.isArray(incoming.improvements) ? incoming.improvements : defaultReport.improvements,
    interviewerNotes: typeof incoming.interviewerNotes === 'string'
      ? incoming.interviewerNotes
      : (typeof incoming.notes === 'string'
        ? incoming.notes
        : (typeof incoming.sessionNotes === 'string' ? incoming.sessionNotes : defaultReport.interviewerNotes)),
    questionMetrics: questionMetrics.map(normalizeQuestionMetric),
    chatMessages: normalizedChatMessages,
    transcriptHistory: Array.isArray(incoming.transcriptHistory)
      ? incoming.transcriptHistory.map(normalizeMessage)
      : (Array.isArray(incoming.chatMessages) ? incoming.chatMessages.map(normalizeMessage) : defaultReport.transcriptHistory),
    tagPerformance: Array.isArray(incoming.tagPerformance) ? incoming.tagPerformance : defaultReport.tagPerformance,
    difficultyBreakdown: {
      easy: Array.isArray(difficultyBreakdown.easy) ? difficultyBreakdown.easy : [],
      medium: Array.isArray(difficultyBreakdown.medium) ? difficultyBreakdown.medium : [],
      hard: Array.isArray(difficultyBreakdown.hard) ? difficultyBreakdown.hard : [],
    },
    avgScoreByDifficulty: {
      easy: Number(avgScoreByDifficulty.easy ?? 0),
      medium: Number(avgScoreByDifficulty.medium ?? 0),
      hard: Number(avgScoreByDifficulty.hard ?? 0),
    },
  };
};

const hasMeaningfulReportData = (data = {}) => {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data.questionMetrics) && data.questionMetrics.length > 0) return true;
  if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0) return true;
  if (Array.isArray(data.transcriptHistory) && data.transcriptHistory.length > 0) return true;
  if (Number(data.totalSessionTime ?? 0) > 0) return true;
  if (typeof data.interviewerNotes === 'string' && data.interviewerNotes.trim()) return true;
  if (typeof data.notes === 'string' && data.notes.trim()) return true;
  if (typeof data.aiSummary === 'string' && !data.aiSummary.includes('No evaluation data available') && !data.aiSummary.includes('Complete an interview session')) return true;
  return false;
};

const formatDurationHMS = (seconds = 0) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
};

export const ResultsReportPage = () => {
  const { reportId = 'report' } = useParams();
  const location = useLocation();
  const passedReportData = location.state?.reportData;
  const reportRootRef = useRef(null);
  
  const [isDark, setIsDark] = useState(false);
  
  const [report, setReport] = useState(defaultReport);

  const handlePrintScorecard = () => {
    window.print();
  };

  useEffect(() => {
    const savedReportData = (() => {
      try {
        const raw = localStorage.getItem('aiInterviewReport:last');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && parsed.reportId && parsed.reportId !== reportId) {
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    })();

    const resolvedReportData = passedReportData || savedReportData;
    const shouldUseResolvedData = hasMeaningfulReportData(resolvedReportData);

    if (shouldUseResolvedData) {
      const questionScores = Array.isArray(resolvedReportData.questionMetrics)
        ? resolvedReportData.questionMetrics.map((metric) => Number(metric.score ?? 0))
        : [];
      const derivedAverage = questionScores.length > 0
        ? Math.round(questionScores.reduce((sum, value) => sum + value, 0) / questionScores.length)
        : 0;
      const derivedScores = deriveCategoryScores(Array.isArray(resolvedReportData.questionMetrics) ? resolvedReportData.questionMetrics : []);

      setReport((prev) => normalizeReportData({
        ...prev,
        ...resolvedReportData,
        overallScore: Number(resolvedReportData.overallScore ?? derivedScores.overallScore ?? resolvedReportData.overallAvgScore ?? derivedAverage ?? prev.overallScore ?? 0),
        technicalScore: Number(resolvedReportData.technicalScore ?? derivedScores.technicalScore ?? derivedAverage ?? prev.technicalScore ?? 0),
        communicationScore: Number(resolvedReportData.communicationScore ?? derivedScores.communicationScore ?? derivedAverage ?? prev.communicationScore ?? 0),
        problemSolvingScore: Number(resolvedReportData.problemSolvingScore ?? derivedScores.problemSolvingScore ?? derivedAverage ?? prev.problemSolvingScore ?? 0),
        codeQualityScore: Number(resolvedReportData.codeQualityScore ?? derivedScores.codeQualityScore ?? derivedAverage ?? prev.codeQualityScore ?? 0),
      }));
    } else {
      async function loadReport() {
        try {
          const res = await API.get(`/interviews/${reportId}/report`);
          if (res.data.success && res.data.data) {
            setReport(normalizeReportData(res.data.data));
          }
        } catch (e) {
          console.warn('Report API fallback engaged.');
        }
      }
      loadReport();
    }
  }, [reportId, passedReportData]);

  return (
    <>
      <style>{printStyles}</style>
      <div ref={reportRootRef} className={`scorecard-page space-y-8 max-w-5xl mx-auto px-4 py-8 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className={`flex items-center gap-2 text-xs transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'}`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={handlePrintScorecard}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
          >
            <Printer className="w-3.5 h-3.5" /> Print Scorecard
          </button>
        </div>
      </div>

      {/* Main Scorecard Header */}
      <div className={`p-8 rounded-3xl border space-y-6 relative overflow-hidden ${isDark ? 'glass-panel bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 border-slate-800' : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-slate-50 border-slate-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border border-emerald-300 text-emerald-700'}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Evaluation Report Certified
            </div>
            <h1 className={`text-3xl font-heading font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Candidate Evaluation Scorecard</h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Generated by Gemini AI & Technical Evaluator Engine</p>
          </div>

          {/* Hiring Recommendation Badge */}
          <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border min-w-[180px] text-center ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Final Recommendation
            </span>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-extrabold shadow-lg ${
                report.hiringRecommendation === 'Strong Hire'
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
            >
              {report.hiringRecommendation}
            </span>
          </div>
        </div>

        {/* Breakdown Radial Scores */}
        <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          {[
            { label: 'Overall Score', val: report.overallScore, color: isDark ? 'text-amber-400' : 'text-amber-600' },
            { label: 'Technical', val: report.technicalScore, color: isDark ? 'text-indigo-400' : 'text-indigo-600' },
            { label: 'Communication', val: report.communicationScore, color: isDark ? 'text-purple-400' : 'text-purple-600' },
            { label: 'Problem Solving', val: report.problemSolvingScore, color: isDark ? 'text-pink-400' : 'text-pink-600' },
            { label: 'Code Quality', val: report.codeQualityScore, color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
          ].map((score, i) => (
            <div key={i} className={`p-3 rounded-xl border text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
              <span className={`text-[10px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{score.label}</span>
              <span className={`text-2xl font-heading font-extrabold ${score.color} mt-0.5 block`}>
                {score.val} <span className={`text-xs font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ 100</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-heading font-bold flex items-center gap-2 border-b pb-3 mb-4 ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
          <Target className="w-4 h-4 text-indigo-500" /> Evaluation Formula
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <p><span className="font-bold">Technical</span> = Average(all answered question scores)</p>
            <p><span className="font-bold">Communication</span> = Average(text-question scores)</p>
            <p><span className="font-bold">Problem Solving</span> = Average(coding-question scores)</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
            <p><span className="font-bold">Code Quality</span> = Average(coding-question scores)</p>
            <p><span className="font-bold">Overall</span> = Round((Technical + Communication + Problem Solving + Code Quality) / 4)</p>
            <p><span className="font-bold">Score Range</span> = 0 to 100, then clamped to valid range</p>
          </div>
        </div>
      </div>

      {/* Detailed AI Analysis & Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-heading font-bold flex items-center gap-2 border-b pb-3 ${isDark ? 'text-emerald-400 border-slate-800' : 'text-emerald-700 border-slate-200'}`}>
            <CheckCircle2 className="w-4 h-4" /> Demonstrated Key Strengths
          </h3>
          <ul className={`space-y-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {report.strengths.length > 0 ? report.strengths.map((str, idx) => (
              <li key={idx} className={`flex items-start gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                <span>{str}</span>
              </li>
            )) : (
              <li className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Complete an interview to see your strengths.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-heading font-bold flex items-center gap-2 border-b pb-3 ${isDark ? 'text-amber-400 border-slate-800' : 'text-amber-700 border-slate-200'}`}>
            <AlertCircle className="w-4 h-4" /> Targeted Growth Opportunities
          </h3>
          <ul className={`space-y-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {report.improvements.length > 0 ? report.improvements.map((imp, idx) => (
              <li key={idx} className={`flex items-start gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                <span>{imp}</span>
              </li>
            )) : (
              <li className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Complete an interview to see improvement areas.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Session Time Analysis */}
      <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Clock className="w-4 h-4 text-indigo-500" /> Session Time Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Session Time</span>
            <span className={`text-2xl font-heading font-extrabold mt-1 block ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
              {formatDurationHMS(report.totalSessionTime)}
            </span>
          </div>
          <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Avg Time per Question</span>
            <span className={`text-2xl font-heading font-extrabold mt-1 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {formatDurationHMS(report.avgTimePerQuestion)}
            </span>
          </div>
          <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Questions Answered</span>
            <span className={`text-2xl font-heading font-extrabold mt-1 block ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
              {report.questionMetrics.length}
            </span>
          </div>
        </div>
      </div>

      {/* Interview Evidence */}
      <div className={`p-6 rounded-2xl border space-y-5 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <FileText className="w-4 h-4 text-violet-500" /> Interview Evidence
        </h3>

        {(report.interviewerNotes || '').trim() && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interviewer Notes</div>
            <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{report.interviewerNotes}</p>
          </div>
        )}

        {Array.isArray(report.chatMessages) && report.chatMessages.length > 0 && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Chat Between Them</div>
            <div className="space-y-2">
              {report.chatMessages.map((message, idx) => {
                const sender = message?.sender || message?.role || message?.speaker || message?.author || 'Participant';
                const text = message?.text || message?.message || message?.content || '';
                return (
                  <div key={idx} className={`rounded-lg border p-2 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                    <div className={`text-[10px] font-mono uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{sender}</div>
                    <p className={`text-xs whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{text || 'No message text'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(!Array.isArray(report.chatMessages) || report.chatMessages.length === 0) && Array.isArray(report.transcriptHistory) && report.transcriptHistory.length > 0 && (
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`text-[10px] font-mono uppercase tracking-wide mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Session Chat Transcript</div>
            <div className="space-y-2">
              {report.transcriptHistory.map((message, idx) => {
                const sender = message?.sender || message?.role || message?.speaker || message?.author || 'Participant';
                const text = message?.text || message?.message || message?.content || '';
                return (
                  <div key={idx} className={`rounded-lg border p-2 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                    <div className={`text-[10px] font-mono uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{sender}</div>
                    <p className={`text-xs whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{text || 'No message text'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Question-by-Question Breakdown */}
      {report.questionMetrics.length > 0 && (
        <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Target className="w-4 h-4 text-pink-500" /> Question-by-Question Performance
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {report.questionMetrics.map((metric, idx) => {
              const metricQuestion = metric?.question || metric?.title || `Question ${idx + 1}`;
              const metricAnswer = metric?.answer || metric?.candidateAnswer || metric?.selectedOption || '';
              const metricTime = Number(metric?.timeSpentSeconds ?? metric?.timeSpent ?? 0);

              return (
                <div key={idx} className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          Q#{metric.questionNumber ?? idx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          String(metric.difficulty || 'medium').toLowerCase() === 'easy' 
                            ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            : String(metric.difficulty || 'medium').toLowerCase() === 'medium'
                            ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                            : isDark ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {String(metric.difficulty || 'Medium')}
                        </span>
                      </div>
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{metricQuestion}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(Array.isArray(metric.tags) ? metric.tags : []).map((tag, tagIdx) => (
                          <span key={tagIdx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className={`text-2xl font-heading font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{Number(metric.score ?? 0)}%</div>
                      <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{formatDurationHMS(metricTime)}</div>
                    </div>
                  </div>

                  {metricAnswer && (
                    <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`text-[10px] font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Candidate Answer / Code:</span>
                      <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'} max-h-28 overflow-y-auto whitespace-pre-wrap`}>
                        {metricAnswer}
                      </p>
                    </div>
                  )}

                  {(Array.isArray(metric.keyPointsCovered) ? metric.keyPointsCovered : []).length > 0 && (
                    <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`text-[10px] font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Key Points Covered:</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(metric.keyPointsCovered) ? metric.keyPointsCovered : []).map((point, pointIdx) => (
                          <span key={pointIdx} className={`px-2 py-0.5 rounded text-[10px] ${isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                            ✓ {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {metric.feedback && (
                    <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <span className={`text-[10px] font-mono block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Feedback:</span>
                      <p className={`text-xs italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{metric.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Charts */}
      {report.questionMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score by Difficulty */}
          <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <BarChart3 className="w-4 h-4 text-cyan-500" /> Performance by Difficulty
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'Easy', score: report.avgScoreByDifficulty.easy, count: report.difficultyBreakdown.easy.length },
                { name: 'Medium', score: report.avgScoreByDifficulty.medium, count: report.difficultyBreakdown.medium.length },
                { name: 'Hard', score: report.avgScoreByDifficulty.hard, count: report.difficultyBreakdown.hard.length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#fff' : '#000' }}
                />
                <Bar dataKey="score" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tag Performance */}
          {report.tagPerformance.length > 0 && (
            <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Tag className="w-4 h-4 text-purple-500" /> Performance by Topic Tags
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.tagPerformance.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="tag" stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={10} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px', color: isDark ? '#fff' : '#000' }}
                  />
                  <Bar dataKey="avgScore" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Summary Narrative */}
      <div className={`p-6 rounded-2xl border space-y-3 ${isDark ? 'glass-panel border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-sm font-heading font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <FileText className="w-4 h-4 text-indigo-500" /> AI Executive Summary
        </h3>
        <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{report.aiSummary}</p>
        <p className={`text-xs italic pt-2 border-t ${isDark ? 'text-slate-400 border-slate-800/80' : 'text-slate-600 border-slate-200'}`}>{report.feedback}</p>
      </div>
    </div>
    </>
  );
};
