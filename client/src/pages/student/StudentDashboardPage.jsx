import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentMyClasses } from '../../services/api';

const StudentDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const response = await getStudentMyClasses();
      setClasses(response.data.classes);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Error al cargar tus clases');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Proyecto Redes - Estudiante</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>Panel de Estudiante</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      <div style={{
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ marginTop: 0 }}>Bienvenido, {user?.full_name}!</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> <span style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '3px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'inline-block'
        }}>ESTUDIANTE</span></p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>📚 Navegación Rápida</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '15px'
        }}>
          <Link to="/student/classes" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '30px',
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}>
              <div style={{ fontSize: '48px' }}>📖</div>
              <h3 style={{ color: '#333' }}>Mis Clases</h3>
              <p style={{ color: '#666' }}>Ver todas tus clases matriculadas</p>
            </div>
          </Link>
        </div>
      </div>

      <div>
        <h2>📋 Resumen de Clases Matriculadas</h2>
        {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Cargando clases...</div>}
        {error && <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>{error}</div>}
        {!loading && !error && classes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            No estás matriculado en ninguna clase aún.
          </div>
        )}
        {!loading && !error && classes.length > 0 && (
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {classes.slice(0, 3).map((classItem) => (
              <div key={classItem.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{classItem.name}</h3>
                <p style={{ margin: '5px 0' }}>{classItem.description}</p>
                <p><strong>Docente:</strong> {classItem.teacher_name}</p>
                <Link to={`/student/classes/${classItem.id}`}>
                  <button style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}>
                    Entrar a la Clase
                  </button>
                </Link>
              </div>
            ))}
            {classes.length > 3 && (
              <Link to="/student/classes">
                <button style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>
                  Ver todas ({classes.length} clases)
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;