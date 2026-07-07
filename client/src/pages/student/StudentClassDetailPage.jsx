import React, { useState, useEffect } from 'react';
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
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando clase...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <Link to="/student/classes" style={{ color: '#007bff', textDecoration: 'none' }}>
            ← Volver a Mis Clases
          </Link>
          <h1 style={{ marginTop: '10px' }}>{classInfo?.name || 'Clase'}</h1>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <button onClick={() => setActiveTab('recursos')} style={{
          padding: '10px 20px',
          marginRight: '10px',
          backgroundColor: activeTab === 'recursos' ? '#007bff' : 'transparent',
          color: activeTab === 'recursos' ? 'white' : '#333',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px 5px 0 0'
        }}>
          📁 Recursos
        </button>
        <button onClick={() => setActiveTab('quizzes')} style={{
          padding: '10px 20px',
          marginRight: '10px',
          backgroundColor: activeTab === 'quizzes' ? '#007bff' : 'transparent',
          color: activeTab === 'quizzes' ? 'white' : '#333',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px 5px 0 0'
        }}>
          ✏️ Quizzes
        </button>
        <button onClick={() => setActiveTab('tareas')} style={{
          padding: '10px 20px',
          backgroundColor: activeTab === 'tareas' ? '#007bff' : 'transparent',
          color: activeTab === 'tareas' ? 'white' : '#333',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px 5px 0 0'
        }}>
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
            <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
              <h2>{selectedQuiz.title}</h2>
              <p>{selectedQuiz.description}</p>
              {quizResult && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
                  <h3>Resultado: {Math.round(quizResult.score * 100) / 100}%</h3>
                  <p>Correctas: {quizResult.correct_answers} de {quizResult.total_questions}</p>
                </div>
              )}
              {!quizResult && selectedQuiz.questions?.map((q, idx) => (
                <div key={q.id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
                  <p><strong>{idx + 1}. {q.question_text}</strong></p>
                  {['option_a', 'option_b', 'option_c', 'option_d'].filter(opt => q[opt]).map((opt) => (
                    <label key={opt} style={{ display: 'block', margin: '10px 0' }}>
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
                  style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  {submittingQuiz ? 'Enviando...' : 'Enviar Quiz'}
                </button>
              )}
              <button
                onClick={() => { setSelectedQuiz(null); setQuizResult(null); }}
                style={{ marginLeft: '10px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  minWidth: '300px'
                }}>
                  <h3>Resultado del Quiz</h3>
                  <p><strong>Puntaje:</strong> {showResultForQuiz.score}%</p>
                  <p><strong>Respuestas correctas:</strong> {showResultForQuiz.correct_answers} de {showResultForQuiz.total_questions}</p>
                  <button
                    onClick={closeResultModal}
                    style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Cerrar
                  </button>
                </div>
              )}
              {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  No hay quizzes disponibles
                </div>
              ) : (
                quizzes.map((quiz) => (
                  <div key={quiz.id} style={{ marginBottom: '15px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: 'white' }}>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description}</p>
                    {quiz.has_submitted > 0 ? (
                      <button
                        onClick={() => handleViewQuizResult(quiz.id)}
                        style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                      >
                        Ver resultado
                      </button>
                    ) : (
                      <button onClick={() => handleStartQuiz(quiz.id)} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            No hay tareas disponibles
          </div>
        ) : (
          tasks.map((task) => {
            const submission = submissionDetails[task.id];
            return (
              <div key={task.id} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><strong>Fecha límite:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                {submission ? (
                  <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
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
                      style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px', minHeight: '80px' }}
                    />
                    <input
                      type="file"
                      id={`task-file-${task.id}`}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      style={{ marginBottom: '10px' }}
                    />
                    <button
                      onClick={() => handleSubmitTask(task.id)}
                      disabled={submittingTask[task.id]}
                      style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
  );
};

export default StudentClassDetailPage;