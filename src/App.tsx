import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { homeForRole } from './components/homeForRole';
import Layout from './components/Layout';
import ForbiddenPage from './pages/Forbidden';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Spinner } from './components/ui';

// Lazy-loaded Page Routes (Code Splitting for Optimal Performance & Bundle Size)
const ClassDetail = lazy(() => import('./pages/shared/ClassDetail'));
const Forum = lazy(() => import('./pages/shared/Forum'));
const NotificationsPage = lazy(() => import('./pages/shared/Notifications'));
const TuitionPage = lazy(() => import('./pages/shared/TuitionPage'));
const QuizPage = lazy(() => import('./pages/shared/QuizPage'));
const DocumentHubPage = lazy(() => import('./pages/shared/DocumentHubPage'));

// Student Pages
const StudentDashboard = lazy(() => import('./pages/student').then(m => ({ default: m.StudentDashboard })));
const StudentClasses = lazy(() => import('./pages/student').then(m => ({ default: m.StudentClasses })));
const StudentAssignments = lazy(() => import('./pages/student').then(m => ({ default: m.StudentAssignments })));
const StudentGrades = lazy(() => import('./pages/student').then(m => ({ default: m.StudentGrades })));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentSchedule = lazy(() => import('./pages/student/Schedule'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const StudentTranscript = lazy(() => import('./pages/student/Transcript'));
const StudentAiAdvisor = lazy(() => import('./pages/student/AiAdvisor'));
const StudentLessonLearning = lazy(() => import('./pages/student/LessonLearning'));
const StudentRegistrations = lazy(() => import('./pages/student/Registrations'));

// Lecturer Pages
const LecturerDashboard = lazy(() => import('./pages/lecturer').then(m => ({ default: m.LecturerDashboard })));
const LecturerClasses = lazy(() => import('./pages/lecturer').then(m => ({ default: m.LecturerClasses })));
const LecturerAssignments = lazy(() => import('./pages/lecturer').then(m => ({ default: m.LecturerAssignments })));
const LecturerGrading = lazy(() => import('./pages/lecturer').then(m => ({ default: m.LecturerGrading })));
const LecturerSchedule = lazy(() => import('./pages/lecturer/Schedule'));
const LecturerProfile = lazy(() => import('./pages/lecturer/Profile'));
const AnalyticsDashboard = lazy(() => import('./pages/lecturer/AnalyticsDashboard'));
const PermissionRequestsPage = lazy(() => import('./pages/lecturer/PermissionRequestsPage'));
const HomeroomGradebook = lazy(() => import('./pages/lecturer/HomeroomGradebook'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminUsers })));
const AdminClasses = lazy(() => import('./pages/admin').then(m => ({ default: m.AdminClasses })));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminCurricula = lazy(() => import('./pages/admin/Curricula'));
const AdminDepartments = lazy(() => import('./pages/admin/Departments'));
const AdminAdministrativeClasses = lazy(() => import('./pages/admin/AdministrativeClasses'));
const RegistrationPeriods = lazy(() => import('./pages/admin/RegistrationPeriods'));
const AdminTuitionManagement = lazy(() => import('./pages/admin/TuitionManagement'));
const AdminPermissions = lazy(() => import('./pages/admin/Permissions'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const ClazzPermissions = lazy(() => import('./pages/admin/ClazzPermissions'));
const AdminPbacApproval = lazy(() => import('./pages/admin/AdminPbacApproval'));

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 dark:bg-slate-950 dark:text-white">
      <div className="text-7xl font-bold text-accent-600 mb-2">404</div>
      <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
      <p className="text-slate-500 text-sm mb-6">Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.</p>
      <a href="/" className="px-4 py-2 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm transition">
        Về trang chủ
      </a>
    </div>
  );
}

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/" element={<RootRedirect />} />

                {/* Student Routes */}
                <Route element={<ProtectedRoute allow={['STUDENT']}><Layout /></ProtectedRoute>}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/classes" element={<StudentClasses />} />
                  <Route path="/student/classes/:id" element={<ClassDetail />} />
                  <Route path="/student/notifications" element={<NotificationsPage />} />
                  <Route path="/student/registration" element={<StudentRegistrations />} />
                  <Route path="/student/registrations" element={<StudentRegistrations />} />
                  <Route path="/student/tuition" element={<TuitionPage />} />
                  <Route path="/student/quizzes" element={<QuizPage />} />
                  <Route path="/student/documents" element={<DocumentHubPage />} />
                  <Route path="/student/forum" element={<Forum />} />
                  <Route path="/student/assignments" element={<StudentAssignments />} />
                  <Route path="/student/grades" element={<StudentGrades />} />
                  <Route path="/student/attendance" element={<StudentAttendance />} />
                  <Route path="/student/schedule" element={<StudentSchedule />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                  <Route path="/student/transcript" element={<StudentTranscript />} />
                  <Route path="/student/ai-advisor" element={<StudentAiAdvisor />} />
                  <Route path="/student/classes/:classId/lessons/:lessonId" element={<StudentLessonLearning />} />
                </Route>

                {/* Lecturer Routes */}
                <Route element={<ProtectedRoute allow={['LECTURER']}><Layout /></ProtectedRoute>}>
                  <Route path="/lecturer" element={<LecturerDashboard />} />
                  <Route path="/lecturer/classes" element={<LecturerClasses />} />
                  <Route path="/lecturer/classes/:id" element={<ClassDetail />} />
                  <Route path="/lecturer/notifications" element={<NotificationsPage />} />
                  <Route path="/lecturer/quizzes" element={<QuizPage />} />
                  <Route path="/lecturer/documents" element={<DocumentHubPage />} />
                  <Route path="/lecturer/forum" element={<Forum />} />
                  <Route path="/lecturer/assignments" element={<LecturerAssignments />} />
                  <Route path="/lecturer/grading" element={<LecturerGrading />} />
                  <Route path="/lecturer/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/lecturer/permission-requests" element={<PermissionRequestsPage />} />
                  <Route path="/lecturer/homeroom" element={<HomeroomGradebook />} />
                  <Route path="/lecturer/schedule" element={<LecturerSchedule />} />
                  <Route path="/lecturer/profile" element={<LecturerProfile />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allow={['ADMIN']}><Layout /></ProtectedRoute>}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/classes" element={<AdminClasses />} />
                  <Route path="/admin/classes/:id" element={<ClassDetail />} />
                  <Route path="/admin/curricula" element={<AdminCurricula />} />
                  <Route path="/admin/registration" element={<RegistrationPeriods />} />
                  <Route path="/admin/registrations" element={<Navigate to="/admin/registration" replace />} />
                  <Route path="/admin/tuition" element={<AdminTuitionManagement />} />
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/pbac-approvals" element={<AdminPbacApproval />} />
                  <Route path="/admin/pbac-approval" element={<Navigate to="/admin/pbac-approvals" replace />} />
                  <Route path="/admin/documents" element={<DocumentHubPage />} />
                  <Route path="/admin/permissions" element={<AdminPermissions />} />
                  <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                  <Route path="/admin/clazz-permissions" element={<ClazzPermissions />} />
                  <Route path="/admin/class-permissions" element={<Navigate to="/admin/clazz-permissions" replace />} />
                  <Route path="/admin/departments" element={<AdminDepartments />} />
                  <Route path="/admin/administrative-classes" element={<AdminAdministrativeClasses />} />
                  <Route path="/admin/schedule" element={<Navigate to="/admin/classes" replace />} />
                  <Route path="/admin/notifications" element={<NotificationsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}
