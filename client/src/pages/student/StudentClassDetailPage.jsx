import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import StudentContentManager from '../../components/student/StudentContentManager';
import SkeletonLoader from '../../components/SkeletonLoader';
import {
  getStudentClassContent,
  getStudentQuizzes,
  getStudentQuizById,
  getStudentQuizResult,
  submitStudentQuiz,
  getStudentTasks,
  getStudentSubmission,
  submitStudentTask
} from '../../services/api';
import useMathParticles from '../../hooks/useMathParticles';
import { useModal } from '../../features/modal/ModalContext';

const StudentClassDetailPage = () => {
  const { id: classId } = useParams();
  const { logout } = useAuth();
  const { showAlert } = useModal();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recursos');
  const [classInfo, setClassInfo] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submittingTask, setSubmittingTask] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [showResultForQuiz, setShowResultForQuiz] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState({});

  const particles = useMathParticles(20);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const [contentRes, quizzesRes, tasksRes] = await Promise.all([
        getStudentClassContent(classId),
        getStudentQuizzes(classId),
        getStudentTasks(classId)
      ]);
      
      if (contentRes.data.content && contentRes.data.content.length > 0 && contentRes.data.content[0].class_name) {
        setClassInfo({ name: contentRes.data.content[0].class_name, id: classId });
      } else {
        setClassInfo({ name: 'Clase', id: classId });
      }
      
      setQuizzes(quizzesRes.data.quizzes || []);
      setTasks(tasksRes.data.tasks || []);
      
      // Cargar detalles de entrega para tareas ya entregadas
      for (const task of (tasksRes.data.tasks || [])) {
        if (task.has_submitted) {
          try {
            const submissionRes = await getStudentSubmission(task.id);
            setSubmissionDetails(prev => ({ ...prev, [task.id]: submissionRes.data.submission }));
          } catch (err) {
            console.error('Error fetching submission:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching class data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const response = await getStudentQuizById(quizId);
      setSelectedQuiz(response.data.quiz);
      setQuizAnswers({});
      setQuizResult(null);
      setShowResultForQuiz(null);
    } catch (err) {
      console.error('Error loading quiz:', err);
      showAlert('Error al cargar el quiz', 'error');
    }
  };

  const handleViewQuizResult = async (quizId) => {
  try {
    const response = await getStudentQuizResult(quizId);
    console.log('Resultado raw:', response.data);
    setShowResultForQuiz({
      id: quizId,
      score: response.data.score ?? 0,
      total_questions: response.data.total_questions ?? 0,
      correct_answers: response.data.correct_answers ?? 0,
      submitted_at: response.data.submitted_at
    });
  } catch (err) {
    console.error('Error loading quiz result:', err);
    showAlert('Error al cargar el resultado', 'error');
  }
};

  const handleQuizAnswerChange = (questionId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = async () => {
    const answers = Object.entries(quizAnswers).map(([questionId, selected_answer]) => ({
      question_id: parseInt(questionId),
      selected_answer
    }));
    
    const totalQuestions = selectedQuiz.questions?.length || 0;
    if (answers.length !== totalQuestions) {
      showAlert(`Por favor responde todas las preguntas (${answers.length}/${totalQuestions})`, 'warning');
      return;
    }
    
    setSubmittingQuiz(true);
    try {
      const response = await submitStudentQuiz(selectedQuiz.id, answers);
      setQuizResult(response.data);
      await fetchClassData();
      setSelectedQuiz(null);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      showAlert(err.response?.data?.message || 'Error al enviar el quiz', 'error');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitTask = async (taskId) => {
    const fileInput = document.getElementById(`task-file-${taskId}`);
    const file = fileInput?.files[0];
    
    if (!file) {
      showAlert('Selecciona un archivo para entregar', 'warning');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    if (taskNotes[taskId]) {
      formData.append('notes', taskNotes[taskId]);
    }
    
    setSubmittingTask(prev => ({ ...prev, [taskId]: true }));
    try {
      await submitStudentTask(taskId, formData);
      showAlert('Tarea entregada exitosamente');
      await fetchClassData();
      setTaskNotes(prev => ({ ...prev, [taskId]: '' }));
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error submitting task:', err);
      showAlert(err.response?.data?.message || 'Error al entregar la tarea', 'error');
    } finally {
      setSubmittingTask(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const viewUrl = (fileId) => {
      return `${API_BASE_URL}/student/classes/${classId}/content/${fileId}/view`;
  };

  const downloadUrl = (fileId) => {
      return `${API_BASE_URL}/student/classes/${classId}/content/${fileId}/download`;
  };

  const closeResultModal = () => {
    setShowResultForQuiz(null);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ maxWidth: '600px', width: '90%' }}>
          <SkeletonLoader variant="page" />
        </div>
      </div>
    );
  }

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

        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

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
          background: linear-gradient(135deg, #27ae60, #2ecc71);
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
          box-shadow: 0 4px 16px rgba(46, 204, 113, 0.4);
        }

        .btn-danger {
          padding: 10px 20px;
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-danger:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4);
        }

        .btn-warning {
          padding: 10px 20px;
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          color: #212529;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-warning:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(241, 196, 15, 0.4);
        }

        .btn-info {
          padding: 10px 20px;
          background: linear-gradient(135deg, #17a2b8, #20c997);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-info:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(23, 162, 184, 0.4);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #f5e6b8;
        }

        .tab-btn {
          padding: 10px 20px;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: none;
          cursor: pointer;
          border-radius: 8px 8px 0 0;
          transition: background 0.2s, color 0.2s;
          font-size: 14px;
          font-weight: 500;
        }

        .tab-btn.active {
          background: rgba(255, 255, 255, 0.12);
          color: #f5e6b8;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.06);
          color: #f5e6b8;
        }

        .back-link {
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s;
        }

        .back-link:hover {
          color: #f5e6b8;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-text {
          text-align: center;
          padding: 40px;
          color: rgba(255, 255, 255, 0.7);
        }

        .quiz-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .quiz-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .quiz-card h4 {
          margin: 0 0 5px 0;
          color: #f5e6b8;
        }

        .quiz-card p {
          margin: 5px 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .task-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 15px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .task-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }

        .task-card h4 {
          margin: 0 0 5px 0;
          color: #f5e6b8;
        }

        .task-card p {
          margin: 5px 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: rgba(30, 30, 47, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          padding: 25px;
          max-width: 500px;
          width: 90%;
        }

        .modal-content h3 {
          color: #f5e6b8;
          margin-top: 0;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          padding: 20px;
          margin-bottom: 30px;
        }

        .form-card h3 {
          color: #f5e6b8;
          margin-top: 0;
        }

        .form-card input,
        .form-card textarea,
        .form-card select {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          padding: 8px 12px;
          width: 100%;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-card input:focus,
        .form-card textarea:focus,
        .form-card select:focus {
          border-color: #f0c040;
        }

        .form-card label {
          display: block;
          margin-bottom: 5px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }

        .submission-card {
          margin-top: 15px;
          padding: 15px;
          background: rgba(40,167,69,0.2);
          border-radius: 8px;
          color: #f5e6b8;
          border: 1px solid rgba(40,167,69,0.3);
        }
      `}</style>

      {/* Fondo galaxia matemática */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0d0221 0%, #1a0a2e 30%, #16213e 60%, #0f3460 100%)',
          overflow: 'hidden',
          zIndex: -1,
        }}
      >
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle-bg"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          >
            {p.symbol}
          </span>
        ))}
      </div>

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Encabezado */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div>
            <Link to="/student/classes" className="back-link">
              ← Volver a Mis Clases
            </Link>
            <h1 style={{ margin: '5px 0 0', color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px' }}>
              {classInfo?.name || 'Clase'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-danger"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(119, 116, 116, 0.74)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('recursos')}
            className={`tab-btn ${activeTab === 'recursos' ? 'active' : ''}`}
          >
            📁 Recursos
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          >
            ✏️ Quizzes
          </button>
          <button
            onClick={() => setActiveTab('tareas')}
            className={`tab-btn ${activeTab === 'tareas' ? 'active' : ''}`}
          >
            📝 Tareas
          </button>
        </div>

        {activeTab === 'recursos' && (
          <StudentContentManager
            classId={classId}
            viewUrl={viewUrl}
            downloadUrl={downloadUrl}
          />
        )}

        {activeTab === 'quizzes' && (
          <div>
            {selectedQuiz ? (
              <div className="form-card">
                <h3>{selectedQuiz.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedQuiz.description}</p>
                {quizResult && (
                  <div className="submission-card">
                    <h3 style={{ margin: 0 }}>Resultado: {Math.round(quizResult.score * 100) / 100}%</h3>
                    <p>Correctas: {quizResult.correct_answers} de {quizResult.total_questions}</p>
                  </div>
                )}
                {!quizResult && selectedQuiz.questions?.map((q, idx) => (
                  <div key={q.id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ color: '#f5e6b8' }}><strong>{idx + 1}. {q.question_text}</strong></p>
                    {['option_a', 'option_b', 'option_c', 'option_d'].filter(opt => q[opt]).map((opt) => (
                      <label key={opt} style={{ display: 'block', margin: '10px 0', color: 'rgba(255,255,255,0.8)' }}>
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={opt.replace('option_', '')}
                          onChange={() => handleQuizAnswerChange(q.id, opt.replace('option_', ''))}
                          style={{ marginRight: '10px' }}
                        />
                        {q[opt]}
                      </label>
                    ))}
                  </div>
                ))}
                {!quizResult && (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="btn-primary"
                    style={{ marginRight: '10px' }}
                  >
                    {submittingQuiz ? 'Enviando...' : 'Enviar Quiz'}
                  </button>
                )}
                <button
                  onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                {showResultForQuiz && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <h3>Resultado del Quiz</h3>
                      <p style={{ color: 'rgba(255,255,255,0.8)' }}><strong>Puntaje:</strong> {showResultForQuiz.score}%</p>
                      <p style={{ color: 'rgba(255,255,255,0.8)' }}><strong>Respuestas correctas:</strong> {showResultForQuiz.correct_answers} de {showResultForQuiz.total_questions}</p>
                      <button
                        onClick={closeResultModal}
                        className="btn-primary"
                        style={{ marginTop: '15px' }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
                {quizzes.length === 0 ? (
                  <div className="empty-state">
                    No hay quizzes disponibles
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className="quiz-card" style={{ marginBottom: '15px' }}>
                      <h4>{quiz.title}</h4>
                      <p style={{ fontSize: '14px' }}>{quiz.description}</p>
                      {quiz.has_submitted > 0 ? (
                        <button
                          onClick={() => handleViewQuizResult(quiz.id)}
                          className="btn-info"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Ver resultado
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Responder Quiz
                        </button>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'tareas' && (
          tasks.length === 0 ? (
            <div className="empty-state">
              No hay tareas disponibles
            </div>
          ) : (
            tasks.map((task) => {
              const submission = submissionDetails[task.id];
              return (
                <div key={task.id} className="task-card" style={{ marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <h4>{task.title}</h4>
                    <p style={{ fontSize: '14px' }}>{task.description}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      <strong>Fecha límite:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </p>
                  </div>
                  {submission ? (
                    <div className="submission-card">
                      <p><strong>✅ Entregada el:</strong> {new Date(submission.submitted_at).toLocaleString('es-ES')}</p>
                      <p><strong>Archivo:</strong> {submission.original_name}</p>
                      {submission.grade !== null && <p><strong>Calificación:</strong> {submission.grade}</p>}
                      {submission.feedback && <p><strong>Feedback:</strong> {submission.feedback}</p>}
                    </div>
                  ) : (
                    <div style={{ marginTop: '15px' }}>
                      <textarea
                        placeholder="Notas (opcional)"
                        value={taskNotes[task.id] || ''}
                        onChange={(e) => setTaskNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', minHeight: '80px', background: 'rgba(255,255,255,0.06)', color: '#f5e6b8', boxSizing: 'border-box' }}
                      />
                      <input
                        type="file"
                        id={`task-file-${task.id}`}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        style={{ marginBottom: '10px', color: '#f5e6b8' }}
                      />
                      <button
                        onClick={() => handleSubmitTask(task.id)}
                        disabled={submittingTask[task.id]}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        {submittingTask[task.id] ? 'Subiendo...' : 'Subir Entrega'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </>
  );
};

export default StudentClassDetailPage;
