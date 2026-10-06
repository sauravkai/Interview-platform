import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  User,
  Mail,
  Shield,
  Camera,
  Key,
  Save,
  X,
  Check,
  Upload,
  Edit2,
  LogOut,
  AlertCircle,
  Bell,
  Lock,
  Globe,
  Github,
  Linkedin,
  Twitter,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Sparkles,
  BarChart3,
  Settings,
  UserCog,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    title: user?.title || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [socialLinks, setSocialLinks] = useState(user?.socialLinks || {
    github: '',
    linkedin: '',
    twitter: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    interviewReminders: true,
    weeklyReport: false,
    marketingEmails: false,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch sessions when sessions tab is active
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await API.get('/sessions');
      if (res.data.success) {
        setSessions(res.data.sessions || []);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await API.put('/auth/profile', {
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        skills,
        socialLinks,
      });

      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setShowSuccess(true);
        setIsEditing(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSocialLinkChange = (platform, value) => {
    setSocialLinks({ ...socialLinks, [platform]: value });
  };

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleSecurityChange = (key, value) => {
    setSecuritySettings({ ...securitySettings, [key]: value });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const res = await API.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.data.success) {
        setShowSuccess(true);
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingPhoto(true);
      setError('');

      try {
        // Convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64Image = reader.result;

          try {
            const res = await API.put('/auth/avatar', {
              avatar: base64Image,
            });

            if (res.data.success) {
              setUser(res.data.user);
              localStorage.setItem('user', JSON.stringify(res.data.user));
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo');
          } finally {
            setIsUploadingPhoto(false);
          }
        };
        reader.onerror = () => {
          setError('Failed to process image');
          setIsUploadingPhoto(false);
        };
      } catch (err) {
        setError('Failed to process image');
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const stats = user?.stats || {
    interviewsCompleted: 0,
    problemsSolved: 0,
    averageScore: 0,
    totalHours: 0,
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills', icon: Zap },
    { id: 'social', label: 'Social Links', icon: Globe },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const roleTheme = user?.role === 'interviewer'
    ? {
        shell: 'from-indigo-600 via-violet-600 to-fuchsia-600',
        badge: 'bg-violet-50 text-violet-700 border-violet-200',
        accent: 'text-violet-600',
        tab: 'text-violet-600 bg-violet-50',
      }
    : {
        shell: 'from-violet-600 via-fuchsia-600 to-pink-500',
        badge: 'bg-pink-50 text-pink-700 border-pink-200',
        accent: 'text-pink-600',
        tab: 'text-pink-600 bg-pink-50',
      };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] ${roleTheme.badge}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {user?.role || 'candidate'} profile
            </div>
            <h1 className="mt-4 flex items-center gap-3 text-3xl font-black tracking-[-0.06em] text-slate-900">
              <User className={`h-8 w-8 ${roleTheme.accent}`} />
              Profile Settings
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.2)] transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {showSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <Check className="h-5 w-5" />
            <span className="font-medium">Changes saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className={`bg-gradient-to-r ${roleTheme.shell} p-8`}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={user?.name}
                      className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-[0_16px_35px_rgba(15,23,42,0.25)]"
                    />
                    <label className={`absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:scale-105 ${isUploadingPhoto ? 'cursor-not-allowed opacity-50' : ''}`}>
                      {isUploadingPhoto ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                    </label>
                  </div>

                  <h2 className="text-2xl font-black tracking-[-0.06em] text-white">{user?.name}</h2>
                  <p className="mt-2 text-sm text-white/80">{user?.title || 'Professional Profile'}</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                    <Shield className="h-3.5 w-3.5" />
                    {user?.role || 'candidate'}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                  <BarChart3 className={`h-4 w-4 ${roleTheme.accent}`} />
                  Quick stats
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                      <Award className="h-4 w-4 text-violet-600" />
                      Interviews
                    </div>
                    <p className="text-xl font-black tracking-[-0.05em] text-slate-900">{stats.interviewsCompleted}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Score
                    </div>
                    <p className="text-xl font-black tracking-[-0.05em] text-slate-900">{stats.averageScore}%</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-4 w-4 text-amber-600" />
                      Hours
                    </div>
                    <p className="text-xl font-black tracking-[-0.05em] text-slate-900">{stats.totalHours}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                      <Star className="h-4 w-4 text-pink-600" />
                      Problems
                    </div>
                    <p className="text-xl font-black tracking-[-0.05em] text-slate-900">{stats.problemsSolved}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <UserCog className={`h-4 w-4 ${roleTheme.accent}`} />
                    Account info
                  </div>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    {user?.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user?.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-slate-400" />
                        <a className="truncate text-violet-600 hover:underline" href={user.website} target="_blank" rel="noreferrer">
                          {user.website}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Member since 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)]">
            <div className="flex flex-wrap border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition ${
                    activeTab === tab.id ? `${roleTheme.tab} border-b-2 border-current` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">overview</div>
                      <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Personal information</h3>
                    </div>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        <Edit2 className="h-4 w-4" />
                        Edit profile
                      </button>
                    ) : (
                      <button onClick={() => setIsEditing(false)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={!isEditing} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input value={formData.email} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-slate-500 outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Job Title</label>
                        <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} disabled={!isEditing} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} disabled={!isEditing} className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Website</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={!isEditing} placeholder="https://yourwebsite.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Bio</label>
                        <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} disabled={!isEditing} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100" />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsEditing(false)} className="rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
                        <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(168,85,247,0.35)] transition hover:scale-[1.01]">
                          <Save className="h-4 w-4" />
                          Save Changes
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">skills</div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Skills & expertise</h3>
                  </div>

                  <div className="flex gap-3">
                    <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSkill()} placeholder="Add a skill" className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white" />
                    <button onClick={addSkill} className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500">
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="group inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="opacity-60 transition hover:opacity-100">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {skills.length === 0 && <p className="text-sm text-slate-500">No skills added yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">links</div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Social profiles</h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'github', label: 'GitHub', icon: Github },
                      { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                      { key: 'twitter', label: 'Twitter', icon: Twitter },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key}>
                        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"><Icon className="h-4 w-4" />{label}</label>
                        <input value={socialLinks[key]} onChange={(e) => handleSocialLinkChange(key, e.target.value)} placeholder={`https://${label.toLowerCase()}.com/username`} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white" />
                      </div>
                    ))}
                  </div>

                  <button onClick={handleProfileUpdate} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(168,85,247,0.35)]">
                    <Save className="h-4 w-4" />
                    Save Social Links
                  </button>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">security activity</div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Session history</h3>
                  </div>

                  {loadingSessions ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">No session history available</div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session, index) => (
                        <div key={index} className={`rounded-2xl border p-4 ${session.isActive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {session.isActive && <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Current</span>}
                              <span className={`text-sm font-semibold ${session.type === 'login' ? 'text-emerald-700' : 'text-rose-700'}`}>{session.type === 'login' ? 'Login' : 'Logout'}</span>
                            </div>
                            {session.isActive && <button className="text-xs font-semibold text-rose-600">Revoke</button>}
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{session.location || 'Unknown location'}</div>
                            <div className="flex items-center gap-2"><Globe className="h-4 w-4" />{session.ipAddress || 'Unknown IP'}</div>
                            <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" />{session.device || 'Unknown device'}</div>
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(session.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">security</div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Password & account security</h3>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><Key className="h-5 w-5 text-violet-600" />Change Password</div>

                    {!isChangingPassword ? (
                      <button onClick={() => setIsChangingPassword(true)} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"> <Edit2 className="h-4 w-4" /> Change Password </button>
                    ) : (
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Current Password</label>
                          <div className="relative">
                            <input type={showPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-violet-400" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-5 w-5" /></button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                          <div className="relative">
                            <input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-violet-400" required />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Eye className="h-5 w-5" /></button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">Confirm New Password</label>
                          <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-violet-400" required />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setError(''); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                          <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />Update Password</button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><Lock className="h-5 w-5 text-violet-600" />Security options</div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl bg-white p-4">
                        <div>
                          <div className="font-semibold text-slate-900">Two-Factor Authentication</div>
                          <div className="text-sm text-slate-500">Add an extra layer of security</div>
                        </div>
                        <button onClick={() => handleSecurityChange('twoFactorEnabled', !securitySettings.twoFactorEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${securitySettings.twoFactorEnabled ? 'bg-violet-600' : 'bg-slate-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-white p-4">
                        <div>
                          <div className="font-semibold text-slate-900">Login Alerts</div>
                          <div className="text-sm text-slate-500">Get notified of new sign-ins</div>
                        </div>
                        <button onClick={() => handleSecurityChange('loginAlerts', !securitySettings.loginAlerts)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${securitySettings.loginAlerts ? 'bg-violet-600' : 'bg-slate-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${securitySettings.loginAlerts ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">preferences</div>
                    <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Notification settings</h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'email', title: 'Email Notifications', description: 'Receive updates via email', icon: Mail },
                      { key: 'push', title: 'Push Notifications', description: 'Receive push notifications', icon: Smartphone },
                      { key: 'interviewReminders', title: 'Interview Reminders', description: 'Get reminded about upcoming interviews', icon: Calendar },
                      { key: 'weeklyReport', title: 'Weekly Reports', description: 'Receive weekly performance reports', icon: BarChart3 },
                      { key: 'marketingEmails', title: 'Marketing Emails', description: 'Receive product updates and offers', icon: Sparkles },
                    ].map(({ key, title, description, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5" /></div>
                          <div>
                            <div className="font-semibold text-slate-900">{title}</div>
                            <div className="text-sm text-slate-500">{description}</div>
                          </div>
                        </div>
                        <button onClick={() => handleNotificationChange(key)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${notifications[key] ? 'bg-violet-600' : 'bg-slate-300'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notifications[key] ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
