// App router + provider stack
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { homeForRole } from './components/homeForRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import ClassDetail from './pages/shared/ClassDetail';
import {
  StudentDashboard, StudentClasses, StudentAssignments, StudentGrades,
} from './pages/student';
import StudentAttendance from './pages/student/Attendance';
import StudentSchedule from './pages/student/Schedule';
import StudentProfile from './pages/student/Profile';
import StudentTranscript from './pages/student/Transcript';
import {
  LecturerDashboard, LecturerClasses, LecturerAssignments, LecturerGrading,
} from './pages/lecturer';
import LecturerSchedule from './pages/lecturer/Schedule';
import LecturerProfile from './pages/lecturer/Profile';
import { AdminDashboard, AdminUsers, AdminClasses } from './pages/admin';
import AdminReports from './pages/admin/Reports';
import AdminCurricula from './pages/admin/Curricula';
import RegistrationPeriods from './pages/admin/RegistrationPeriods';
import NotificationsPage from './pages/shared/Notifications';
import TuitionPage from './pages/shared/TuitionPage';
import QuizPage from './pages/shared/QuizPage';

// Component chuyen huong root theo trang thai dang nhap
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-slate-400">Dang tai</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

// Trang 404 don gian
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
      <div className="text-7xl mb-4">404</div>
      <h1 className="text-3xl font-bold mb-2">Khong tim thay trang</h1>
      <p className="text-slate-600 mb-6">Duong dan ban truy cap khong ton tai</p>
      <a href="/" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
        Ve trang chu
   </a>
 </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route element={<ProtectedRoute allow={['STUDENT']}><Layout></Layout></ProtectedRoute>}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/classes/:id" element={<ClassDetail />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
            <Route path="/student/tuition" element={<TuitionPage />} />
            <Route path="/student/quizzes" element={<QuizPage />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/schedule" element={<StudentSchedule />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/transcript" element={<StudentTranscript />} />
       </Route>
          <Route element={<ProtectedRoute allow={['LECTURER']}><Layout></Layout></ProtectedRoute>}>
            <Route path="/lecturer" element={<LecturerDashboard />} />
            <Route path="/lecturer/classes" element={<LecturerClasses />} />
            <Route path="/lecturer/classes/:id" element={<ClassDetail />} />
            <Route path="/lecturer/notifications" element={<NotificationsPage />} />
            <Route path="/lecturer/quizzes" element={<QuizPage />} />
            <Route path="/lecturer/assignments" element={<LecturerAssignments />} />
            <Route path="/lecturer/grading" element={<LecturerGrading />} />
            <Route path="/lecturer/schedule" element={<LecturerSchedule />} />
            <Route path="/lecturer/profile" element={<LecturerProfile />} />
       </Route>
          <Route element={<ProtectedRoute allow={['ADMIN']}><Layout></Layout></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/classes/:id" element={<ClassDetail />} />
            <Route path="/admin/curricula" element={<AdminCurricula />} />
            <Route path="/admin/registration" element={<RegistrationPeriods />} />
            <Route path="/admin/reports" element={<AdminReports />} />
       </Route>
          <Route path="*" element={<NotFoundPage />} />
     </Routes>
   </BrowserRouter>
 </AuthProvider>
  );
}
