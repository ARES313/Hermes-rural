import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getClasses } from '../../services/api';
import useMathParticles from '../../hooks/useMathParticles';
import SkeletonLoader from '../../components/SkeletonLoader';

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const particles = useMathParticles(20);

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
    <>
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3); padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .glass-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        .btn-logout {
          padding: 10px 20px;
          background: linear-gradient(135deg, #c0392b, #e74c3c); color: white;
          border: none; border-radius: 8px; cursor: pointer;
          font-size: 14px; font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-logout:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(231,76,60,0.4); }
        .link-card { text-decoration: none; display: block; }
        .link-card .glass-card { text-align: center; cursor: pointer; }
        .link-card .glass-card h3 { margin: 10px 0; color: #f5e6b8; font-size: 1.1rem; }
        .link-card .glass-card p { margin: 0; color: rgba(255,255,255,0.7); font-size: 14px; }
        .badge-admin {
          background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;
          padding: 3px 10px; border-radius: 6px; font-size: 12px;
          font-weight: bold; margin-left: 8px; display: inline-block;
        }
        .class-item {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px); border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3); padding: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .class-item:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
        .class-item h3 { margin: 0 0 10px; color: #f5e6b8; }
        .class-item p { margin: 5px 0; color: rgba(255,255,255,0.7); }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(250px,1fr)); gap: 15px; }
        .info-grid p { color: rgba(255,255,255,0.8); }
        .info-grid strong { color: #f5e6b8; }
        .empty-state {
          text-align: center; padding: 40px;
          background: rgba(255,255,255,0.06); backdrop-filter: blur(12px);
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.7);
        }
        .loading-text { text-align: center; padding: 40px; color: rgba(255,255,255,0.7); }
        .error-box {
          padding: 12px; background: rgba(231,76,60,0.15);
          color: #ff6b6b; border-radius: 8px; margin-bottom: 20px;
          border: 1px solid rgba(231,76,60,0.3);
        }
      `}</style>

      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
        overflow: 'hidden', zIndex: -1,
      }}>
        {particles.map((p) => (
          <span key={p.id} className="particle-bg" style={{
            left: `${p.left}%`, top: `${p.top}%`, fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          }}>{p.symbol}</span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '30px', paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px' }}>
              Hermes Rural — Admin
            </h1>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.6)' }}>Panel de Administración</p>
          </div>
          <button onClick={logout} className="btn-logout">Cerrar Sesión</button>
      </div>

      <div className="glass-card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0, color: '#f5e6b8', fontSize: '1.3rem', fontWeight: 400 }}>Información del Usuario</h2>
        <div className="info-grid">
          <p><strong>Nombre:</strong> {user?.full_name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rol:</strong> 
            <span className="badge-admin">
              ADMIN
            </span>
          </p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f5e6b8', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 400 }}>Panel de Administración</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px'
        }}>
          {adminActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="link-card"
            >
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '10px 0', color: '#f5e6b8', fontSize: '1.1rem' }}>{action.name}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ color: '#f5e6b8', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 400 }}>Clases del Sistema</h2>
        {loading && <SkeletonLoader variant="card" count={3} />}
        {error && <div className="error-box">{error}</div>}
        {!loading && !error && classes.length === 0 && (
          <div className="empty-state">
            No hay clases disponibles
          </div>
        )}
        {!loading && !error && classes.length > 0 && (
          <div style={{ display: 'grid', gap: '15px' }}>
            {classes.map((classItem) => (
              <div key={classItem.id} className="class-item">
                <h3>{classItem.name}</h3>
                <p>{classItem.description}</p>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  <span><strong>Docente:</strong> {classItem.teacher_name}</span>
                  <span style={{ marginLeft: '20px' }}><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                  <span style={{ marginLeft: '20px' }}><strong>Estado:</strong> 
                    <span style={{ color: classItem.status === 'active' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}> {classItem.status === 'active' ? 'Activa' : 'Inactiva'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminDashboardPage;