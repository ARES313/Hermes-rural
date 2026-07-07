import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentMyClasses } from '../../services/api';

const MATH_SYMBOLS = ['π', '∑', '√', '∞', '∫'];

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
      delay: Math.random() * 5,
    });
  }
  return particles;
};

const StudentDashboardPage = () => {
  const { user, logout } = useAuth();
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

  return (
    <>
      <style>{`
        @keyframes floatSymbols {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.25; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.15; }
        }
        .particle {
          position: absolute;
          pointer-events: none;
          animation: floatSymbols linear infinite;
          filter: blur(1px);
          color: rgba(255,255,255,0.15);
          font-weight: bold;
          user-select: none;
        }
        .glass-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 16px;
          box-shadow: 0 8px 32px 0 rgba(31,38,135,0.37);
          color: #f0e6d0;
        }
        .btn-ai {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 14px 28px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 15px rgba(102,126,234,0.5);
          width: 100%;
          text-align: center;
        }
        .btn-ai:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(102,126,234,0.8);
        }
        .btn-logout {
          background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%);
          border: none;
          color: white;
          padding: 10px 20px;
          font-size: 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-logout:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 15px rgba(220,53,69,0.4);
        }
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102,126,234,0.5);
        }
        .btn-secondary {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #f0e6d0;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: rgba(255,255,255,0.25);
        }
        @media (max-width: 768px) {
          .glass-card {
            padding: 16px !important;
          }
        }
      `}</style>
      <div style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        overflow: 'hidden',
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        color: '#f0e6d0'
      }}>
        {/* Floating math symbols */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
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

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#f0e6d0', textShadow: '0 0 10px rgba(102,126,234,0.5)' }}>
              Hermes Rural - Estudiante
            </h1>
            <p style={{ margin: '5px 0 0', color: '#c0b8a0' }}>Panel de Estudiante</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Profile card */}
        <div className="glass-card" style={{
          marginBottom: '30px',
          padding: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{ marginTop: 0, color: '#f0e6d0' }}>Bienvenido, {user?.full_name}!</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Rol:</strong> <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '3px 10px',
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>ESTUDIANTE</span></p>
        </div>

        {/* Quick Navigation + AI button */}
        <div style={{ marginBottom: '30px', position: 'relative', zIndex: 1 }}>
          <h2>📚 Navegación Rápida</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginTop: '15px'
          }}>
            <Link to="/student/classes" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{
                padding: '30px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}>
                <div style={{ fontSize: '48px' }}>📖</div>
                <h3 style={{ color: '#f0e6d0' }}>Mis Clases</h3>
                <p style={{ color: '#c0b8a0' }}>Ver todas tus clases matriculadas</p>
              </div>
            </Link>
            {/* AI button card */}
            <div className="glass-card" style={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🤖</div>
              <button
                onClick={() => navigate('/ai-access')}
                className="btn-ai"
              >
                Hablar con la IA
              </button>
            </div>
          </div>
        </div>

        {/* Classes summary */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2>📋 Resumen de Clases Matriculadas</h2>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Cargando clases...</div>}
          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: 'rgba(220,53,69,0.2)',
              backdropFilter: 'blur(8px)',
              color: '#f8d7da',
              borderRadius: '8px',
              border: '1px solid rgba(220,53,69,0.3)'
            }}>
              {error}
            </div>
          )}
          {!loading && !error && classes.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              No estás matriculado en ninguna clase aún.
            </div>
          )}
          {!loading && !error && classes.length > 0 && (
            <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
              {classes.slice(0, 3).map((classItem) => (
                <div key={classItem.id} className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#f0e6d0' }}>{classItem.name}</h3>
                  <p style={{ margin: '5px 0', color: '#c0b8a0' }}>{classItem.description}</p>
                  <p><strong>Docente:</strong> {classItem.teacher_name}</p>
                  <Link to={`/student/classes/${classItem.id}`}>
                    <button className="btn-primary" style={{ marginTop: '10px' }}>
                      Entrar a la Clase
                    </button>
                  </Link>
                </div>
              ))}
              {classes.length > 3 && (
                <Link to="/student/classes">
                  <button className="btn-secondary" style={{ width: '100%', padding: '12px' }}>
                    Ver todas ({classes.length} clases)
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboardPage;
