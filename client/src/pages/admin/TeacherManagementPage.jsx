import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, changeTeacherPassword } from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useModal } from '../../features/modal/ModalContext';
import useMathParticles from '../../hooks/useMathParticles';

const TeacherManagementPage = () => {
  const [teachers, setTeachers] = useState([]);
  const { showAlert, showConfirm } = useModal();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    status: 'active'
  });

  const particles = useMathParticles(20);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await getTeachers();
      setTeachers(response.data.teachers);
      setError('');
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Error al cargar los docentes');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          status: formData.status
        };
        await updateTeacher(editingTeacher.id, updateData);
        showAlert('Docente actualizado exitosamente');
      } else {
        if (!formData.password || formData.password.length < 6) {
          showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
          return;
        }
        await createTeacher(formData);
        showAlert('Docente creado exitosamente');
      }
      resetForm();
      fetchTeachers();
    } catch (err) {
      console.error('Error saving teacher:', err);
      showAlert(err.response?.data?.message || 'Error al guardar el docente', 'error');
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      email: teacher.email,
      password: '',
      status: teacher.status
    });
    setShowForm(true);
  };

  const handleDelete = (id, fullName) => {
    showConfirm(`¿Desactivar al docente "${fullName}"?`, async () => {
      try {
        await deleteTeacher(id);
        showAlert('Docente desactivado exitosamente');
        fetchTeachers();
      } catch (err) {
        console.error('Error deleting teacher:', err);
        showAlert(err.response?.data?.message || 'Error al desactivar el docente', 'error');
      }
    });
  };

  const handleHardDelete = (id, fullName) => {
    showConfirm(`¿ELIMINAR PERMANENTEMENTE al docente "${fullName}"? Esta acción no se puede deshacer.`, async () => {
      try {
        await deleteTeacher(id, true);
        showAlert('Docente eliminado permanentemente');
        fetchTeachers();
      } catch (err) {
        console.error('Error hard deleting teacher:', err);
        showAlert(err.response?.data?.message || 'Error al eliminar el docente', 'error');
      }
    });
  };

  const openPasswordModal = (teacher) => {
    setSelectedTeacher(teacher);
    setNewPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setUpdatingPassword(true);
    try {
      await changeTeacherPassword(selectedTeacher.id, newPassword);
      showAlert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setPasswordError('');
    } catch (err) {
      console.error('Error changing password:', err);
      showAlert(err.response?.data?.message || 'Error al cambiar la contraseña', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      status: 'active'
    });
  };

  return (
    <>
      <style>{`
        .glass-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 8px 32px rgba(0,0,0,0.3); padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
        .glass-table { width: 100%; border-collapse: separate; border-spacing: 0; background: rgba(255,255,255,0.04); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .glass-table thead th { padding: 14px 16px; text-align: left; color: #f5e6b8; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .glass-table tbody td { padding: 14px 16px; color: rgba(255,255,255,0.8); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .glass-table tbody tr:last-child td { border-bottom: none; }
        .glass-table tbody tr:hover { background: rgba(255,255,255,0.06); }
        .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #6c5ce7, #0984e3); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(108,92,231,0.4); }
        .btn-success { padding: 10px 20px; background: linear-gradient(135deg, #00b894, #00cec9); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-success:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(0,184,148,0.4); }
        .btn-warning { padding: 6px 12px; background: linear-gradient(135deg, #fdcb6e, #e17055); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-warning:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(225,112,85,0.4); }
        .btn-danger { padding: 6px 12px; background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-danger:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(231,76,60,0.4); }
        .btn-info { padding: 6px 12px; background: linear-gradient(135deg, #0984e3, #6c5ce7); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-info:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(108,92,231,0.4); }
        .btn-secondary { padding: 6px 12px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-secondary:hover { transform: scale(1.02); background: rgba(255,255,255,0.15); }
        .cancel-btn { padding: 10px 20px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .cancel-btn:hover { transform: scale(1.02); background: rgba(255,255,255,0.15); }
        .glass-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: rgba(255,255,255,0.9); font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .glass-input:focus { border-color: rgba(108,92,231,0.6); box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
        .glass-input::placeholder { color: rgba(255,255,255,0.35); }
        .glass-select { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: rgba(255,255,255,0.9); font-size: 14px; outline: none; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .glass-select:focus { border-color: rgba(108,92,231,0.6); box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
        .glass-label { display: block; margin-bottom: 6px; color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 500; }
        .error-box { padding: 12px; background: rgba(231,76,60,0.15); color: #ff6b6b; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(231,76,60,0.3); }
        .loading-text { text-align: center; padding: 40px; color: rgba(255,255,255,0.7); }
        .back-link { text-decoration: none; color: rgba(255,255,255,0.7); transition: color 0.2s; }
        .back-link:hover { color: #f5e6b8; }
        .status-badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
        .status-badge.active { background: rgba(46,204,113,0.2); color: #2ecc71; border: 1px solid rgba(46,204,113,0.3); }
        .status-badge.inactive { background: rgba(231,76,60,0.2); color: #e74c3c; border: 1px solid rgba(231,76,60,0.3); }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)', overflow: 'hidden', zIndex: -1 }}>
        {particles.map((p) => (
          <span key={p.id} className="particle-bg" style={{ left: `${p.left}%`, top: `${p.top}%`, fontSize: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}>{p.symbol}</span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', margin: 0 }}>Gestión de Docentes</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>Administra los docentes del sistema</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'cancel-btn' : 'btn-success'}>
            {showForm ? 'Cancelar' : '+ Nuevo Docente'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {showForm && (
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 20px', color: '#f5e6b8', fontSize: '1.2rem', fontWeight: 400 }}>
              {editingTeacher ? 'Editar Docente' : 'Nuevo Docente'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Nombre completo:</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required className="glass-input" placeholder="Nombre completo del docente" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="glass-input" placeholder="correo@ejemplo.com" />
              </div>
              {!editingTeacher && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="glass-label">Contraseña (mínimo 6 caracteres):</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="glass-input" placeholder="••••••" />
                </div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <label className="glass-label">Estado:</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="glass-select">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">{editingTeacher ? 'Actualizar' : 'Crear'}</button>
                <button type="button" onClick={resetForm} className="cancel-btn">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <SkeletonLoader variant="table" count={5} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>No hay docentes registrados</td></tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td style={{ color: 'rgba(255,255,255,0.5)' }}>{teacher.id}</td>
                      <td style={{ color: '#f5e6b8', fontWeight: 500 }}>{teacher.full_name}</td>
                      <td>{teacher.email}</td>
                      <td>
                        <span className={`status-badge ${teacher.status === 'active' ? 'active' : 'inactive'}`}>
                          {teacher.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleEdit(teacher)} className="btn-warning">Editar</button>
                          <button onClick={() => openPasswordModal(teacher)} className="btn-info">Pass</button>
                          <button onClick={() => handleDelete(teacher.id, teacher.full_name)} className="btn-danger">Desactivar</button>
                          <button onClick={() => handleHardDelete(teacher.id, teacher.full_name)} className="btn-secondary">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {showPasswordModal && selectedTeacher && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="glass-card" style={{ maxWidth: '420px', width: '90%' }}>
              <h2 style={{ margin: '0 0 8px', color: '#f5e6b8', fontSize: '1.3rem', fontWeight: 400 }}>Cambiar Contraseña</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px', fontSize: '14px' }}>
                <strong style={{ color: '#f5e6b8' }}>Docente:</strong> {selectedTeacher.full_name} — {selectedTeacher.email}
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Nueva Contraseña:</label>
                <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }} placeholder="Mínimo 6 caracteres" className="glass-input" />
                {passwordError && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '5px' }}>{passwordError}</p>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleChangePassword} disabled={updatingPassword} className="btn-primary" style={{ opacity: updatingPassword ? 0.6 : 1 }}>
                  {updatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
                <button onClick={() => { setShowPasswordModal(false); setSelectedTeacher(null); setNewPassword(''); setPasswordError(''); }} className="cancel-btn">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TeacherManagementPage;