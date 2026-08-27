// App router + provider stack
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ClassDetail from './pages/shared/ClassDetail';
import {
  StudentDashboard, StudentClasses, StudentAssignments, StudentGrades, StudentChat,
} from './pages/student';
import {
  LecturerDashboard, LecturerClasses, LecturerAssignments, LecturerGrading, LecturerChat,
} from './pages/lecturer';
import { AdminDashboard, AdminUsers, AdminClasses } from './pages/admin';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute allow={['STUDENT']}><Layout /></ProtectedRoute>}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/classes/:id" element={<ClassDetail />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/chat" element={<StudentChat />} />
          </Route>
          <Route element={<ProtectedRoute allow={['LECTURER']}><Layout /></ProtectedRoute>}>
            <Route path="/lecturer" element={<LecturerDashboard />} />
            <Route path="/lecturer/classes" element={<LecturerClasses />} />
            <Route path="/lecturer/classes/:id" element={<ClassDetail />} />
            <Route path="/lecturer/assignments" element={<LecturerAssignments />} />
            <Route path="/lecturer/grading" element={<LecturerGrading />} />
            <Route path="/lecturer/chat" element={<LecturerChat />} />
          </Route>
          <Route element={<ProtectedRoute allow={['ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/classes/:id" element={<ClassDetail />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}