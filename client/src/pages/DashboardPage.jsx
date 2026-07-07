import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import AdminDashboardPage from './admin/AdminDashboardPage';
import TeacherDashboardPage from './teacher/TeacherDashboardPage';
import StudentDashboardPage from './student/StudentDashboardPage';

const DashboardPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e1e2f 0%, #2a1a3e 50%, #1a1a2e 100%)',
        color: '#f5e6b8',
        fontSize: '1.2rem',
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}>
        Cargando...
      </div>
    );
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1e2f 0%, #2a1a3e 50%, #1a1a2e 100%)',
      color: '#f5e6b8',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: '40px 32px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.8rem', fontWeight: 300, letterSpacing: '2px' }}>
          Rol no reconocido
        </h2>
        <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>
          Contacte al administrador
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
