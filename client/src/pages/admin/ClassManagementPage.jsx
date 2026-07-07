import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { getClasses, createClass, updateClass, deleteClass, getTeachers } from '../../services/api';

const ClassManagementPage = () => {
  const { user } = useAuth();
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
        alert('Clase actualizada exitosamente');
      } else {
        if (!formData.name || !formData.teacher_id) {
          alert('Nombre y docente son obligatorios');
          return;
        }
        await createClass(formData);
        alert('Clase creada exitosamente');
      }
      resetForm();
      fetchClasses();
    } catch (err) {
      console.error('Error saving class:', err);
      alert(err.response?.data?.message || 'Error al guardar la clase');
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Eliminar la clase "${name}"? Esta acción desactivará la clase.`)) {
      try {
        await deleteClass(id);
        alert('Clase desactivada exitosamente');
        fetchClasses();
      } catch (err) {
        console.error('Error deleting class:', err);
        alert(err.response?.data?.message || 'Error al eliminar la clase');
      }
    }
  };

  const handleHardDelete = async (id, name) => {
    if (window.confirm(`¿ELIMINAR PERMANENTEMENTE la clase "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteClass(id, true);
        alert('Clase eliminada permanentemente');
        fetchClasses();
      } catch (err) {
        console.error('Error hard deleting class:', err);
        alert(err.response?.data?.message || 'Error al eliminar la clase');
      }
    }
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Clases</h1>
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
          {showForm ? 'Cancelar' : '+ Nueva Clase'}
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
          <h2>{editingClass ? 'Editar Clase' : 'Nueva Clase'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nombre de la clase:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Descripción:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Docente:</label>
              <select
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              >
                <option value="">Seleccione un docente</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Año escolar:</label>
              <input
                type="text"
                name="school_year"
                value={formData.school_year}
                onChange={handleInputChange}
                placeholder="Ej: 2024, 2025, 2024-2025"
                style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
              />
            </div>
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
                {editingClass ? 'Actualizar' : 'Crear'}
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
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando clases...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Nombre</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Docente</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Año</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classItem) => (
                <tr key={classItem.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{classItem.id}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{classItem.name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{classItem.teacher_name}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{classItem.school_year || 'N/A'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      backgroundColor: classItem.status === 'active' ? '#d4edda' : '#f8d7da',
                      color: classItem.status === 'active' ? '#155724' : '#721c24',
                      fontSize: '12px'
                    }}>
                      {classItem.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <button
                      onClick={() => handleEdit(classItem)}
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
                      onClick={() => handleDelete(classItem.id, classItem.name)}
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
                      onClick={() => handleHardDelete(classItem.id, classItem.name)}
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
    </div>
  );
};

export default ClassManagementPage;