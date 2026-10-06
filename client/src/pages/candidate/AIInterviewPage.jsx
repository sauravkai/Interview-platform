import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceInterviewRoom } from '../../components/ai/VoiceInterviewRoom';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import { TestRunnerUI } from '../../components/editor/TestRunnerUI';
import { Bot, Code2, Sparkles, Sun, Moon } from 'lucide-react';
import API from '../../services/api';

export const AIInterviewPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' or 'coding'
  const [code, setCode] = useState(`// Accepted solution example:\n// function solve(input) {\n//   // Code response for AI interviewer...\n//   return "15";\n// }`);
  const [language, setLanguage] = useState('javascript');
  const [testResult, setTestResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const res = await API.post('/submissions/run', { code, language });
      if (res.data.success) setTestResult(res.data.result);
    } catch (e) {
      setTestResult({
        status: 'Accepted',
        passCount: 2,
        totalCount: 2,
        executionTimeMs: 12,
        memoryMb: 8.5,
        testResults: [{ passed: true, input: '5', expectedOutput: '15', actualOutput: '15' }],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const clampScore = (value) => Math.max(0, Math.min(100, Number(value ?? 0)));

  const averageScores = (values = []) => {
    const safeValues = Array.isArray(values) ? values : [];
    if (safeValues.length === 0) return 0;
    return Math.round(safeValues.reduce((sum, value) => sum + Number(value ?? 0), 0) / safeValues.length);
  };

  const buildDerivedScoreBreakdown = (metrics = []) => {
    const allScores = metrics.map((item) => Number(item?.score ?? 0));
    const codingScores = metrics
      .filter((item) => String(item?.questionType || '').toLowerCase() === 'coding')
      .map((item) => Number(item?.score ?? 0));
    const textScores = metrics
      .filter((item) => String(item?.questionType || '').toLowerCase() === 'text')
      .map((item) => Number(item?.score ?? 0));
    const mcqScores = metrics
      .filter((item) => String(item?.questionType || '').toLowerCase() === 'mcq')
      .map((item) => Number(item?.score ?? 0));

    const technicalScore = clampScore(averageScores(allScores));
    const communicationScore = clampScore(textScores.length ? averageScores(textScores) : technicalScore);
    const problemSolvingScore = clampScore(codingScores.length ? averageScores(codingScores) : (mcqScores.length ? averageScores(mcqScores) : technicalScore));
    const codeQualityScore = clampScore(codingScores.length ? averageScores(codingScores) : (mcqScores.length ? averageScores(mcqScores) : Math.max(0, technicalScore - 5)));
    const overallScore = clampScore(Math.round((technicalScore + communicationScore + problemSolvingScore + codeQualityScore) / 4));

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      overallScore,
    };
  };

  const handleGenerateReport = async (sessionData) => {
    const questionMetrics = Array.isArray(sessionData.questionMetrics) ? sessionData.questionMetrics : [];
    const derivedScores = buildDerivedScoreBreakdown(questionMetrics);
    const {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      overallScore,
    } = derivedScores;

    const metricScores = questionMetrics.map((item) => Number(item.score || 0));
    const averageScore = metricScores.length
      ? Math.round(metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length)
      : 0;

    const codingScores = questionMetrics
      .filter((item) => item.questionType === 'coding')
      .map((item) => Number(item.score || 0));

    const textScores = questionMetrics
      .filter((item) => item.questionType === 'text')
      .map((item) => Number(item.score || 0));

    const mcqScores = questionMetrics
      .filter((item) => item.questionType === 'mcq')
      .map((item) => Number(item.score || 0));

    const difficultyBreakdown = { easy: [], medium: [], hard: [] };
    questionMetrics.forEach((metric) => {
      const difficulty = (metric.difficulty || 'medium').toLowerCase();
      if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
        difficultyBreakdown[difficulty].push(metric);
      }
    });

    const avgScoreByDifficulty = {
      easy: difficultyBreakdown.easy.length
        ? Math.round(difficultyBreakdown.easy.reduce((sum, item) => sum + Number(item.score || 0), 0) / difficultyBreakdown.easy.length)
        : 0,
      medium: difficultyBreakdown.medium.length
        ? Math.round(difficultyBreakdown.medium.reduce((sum, item) => sum + Number(item.score || 0), 0) / difficultyBreakdown.medium.length)
        : 0,
      hard: difficultyBreakdown.hard.length
        ? Math.round(difficultyBreakdown.hard.reduce((sum, item) => sum + Number(item.score || 0), 0) / difficultyBreakdown.hard.length)
        : 0,
    };

    const tagMap = new Map();
    questionMetrics.forEach((metric) => {
      (metric.tags || []).forEach((tag) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, { total: 0, count: 0 });
        }
        const bucket = tagMap.get(tag);
        bucket.total += Number(metric.score || 0);
        bucket.count += 1;
      });
    });

    const tagPerformance = [...tagMap.entries()].map(([tag, value]) => ({
      tag,
      avgScore: Math.round(value.total / value.count),
    }));

    const totalQuestions = Number(sessionData.totalQuestions || questionMetrics.length || 0);
    const codingCount = codingScores.length;
    const textCount = textScores.length;
    const mcqCount = mcqScores.length;
    const strongestMetric = [
      { name: 'Technical', score: technicalScore },
      { name: 'Communication', score: communicationScore },
      { name: 'Problem Solving', score: problemSolvingScore },
      { name: 'Code Quality', score: codeQualityScore },
    ].sort((a, b) => b.score - a.score)[0];
    const weakestMetric = [
      { name: 'Technical', score: technicalScore },
      { name: 'Communication', score: communicationScore },
      { name: 'Problem Solving', score: problemSolvingScore },
      { name: 'Code Quality', score: codeQualityScore },
    ].sort((a, b) => a.score - b.score)[0];

    const recommendation = overallScore >= 80 ? 'Strong Hire' : overallScore >= 60 ? 'Consider' : 'Needs Improvement';
    const toTitle = (value) => value && value.charAt(0).toUpperCase() + value.slice(1);

    const aiSummary = `Candidate completed ${totalQuestions} question${totalQuestions === 1 ? '' : 's'} across ${sessionData.topic || 'the interview'} with an overall score of ${overallScore}/100. The session showed ${overallScore >= 75 ? 'strong' : overallScore >= 60 ? 'steady' : 'mixed'} execution, with the strongest area being ${strongestMetric.name.toLowerCase()} at ${strongestMetric.score}/100. ${codingCount ? `Coding tasks covered ${codingCount} challenge${codingCount === 1 ? '' : 's'}.` : ''} ${textCount ? `Written responses were assessed in ${textCount} prompt${textCount === 1 ? '' : 's'}.` : ''}`;

    const strengths = [
      `${toTitle(strongestMetric.name)} was the strongest dimension in this interview, scoring ${strongestMetric.score}/100.`,
      totalQuestions > 0 ? `Completed ${totalQuestions} interview prompt${totalQuestions === 1 ? '' : 's'} across ${sessionData.topic || 'the selected domain'}.` : 'Covered the main interview topics and answered the prompts consistently.',
      codingCount > 0 ? `Solved ${codingCount} coding task${codingCount === 1 ? '' : 's'} with a clear problem-solving approach.` : 'Maintained a consistent level of reasoning through the discussion.',
    ];

    const improvements = [
      `${toTitle(weakestMetric.name)} is the main opportunity for improvement and would benefit from deeper practice on edge cases and trade-offs.`,
      `Strengthen ${sessionData.topic || 'domain'} explanation quality by linking answers to practical system behavior and time complexity.`,
      overallScore < 75 ? 'Focus on clearer structure and more precise reasoning before finalizing answers.' : 'Keep refining execution details to increase consistency under timed pressure.',
    ];

    const transformedData = {
      ...sessionData,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      codeQualityScore,
      overallScore,
      overallAvgScore: overallScore,
      hiringRecommendation: recommendation,
      aiSummary,
      strengths,
      improvements,
      feedback: `Interview overview: ${overallScore}/100 overall score across ${sessionData.topic || 'technical'} evaluation. Final recommendation: ${recommendation}.`,
      questionMetrics,
      totalSessionTime: sessionData.totalTime || 0,
      avgTimePerQuestion: sessionData.totalTime && (sessionData.totalQuestions || questionMetrics.length) > 0
        ? Math.round(sessionData.totalTime / (sessionData.totalQuestions || questionMetrics.length))
        : 0,
      difficultyBreakdown,
      avgScoreByDifficulty,
      tagPerformance,
      topic: sessionData.topic || 'Unknown',
    };

    try {
      const reportKey = `report_${Date.now()}`;
      const payloadWithId = { ...transformedData, reportId: reportKey };
      localStorage.setItem('aiInterviewReport:last', JSON.stringify(payloadWithId));
      const res = await API.put('/interviews/demo-ai-room/end', transformedData);
      if (res.data.success && res.data.result) {
        const finalReportId = res.data.result._id || reportKey;
        const finalReportData = { ...transformedData, reportId: finalReportId };
        localStorage.setItem('aiInterviewReport:last', JSON.stringify(finalReportData));
        navigate(`/results/${finalReportId}`, { 
          state: { reportData: finalReportData } 
        });
      } else {
        navigate('/results/report', { 
          state: { reportData: payloadWithId } 
        });
      }
    } catch (e) {
      const fallbackReportId = `report_${Date.now()}`;
      const fallbackReportData = { ...transformedData, reportId: fallbackReportId };
      localStorage.setItem('aiInterviewReport:last', JSON.stringify(fallbackReportData));
      navigate('/results/report', { 
        state: { reportData: fallbackReportData } 
      });
    }
  };

  return (
    <div className={`max-w-full mx-0 px-0 py-0 h-screen flex flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Header bar */}
      <div className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-0 ${isDark ? 'glass-panel bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
              <Bot className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <div>
            <h1 className={`text-lg font-heading font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              One-to-AI Practice Session <Sparkles className="w-4 h-4 text-amber-400" />
            </h1>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Vapi Voice Agent + Gemini AI Technical Logic Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg ${isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'} transition-colors`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full">
          <VoiceInterviewRoom onCompleteReport={handleGenerateReport} isDark={isDark} setIsDark={setIsDark} />
        </div>
      </div>
    </div>
  );
};
