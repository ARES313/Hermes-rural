import React, { useState, useEffect } from 'react';
import { getClasses, getTeachers, updateClass } from '../../services/api';

const AssignTeacherToClassPage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        getClasses(),
        getTeachers()
      ]);
      setClasses(classesRes.data.classes);
      setTeachers(teachersRes.data.teachers);
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = async (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSelectedTeacher('');
    setSuccess('');
    setError('');
    
    if (classId) {
      const foundClass = classes.find(c => c.id === parseInt(classId));
      if (foundClass && foundClass.teacher_id) {
        setCurrentTeacher(foundClass.teacher_id);
        setSelectedTeacher(foundClass.teacher_id.toString());
      } else {
        setCurrentTeacher(null);
      }
    } else {
      setCurrentTeacher(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedTeacher) {
      setError('Debe seleccionar una clase y un docente');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const classToUpdate = classes.find(c => c.id === parseInt(selectedClass));
      const updateData = {
        name: classToUpdate.name,
        description: classToUpdate.description,
        school_year: classToUpdate.school_year,
        status: classToUpdate.status,
        teacher_id: parseInt(selectedTeacher)
      };
      
      await updateClass(selectedClass, updateData);
      setSuccess('Docente asignado correctamente a la clase');
      
      // Actualizar la lista de clases
      await fetchData();
      
      // Actualizar la información actual
      const updatedClass = classes.find(c => c.id === parseInt(selectedClass));
      if (updatedClass) {
        setCurrentTeacher(parseInt(selectedTeacher));
      }
    } catch (err) {
      console.error('Error assigning teacher:', err);
      setError(err.response?.data?.message || 'Error al asignar el docente');
    } finally {
      setUpdating(false);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.full_name : 'No asignado';
  };

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === parseInt(classId));
    return classItem ? classItem.name : '';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Asignar Docente a Clase</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Cada clase puede tener un solo docente. Seleccione una clase y asígnele un docente.
      </p>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '5px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando datos...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Seleccionar Clase:</label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="">-- Seleccione una clase --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.school_year || 'Sin año'})
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div style={{ 
              marginBottom: '25px', 
              padding: '15px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              <p><strong>Docente actual:</strong> {currentTeacher ? getTeacherName(currentTeacher) : 'No asignado'}</p>
            </div>
          )}

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Asignar Docente:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="">-- Seleccione un docente --</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={updating || !selectedClass || !selectedTeacher}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (updating || !selectedClass || !selectedTeacher) ? 'not-allowed' : 'pointer',
              opacity: (updating || !selectedClass || !selectedTeacher) ? 0.6 : 1,
              fontSize: '16px'
            }}
          >
            {updating ? 'Asignando...' : 'Asignar Docente a la Clase'}
          </button>
        </form>
      )}

      {selectedClass && selectedTeacher && !updating && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#d1ecf1',
          borderRadius: '8px',
          border: '1px solid #bee5eb'
        }}>
          <h3 style={{ marginTop: 0, color: '#0c5460' }}>Resumen de la asignación</h3>
          <p><strong>Clase:</strong> {getClassName(selectedClass)}</p>
          <p><strong>Docente asignado:</strong> {getTeacherName(parseInt(selectedTeacher))}</p>
          <p style={{ marginBottom: 0, fontSize: '14px', color: '#0c5460' }}>
            ⚠️ Esta acción reemplazará al docente actual si existe
          </p>
        </div>
      )}
    </div>
  );
};

export default AssignTeacherToClassPage;