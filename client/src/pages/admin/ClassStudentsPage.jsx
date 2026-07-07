import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { getClasses, getStudents, getStudentsByClass, assignStudentToClass, removeStudentFromClass } from '../../services/api';

const ClassStudentsPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchAllStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      setClasses(response.data.classes);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Error al cargar las clases');
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchClassStudents = async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      const response = await getStudentsByClass(classId);
      setClassStudents(response.data.students);
      setError('');
    } catch (err) {
      console.error('Error fetching class students:', err);
      setError('Error al cargar los estudiantes de la clase');
      setClassStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    if (classId) {
      fetchClassStudents(classId);
    } else {
      setClassStudents([]);
    }
  };

  const handleAssignStudent = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent) {
      alert('Seleccione una clase y un estudiante');
      return;
    }
    try {
      await assignStudentToClass(selectedClass, selectedStudent);
      alert('Estudiante asignado exitosamente');
      setShowAssignForm(false);
      setSelectedStudent('');
      fetchClassStudents(selectedClass);
      fetchAllStudents();
    } catch (err) {
      console.error('Error assigning student:', err);
      alert(err.response?.data?.message || 'Error al asignar el estudiante');
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (window.confirm(`¿Quitar al estudiante "${studentName}" de esta clase?`)) {
      try {
        await removeStudentFromClass(selectedClass, studentId);
        alert('Estudiante removido de la clase');
        fetchClassStudents(selectedClass);
        fetchAllStudents();
      } catch (err) {
        console.error('Error removing student:', err);
        alert(err.response?.data?.message || 'Error al quitar el estudiante');
      }
    }
  };

  const getAvailableStudents = () => {
    const enrolledIds = classStudents.map(s => s.id);
    return students.filter(s => !enrolledIds.includes(s.id) && s.status === 'active');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Gestión de Estudiantes por Clase</h1>

      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Seleccionar Clase:</label>
        <select
          value={selectedClass}
          onChange={handleClassChange}
          style={{ width: '100%', padding: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
        >
          <option value="">-- Seleccione una clase --</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} - {cls.teacher_name}</option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Estudiantes matriculados</h2>
            <button
              onClick={() => setShowAssignForm(!showAssignForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showAssignForm ? 'Cancelar' : '+ Asignar Estudiante'}
            </button>
          </div>

          {showAssignForm && (
            <div style={{
              marginBottom: '20px',
              padding: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '8px'
            }}>
              <h3>Asignar Estudiante a esta Clase</h3>
              <form onSubmit={handleAssignStudent}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Estudiante:</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="">-- Seleccione un estudiante --</option>
                    {getAvailableStudents().map(s => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                    ))}
                  </select>
                </div>
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
                  Asignar
                </button>
              </form>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '5px', marginBottom: '20px' }}>
              {error}
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
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Estado Matrícula</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                        No hay estudiantes matriculados en esta clase
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((student) => (
                      <tr key={student.id}>
                        <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.id}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.full_name}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{student.email}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '3px',
                            backgroundColor: student.enrollment_status === 'active' ? '#d4edda' : '#f8d7da',
                            color: student.enrollment_status === 'active' ? '#155724' : '#721c24',
                            fontSize: '12px'
                          }}>
                            {student.enrollment_status === 'active' ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                          <button
                            onClick={() => handleRemoveStudent(student.id, student.full_name)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            Quitar de Clase
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassStudentsPage;