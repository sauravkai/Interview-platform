import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';

import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { CheckoutStatusPage } from './pages/public/CheckoutStatusPage';

import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { PracticeCodingPage } from './pages/candidate/PracticeCodingPage';
import { AIInterviewPage } from './pages/candidate/AIInterviewPage';
import { CandidateWelcomePage } from './pages/candidate/CandidateWelcomePage';

import { InterviewerDashboard } from './pages/interviewer/InterviewerDashboard';
import { LiveInterviewRoom } from './pages/interviewer/LiveInterviewRoom';
import { InterviewerWelcomePage } from './pages/interviewer/InterviewerWelcomePage';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ResultsReportPage } from './pages/common/ResultsReportPage';
import { ProfilePage } from './pages/common/ProfilePage';

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />
      <main className="flex-1 bg-white">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<LandingPage />} />
          <Route path="/pricing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<CheckoutStatusPage />} />

          {/* Candidate Portal */}
          <Route path="/candidate/welcome" element={<CandidateWelcomePage />} />
          <Route path="/dashboard" element={<CandidateDashboard />} />
          <Route path="/practice" element={<PracticeCodingPage />} />
          <Route path="/ai-interview/practice" element={<AIInterviewPage />} />

          {/* Interviewer Portal */}
          <Route path="/interviewer/welcome" element={<InterviewerWelcomePage />} />
          <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
          <Route
            path="/live-room/:roomId"
            element={user ? <LiveInterviewRoom /> : <Navigate to="/login" replace />}
          />

          {/* Admin Portal */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Evaluation Reports */}
          <Route path="/results/:reportId" element={<ResultsReportPage />} />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              user ? <ProfilePage /> : <Navigate to="/login" replace />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
