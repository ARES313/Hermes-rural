import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentMyClasses } from '../../services/api';

const StudentClassesPage = () => {
  const { logout } = useAuth();
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

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Mis Clases</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cerrar Sesión
        </button>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p>No estás matriculado en ninguna clase aún.</p>
          <Link to="/student/dashboard">
            <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>
              Volver al Dashboard
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {classes.map((classItem) => (
            <div key={classItem.id} style={{
              padding: '25px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
              transition: 'box-shadow 0.2s'
            }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{classItem.name}</h2>
              <p style={{ margin: '10px 0', color: '#666' }}>{classItem.description || 'Sin descripción'}</p>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                <span><strong>Docente:</strong> {classItem.teacher_name}</span>
                <span><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                <span><strong>Estado:</strong> 
                  <span style={{ color: classItem.status === 'active' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                    {' '}{classItem.status === 'active' ? 'Activa' : 'Inactiva'}
                  </span>
                </span>
              </div>
              <Link to={`/student/classes/${classItem.id}`}>
                <button style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
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
        </div>
      )}
    </div>
  );
};

export default StudentClassesPage;
