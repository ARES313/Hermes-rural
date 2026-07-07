import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ProtectedRoute from '../components/ProtectedRoute';
import StudentManagementPage from '../pages/admin/StudentManagementPage';
import TeacherManagementPage from '../pages/admin/TeacherManagementPage';
import ClassManagementPage from '../pages/admin/ClassManagementPage';
import ClassStudentsPage from '../pages/admin/ClassStudentsPage';
import AssignTeacherToClassPage from '../pages/admin/AssignTeacherToClassPage';
import TeacherClassesPage from '../pages/teacher/TeacherClassesPage';
import TeacherClassDetailPage from '../pages/teacher/TeacherClassDetailPage';
// Nuevos imports para estudiante
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import StudentClassesPage from '../pages/student/studentClassesPage';
import StudentClassDetailPage from '../pages/student/StudentClassDetailPage';
import AiAccessPage from '../pages/AiAccessPage';
import AiChatPage from '../pages/AiChatPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute>
            <StudentManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <ProtectedRoute>
            <TeacherManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute>
            <ClassManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/class-students"
        element={
          <ProtectedRoute>
            <ClassStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assign-teacher"
        element={
          <ProtectedRoute>
            <AssignTeacherToClassPage />
          </ProtectedRoute>
        }
      />
      {/* Teacher Routes */}
      <Route
        path="/teacher/classes"
        element={
          <ProtectedRoute>
            <TeacherClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes/:id"
        element={
          <ProtectedRoute>
            <TeacherClassDetailPage />
          </ProtectedRoute>
        }
      />
      {/* Student Routes (NUEVAS) */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classes"
        element={
          <ProtectedRoute>
            <StudentClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classes/:id"
        element={
          <ProtectedRoute>
            <StudentClassDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/ai-access" element={<AiAccessPage />} />
      <Route path="/ai-chat" element={<AiChatPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;