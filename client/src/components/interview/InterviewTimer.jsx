import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const InterviewTimer = ({ initialMinutes = 45, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft < 300; // Under 5 mins

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
        isWarning
          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
          : 'bg-slate-900 border-slate-800 text-indigo-300'
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
