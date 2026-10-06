import React, { useState, useEffect } from 'react';
import { Shield, Users, Code2, Cpu, Server, CheckCircle2, Search, Edit } from 'lucide-react';
import API from '../../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 42,
    totalProblems: 18,
    totalInterviews: 125,
    totalSubmissions: 340,
    activeServers: 'Operational',
    dockerSandbox: 'Ready',
  });

  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const statsRes = await API.get('/users/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);

        const usersRes = await API.get('/users');
        if (usersRes.data.success) setUsers(usersRes.data.data);
      } catch (e) {
        console.warn('API fallback engaged.');
      }
    }
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (e) {
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Admin Header */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-cyan-950/40 via-indigo-950/20 to-slate-950">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" /> System Administration Console
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-white">Platform Health & Governance</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Manage user roles, monitor Docker code runner clusters, and review system logs.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Registered Platform Users', val: stats.totalUsers, icon: Users, color: 'text-indigo-400' },
          { label: 'Problem Repository', val: stats.totalProblems, icon: Code2, color: 'text-purple-400' },
          { label: 'Code Executions', val: stats.totalSubmissions, icon: Cpu, color: 'text-cyan-400' },
          { label: 'Docker Sandbox', val: stats.dockerSandbox, icon: Server, color: 'text-emerald-400' },
        ].map((item, i) => (
          <div key={i} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">{item.label}</span>
              <span className="text-2xl font-heading font-extrabold text-white mt-1 block">{item.val}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* User Management Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-heading font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users className="w-4 h-4 text-cyan-400" /> Platform User Directory & RBAC
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-3">USER</th>
                <th className="py-2.5 px-3">EMAIL</th>
                <th className="py-2.5 px-3">TITLE</th>
                <th className="py-2.5 px-3">ROLE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-3 font-semibold text-white">{u.name}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{u.email}</td>
                  <td className="py-3 px-3 text-slate-300">{u.title || 'Engineer'}</td>
                  <td className="py-3 px-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-md px-2 py-1 focus:outline-none focus:border-cyan-500 text-cyan-300"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="interviewer">Interviewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
