import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AiAccessPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Debes ingresar una clave.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/ai-chat');
      } else {
        setError(data.message || 'Error al ingresar. Intente de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión. Intente más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Acceso al Asistente IA</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ingrese la clave"
          disabled={loading}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 15px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#007bff',
            color: 'white',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
        {error && <p style={{ color: 'red', textAlign: 'center', margin: '0' }}>{error}</p>}
      </form>
    </div>
  );
}

export default AiAccessPage;
