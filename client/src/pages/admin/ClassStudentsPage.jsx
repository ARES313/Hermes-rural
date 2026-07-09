import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getClasses, getStudents, getStudentsByClass, assignStudentToClass, removeStudentFromClass } from '../../services/api';
import { useModal } from '../../features/modal/ModalContext';
import useMathParticles from '../../hooks/useMathParticles';

const ClassStudentsPage = () => {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');

  const particles = useMathParticles(20);

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
      showAlert('Seleccione una clase y un estudiante', 'warning');
      return;
    }
    try {
      await assignStudentToClass(selectedClass, selectedStudent);
      showAlert('Estudiante asignado exitosamente');
      setShowAssignForm(false);
      setSelectedStudent('');
      fetchClassStudents(selectedClass);
      fetchAllStudents();
    } catch (err) {
      console.error('Error assigning student:', err);
      showAlert(err.response?.data?.message || 'Error al asignar el estudiante', 'error');
    }
  };

  const handleRemoveStudent = (studentId, studentName) => {
    showConfirm(`¿Quitar al estudiante "${studentName}" de esta clase?`, async () => {
      try {
        await removeStudentFromClass(selectedClass, studentId);
        showAlert('Estudiante removido de la clase');
        fetchClassStudents(selectedClass);
        fetchAllStudents();
      } catch (err) {
        console.error('Error removing student:', err);
        showAlert(err.response?.data?.message || 'Error al quitar el estudiante', 'error');
      }
    });
  };

  const getAvailableStudents = () => {
    const enrolledIds = classStudents.map(s => s.id);
    return students.filter(s => !enrolledIds.includes(s.id) && s.status === 'active');
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
        .btn-success { padding: 10px 20px; background: linear-gradient(135deg, #00b894, #00cec9); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-success:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(0,184,148,0.4); }
        .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #6c5ce7, #0984e3); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(108,92,231,0.4); }
        .btn-danger { padding: 6px 12px; background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-danger:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(231,76,60,0.4); }
        .cancel-btn { padding: 10px 20px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .cancel-btn:hover { transform: scale(1.02); background: rgba(255,255,255,0.15); }
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

        <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', marginBottom: '8px' }}>
          Gestión de Estudiantes por Clase
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '25px' }}>
          Asigna y remueve estudiantes de las clases
        </p>

        <div className="glass-card" style={{ marginBottom: '30px' }}>
          <label className="glass-label" style={{ fontSize: '14px', marginBottom: '10px' }}>Seleccionar Clase:</label>
          <select value={selectedClass} onChange={handleClassChange} className="glass-select">
            <option value="">-- Seleccione una clase --</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.teacher_name}</option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#f5e6b8', fontSize: '1.2rem', fontWeight: 400, margin: 0 }}>Estudiantes matriculados</h2>
              <button onClick={() => setShowAssignForm(!showAssignForm)} className={showAssignForm ? 'cancel-btn' : 'btn-success'}>
                {showAssignForm ? 'Cancelar' : '+ Asignar Estudiante'}
              </button>
            </div>

            {showAssignForm && (
              <div className="glass-card" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px', color: '#f5e6b8', fontSize: '1rem', fontWeight: 400 }}>Asignar Estudiante a esta Clase</h3>
                <form onSubmit={handleAssignStudent}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="glass-label">Estudiante:</label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required className="glass-select">
                      <option value="">-- Seleccione un estudiante --</option>
                      {getAvailableStudents().map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Asignar</button>
                </form>
              </div>
            )}

            {error && <div className="error-box">{error}</div>}

            {loading ? (
              <SkeletonLoader variant="table" count={4} />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Estado Matrícula</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>No hay estudiantes matriculados en esta clase</td></tr>
                    ) : (
                      classStudents.map((student) => (
                        <tr key={student.id}>
                          <td style={{ color: 'rgba(255,255,255,0.5)' }}>{student.id}</td>
                          <td style={{ color: '#f5e6b8', fontWeight: 500 }}>{student.full_name}</td>
                          <td>{student.email}</td>
                          <td>
                            <span className={`status-badge ${student.enrollment_status === 'active' ? 'active' : 'inactive'}`}>
                              {student.enrollment_status === 'active' ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td>
                            <button onClick={() => handleRemoveStudent(student.id, student.full_name)} className="btn-danger">
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
    </>
  );
};

export default ClassStudentsPage;