import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getClasses } from '../../services/api';

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const adminActions = [
    { name: 'Estudiantes', description: 'Gestionar estudiantes del sistema', path: '/admin/students' },
    { name: 'Docentes', description: 'Gestionar docentes del sistema', path: '/admin/teachers' },
    { name: 'Clases', description: 'Gestionar todas las clases', path: '/admin/classes' },
    { name: 'Estudiantes por Clase', description: 'Asignar estudiantes a clases', path: '/admin/class-students' },
    { name: 'Asignar Docente a Clase', description: 'Asignar un docente a cada clase', path: '/admin/assign-teacher' }
  ];

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
          <h1 style={{ margin: 0, color: '#333' }}>Proyecto Redes - Admin</h1>
          <p style={{ margin: '5px 0 0', color: '#666' }}>Panel de Administración</p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px',
            fontSize: '14px'
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
        <h2 style={{ marginTop: 0, color: '#495057' }}>Información del Usuario</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <p><strong>Nombre:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rol:</strong> 
            <span style={{ 
              backgroundColor: '#dc3545',
              color: 'white',
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: '8px',
              display: 'inline-block'
            }}>
              ADMIN
            </span>
          </p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#495057', marginBottom: '15px' }}>Panel de Administración</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px'
        }}>
          {adminActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ margin: '10px 0', color: '#333' }}>{action.name}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ color: '#495057', marginBottom: '15px' }}>Clases del Sistema</h2>
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando clases...</div>}
        {error && <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px' }}>{error}</div>}
        {!loading && !error && classes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px', color: '#666' }}>
            No hay clases disponibles
          </div>
        )}
        {!loading && !error && classes.length > 0 && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {classes.map((classItem) => (
              <div key={classItem.id} style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>{classItem.name}</h3>
                <p style={{ margin: '5px 0', color: '#666' }}>{classItem.description}</p>
                <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  <span><strong>Docente:</strong> {classItem.teacher_name}</span>
                  <span><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                  <span><strong>Estado:</strong> 
                    <span style={{ color: classItem.status === 'active' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}> {classItem.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;