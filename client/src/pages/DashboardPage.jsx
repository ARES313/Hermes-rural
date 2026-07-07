import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import AdminDashboardPage from './admin/AdminDashboardPage';
import TeacherDashboardPage from './teacher/TeacherDashboardPage';
import StudentDashboardPage from './student/StudentDashboardPage';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;
  }

  const role = user?.role_name?.toLowerCase() || '';

  if (role === 'admin') {
    return <AdminDashboardPage />;
  }

  if (role === 'teacher' || role === 'docente') {
    return <TeacherDashboardPage />;
  }

  if (role === 'student' || role === 'estudiante') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', color: '#dc3545' }}>
      <h2>Rol no reconocido</h2>
      <p>Contacte al administrador</p>
    </div>
  );
};

export default DashboardPage;