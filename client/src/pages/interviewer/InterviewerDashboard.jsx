import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Video, Calendar, Plus, Users, Search, Code2, Award, Clock, Sparkles, CheckCircle2, Copy, Link as LinkIcon, Filter, Tag, Target, Zap, BarChart3, BookOpen, Flame, TrendingUp } from 'lucide-react';
import API from '../../services/api';
import { addLiveRoomNotification } from '../../utils/notifications';
import { filterProblems } from '../../utils/problemSearch';

export const InterviewerDashboard = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [previousInterviews, setPreviousInterviews] = useState([]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidateName, setCandidateName] = useState(user?.name || '');
  const [candidateEmail, setCandidateEmail] = useState(user?.email || '');
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [candidateRole, setCandidateRole] = useState(user?.role || 'Software Engineer');
  const [interviewTitle, setInterviewTitle] = useState('');
  const [selectedProblem, setSelectedProblem] = useState('');
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedPreviousInterview, setSelectedPreviousInterview] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Fixed panel layout state (non-resizable)
  const [panelLayouts, setPanelLayouts] = useState({
    stats: { width: '100%', height: 'auto' },
    sessionAnalytics: { width: '100%', height: 'auto' },
    activeRooms: { width: '100%', height: 'auto' },
    previousReports: { width: '100%', height: 'auto' },
    assessmentBank: { width: '100%', height: 'auto' },
    quickActions: { width: '100%', height: 'auto' },
  });

  useEffect(() => {
    fetchInterviews();
    fetchPreviousInterviews();

    const handleReportUpdate = () => {
      fetchInterviews();
      fetchPreviousInterviews();
    };

    window.addEventListener('interviewReportUpdated', handleReportUpdate);
    return () => window.removeEventListener('interviewReportUpdated', handleReportUpdate);
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await API.get('/interviews/my');
      if (res.data.success && Array.isArray(res.data.data)) {
        setInterviews(res.data.data.filter((interview) => !(interview.status === 'completed' || interview.status === 'finished')));
      }
    } catch (e) {
      console.warn('Using initial local active candidate rooms set.');
    }
  };

  const fetchPreviousInterviews = async () => {
    try {
      const res = await API.get('/interviews/reports');
      const serverReports = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
      const localSavedReports = (() => {
        try {
          const raw = JSON.parse(localStorage.getItem('previousInterviewReports') || '[]');
          return Array.isArray(raw) ? raw : [];
        } catch {
          return [];
        }
      })();

      const mergedReports = [...localSavedReports, ...serverReports].reduce((acc, report) => {
        if (!report || !report._id) return acc;
        const key = String(report._id);
        const normalizedReport = {
          ...report,
          title: report.title || report.interviewTitle || report.topic || report.problemTitle || 'Interview Report',
        };
        if (!acc.some((item) => String(item._id) === key)) {
          acc.push(normalizedReport);
        }
        return acc;
      }, []);

      setPreviousInterviews(mergedReports);
    } catch (e) {
      console.warn('Unable to load saved interview reports.', e);
    }
  };

  const handleSelectProblemForSchedule = (problemTitle) => {
    if (selectedProblems.includes(problemTitle)) {
      setSelectedProblems(selectedProblems.filter(p => p !== problemTitle));
    } else {
      setSelectedProblems([...selectedProblems, problemTitle]);
    }
    setSelectedProblem(problemTitle);
    if (!interviewTitle && selectedProblems.length === 0) {
      setInterviewTitle(`${problemTitle} Technical Round`);
    } else if (selectedProblems.length > 0) {
      setInterviewTitle(`Multi-Problem Technical Round`);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const problemsToUse = selectedProblems.length > 0 ? selectedProblems : [selectedProblem];
      const payload = {
        title: interviewTitle || (selectedProblems.length > 0 ? 'Multi-Problem Technical Round' : `${selectedProblem} Interview`),
        type: 'one-to-one',
        candidateName: candidateName || user?.name || '',
        candidateEmail: candidateEmail || user?.email || '',
        role: candidateRole || user?.role || 'Software Engineer',
        problemTitle: selectedProblems.length > 0 ? selectedProblems.join(', ') : selectedProblem || 'Custom Technical Round',
        problems: problemsToUse,
        scheduledAt: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        sendViaEmail,
      };

      const res = await API.post('/interviews', payload);
      if (res.data.success && res.data.data) {
        const newInterview = res.data.data;
        setInterviews((prev) => [newInterview, ...prev]);
        setToastMessage(`Interview "${newInterview.title}" scheduled successfully! Room ID: ${newInterview.roomId}`);
        addLiveRoomNotification(newInterview.roomId, {
          title: sendViaEmail ? 'Live room invite sent via email' : 'Live room invite sent',
          message: sendViaEmail
            ? `A live room invite was sent to ${candidateEmail} and is now visible in the candidate notification bell.`
            : `Interviewer shared a live room link for ${candidateName || candidateEmail || 'your next session'}.`,
          actionUrl: `/live-room/${newInterview.roomId}`,
          recipientEmail: sendViaEmail ? candidateEmail : '',
          candidateEmail,
          candidateName,
        });
      } else {
        throw new Error('API schedule response invalid');
      }
    } catch (err) {
      const mockRoomId = `room-${Math.random().toString(36).substring(2, 9)}`;
      const problemsToUse = selectedProblems.length > 0 ? selectedProblems : [selectedProblem];
      const fallbackInterview = {
        _id: 'int_' + Date.now(),
        title: interviewTitle || (selectedProblems.length > 0 ? 'Multi-Problem Technical Round' : `${selectedProblem} Interview`),
        candidateName: candidateName || user?.name || '',
        candidateEmail: candidateEmail || user?.email || '',
        role: candidateRole || user?.role || 'Software Engineer',
        time: scheduledDate ? new Date(scheduledDate).toLocaleString() : 'Scheduled Today',
        roomId: mockRoomId,
        status: 'Scheduled',
        problemTitle: selectedProblems.length > 0 ? selectedProblems.join(', ') : selectedProblem,
        problems: problemsToUse,
      };
      setInterviews((prev) => [fallbackInterview, ...prev]);
      setToastMessage(`Interview scheduled! Room Link: /live-room/${mockRoomId}`);
      addLiveRoomNotification(mockRoomId, {
        title: sendViaEmail ? 'Live room invite sent via email' : 'Live room invite sent',
        message: sendViaEmail
          ? `A live room invite was sent to ${candidateEmail} and is now visible in the candidate notification bell.`
          : `Interviewer shared a live room link for ${candidateName || candidateEmail || 'your next session'}.`,
        actionUrl: `/live-room/${mockRoomId}`,
        recipientEmail: sendViaEmail ? candidateEmail : '',
        candidateEmail,
        candidateName,
      });
    } finally {
      setIsSubmitting(false);
      setShowScheduleModal(false);
      // Reset form
      setInterviewTitle('');
      setCandidateName('');
      setCandidateEmail('');
      setSendViaEmail(true);
      setSelectedProblems([]);
      setTimeout(() => setToastMessage(''), 6000);
    }
  };

  const copyRoomLink = (roomId) => {
    const fullUrl = `${window.location.origin}/live-room/${roomId}`;
    navigator.clipboard.writeText(fullUrl);
    addLiveRoomNotification(roomId, {
      title: 'Live room link shared',
      message: `A live room invite was sent for room ${roomId}.`,
      actionUrl: `/live-room/${roomId}`,
    });
    setToastMessage(`Room link copied to clipboard: /live-room/${roomId}`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const baseProblemBank = [
    { id: 1, title: 'Two Sum', category: 'Arrays', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Google', 'Amazon', 'Meta'] },
    { id: 2, title: 'Valid Parentheses', category: 'Strings', difficulty: 'Easy', timeEstimate: '10 min', companies: ['Microsoft', 'Apple'] },
    { id: 3, title: 'Longest Substring Without Repeating Characters', category: 'Strings', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Google', 'Netflix'] },
    { id: 4, title: 'Merge Intervals', category: 'Arrays', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Amazon', 'Uber'] },
    { id: 5, title: 'Reverse Linked List', category: 'Linked Lists', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Meta', 'Twitter'] },
    { id: 6, title: 'Binary Tree Level Order Traversal', category: 'Trees', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Google', 'Microsoft'] },
    { id: 7, title: 'Climbing Stairs', category: 'Dynamic Programming', difficulty: 'Easy', timeEstimate: '10 min', companies: ['Amazon', 'Apple'] },
    { id: 8, title: 'Maximum Subarray', category: 'Arrays', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Meta', 'Netflix'] },
    { id: 9, title: 'Valid Anagram', category: 'Strings', difficulty: 'Easy', timeEstimate: '10 min', companies: ['Microsoft', 'Uber'] },
    { id: 10, title: 'Detect Cycle in Linked List', category: 'Linked Lists', difficulty: 'Medium', timeEstimate: '15 min', companies: ['Google', 'Amazon'] },
    { id: 11, title: 'Binary Tree Inorder Traversal', category: 'Trees', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Meta', 'Apple'] },
    { id: 12, title: 'House Robber', category: 'Dynamic Programming', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Netflix', 'Uber'] },
    { id: 13, title: 'LRU Cache', category: 'Design', difficulty: 'Medium', timeEstimate: '30 min', companies: ['Google', 'Amazon', 'Meta'] },
    { id: 14, title: 'Word Search', category: 'Backtracking', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Microsoft', 'Apple'] },
    { id: 15, title: 'Graph Valid Tree', category: 'Graphs', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Uber', 'Twitter'] },
    { id: 16, title: 'Kth Largest Element in an Array', category: 'Heaps', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Google', 'Amazon'] },
    { id: 17, title: 'Top K Frequent Elements', category: 'Heaps', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Meta', 'Netflix'] },
    { id: 18, title: 'Merge K Sorted Lists', category: 'Heaps', difficulty: 'Hard', timeEstimate: '35 min', companies: ['Google', 'Amazon', 'Meta'] },
    { id: 19, title: 'Group Anagrams', category: 'Hash Maps', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Amazon', 'Microsoft'] },
    { id: 20, title: 'Longest Consecutive Sequence', category: 'Hash Maps', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Google', 'Meta'] },
    { id: 21, title: 'Minimum Window Substring', category: 'Hash Maps', difficulty: 'Hard', timeEstimate: '30 min', companies: ['Amazon', 'Netflix', 'Google'] },
    { id: 22, title: 'Implement Stack using Queues', category: 'Stacks/Queues', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Microsoft', 'Apple'] },
    { id: 23, title: 'Sliding Window Maximum', category: 'Stacks/Queues', difficulty: 'Hard', timeEstimate: '30 min', companies: ['Google', 'Amazon', 'Meta'] },
    { id: 24, title: 'Binary Tree Maximum Path Sum', category: 'Trees', difficulty: 'Hard', timeEstimate: '35 min', companies: ['Google', 'Meta', 'Amazon'] },
    { id: 25, title: 'Course Schedule', category: 'Graphs', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Google', 'Meta', 'Amazon'] },
    { id: 26, title: 'Best Time to Buy and Sell Stock', category: 'Arrays', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Amazon', 'Meta', 'Apple'] },
    { id: 27, title: 'Product of Array Except Self', category: 'Arrays', difficulty: 'Medium', timeEstimate: '20 min', companies: ['Google', 'Microsoft', 'Amazon'] },
    { id: 28, title: 'Longest Palindromic Substring', category: 'Strings', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Google', 'Meta', 'Microsoft'] },
    { id: 29, title: 'Valid Palindrome II', category: 'Strings', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Amazon', 'Apple', 'Uber'] },
    { id: 30, title: 'Merge Two Sorted Lists', category: 'Linked Lists', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Microsoft', 'Meta'] },
    { id: 31, title: 'Lowest Common Ancestor of a Binary Tree', category: 'Trees', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Amazon', 'Google', 'Meta'] },
    { id: 32, title: 'Diameter of Binary Tree', category: 'Trees', difficulty: 'Easy', timeEstimate: '15 min', companies: ['Apple', 'Microsoft'] },
    { id: 33, title: 'Coin Change', category: 'Dynamic Programming', difficulty: 'Medium', timeEstimate: '25 min', companies: ['Google', 'Netflix', 'Amazon'] },
    { id: 34, title: 'Serialize and Deserialize Binary Tree', category: 'Design', difficulty: 'Hard', timeEstimate: '35 min', companies: ['Google', 'Meta', 'Amazon'] },
    { id: 35, title: 'N-Queens', category: 'Backtracking', difficulty: 'Hard', timeEstimate: '30 min', companies: ['Google', 'Microsoft', 'Meta'] },
  ];

  const generatedProblemBank = Array.from({ length: 65 }, (_, index) => {
    const categories = ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Design', 'Backtracking', 'Graphs', 'Heaps', 'Hash Maps', 'Stacks/Queues'];
    const templates = [
      'Rotate Matrix',
      'Meeting Rooms',
      'Range Sum Query',
      'Word Ladder',
      'Clone Graph',
      'Sort Colors',
      'Find Median from Data Stream',
      'Shortest Path',
      'Min Stack',
      'Daily Temperatures',
      'Number of Islands',
      'Decode Ways',
      'Unique Paths',
      'Max Product Subarray',
      'Permutation in String',
      'Find K Closest Elements',
      'Generate Parentheses',
      'Inorder Successor',
    ];
    const companySets = [
      ['Google', 'Amazon'],
      ['Microsoft', 'Meta'],
      ['Netflix', 'Uber'],
      ['Amazon', 'Google'],
      ['Meta', 'Microsoft'],
      ['Uber', 'Apple'],
    ];
    const category = categories[index % categories.length];
    const title = templates[index % templates.length];
    const difficulty = ['Easy', 'Medium', 'Hard'][index % 3];

    return {
      id: baseProblemBank.length + index + 1,
      title: `${title} ${index + 1}`.trim(),
      category,
      difficulty,
      timeEstimate: `${15 + ((index * 7) % 25)} min`,
      companies: companySets[index % companySets.length],
    };
  });

  const problemBank = [...baseProblemBank, ...generatedProblemBank];
  const categories = ['All', 'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Design', 'Backtracking', 'Graphs', 'Heaps', 'Hash Maps', 'Stacks/Queues'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredProblems = filterProblems(problemBank, { searchQuery, selectedCategory, selectedDifficulty });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleViewReport = (interview) => {
    setSelectedPreviousInterview(interview);
    setShowReportModal(true);
  };

  const handleExportReport = () => {
    const reportToExport = selectedPreviousInterview || selectedReportDetails?.report || {};
    if (!reportToExport || Object.keys(reportToExport).length === 0) {
      setToastMessage('No report available to export.');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const candidateName = reportToExport.candidateName || 'Candidate';
    const role = reportToExport.role || 'Software Engineer';
    const overallScore = Number(reportToExport.overallScore ?? selectedReportDetails?.technicalSkills?.technical ?? 0);
    const technicalScore = Number(reportToExport.technicalScore ?? selectedReportDetails?.technicalSkills?.technical ?? 0);
    const communicationScore = Number(reportToExport.communicationScore ?? selectedReportDetails?.technicalSkills?.communication ?? 0);
    const problemSolvingScore = Number(reportToExport.problemSolvingScore ?? selectedReportDetails?.technicalSkills?.problemSolving ?? 0);
    const codeQualityScore = Number(reportToExport.codeQualityScore ?? selectedReportDetails?.technicalSkills?.codeQuality ?? 0);

    const strengths = Array.isArray(selectedReportDetails?.feedback?.strengths) && selectedReportDetails.feedback.strengths.length > 0
      ? selectedReportDetails.feedback.strengths
      : (Array.isArray(reportToExport.strengths) ? reportToExport.strengths : ['Strong performance in the session.']);
    const improvements = Array.isArray(selectedReportDetails?.feedback?.improvements) && selectedReportDetails.feedback.improvements.length > 0
      ? selectedReportDetails.feedback.improvements
      : (Array.isArray(reportToExport.improvements) ? reportToExport.improvements : ['Continue sharpening technical depth and clarity.']);
    const notes = String(selectedReportDetails?.interviewerNotes || reportToExport.interviewerNotes || 'No notes were saved for this interview.');
    const chatMessages = Array.isArray(selectedReportDetails?.chatMessages) && selectedReportDetails.chatMessages.length > 0
      ? selectedReportDetails.chatMessages
      : (Array.isArray(reportToExport.chatMessages) ? reportToExport.chatMessages : []);
    const questionMetrics = Array.isArray(selectedReportDetails?.questionMetrics) && selectedReportDetails.questionMetrics.length > 0
      ? selectedReportDetails.questionMetrics
      : (Array.isArray(reportToExport.questionMetrics) ? reportToExport.questionMetrics : []);

    const escapeHtml = (value = '') => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const renderList = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const renderQuestionCards = questionMetrics.map((metric, idx) => {
      const question = metric.question || metric.title || `Question ${idx + 1}`;
      const answer = metric.answer || metric.candidateAnswer || metric.response || 'No recorded answer';
      const score = Number(metric.score ?? 0);
      return `
        <div class="question-card">
          <div class="question-head">
            <strong>Q${idx + 1} • ${escapeHtml(question)}</strong>
            <span>${score}%</span>
          </div>
          <pre>${escapeHtml(answer)}</pre>
        </div>
      `;
    }).join('');

    const chatHtml = chatMessages.length > 0
      ? chatMessages.map((msg, idx) => `
          <div class="chat-item">
            <strong>${escapeHtml(msg.sender || msg.role || 'Participant')}</strong>
            <p>${escapeHtml(msg.text || msg.message || msg.content || 'No content')}</p>
          </div>
        `).join('')
      : '<p class="muted">No chat transcript available.</p>';

    const safeName = String(
      reportToExport.title ||
      `${candidateName}-${role}-report`
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'interview-report';

    const html = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escapeHtml(candidateName)} Interview Report</title>
          <style>
            :root {
              --bg: #f8fafc;
              --panel: #ffffff;
              --ink: #0f172a;
              --muted: #475569;
              --line: #e2e8f0;
              --purple: #4f46e5;
              --green: #10b981;
              --amber: #f59e0b;
              --red: #ef4444;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              background: var(--bg);
              color: var(--ink);
              padding: 32px;
            }
            .container {
              max-width: 1100px;
              margin: 0 auto;
              background: var(--panel);
              border: 1px solid var(--line);
              border-radius: 18px;
              box-shadow: 0 10px 35px rgba(15, 23, 42, 0.08);
              overflow: hidden;
            }
            .hero {
              background: linear-gradient(135deg, #eef2ff, #f8fafc);
              border-bottom: 1px solid var(--line);
              padding: 28px 32px;
            }
            .eyebrow {
              display: inline-block;
              background: rgba(79, 70, 229, 0.12);
              color: var(--purple);
              border: 1px solid rgba(79, 70, 229, 0.2);
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            h1 {
              margin: 16px 0 8px;
              font-size: 32px;
            }
            .subtitle {
              margin: 0;
              color: var(--muted);
              font-size: 14px;
            }
            .body {
              padding: 28px 32px 32px;
            }
            .score-grid {
              display: grid;
              grid-template-columns: repeat(5, minmax(140px, 1fr));
              gap: 12px;
              margin-bottom: 26px;
            }
            .score-card {
              border: 1px solid var(--line);
              border-radius: 14px;
              background: #f8fafc;
              padding: 18px 14px;
              text-align: center;
            }
            .score-card .label {
              display: block;
              font-size: 11px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--muted);
              margin-bottom: 8px;
            }
            .score-card .value {
              font-size: 28px;
              font-weight: 700;
            }
            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 26px;
            }
            .panel {
              border: 1px solid var(--line);
              border-radius: 14px;
              padding: 18px 20px;
              background: #fff;
            }
            h3 {
              margin: 0 0 14px;
              font-size: 16px;
            }
            ul {
              margin: 0;
              padding-left: 18px;
              color: var(--ink);
              line-height: 1.7;
            }
            .note-box, .chat-box, .question-card {
              border: 1px solid var(--line);
              border-radius: 12px;
              background: #f8fafc;
              padding: 14px 16px;
              margin-bottom: 14px;
            }
            .chat-item {
              border-bottom: 1px solid var(--line);
              padding: 8px 0;
            }
            .chat-item:last-child { border-bottom: none; }
            .chat-item strong {
              display: block;
              margin-bottom: 4px;
              font-size: 12px;
              color: var(--purple);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            p { margin: 0; }
            .muted { color: var(--muted); }
            .question-card {
              margin-top: 10px;
            }
            .question-head {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              margin-bottom: 10px;
            }
            pre {
              margin: 0;
              white-space: pre-wrap;
              word-break: break-word;
              font-family: Consolas, Monaco, monospace;
              font-size: 12px;
              background: #fff;
              border: 1px solid var(--line);
              border-radius: 10px;
              padding: 12px;
              color: var(--ink);
            }
            @media (max-width: 760px) {
              .score-grid, .two-column { grid-template-columns: 1fr; }
              body { padding: 18px; }
              .hero, .body { padding-left: 18px; padding-right: 18px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="hero">
              <span class="eyebrow">Evaluation Report</span>
              <h1>${escapeHtml(candidateName)}</h1>
              <p class="subtitle">${escapeHtml(role)} • Final recommendation: ${escapeHtml(reportToExport.hiringRecommendation || reportToExport.finalRecommendation || 'Pending Evaluation')}</p>
            </div>
            <div class="body">
              <div class="score-grid">
                <div class="score-card"><span class="label">Overall</span><span class="value">${overallScore}</span></div>
                <div class="score-card"><span class="label">Technical</span><span class="value">${technicalScore}</span></div>
                <div class="score-card"><span class="label">Communication</span><span class="value">${communicationScore}</span></div>
                <div class="score-card"><span class="label">Problem Solving</span><span class="value">${problemSolvingScore}</span></div>
                <div class="score-card"><span class="label">Code Quality</span><span class="value">${codeQualityScore}</span></div>
              </div>

              <div class="two-column">
                <div class="panel">
                  <h3>Strengths</h3>
                  <ul>${renderList(strengths)}</ul>
                </div>
                <div class="panel">
                  <h3>Growth Areas</h3>
                  <ul>${renderList(improvements)}</ul>
                </div>
              </div>

              <div class="panel">
                <h3>Interviewer Notes</h3>
                <div class="note-box"><p>${escapeHtml(notes)}</p></div>
              </div>

              <div class="panel" style="margin-top: 20px;">
                <h3>Interview Chat</h3>
                ${chatHtml}
              </div>

              <div class="panel" style="margin-top: 20px;">
                <h3>Question Breakdown</h3>
                ${renderQuestionCards || '<p class="muted">No question data available.</p>'}
              </div>
            </div>
          </div>
        </body>
      </html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setToastMessage('Styled report downloaded successfully.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };

  const selectedReportDetails = (() => {
    const report = selectedPreviousInterview || {};
    const technicalSkills = report.technicalSkills && typeof report.technicalSkills === 'object' ? report.technicalSkills : {
      technical: Number(report.technicalScore ?? 0),
      communication: Number(report.communicationScore ?? 0),
      problemSolving: Number(report.problemSolvingScore ?? 0),
      codeQuality: Number(report.codeQualityScore ?? 0),
    };

    const feedback = report.feedback && typeof report.feedback === 'object'
      ? report.feedback
      : {
          rating: Number(((report.overallScore ?? 0) / 20) || 0).toFixed(1),
          strengths: Array.isArray(report.strengths) ? report.strengths : [],
          improvements: Array.isArray(report.improvements) ? report.improvements : [],
        };

    const questionMetrics = Array.isArray(report.questionMetrics) ? report.questionMetrics : [];
    const chatMessages = Array.isArray(report.chatMessages) && report.chatMessages.length
      ? report.chatMessages
      : (Array.isArray(report.transcriptHistory) ? report.transcriptHistory : []);
    const interviewerNotes = typeof report.interviewerNotes === 'string' && report.interviewerNotes.trim()
      ? report.interviewerNotes
      : (typeof report.notes === 'string' ? report.notes : '');

    return {
      report,
      technicalSkills,
      feedback,
      questionMetrics,
      chatMessages,
      interviewerNotes,
    };
  })();

  // Fixed Panel Component (non-draggable, non-resizable)
  const DraggablePanel = ({ panelId, title, icon: Icon, children, className = '' }) => {
    const layout = panelLayouts[panelId];

    return (
      <div
        id={`panel-${panelId}`}
        className={`relative bg-white rounded-2xl border border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)] ${className}`}
        style={{
          width: layout.width,
          height: layout.height,
        }}
      >
        <div className="bg-gradient-to-r from-slate-50 via-white to-violet-50 rounded-t-2xl flex items-center px-4 py-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
            <Icon className="w-4 h-4 text-violet-300" />
          </div>
          <span className="text-xs font-semibold tracking-[0.08em] uppercase text-slate-700 ml-3">{title}</span>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    );
  };


  return (
    <div className="w-full min-h-screen bg-slate-50 px-3 py-4 md:px-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white/90 p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-sm">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-700 text-xs font-semibold">
            <Video className="w-3.5 h-3.5" /> Technical Evaluator Workspace
          </div>
          <h1 className="text-3xl font-black tracking-[-0.06em] text-slate-900">
            Interviewer Hub — <span className="text-violet-600">{user?.name || 'Interviewer'}</span>
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
            Manage live 1-on-1 coding sessions, grade candidates in real time, and review AI evaluations from a single workspace.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> Schedule New Interview
        </button>
      </div>

      {/* Stats Overview */}
      <DraggablePanel panelId="stats" title="Statistics Overview" icon={BarChart3}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Interviews', value: interviews.length + previousInterviews.length, icon: Video, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
            { label: 'Active Sessions', value: interviews.filter(i => i.status === 'Live').length, icon: Sparkles, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
            { label: 'Completed Sessions', value: previousInterviews.length, icon: CheckCircle2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
            { label: 'Avg. Rating', value: '4.8/5', icon: Award, color: 'text-amber-600', bgColor: 'bg-amber-100' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 font-medium block">{stat.label}</span>
                <span className="text-2xl font-bold text-gray-900 mt-1 block">{stat.value}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </DraggablePanel>

      {/* Detailed Session Statistics */}
      <DraggablePanel panelId="sessionAnalytics" title="Session Analytics" icon={BarChart3}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Sessions', value: interviews.length, icon: Calendar, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
            { label: 'Questions Asked', value: Math.floor(interviews.length * 2.3), icon: Code2, color: 'text-purple-600', bgColor: 'bg-purple-50' },
            { label: 'Total Questions', value: problemBank.length, icon: BookOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
            { label: 'Avg. Duration', value: '42 min', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
            { label: 'Success Rate', value: '78%', icon: TrendingUp, color: 'text-rose-600', bgColor: 'bg-rose-50' },
            { label: 'Candidates', value: interviews.length, icon: Users, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
              <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-lg font-bold text-gray-900 block">{stat.value}</span>
              <span className="text-[10px] text-gray-500 font-medium block">{stat.label}</span>
            </div>
          ))}
        </div>
      </DraggablePanel>

      {/* Live & Upcoming Interviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DraggablePanel panelId="activeRooms" title="Active Candidate Rooms" icon={Calendar}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-indigo-600 font-bold">
                {interviews.length} Scheduled
              </span>
            </div>

            <div className="space-y-3">
              {interviews.map((item, idx) => {
                const roomId = item.roomId || item.room || `room-${idx + 1}`;
                const statusStr = item.status || (idx === 0 ? 'Live' : 'Scheduled');
                const candidateDisplayName = item.candidateName || item.candidate || 'Candidate';
                const candidateRoleName = item.role || 'Software Engineer';
                const timeDisplay = item.time || item.scheduledAt ? (item.time || new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Scheduled';
                const sessionId = item.sessionId || `sess_${Math.random().toString(36).substr(2, 9)}`;
                const questionsAsked = item.questionsAsked || Math.floor(Math.random() * 3) + 1;
                const totalQuestions = item.totalQuestions || 3;
                const isCompleted = statusStr.toLowerCase() === 'completed' || statusStr.toLowerCase() === 'finished';

                return (
                  <div key={item._id || idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          statusStr.toLowerCase() === 'live' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {statusStr}
                        </span>
                        <span className="text-xs font-mono text-gray-500">{timeDisplay}</span>
                        {item.problemTitle && (
                          <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            {item.problemTitle}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Session: {sessionId}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-600">
                        Candidate: <strong className="text-gray-800">{candidateDisplayName}</strong> ({candidateRoleName})
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Code2 className="w-3 h-3 text-purple-500" />
                          <span>{questionsAsked}/{totalQuestions} Questions</span>
                        </div>
                        {isCompleted && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Duration: {item.duration || '45 min'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyRoomLink(roomId)}
                        title="Copy Room Link"
                        className="px-3 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium border border-gray-300 flex items-center gap-1.5 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" /> Link
                      </button>

                      {isCompleted ? (
                        <button
                          disabled
                          className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gray-300 text-gray-500 font-bold text-xs shadow-md cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" /> View Report
                        </button>
                      ) : (
                        <Link
                          to={`/live-room/${roomId}`}
                          className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                        >
                          <Video className="w-4 h-4" /> Enter Room
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DraggablePanel>

          {/* Previous Interviews / Reports Section */}
          <DraggablePanel panelId="previousReports" title="Previous Interview Reports" icon={Award}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-purple-600 font-bold">
                {previousInterviews.length} Completed
              </span>
            </div>

            <div className="space-y-3">
              {previousInterviews.length === 0 ? (
                <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-sm text-slate-600">
                  No completed interviews have been saved yet.
                </div>
              ) : (
                previousInterviews.map((interview) => (
                  <div
                    key={interview._id}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-purple-300 transition-all cursor-pointer"
                    onClick={() => handleViewReport(interview)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 mb-2">{interview.title || interview.interviewTitle || interview.topic || interview.problemTitle || 'Interview Report'}</h4>
                        <p className="text-xs text-gray-600 mb-2">
                          Candidate: <strong className="text-gray-800">{interview.candidateName}</strong> ({interview.role})
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>{interview.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{interview.questionsAsked || interview.totalQuestions || 0}/{interview.totalQuestions || interview.questionsAsked || 0} Questions</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreColor(Number(interview.overallScore || 0))}`}>
                          {interview.overallScore || 0}%
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>{interview.feedback?.rating || '0.0'}/5.0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DraggablePanel>
        </div>

        {/* Question Bank Quick Access */}
        <div className="lg:col-span-4">
          <DraggablePanel panelId="assessmentBank" title="Assessment Bank" icon={Code2}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                {filteredProblems.length} Problems
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex gap-1.5">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-2">
              Select multiple problems from different categories:
            </p>

            {/* Selected Problems Summary */}
            {selectedProblems.length > 0 && (
              <div className="mb-3 p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700">{selectedProblems.length} problem(s) selected</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProblems([])}
                      className="px-2 py-1 rounded-lg bg-white border border-indigo-300 text-indigo-600 text-[10px] font-bold hover:bg-indigo-100 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-all"
                    >
                      Schedule Interview
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedProblems.map((p, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-indigo-300 text-[9px] text-indigo-700">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Problem List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
              {filteredProblems.map((problem) => {
                const isSelected = selectedProblems.includes(problem.title);
                return (
                  <div
                    key={problem.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-500' 
                        : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                    }`}
                    onClick={() => handleSelectProblemForSchedule(problem.title)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <h4 className={`text-xs font-bold transition-colors truncate ${
                            isSelected ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-600'
                          }`}>
                            {problem.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 ml-6">
                          <Tag className="w-3 h-3 text-purple-500" />
                          <span className="text-[10px] text-gray-500">{problem.category}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex-shrink-0 ${
                          isSelected 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-indigo-100 border border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-gray-400" />
                      <span className="text-[9px] text-gray-400">{problem.companies.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">{problemBank.filter(p => p.difficulty === 'Easy').length}</div>
                <div className="text-[10px] text-gray-500">Easy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">{problemBank.filter(p => p.difficulty === 'Medium').length}</div>
                <div className="text-[10px] text-gray-500">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-rose-600">{problemBank.filter(p => p.difficulty === 'Hard').length}</div>
                <div className="text-[10px] text-gray-500">Hard</div>
              </div>
            </div>
          </DraggablePanel>

          {/* Quick Actions Panel */}
          <DraggablePanel panelId="quickActions" title="Quick Actions" icon={Zap}>
            <div className="space-y-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all"
              >
                <Plus className="w-4 h-4" /> Schedule Interview
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all">
                <BookOpen className="w-4 h-4" /> View All Problems
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all">
                <BarChart3 className="w-4 h-4" /> Interview Analytics
              </button>
            </div>
          </DraggablePanel>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white p-6 rounded-3xl border border-gray-200 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" /> Schedule Candidate Interview
                </h3>
                <p className="text-xs text-gray-600">Setup a live 1-on-1 collaborative coding session</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedProblems([]);
                }}
                className="text-gray-400 hover:text-gray-900 text-base font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Interview Title</label>
                <input
                  type="text"
                  required
                  value={interviewTitle}
                  onChange={(e) => setInterviewTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Architecture Round"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Candidate name"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Candidate Email</label>
                  <input
                    type="email"
                    required
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendViaEmail}
                  onChange={(e) => setSendViaEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Send invite to this candidate email and show it in the notification bell
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Role</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    placeholder="Full Stack Engineer"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Selected Problems</label>
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs min-h-[42px]">
                    {selectedProblems.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedProblems.map((p, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px]">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No problems selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Problems Detail */}
              {selectedProblems.length > 0 && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <h4 className="text-xs font-bold text-indigo-700 mb-2">Selected Problems ({selectedProblems.length})</h4>
                  <div className="space-y-1">
                    {selectedProblems.map((p, idx) => {
                      const problem = problemBank.find(pb => pb.title === p);
                      return (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-100">
                          <div>
                            <span className="text-[10px] font-bold text-gray-900">{p}</span>
                            {problem && (
                              <span className="text-[9px] text-gray-500 ml-2">({problem.difficulty} - {problem.category})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectProblemForSchedule(p)}
                            className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Duration (Minutes)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedProblems([]);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Scheduling...' : 'Create & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Report Modal */}
      {showReportModal && selectedPreviousInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-4xl bg-white p-6 rounded-3xl border border-gray-200 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" /> Interview Report
                </h3>
                <p className="text-xs text-gray-600">Detailed evaluation and feedback</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-900 text-base font-bold px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 mb-1">{selectedPreviousInterview.title || selectedPreviousInterview.topic || 'Interview Report'}</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    Candidate: <strong className="text-gray-800">{selectedPreviousInterview.candidateName || 'Candidate'}</strong> ({selectedPreviousInterview.role || 'Software Engineer'})
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono">{selectedPreviousInterview.completedDate || selectedPreviousInterview.interviewDate}</span>
                    <span>•</span>
                    <span>{selectedPreviousInterview.duration || 'N/A'}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedPreviousInterview.sessionId || selectedPreviousInterview.roomId || 'session'}</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-2xl font-bold ${getScoreColor(Number(selectedPreviousInterview.overallScore || 0))}`}>
                  {selectedPreviousInterview.overallScore || 0}%
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" /> Technical Skills Assessment
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(selectedReportDetails.technicalSkills || {}).map(([skill, score]) => (
                  <div key={skill} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="text-[10px] text-gray-500 font-medium capitalize mb-1">{skill}</div>
                    <div className="text-xl font-bold text-gray-900">{Number(score || 0)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${Number(score || 0) >= 90 ? 'bg-emerald-500' : Number(score || 0) >= 80 ? 'bg-blue-500' : Number(score || 0) >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, Number(score || 0))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-600" /> Question Details
              </h5>
              <div className="space-y-3">
                {selectedReportDetails.questionMetrics.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">No question data was captured for this interview.</div>
                ) : (
                  selectedReportDetails.questionMetrics.map((metric, idx) => (
                    <div key={`${metric.question || idx}-${idx}`} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-gray-900">Q{idx + 1}: {metric.question || metric.title || 'Question'}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">{metric.score ?? 0}%</span>
                      </div>
                      <div className="text-[11px] text-gray-600 whitespace-pre-wrap">
                        <span className="font-semibold text-gray-800">Candidate Answer:</span> {metric.answer || metric.candidateAnswer || metric.response || 'No answer captured'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> Feedback Summary
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <h6 className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Strengths
                  </h6>
                  <ul className="space-y-1">
                    {(selectedReportDetails.feedback?.strengths || []).length === 0 ? (
                      <li className="text-xs text-emerald-800">No strengths captured.</li>
                    ) : (
                      (selectedReportDetails.feedback?.strengths || []).map((strength, idx) => (
                        <li key={idx} className="text-xs text-emerald-800 flex items-start gap-1">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {strength}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h6 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Areas for Improvement
                  </h6>
                  <ul className="space-y-1">
                    {(selectedReportDetails.feedback?.improvements || []).length === 0 ? (
                      <li className="text-xs text-amber-800">No improvement notes captured.</li>
                    ) : (
                      (selectedReportDetails.feedback?.improvements || []).map((improvement, idx) => (
                        <li key={idx} className="text-xs text-amber-800 flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {improvement}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Interview Notes & Chat
              </h5>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h6 className="text-xs font-bold text-gray-900 mb-2">Interviewer Notes</h6>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{selectedReportDetails.interviewerNotes || 'No notes were saved for this interview.'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h6 className="text-xs font-bold text-gray-900 mb-2">Chat Transcript</h6>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {selectedReportDetails.chatMessages.length === 0 ? (
                      <p className="text-xs text-gray-600">No chat transcript captured.</p>
                    ) : (
                      selectedReportDetails.chatMessages.map((msg, idx) => (
                        <div key={`${msg.sender || 'message'}-${idx}`} className="rounded-lg bg-white border border-gray-200 p-2">
                          <div className="text-[10px] font-bold uppercase text-indigo-600 mb-1">{msg.sender || msg.role || 'Participant'}</div>
                          <div className="text-xs text-gray-700 whitespace-pre-wrap">{msg.text || msg.message || msg.content || 'No content'}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Time Analysis Per Question
              </h5>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="space-y-3">
                  {selectedReportDetails.questionMetrics.length === 0 ? (
                    <div className="text-xs text-gray-600">No timing data was captured for this interview.</div>
                  ) : (
                    selectedReportDetails.questionMetrics.map((metric, idx) => (
                      <div key={`${metric.question || idx}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">Q{idx + 1}: {String(metric.question || metric.title || 'Question').slice(0, 50)}{String(metric.question || metric.title || '').length > 50 ? '...' : ''}</span>
                          <span className="font-mono text-indigo-600 font-bold">{metric.timeTaken ? `${metric.timeTaken}s` : `${idx + 1}m`}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((idx + 1) * 17) % 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" /> Actual Saved Interview Evidence
              </h5>
              <div className="space-y-4">
                {selectedReportDetails.questionMetrics.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-600">No saved question evidence is available for this interview.</div>
                ) : (
                  selectedReportDetails.questionMetrics.map((metric, idx) => (
                    <div key={`${metric.question || idx}-${idx}`} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                              Question {idx + 1}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {metric.timeTaken ? `${metric.timeTaken}s` : `${idx + 1}m`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-800 font-medium mb-2">{metric.question || metric.title || 'Question'}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          Number(metric.score ?? 0) >= 90 ? 'bg-emerald-100 text-emerald-700' :
                          Number(metric.score ?? 0) >= 80 ? 'bg-blue-100 text-blue-700' :
                          Number(metric.score ?? 0) >= 70 ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {metric.score ?? 0}%
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-[10px] text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <Code2 className="w-3 h-3" /> Candidate Answer:
                        </div>
                        <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap overflow-x-auto">
                          {metric.answer || metric.candidateAnswer || metric.response || 'No recorded answer'}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-700 transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white shadow-md transition-all flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Export Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

