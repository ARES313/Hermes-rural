import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentMyClasses } from '../../services/api';

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

const StudentClassesPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const particles = useMemo(() => generateParticles(20), []);

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
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f5e6b8',
        fontSize: '1.5rem'
      }}>
        Cargando...
      </div>
    );
  }

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

        .back-link {
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #f5e6b8;
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
        <div style={{ marginBottom: '20px' }}>
          <Link to="/student/dashboard" className="back-link">
            ← Volver al inicio
          </Link>
        </div>

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
              Mis Clases
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            Cerrar Sesión
          </button>
        </div>

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: 'rgba(220,53,69,0.2)',
            backdropFilter: 'blur(8px)',
            color: '#f8d7da',
            borderRadius: '8px',
            border: '1px solid rgba(220,53,69,0.3)',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {classes.length === 0 ? (
          <div className="empty-state">
            <p>No estás matriculado en ninguna clase aún.</p>
            <Link to="/student/dashboard">
              <button className="btn-ai" style={{ marginTop: '10px', animation: 'none' }}>
                Volver al Dashboard
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {classes.map((classItem) => (
              <div key={classItem.id} className="class-item">
                <h3>{classItem.name}</h3>
                <p>{classItem.description || 'Sin descripción'}</p>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                  <span><strong>Docente:</strong> {classItem.teacher_name}</span>
                  <span style={{ marginLeft: '15px' }}><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                  <span style={{ marginLeft: '15px' }}><strong>Estado:</strong> 
                    <span style={{ color: classItem.status === 'active' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                      {' '}{classItem.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </span>
                </div>
                <Link to={`/student/classes/${classItem.id}`}>
                  <button className="btn-ai" style={{ animation: 'none', padding: '8px 16px', fontSize: '14px' }}>
                    Entrar a la Clase
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentClassesPage;
