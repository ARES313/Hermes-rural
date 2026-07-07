import React, { useState, useRef, useEffect, useMemo } from 'react';

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

function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const particles = useMemo(() => generateParticles(20), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage || loading) return;

    const newMessage = { sender: 'user', text: trimmedMessage };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'ai', text: data.reply || 'Sin respuesta del modelo.' },
        ]);
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'ai', text: data.message || 'Error al obtener respuesta de la IA.' },
        ]);
      }
    } catch (err) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'ai', text: 'Error de conexión con la IA.' },
      ]);
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

        .chat-input {
          flex: 1;
          padding: 10px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          color: white;
          font-size: 16px;
          outline: none;
        }

        .chat-input::placeholder {
          color: rgba(255,255,255,0.5);
        }

        .message-bubble {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 18px;
          max-width: 70%;
          word-wrap: break-word;
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
        }

        .message-bubble.ai {
          background: rgba(255,255,255,0.12);
          color: #f5e6b8;
        }

        .message-bubble.loading {
          background: rgba(255,255,255,0.12);
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

      <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h2 style={{ textAlign: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', margin: '0', color: '#f5e6b8', fontWeight: 300, letterSpacing: '2px' }}>
            Asistente IA
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '10px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                <span className={`message-bubble ${msg.sender}`}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'left', marginBottom: '10px' }}>
                <span className="message-bubble loading">
                  Pensando...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', gap: '10px' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-ai"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AiChatPage;
