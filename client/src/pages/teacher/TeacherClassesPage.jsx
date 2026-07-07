import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getMyClasses } from '../../services/api';

const TeacherClassesPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await getMyClasses();
      setClasses(response.data.classes);
      setError('');
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/teacher/dashboard" style={{ textDecoration: 'none', color: '#007bff' }}>
          ← Volver al Dashboard
        </Link>
      </div>

      <h1>Mis Clases</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Clases que tienes asignadas como docente
      </p>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando clases...</div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          No tienes clases asignadas aún
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <h2 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{classItem.name}</h2>
              <p style={{ margin: '5px 0', color: '#666' }}>{classItem.description || 'Sin descripción'}</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                <span><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                <span><strong>Estado:</strong>
                  <span style={{ color: classItem.status === 'active' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                    {' '}{classItem.status === 'active' ? 'Activa' : 'Inactiva'}
                  </span>
                </span>
              </div>
              <Link
                to={`/teacher/classes/${classItem.id}`}
                style={{
                  display: 'inline-block',
                  marginTop: '15px',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                Ver Clase
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClassesPage;