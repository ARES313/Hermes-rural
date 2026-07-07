import React, { useState, useRef, useEffect } from 'react';

function AiChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxWidth: '600px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', padding: '15px', borderBottom: '1px solid #eee', margin: '0' }}>Asistente IA</h2>
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px', backgroundColor: '#f9f9f9' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '18px',
              backgroundColor: msg.sender === 'user' ? '#007bff' : '#e0e0e0',
              color: msg.sender === 'user' ? 'white' : '#333',
              maxWidth: '70%',
              wordWrap: 'break-word'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '18px', backgroundColor: '#e0e0e0', color: '#333' }}>
              Pensando...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '15px', borderTop: '1px solid #eee', gap: '10px' }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={loading}
          style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#007bff', color: 'white', fontSize: '16px', cursor: 'pointer' }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default AiChatPage;
