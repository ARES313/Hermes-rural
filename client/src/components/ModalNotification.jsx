import React, { useEffect, useCallback } from 'react';

const MODAL_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

const typeConfig = {
  [MODAL_TYPES.SUCCESS]: {
    icon: '✅',
    title: 'Éxito',
    accentColor: '#2ecc71',
    gradient: 'linear-gradient(135deg, #27ae60, #2ecc71)',
  },
  [MODAL_TYPES.ERROR]: {
    icon: '❌',
    title: 'Error',
    accentColor: '#e74c3c',
    gradient: 'linear-gradient(135deg, #c0392b, #e74c3c)',
  },
  [MODAL_TYPES.INFO]: {
    icon: 'ℹ️',
    title: 'Información',
    accentColor: '#3498db',
    gradient: 'linear-gradient(135deg, #2980b9, #3498db)',
  },
  [MODAL_TYPES.WARNING]: {
    icon: '⚠️',
    title: 'Confirmación',
    accentColor: '#f39c12',
    gradient: 'linear-gradient(135deg, #e67e22, #f39c12)',
  },
};

/**
 * ModalNotification — Componente reutilizable con estética glassmorphism.
 *
 * Modos:
 *   - alert:  muestra un mensaje con botón "Aceptar"
 *   - confirm: muestra un mensaje con botones "Sí" y "No"
 *
 * @param {Object} props
 * @param {'alert'|'confirm'} props.mode
 * @param {string} props.message
 * @param {'success'|'error'|'info'|'warning'} [props.type='info']
 * @param {Function} [props.onConfirm] - Callback al confirmar (solo modo confirm)
 * @param {Function} props.onClose
 */
const ModalNotification = ({ mode = 'alert', message, type = MODAL_TYPES.INFO, onConfirm, onClose }) => {
  const config = typeConfig[type] || typeConfig.info;

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        if (mode === 'confirm') {
          onClose();
        } else {
          onClose();
        }
      }
    },
    [mode, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'modalFadeIn 0.25s ease-out',
        padding: '20px',
      }}
    >
      {/* Inyectar keyframe de animación solo una vez */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${config.accentColor}22`,
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          animation: 'modalSlideUp 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Barra de acento superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: config.gradient,
          }}
        />

        {/* Icono + Título */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '40px',
              marginBottom: '8px',
              display: 'inline-block',
              filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.15))',
            }}
          >
            {config.icon}
          </div>
          <h3
            style={{
              margin: 0,
              color: '#f5e6b8',
              fontSize: '1.2rem',
              fontWeight: 500,
              letterSpacing: '1px',
            }}
          >
            {mode === 'confirm' ? 'Confirmación' : config.title}
          </h3>
        </div>

        {/* Mensaje */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            textAlign: 'center',
            marginBottom: '24px',
            wordBreak: 'break-word',
          }}
        >
          {message}
        </div>

        {/* Botones */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          {mode === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 28px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  flex: 1,
                  maxWidth: '140px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                No
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                style={{
                  padding: '12px 28px',
                  background: config.gradient,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  flex: 1,
                  maxWidth: '140px',
                  boxShadow: `0 4px 16px ${config.accentColor}44`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = `0 6px 24px ${config.accentColor}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${config.accentColor}44`;
                }}
              >
                Sí
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              style={{
                padding: '12px 36px',
                background: config.gradient,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 700,
                transition: 'all 0.2s',
                minWidth: '140px',
                boxShadow: `0 4px 16px ${config.accentColor}44`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = `0 6px 24px ${config.accentColor}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${config.accentColor}44`;
              }}
              autoFocus
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { MODAL_TYPES };
export default ModalNotification;
