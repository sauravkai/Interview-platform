import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Cpu, Terminal, ShieldAlert } from 'lucide-react';

export const TestRunnerUI = ({ result, isRunning, isDark = false, submissionError = null }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (isRunning) {
    return (
      <div className={`${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] text-center`}>
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
        <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sending code to Docker Sandbox environment...</p>
        <p className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Compiling & executing input test vectors</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`${isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'} border rounded-xl p-4 flex items-center justify-between text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <span className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" /> Test case output will appear here after execution.
        </span>
        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Execution Timeout: 3.0s</span>
      </div>
    );
  }

  const { status, passCount, totalCount, executionTimeMs, memoryMb, testResults = [] } = result;

  const isAccepted = status === 'Accepted';
  const isBlocked = status === 'Submission Blocked';

  return (
    <div className={`${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border rounded-xl overflow-hidden shadow-xl`}>
      {/* Result Status Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-extrabold text-xs tracking-wide uppercase ${
              isAccepted
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : isBlocked
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {isAccepted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isBlocked ? (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            Status: {status}
          </div>

          <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Passed {passCount} / {totalCount} Test Cases
          </span>
        </div>

        {/* Execution Metrics */}
        <div className={`flex items-center gap-4 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> {executionTimeMs} ms
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> {memoryMb} MB
          </span>
        </div>
      </div>

      {/* Submission Error Message */}
      {submissionError && (
        <div className={`px-4 py-2 border-b ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-2">
            <ShieldAlert className={`w-4 h-4 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
              <div className="font-bold mb-1">Submission Notice:</div>
              <div className="whitespace-pre-wrap">{submissionError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases Tabs */}
      {testResults.length > 0 && (
        <div className="p-4 space-y-4">
          <div className={`flex items-center gap-2 border-b pb-2 overflow-x-auto ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            {testResults.map((tc, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeTab === idx
                    ? `${isDark ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'} font-bold border shadow`
                    : isDark ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tc.passed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                Test Case {idx + 1}
              </button>
            ))}
          </div>

          {/* Selected Test Case Details */}
          {testResults[activeTab] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className={`${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-lg p-3`}>
                <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Input:
                </span>
                <pre className={isDark ? 'text-slate-200' : 'text-slate-800'}>{testResults[activeTab].input || '(No input)'}</pre>
              </div>

              <div className={`${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-lg p-3`}>
                <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Expected Output:
                </span>
                <pre className="text-emerald-400 font-semibold whitespace-pre-wrap">
                  {testResults[activeTab].expectedOutput}
                </pre>
              </div>

              <div className={`${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border rounded-lg p-3 md:col-span-2`}>
                <span className={`text-[10px] uppercase tracking-wider block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Candidate Actual Output:
                </span>
                <pre
                  className={`whitespace-pre-wrap ${
                    testResults[activeTab].passed ? 'text-emerald-300' : 'text-rose-300 font-semibold'
                  }`}
                >
                  {testResults[activeTab].actualOutput || '(No output returned)'}
                </pre>

                {testResults[activeTab].error && (
                  <div className="mt-2 p-2 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300 text-[11px]">
                    <div className="flex items-center gap-1 font-bold text-rose-400 mb-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Compiler / Execution Error:
                    </div>
                    {testResults[activeTab].error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
