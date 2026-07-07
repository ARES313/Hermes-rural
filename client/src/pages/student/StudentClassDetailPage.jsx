import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import StudentContentManager from '../../components/student/StudentContentManager';
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

const MATH_SYMBOLS = ['π', '∑', '√', '∞', '∫', 'α', 'Ω', 'λ', '+', 'fx'];

const generateParticles = (count = 20) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 14 + Math.random() * 24,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
    });
  }
  return particles;
};

const StudentClassDetailPage = () => {
  const { id: classId } = useParams();
  const { logout } = useAuth();
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

  const particles = useMemo(() => generateParticles(20), []);

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
      alert('Error al cargar el quiz');
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
    alert('Error al cargar el resultado');
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
      alert(`Por favor responde todas las preguntas (${answers.length}/${totalQuestions})`);
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
      alert(err.response?.data?.message || 'Error al enviar el quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitTask = async (taskId) => {
    const fileInput = document.getElementById(`task-file-${taskId}`);
    const file = fileInput?.files[0];
    
    if (!file) {
      alert('Selecciona un archivo para entregar');
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
      alert('✅ Tarea entregada exitosamente');
      await fetchClassData();
      setTaskNotes(prev => ({ ...prev, [taskId]: '' }));
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error submitting task:', err);
      alert(err.response?.data?.message || '❌ Error al entregar la tarea');
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
        color: '#f5e6b8',
        fontSize: '1.5rem'
      }}>
        Cargando clase...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          90% {
            opacity: 0.2;
          }
          100% {
            transform: translateY(-120px) translateX(40px);
            opacity: 0;
          }
        }

        .particle-bg {
          position: absolute;
          pointer-events: none;
          user-select: none;
          font-weight: bold;
          color: rgba(255, 215, 0, 0.15);
          filter: blur(1.5px);
          animation: floatParticle linear infinite;
        }

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

        .btn-logout {
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

        .btn-logout:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4);
        }

        .btn-ai {
          padding: 10px 20px;
          background: linear-gradient(135deg, #6c5ce7, #0984e3, #fdcb6e);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .btn-ai:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(108, 92, 231, 0.5);
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(108, 92, 231, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(108, 92, 231, 0.6);
          }
        }

        .tab-btn {
          padding: 10px 20px;
          margin-right: 10px;
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: none;
          cursor: pointer;
          border-radius: 5px 5px 0 0;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255,255,255,0.1);
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
            <Link to="/student/classes" style={{ color: '#6c5ce7', textDecoration: 'none', fontSize: '14px' }}>
              ← Volver a Mis Clases
            </Link>
            <h1 style={{ margin: '5px 0 0', color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px' }}>
              {classInfo?.name || 'Clase'}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
              <div className="glass-card">
                <h2 style={{ color: '#f5e6b8', marginTop: 0 }}>{selectedQuiz.title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedQuiz.description}</p>
                {quizResult && (
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(40,167,69,0.2)', borderRadius: '8px', color: '#f5e6b8' }}>
                    <h3>Resultado: {Math.round(quizResult.score * 100) / 100}%</h3>
                    <p>Correctas: {quizResult.correct_answers} de {quizResult.total_questions}</p>
                  </div>
                )}
                {!quizResult && selectedQuiz.questions?.map((q, idx) => (
                  <div key={q.id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>
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
                    className="btn-ai"
                    style={{ animation: 'none', marginRight: '10px' }}
                  >
                    {submittingQuiz ? 'Enviando...' : 'Enviar Quiz'}
                  </button>
                )}
                <button
                  onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}
                  className="btn-logout"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#f5e6b8' }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                {showResultForQuiz && (
                  <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: '#1a0a2e',
                    padding: '30px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    minWidth: '300px',
                    color: '#f5e6b8',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}>
                    <h3>Resultado del Quiz</h3>
                    <p><strong>Puntaje:</strong> {showResultForQuiz.score}%</p>
                    <p><strong>Respuestas correctas:</strong> {showResultForQuiz.correct_answers} de {showResultForQuiz.total_questions}</p>
                    <button
                      onClick={closeResultModal}
                      className="btn-ai"
                      style={{ marginTop: '15px', animation: 'none' }}
                    >
                      Cerrar
                    </button>
                  </div>
                )}
                {quizzes.length === 0 ? (
                  <div className="empty-state">
                    No hay quizzes disponibles
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className="glass-card" style={{ marginBottom: '15px' }}>
                      <h3 style={{ color: '#f5e6b8', margin: '0 0 10px 0' }}>{quiz.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.7)' }}>{quiz.description}</p>
                      {quiz.has_submitted > 0 ? (
                        <button
                          onClick={() => handleViewQuizResult(quiz.id)}
                          className="btn-ai"
                          style={{ animation: 'none', padding: '8px 16px', fontSize: '14px' }}
                        >
                          Ver resultado
                        </button>
                      ) : (
                        <button onClick={() => handleStartQuiz(quiz.id)} className="btn-ai" style={{ animation: 'none', padding: '8px 16px', fontSize: '14px' }}>
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
                <div key={task.id} className="glass-card" style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#f5e6b8', margin: '0 0 10px 0' }}>{task.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>{task.description}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}><strong>Fecha límite:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                  {submission ? (
                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'rgba(40,167,69,0.2)', borderRadius: '8px', color: '#f5e6b8' }}>
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
                        style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', minHeight: '80px', background: 'rgba(255,255,255,0.06)', color: '#f5e6b8' }}
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
                        className="btn-ai"
                        style={{ animation: 'none', padding: '8px 16px', fontSize: '14px' }}
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
