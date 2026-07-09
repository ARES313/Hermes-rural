import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClasses, getTeachers, updateClass } from '../../services/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import useMathParticles from '../../hooks/useMathParticles';

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

  const particles = useMathParticles(20);

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
    <>
      <style>{`
        .glass-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 8px 32px rgba(0,0,0,0.3); padding: 20px; transition: transform 0.2s, box-shadow 0.2s; }
        .glass-input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: rgba(255,255,255,0.9); font-size: 14px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .glass-input:focus { border-color: rgba(108,92,231,0.6); box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
        .glass-select { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: rgba(255,255,255,0.9); font-size: 14px; outline: none; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .glass-select:focus { border-color: rgba(108,92,231,0.6); box-shadow: 0 0 0 3px rgba(108,92,231,0.15); }
        .glass-label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500; }
        .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #6c5ce7, #0984e3); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(108,92,231,0.4); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
        .error-box { padding: 12px; background: rgba(231,76,60,0.15); color: #ff6b6b; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(231,76,60,0.3); }
        .success-box { padding: 12px; background: rgba(46,204,113,0.15); color: #2ecc71; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(46,204,113,0.3); }
        .loading-text { text-align: center; padding: 40px; color: rgba(255,255,255,0.7); }
        .back-link { text-decoration: none; color: rgba(255,255,255,0.7); transition: color 0.2s; }
        .back-link:hover { color: #f5e6b8; }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)', overflow: 'hidden', zIndex: -1 }}>
        {particles.map((p) => (
          <span key={p.id} className="particle-bg" style={{ left: `${p.left}%`, top: `${p.top}%`, fontSize: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}>{p.symbol}</span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">← Volver al Dashboard</Link>
        </div>

        <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', marginBottom: '8px' }}>
          Asignar Docente a Clase
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '25px' }}>
          Cada clase puede tener un solo docente. Seleccione una clase y asígnele un docente.
        </p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {loading ? (
          <SkeletonLoader variant="card" count={2} />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="glass-card" style={{ marginBottom: '25px' }}>
              <label className="glass-label">Seleccionar Clase:</label>
              <select value={selectedClass} onChange={handleClassChange} required className="glass-select">
                <option value="">-- Seleccione una clase --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name} ({cls.school_year || 'Sin año'})</option>
                ))}
              </select>
            </div>

            {selectedClass && (
              <div className="glass-card" style={{ marginBottom: '25px' }}>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                  <strong style={{ color: '#f5e6b8' }}>Docente actual:</strong> {currentTeacher ? getTeacherName(currentTeacher) : 'No asignado'}
                </p>
              </div>
            )}

            <div className="glass-card" style={{ marginBottom: '25px' }}>
              <label className="glass-label">Asignar Docente:</label>
              <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required className="glass-select">
                <option value="">-- Seleccione un docente --</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.full_name} ({teacher.email})</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={updating || !selectedClass || !selectedTeacher} className="btn-primary" style={{ width: '100%' }}>
              {updating ? 'Asignando...' : 'Asignar Docente a la Clase'}
            </button>
          </form>
        )}

        {selectedClass && selectedTeacher && !updating && (
          <div className="glass-card" style={{ marginTop: '30px' }}>
            <h3 style={{ margin: '0 0 12px', color: '#f5e6b8', fontSize: '1rem', fontWeight: 400 }}>Resumen de la asignación</h3>
            <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.8)' }}><strong style={{ color: '#f5e6b8' }}>Clase:</strong> {getClassName(selectedClass)}</p>
            <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.8)' }}><strong style={{ color: '#f5e6b8' }}>Docente asignado:</strong> {getTeacherName(parseInt(selectedTeacher))}</p>
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#fdcb6e' }}>
              ⚠️ Esta acción reemplazará al docente actual si existe
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignTeacherToClassPage;