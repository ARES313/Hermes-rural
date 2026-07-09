import React, { createContext, useState, useContext, useCallback } from 'react';
import ModalNotification, { MODAL_TYPES } from '../../components/ModalNotification';

const ModalContext = createContext(null);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal debe usarse dentro de un ModalProvider');
  }
  return ctx;
};

/**
 * ModalProvider — Envuelve la app y expone showAlert / showConfirm.
 *
 * Uso:
 * ```jsx
 * const { showAlert, showConfirm } = useModal();
 *
 * showAlert('Archivo guardado');
 * showAlert('Error al conectar', 'error');
 * showConfirm('¿Eliminar clase?', () => deleteClass(id));
 * ```
 */
export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null); // { mode, message, type, onConfirm }

  const showAlert = useCallback((message, type = MODAL_TYPES.SUCCESS) => {
    setModal({ mode: 'alert', message, type });
  }, []);

  const showError = useCallback((message) => {
    setModal({ mode: 'alert', message, type: MODAL_TYPES.ERROR });
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setModal({ mode: 'confirm', message, type: MODAL_TYPES.WARNING, onConfirm });
  }, []);

  const hideModal = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <ModalContext.Provider value={{ showAlert, showError, showConfirm, hideModal }}>
      {children}

      {modal && (
        <ModalNotification
          mode={modal.mode}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onClose={hideModal}
        />
      )}
    </ModalContext.Provider>
  );
};

export default ModalContext;
