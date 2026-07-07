import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/api';
import api from '../../services/api';

const StudentManagementPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getStudents();
      setStudents(response.data.students);
      setError('');
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Error al cargar los estudiantes');
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
      if (editingStudent) {
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          status: formData.status
        };
        await updateStudent(editingStudent.id, updateData);
        alert('Estudiante actualizado exitosamente');
      } else {
        if (!formData.password || formData.password.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        await createStudent(formData);
        alert('Estudiante creado exitosamente');
      }
      resetForm();
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      alert(err.response?.data?.message || 'Error al guardar el estudiante');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      email: student.email,
      password: '',
      status: student.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id, fullName) => {
    if (window.confirm(`¿Desactivar al estudiante "${fullName}"?`)) {
      try {
        await deleteStudent(id);
        alert('Estudiante desactivado exitosamente');
        fetchStudents();
      } catch (err) {
        console.error('Error deleting student:', err);
        alert(err.response?.data?.message || 'Error al desactivar el estudiante');
      }
    }
  };

  const handleHardDelete = async (id, fullName) => {
    if (window.confirm(`¿ELIMINAR PERMANENTEMENTE al estudiante "${fullName}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteStudent(id, true);
        alert('Estudiante eliminado permanentemente');
        fetchStudents();
      } catch (err) {
        console.error('Error hard deleting student:', err);
        alert(err.response?.data?.message || 'Error al eliminar el estudiante');
      }
    }
  };

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
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
      await api.put(`/students/${selectedStudent.id}/password`, { newPassword });
      alert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setPasswordError('');
    } catch (err) {
      console.error('Error changing password:', err);
      alert(err.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      status: 'active'
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Estudiantes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Estudiante'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h2>{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nombre completo:</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            {!editingStudent && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña (mínimo 6 caracteres):</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Estado:</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {editingStudent ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando estudiantes...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.full_name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.email}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      backgroundColor: student.status === 'active' ? '#d4edda' : '#f8d7da',
                      color: student.status === 'active' ? '#155724' : '#721c24',
                      fontSize: '12px'
                    }}>
                      {student.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <button
                      onClick={() => handleEdit(student)}
                      style={{
                        marginRight: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openPasswordModal(student)}
                      style={{
                        marginRight: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Cambiar Pass
                    </button>
                    <button
                      onClick={() => handleDelete(student.id, student.full_name)}
                      style={{
                        marginRight: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Desactivar
                    </button>
                    <button
                      onClick={() => handleHardDelete(student.id, student.full_name)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2>Cambiar Contraseña</h2>
            <p><strong>Estudiante:</strong> {selectedStudent.full_name}</p>
            <p><strong>Email:</strong> {selectedStudent.email}</p>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nueva Contraseña:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Mínimo 6 caracteres"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              />
              {passwordError && (
                <p style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>{passwordError}</p>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleChangePassword}
                disabled={updatingPassword}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: updatingPassword ? 'not-allowed' : 'pointer',
                  opacity: updatingPassword ? 0.6 : 1
                }}
              >
                {updatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedStudent(null);
                  setNewPassword('');
                  setPasswordError('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementPage;