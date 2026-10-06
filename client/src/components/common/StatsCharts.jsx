import React, { useMemo, useEffect, useState } from 'react';
import API from '../../services/api';
import { getCanonicalSolvedCount } from '../../utils/dashboardStats';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366F1', '#06B6D4', '#F43F5E', '#10B981', '#F59E0B'];

function lastNMonths(n = 6) {
  const res = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push(`${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear().toString().slice(-2)}`);
  }
  return res;
}

export default function StatsCharts({ user = {}, interviews: propInterviews = [], sessions = [] }) {
  const months = useMemo(() => lastNMonths(6), []);
  const [interviews, setInterviews] = useState(propInterviews || []);
  const [problemsByMonth, setProblemsByMonth] = useState([]);
  const [interviewsByMonth, setInterviewsByMonth] = useState([]);

  useEffect(() => {
    setInterviews(propInterviews || []);
  }, [propInterviews]);
  const [statusPie, setStatusPie] = useState([]);
  const [solvedHistory, setSolvedHistory] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  });

  const solvedCount = useMemo(() => {
    return getCanonicalSolvedCount({
      user,
      solvedHistory,
      localSolvedProgress: Number.parseInt(localStorage.getItem('solvedProgress') || '0', 10),
    });
  }, [user, solvedHistory]);

  const lastSolvedMonth = useMemo(() => {
    return localStorage.getItem('lastSolvedMonth') || new Date().toLocaleString('en-US', { month: 'short' });
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;

    const fetchCharts = async () => {
      try {
        const [ovRes, subsRes, ivRes, mySubsRes] = await Promise.all([
          API.get('/stats/overview').catch(() => ({ data: { success: false } })),
          API.get('/stats/submissions').catch(() => ({ data: { success: false } })),
          API.get('/stats/interviews').catch(() => ({ data: { success: false } })),
          API.get('/submissions/my').catch(() => ({ data: { success: false, data: [] } })),
        ]);

        if (subsRes.data?.success && Array.isArray(subsRes.data.data)) {
          const pb = subsRes.data.data.map((d) => ({ month: d.label, value: d.accepted }));
          setProblemsByMonth(pb);
        }

        if (mySubsRes.data?.success && Array.isArray(mySubsRes.data.data)) {
          const accepted = mySubsRes.data.data
            .filter((item) => item.status === 'Accepted')
            .map((item) => {
              const createdAt = item.createdAt ? new Date(item.createdAt) : null;
              if (!createdAt || Number.isNaN(createdAt.getTime())) return null;
              return {
                date: createdAt.toISOString().slice(0, 10),
                solvedAt: createdAt.toISOString(),
                problemTitle: item.problemId?.title || item.problemTitle || 'Solved Problem',
              };
            })
            .filter(Boolean);

          const localHistory = (() => {
            try {
              const raw = JSON.parse(localStorage.getItem('solvedQuestionHistory') || '[]');
              return Array.isArray(raw) ? raw : [];
            } catch {
              return [];
            }
          })();

          const merged = [...localHistory, ...accepted].filter((entry) => entry?.date && entry?.problemTitle);
          if (merged.length > 0) {
            localStorage.setItem('solvedQuestionHistory', JSON.stringify(merged));
            setSolvedHistory(merged);
          }
        }

        if (ivRes.data?.success) {
          const timeline = (ivRes.data.data.timeline || []).map((d) => ({ month: d.label, value: d.count }));
          setInterviewsByMonth(timeline);
          const status = (ivRes.data.data.status || []).map((s, idx) => ({ name: s._id, value: s.count, color: ['#6366F1', '#06B6D4', '#F43F5E', '#10B981'][idx % 4] }));
          setStatusPie(status);
        }

        if (ovRes.data?.success && ovRes.data.data) {
          if (!propInterviews || propInterviews.length === 0) {
            // no-op
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCharts();
  }, [user, propInterviews]);

  const hasMeaningfulProblemData = problemsByMonth.some((entry) => Number(entry.value || 0) > 0);
  const fallbackProblemSeries = useMemo(() => {
    const counts = Object.fromEntries(months.map((month) => [month, 0]));

    for (const entry of solvedHistory) {
      const solvedAt = entry?.solvedAt || entry?.date;
      const date = solvedAt ? new Date(solvedAt) : null;
      if (!date || Number.isNaN(date.getTime())) continue;

      const monthKey = `${date.toLocaleString(undefined, { month: 'short' })} ${date.getFullYear().toString().slice(-2)}`;
      if (counts[monthKey] !== undefined) {
        counts[monthKey] += 1;
      }
    }

    const fallbackTotal = Math.max(0, Number(solvedCount || 0));
    const lastMonth = months[months.length - 1];

    if (fallbackTotal > 0 && Object.values(counts).every((value) => value === 0)) {
      counts[lastMonth] = fallbackTotal;
    }

    return months.map((month) => ({ month, value: counts[month] || 0 }));
  }, [months, solvedHistory, solvedCount]);

  const derivedInterviewSeries = useMemo(() => {
    const counts = Object.fromEntries(months.map((month) => [month, 0]));

    for (const entry of interviews) {
      const dateSource = entry?.scheduledAt || entry?.createdAt || entry?.startedAt || entry?.endedAt || entry?.time;
      const date = dateSource ? new Date(dateSource) : null;
      if (!date || Number.isNaN(date.getTime())) continue;

      const monthKey = `${date.toLocaleString(undefined, { month: 'short' })} ${date.getFullYear().toString().slice(-2)}`;
      if (counts[monthKey] !== undefined) {
        counts[monthKey] += 1;
      }
    }

    return months.map((month) => ({ month, value: counts[month] || 0 }));
  }, [interviews, months]);

  const ivSeries = interviewsByMonth.length ? interviewsByMonth : derivedInterviewSeries;
  const pbSeries = hasMeaningfulProblemData ? problemsByMonth : fallbackProblemSeries;
  const pieSeries = statusPie.length
    ? statusPie
    : (propInterviews.length
      ? (() => {
          const counts = { scheduled: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
          propInterviews.forEach((it) => {
            const s = (it.status || 'scheduled').toLowerCase();
            if (counts[s] !== undefined) counts[s]++;
          });
          return Object.keys(counts).map((k, i) => ({ name: k, value: counts[k], color: COLORS[i % COLORS.length] }));
        })()
      : []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow p-4">
        <div className="text-sm text-slate-500">Interviews (last 6 months)</div>
        <div className="h-48 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ivSeries} margin={{ top: 6, right: 12, left: -8, bottom: 6 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow p-4">
        <div className="text-sm text-slate-500">Interview Status</div>
        <div className="h-48 mt-2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieSeries} dataKey="value" nameKey="name" innerRadius={38} outerRadius={68} paddingAngle={2} label>
                {pieSeries.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
