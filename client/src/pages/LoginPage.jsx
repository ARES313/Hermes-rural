import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

// Símbolos matemáticos para las partículas
const MATH_SYMBOLS = ['π', '∑', '√', '∞', '∫', 'α', 'Ω', 'λ', '+', 'fx'];

// Genera un array de partículas con propiedades aleatorias
const generateParticles = (count = 18) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      left: Math.random() * 100,          // % horizontal
      top: Math.random() * 100,           // % vertical
      size: 14 + Math.random() * 24,      // px
      duration: 8 + Math.random() * 12,   // segundos
      delay: Math.random() * 8,           // segundos
      opacityStart: 0.1 + Math.random() * 0.4,
      opacityEnd: 0.3 + Math.random() * 0.5,
    });
  }
  return particles;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Generar partículas una sola vez al montar el componente
  const particles = useMemo(() => generateParticles(18), []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.toLowerCase();
    const result = await login(normalizedEmail, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Estilos globales para animaciones y fondo */}
      <style>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(40px);
            opacity: 0;
          }
        }

        .particle {
          position: absolute;
          pointer-events: none;
          user-select: none;
          font-weight: bold;
          color: rgba(255, 215, 0, 0.7);
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
          animation: floatParticle linear infinite;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          padding: 40px 32px;
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
        }

        .glass-card input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #fff;
          padding: 12px 16px;
          width: 100%;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .glass-card input:focus {
          border-color: #f0c040;
          box-shadow: 0 0 0 3px rgba(240, 192, 64, 0.3);
        }

        .glass-card input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .glass-card label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 0.5px;
        }

        .glass-card button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #f0c040, #d4a017);
          color: #1a1a2e;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          margin-top: 8px;
        }

        .glass-card button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(240, 192, 64, 0.4);
        }

        .glass-card button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.15);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          text-align: center;
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
        {/* Partículas matemáticas */}
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
              opacity: p.opacityStart,
            }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      {/* Contenido principal */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Título Hermes Rural */}
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            fontWeight: 300,
            letterSpacing: '4px',
            color: '#f5e6b8',
            textShadow: '0 0 20px rgba(245, 230, 184, 0.6), 0 0 40px rgba(245, 230, 184, 0.3)',
            marginBottom: '40px',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textAlign: 'center',
          }}
        >
          Hermes Rural
        </h1>

        {/* Formulario Glassmorphism */}
        <div className="glass-card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? 'Cargando…' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
