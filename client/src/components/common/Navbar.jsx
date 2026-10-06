import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotificationsForUser, markNotificationRead } from '../../utils/notifications';
import {
  Code2,
  Bot,
  Video,
  UserCheck,
  LogOut,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  History,
  Settings,
  Sun,
  Moon,
  Bell,
  X,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, loginAsDemoRole, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [inviteToast, setInviteToast] = useState(null);

  useEffect(() => {
    const syncNotifications = () => {
      const filtered = getNotificationsForUser(user?.email || '');
      setNotifications(filtered);
    };

    syncNotifications();

    const handleStorageSync = () => syncNotifications();
    const handleInviteToast = (event) => {
      const notification = event.detail;
      if (!notification) return;

      const shouldShowToast = !user?.email || !notification.recipientEmail || notification.recipientEmail === user.email.toLowerCase();
      if (!shouldShowToast) return;

      setInviteToast(notification);
      setNotificationMenuOpen(true);

      const timeoutId = window.setTimeout(() => setInviteToast(null), 7000);
      return () => window.clearTimeout(timeoutId);
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('live-room-notification', handleInviteToast);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('live-room-notification', handleInviteToast);
    };
  }, [user?.email]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleNotificationClick = (notification) => {
    const updated = markNotificationRead(notification.id);
    setNotifications(updated);
    setNotificationMenuOpen(false);

    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleDemoSwitch = (role) => {
    loginAsDemoRole(role);
    setRoleMenuOpen(false);
    if (role === 'candidate') navigate('/dashboard');
    else if (role === 'interviewer') navigate('/interviewer/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
  };

  const isActive = (path) => location.pathname === path;
  const brandRoute = user?.role === 'interviewer'
    ? '/interviewer/welcome'
    : user?.role === 'admin'
      ? '/admin/dashboard'
      : '/candidate/welcome';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? brandRoute : '/'} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm border border-slate-200">
            <Code2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-black tracking-[-0.05em] text-slate-900">
              INTERVIEW.AI
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-medium mt-1">
              Pro Evaluator
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setNotificationMenuOpen((prev) => !prev)}
                className="relative p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {inviteToast && (
                <div className="absolute right-0 top-14 w-80 rounded-2xl border border-violet-200 bg-white shadow-2xl z-[60] overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-100">
                      Interview invite
                    </div>
                    <div className="mt-1 text-sm font-semibold">{inviteToast.title}</div>
                  </div>
                  <div className="px-4 py-3 text-sm text-slate-600">{inviteToast.message}</div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = markNotificationRead(inviteToast.id);
                        setNotifications(updated);
                        setInviteToast(null);
                        navigate(inviteToast.actionUrl || `/live-room/${inviteToast.roomId}`);
                      }}
                      className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
                    >
                      Join room
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteToast(null)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Notifications
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationMenuOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                      aria-label="Close notifications"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-slate-500 text-center">
                        No new alerts yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`w-full px-4 py-3 border-b border-slate-100 transition-colors ${
                            notification.read ? 'bg-white hover:bg-slate-50' : 'bg-violet-50 hover:bg-violet-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(notification)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-800">
                                  {notification.title}
                                </div>
                                <div className="mt-1 text-xs text-slate-600 leading-relaxed">
                                  {notification.message}
                                </div>
                              </div>
                              {!notification.read && (
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="mt-2 text-[10px] uppercase tracking-[0.15em] text-slate-400">
                              {new Date(notification.createdAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          </button>

                          {notification.actionUrl && (
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleNotificationClick(notification)}
                                className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-violet-500"
                              >
                                Join room
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {!isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  Demo Role: <strong className="text-violet-600">{user?.role || 'Guest'}</strong>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 border-b border-slate-200 mb-1">
                    Switch Persona
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('candidate')}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-violet-500" /> Candidate View
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('interviewer')}
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-500" /> Interviewer View
                  </button>
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 group">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user?.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                  {user?.name}
                </span>
              </Link>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
