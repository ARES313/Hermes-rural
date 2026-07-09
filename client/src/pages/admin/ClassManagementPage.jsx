import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getClasses, createClass, updateClass, deleteClass, getTeachers } from '../../services/api';
import { useModal } from '../../features/modal/ModalContext';
import useMathParticles from '../../hooks/useMathParticles';

const ClassManagementPage = () => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacher_id: '',
    school_year: '',
    status: 'active'
  });

  const particles = useMathParticles(20);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await getClasses();
      setClasses(response.data.classes);
      setError('');
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Error al cargar las clases');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.data.teachers);
    } catch (err) {
      console.error('Error fetching teachers:', err);
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
      if (editingClass) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          school_year: formData.school_year,
          status: formData.status
        };
        await updateClass(editingClass.id, updateData);
        showAlert('Clase actualizada exitosamente');
      } else {
        if (!formData.name || !formData.teacher_id) {
          showAlert('Nombre y docente son obligatorios', 'warning');
          return;
        }
        await createClass(formData);
        showAlert('Clase creada exitosamente');
      }
      resetForm();
      fetchClasses();
    } catch (err) {
      console.error('Error saving class:', err);
      showAlert(err.response?.data?.message || 'Error al guardar la clase', 'error');
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      teacher_id: classItem.teacher_id,
      school_year: classItem.school_year || '',
      status: classItem.status
    });
    setShowForm(true);
  };

  const handleDelete = (id, name) => {
    showConfirm(`¿Eliminar la clase "${name}"? Esta acción desactivará la clase.`, async () => {
      try {
        await deleteClass(id);
        showAlert('Clase desactivada exitosamente');
        fetchClasses();
      } catch (err) {
        console.error('Error deleting class:', err);
        showAlert(err.response?.data?.message || 'Error al eliminar la clase', 'error');
      }
    });
  };

  const handleHardDelete = (id, name) => {
    showConfirm(`¿ELIMINAR PERMANENTEMENTE la clase "${name}"? Esta acción no se puede deshacer.`, async () => {
      try {
        await deleteClass(id, true);
        showAlert('Clase eliminada permanentemente');
        fetchClasses();
      } catch (err) {
        console.error('Error hard deleting class:', err);
        showAlert(err.response?.data?.message || 'Error al eliminar la clase', 'error');
      }
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setFormData({
      name: '',
      description: '',
      teacher_id: '',
      school_year: '',
      status: 'active'
    });
  };

  return (
    <>
      <style>{`
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
        .glass-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        .glass-table thead th {
          padding: 14px 16px;
          text-align: left;
          color: #f5e6b8;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          background: rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-table tbody td {
          padding: 14px 16px;
          color: rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .glass-table tbody tr:last-child td { border-bottom: none; }
        .glass-table tbody tr:hover { background: rgba(255, 255, 255, 0.06); }
        .btn-primary {
          padding: 10px 20px;
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-primary:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.4);
        }
        .btn-success {
          padding: 10px 20px;
          background: linear-gradient(135deg, #00b894, #00cec9);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-success:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(0, 184, 148, 0.4);
        }
        .btn-warning {
          padding: 6px 12px;
          background: linear-gradient(135deg, #fdcb6e, #e17055);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-warning:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(225, 112, 85, 0.4);
        }
        .btn-danger {
          padding: 6px 12px;
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-danger:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
        }
        .btn-secondary {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-secondary:hover {
          transform: scale(1.02);
          background: rgba(255, 255, 255, 0.15);
        }
        .cancel-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cancel-btn:hover {
          transform: scale(1.02);
          background: rgba(255, 255, 255, 0.15);
        }
        .glass-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .glass-input:focus {
          border-color: rgba(108, 92, 231, 0.6);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
        }
        .glass-input::placeholder { color: rgba(255, 255, 255, 0.35); }
        .glass-select {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .glass-select:focus {
          border-color: rgba(108, 92, 231, 0.6);
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
        }
        .glass-label {
          display: block;
          margin-bottom: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 500;
        }
        .error-box {
          padding: 12px;
          background: rgba(231, 76, 60, 0.15);
          color: #ff6b6b;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid rgba(231, 76, 60, 0.3);
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
        }
        .loading-text { text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.7); }
        .back-link {
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }
        .back-link:hover { color: #f5e6b8; }
        .status-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        .status-badge.active {
          background: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
          border: 1px solid rgba(46, 204, 113, 0.3);
        }
        .status-badge.inactive {
          background: rgba(231, 76, 60, 0.2);
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.3);
        }
      `}</style>

      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
        overflow: 'hidden', zIndex: -1,
      }}>
        {particles.map((p) => (
          <span key={p.id} className="particle-bg" style={{
            left: `${p.left}%`, top: `${p.top}%`, fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          }}>{p.symbol}</span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', margin: 0 }}>
              Gestión de Clases
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>Administra las clases del sistema</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'cancel-btn' : 'btn-success'}>
            {showForm ? 'Cancelar' : '+ Nueva Clase'}
          </button>
        </div>

        {error && <div className="error-box">{error}</div>}

        {showForm && (
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 20px', color: '#f5e6b8', fontSize: '1.2rem', fontWeight: 400 }}>
              {editingClass ? 'Editar Clase' : 'Nueva Clase'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Nombre de la clase:</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="glass-input" placeholder="Ej: Matemáticas 5°" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Descripción:</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="glass-input" style={{ resize: 'vertical' }} placeholder="Descripción de la clase..." />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Docente:</label>
                <select name="teacher_id" value={formData.teacher_id} onChange={handleInputChange} required className="glass-select">
                  <option value="">Seleccione un docente</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.full_name} ({teacher.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="glass-label">Año escolar:</label>
                <input type="text" name="school_year" value={formData.school_year} onChange={handleInputChange} className="glass-input" placeholder="Ej: 2024, 2025, 2024-2025" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="glass-label">Estado:</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="glass-select">
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary">{editingClass ? 'Actualizar' : 'Crear'}</button>
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
                  <th>Docente</th>
                  <th>Año</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>No hay clases registradas</td></tr>
                ) : (
                  classes.map((classItem) => (
                    <tr key={classItem.id}>
                      <td style={{ color: 'rgba(255,255,255,0.5)' }}>{classItem.id}</td>
                      <td style={{ color: '#f5e6b8', fontWeight: 500 }}>{classItem.name}</td>
                      <td>{classItem.teacher_name}</td>
                      <td>{classItem.school_year || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${classItem.status === 'active' ? 'active' : 'inactive'}`}>
                          {classItem.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleEdit(classItem)} className="btn-warning">Editar</button>
                          <button onClick={() => handleDelete(classItem.id, classItem.name)} className="btn-danger">Desactivar</button>
                          <button onClick={() => handleHardDelete(classItem.id, classItem.name)} className="btn-secondary">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ClassManagementPage;