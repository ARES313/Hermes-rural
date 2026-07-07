import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getMyClasses } from '../../services/api';

// Símbolos matemáticos para el fondo
const MATH_SYMBOLS = ['π', '∑', '√', '∞', '∫', 'α', 'Ω', 'λ', '+', 'fx'];

const generateParticles = (count = 20) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 14 + Math.random() * 24,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
    });
  }
  return particles;
};

const TeacherDashboardPage = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const particles = useMemo(() => generateParticles(20), []);

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const fetchMyClasses = async () => {
    try {
      const response = await getMyClasses();
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const teacherActions = [
    { name: 'Mis Clases', description: `Tienes ${classes.length} clase(s) asignada(s)`, path: '/teacher/classes' }
  ];

  return (
    <>
      <style>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-120px) translateX(40px);
            opacity: 0;
          }
        }

        .particle-bg {
          position: absolute;
          pointer-events: none;
          user-select: none;
          font-weight: bold;
          color: rgba(255, 215, 0, 0.15);
          filter: blur(1.5px);
          animation: floatParticle linear infinite;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .btn-logout {
          padding: 10px 20px;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-logout:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4);
        }

        .btn-ai {
          padding: 10px 20px;
          background: linear-gradient(135deg, #6c5ce7, #0984e3, #fdcb6e);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .btn-ai:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.5);
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(108, 92, 231, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(108, 92, 231, 0.6);
          }
        }

        .link-card {
          text-decoration: none;
          display: block;
        }

        .link-card .glass-card {
          text-align: center;
        }

        .link-card .glass-card h3 {
          margin: 10px 0;
          color: #f5e6b8;
        }

        .link-card .glass-card p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .class-item {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .class-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .class-item h3 {
          margin: 0 0 10px 0;
          color: #f5e6b8;
        }

        .class-item p {
          margin: 5px 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .class-item span {
          color: rgba(255, 255, 255, 0.6);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .info-grid p {
          color: rgba(255, 255, 255, 0.8);
        }

        .info-grid strong {
          color: #f5e6b8;
        }

        .badge-role {
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          margin-left: 8px;
          display: inline-block;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-text {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.7);
        }
      `}</style>

      {/* Fondo galaxia matemática */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
          overflow: 'hidden',
          zIndex: -1,
        }}
      >
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle-bg"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Encabezado */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px' }}>
              Hermes Rural — Panel del Docente
            </h1>
            <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,0.6)' }}>Panel del Docente</p>
          </div>
          <button
            onClick={logout}
            className="btn-logout"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Información del Usuario */}
        <div className="glass-card" style={{ marginBottom: '30px' }}>
          <h2 style={{ marginTop: 0, color: '#f5e6b8', fontSize: '1.3rem', fontWeight: 400 }}>Información del Usuario</h2>
          <div className="info-grid">
            <p><strong>Nombre:</strong> {user?.full_name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Rol:</strong> 
              <span className="badge-role">
                DOCENTE
              </span>
            </p>
            <p><strong>ID:</strong> {user?.id}</p>
          </div>
        </div>

        {/* Panel del Docente */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#f5e6b8', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 400 }}>Panel del Docente</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px'
          }}>
            {teacherActions.map((action, index) => (
              <Link
                key={index}
                to={action.path}
                className="link-card"
              >
                <div className="glass-card">
                  <h3>{action.name}</h3>
                  <p>{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px',
            marginTop: '20px'
          }}>
            <button
              onClick={() => navigate('/ai-access')}
              className="btn-ai"
            >
              Hablar con la IA
            </button>
          </div>
        </div>

        {/* Resumen de Clases */}
        <div>
          <h2 style={{ color: '#f5e6b8', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 400 }}>Resumen de Clases</h2>
          {loading ? (
            <div className="loading-text">Cargando clases...</div>
          ) : classes.length === 0 ? (
            <div className="empty-state">
              No tienes clases asignadas aún
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {classes.map((classItem) => (
                <div key={classItem.id} className="class-item">
                  <h3>{classItem.name}</h3>
                  <p>{classItem.description}</p>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    <span>Año: {classItem.school_year || 'N/A'}</span>
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

export default TeacherDashboardPage;
