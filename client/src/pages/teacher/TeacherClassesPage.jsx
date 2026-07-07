import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { getMyClasses } from '../../services/api';

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

const TeacherClassesPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const particles = useMemo(() => generateParticles(20), []);

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

        .class-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .class-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .class-card h2 {
          margin: 0 0 10px 0;
          color: #f5e6b8;
        }

        .class-card p {
          margin: 5px 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .class-card .meta {
          display: flex;
          gap: 20px;
          margin-top: 10px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .class-card .meta strong {
          color: #f5e6b8;
        }

        .btn-view {
          display: inline-block;
          margin-top: 15px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-view:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
        }

        .back-link {
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #f5e6b8;
        }

        .error-box {
          padding: 10px;
          background: rgba(255, 107, 107, 0.15);
          color: #ff6b6b;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 107, 107, 0.3);
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
        <div style={{ marginBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            ← Volver al Dashboard
          </Link>
        </div>

        <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', marginBottom: '8px' }}>
          Mis Clases
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
          Clases que tienes asignadas como docente
        </p>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-text">Cargando clases...</div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            No tienes clases asignadas aún
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {classes.map((classItem) => (
              <div key={classItem.id} className="class-card">
                <h2>{classItem.name}</h2>
                <p>{classItem.description || 'Sin descripción'}</p>
                <div className="meta">
                  <span><strong>Año:</strong> {classItem.school_year || 'N/A'}</span>
                  <span><strong>Estado:</strong>
                    <span style={{ color: classItem.status === 'active' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                      {' '}{classItem.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </span>
                </div>
                <Link
                  to={`/teacher/classes/${classItem.id}`}
                  className="btn-view"
                >
                  Ver Clase
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TeacherClassesPage;
