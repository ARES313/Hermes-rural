import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import TeacherContentManager from '../../components/teacher/TeacherContentManager';
import {
  getClassQuizzes,
  createQuiz,
  updateQuizStatus,
  getQuizResults,
  getClassTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskSubmissions
} from '../../services/api';

const TeacherClassDetailPage = () => {
  const { id: classId } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a'
  });

  // Quiz Results state
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [selectedQuizResults, setSelectedQuizResults] = useState(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);

  // Task Submissions state
  const [showTaskSubmissions, setShowTaskSubmissions] = useState(false);
  const [selectedTaskSubmissions, setSelectedTaskSubmissions] = useState(null);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('');
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Task Submissions grade modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [currentTaskIdForRefresh, setCurrentTaskIdForRefresh] = useState(null);

  // Task state
  const [tasks, setTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchQuizzes(),
      fetchTasks()
    ]);
    setLoading(false);
  };

  const fetchQuizzes = async () => {
    try {
      const response = await getClassQuizzes(classId);
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await getClassTasks(classId);
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Quiz handlers
  const addQuestion = () => {
    if (!currentQuestion.question_text) {
      alert('Complete el texto de la pregunta');
      return;
    }
    if (!currentQuestion.option_a || !currentQuestion.option_b || !currentQuestion.option_c || !currentQuestion.option_d) {
      alert('Complete todas las opciones');
      return;
    }
    setNewQuiz({
      ...newQuiz,
      questions: [...newQuiz.questions, { ...currentQuestion }]
    });
    setCurrentQuestion({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'a'
    });
  };

  const removeQuestion = (index) => {
    const updated = [...newQuiz.questions];
    updated.splice(index, 1);
    setNewQuiz({ ...newQuiz, questions: updated });
  };

  const handleCreateQuiz = async () => {
    if (!newQuiz.title) {
      alert('Ingrese un título para el quiz');
      return;
    }
    if (newQuiz.questions.length === 0) {
      alert('Agregue al menos una pregunta');
      return;
    }
    try {
      await createQuiz(classId, newQuiz);
      alert('Quiz creado exitosamente');
      setShowQuizForm(false);
      setNewQuiz({ title: '', description: '', questions: [] });
      fetchQuizzes();
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert(error.response?.data?.message || 'Error al crear el quiz');
    }
  };

  const handleQuizStatus = async (quizId, currentStatus) => {
    let newStatus = 'active';
    if (currentStatus === 'active') newStatus = 'closed';
    else if (currentStatus === 'draft') newStatus = 'active';
    
    try {
      await updateQuizStatus(quizId, newStatus);
      fetchQuizzes();
    } catch (error) {
      console.error('Error updating quiz status:', error);
      alert('Error al cambiar el estado');
    }
  };

  const handleViewQuizResults = async (quizId, quizTitle) => {
    setLoadingResults(true);
    try {
      const response = await getQuizResults(quizId);
      const submissions = Array.isArray(response?.data?.submissions)
        ? response.data.submissions
        : [];

      setSelectedQuizResults(submissions);
      setSelectedQuizTitle(quizTitle);
      setShowQuizResults(true);
    } catch (error) {
      console.error('Error fetching results:', error?.response?.data || error);
      alert(error?.response?.data?.message || 'Error al cargar los resultados');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleViewTaskSubmissions = async (taskId, taskTitle) => {
    setCurrentTaskIdForRefresh(taskId);
    setLoadingSubmissions(true);
    try {
      const response = await getTaskSubmissions(taskId);
      setSelectedTaskSubmissions(response.data.submissions);
      setSelectedTaskTitle(taskTitle);
      setShowTaskSubmissions(true);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      alert('Error al cargar las entregas');
    } finally {
      setLoadingSubmissions(false);
    }
  };
  
  const handleViewSubmission = async (submissionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/submissions/${submissionId}/view`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al abrir el archivo');
      }
    } catch (error) {
      console.error('Error viewing submission:', error);
      alert('Error al abrir el archivo');
    }
  };

  const handleDownloadSubmission = async (submissionId, filename) => {
    try {
      const response = await fetch(`http://localhost:3000/api/submissions/${submissionId}/download`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al descargar el archivo');
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      alert('Error al descargar el archivo');
    }
  };

  const handleOpenGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.grade !== null && submission.grade !== undefined ? submission.grade : '');
    setFeedbackValue(submission.feedback || '');
    setShowGradeModal(true);
  };

  const handleSaveGrade = async () => {
    if (!gradeValue || gradeValue === '') {
      alert('Ingrese una calificación');
      return;
    }
    const gradeNum = parseFloat(gradeValue);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      alert('La calificación debe ser un número entre 0 y 100');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/submissions/${selectedSubmission.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          grade: gradeNum,
          feedback: feedbackValue || null
        })
      });
      const data = await response.json();
      if (data.ok) {
        alert('Calificación guardada');
        setShowGradeModal(false);
        if (currentTaskIdForRefresh) {
          const refreshResponse = await getTaskSubmissions(currentTaskIdForRefresh);
          setSelectedTaskSubmissions(refreshResponse.data.submissions);
        }
        setSelectedSubmission(null);
        setGradeValue('');
        setFeedbackValue('');
      } else {
        alert(data.message || 'Error al guardar la calificación');
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('Error al guardar la calificación');
    }
  };

  // Task handlers
  const handleCreateTask = async () => {
    if (!newTask.title) {
      alert('Complete el título de la tarea');
      return;
    }
    try {
      await createTask(classId, newTask);
      alert('Tarea creada exitosamente');
      setShowTaskForm(false);
      setNewTask({ title: '', description: '', due_date: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert(error.response?.data?.message || 'Error al crear la tarea');
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || ''
    });
    setShowTaskForm(true);
  };

  const handleUpdateTask = async () => {
    if (!newTask.title) {
      alert('Complete el título');
      return;
    }
    try {
      await updateTask(editingTask.id, newTask);
      alert('Tarea actualizada');
      setShowTaskForm(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', due_date: '' });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId, taskTitle) => {
    if (window.confirm(`¿Eliminar la tarea "${taskTitle}"?`)) {
      try {
        await deleteTask(taskId);
        alert('Tarea eliminada');
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error al eliminar la tarea');
      }
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: { bg: '#ffc107', color: '#212529', text: 'Borrador' },
      active: { bg: '#28a745', color: 'white', text: 'Activo' },
      closed: { bg: '#dc3545', color: 'white', text: 'Cerrado' }
    };
    const style = colors[status] || colors.draft;
    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '3px',
        backgroundColor: style.bg,
        color: style.color,
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/teacher/classes" style={{ textDecoration: 'none', color: '#007bff' }}>
          ← Volver a Mis Clases
        </Link>
      </div>

      <h1>Gestión de Clase</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>ID de Clase: {classId}</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e0e0e0', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('content')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'content' ? '#007bff' : 'transparent',
            color: activeTab === 'content' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Contenido
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'quizzes' ? '#007bff' : 'transparent',
            color: activeTab === 'quizzes' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Quizzes
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'tasks' ? '#007bff' : 'transparent',
            color: activeTab === 'tasks' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px 5px 0 0'
          }}
        >
          Tareas
        </button>
      </div>

      {/* Pestaña Contenido */}
      {activeTab === 'content' && (
        <TeacherContentManager classId={classId} />
      )}

      {/* Pestaña Quizzes */}
      {activeTab === 'quizzes' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowQuizForm(!showQuizForm)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showQuizForm ? 'Cancelar' : '+ Nuevo Quiz'}
            </button>
          </div>

          {showQuizForm && (
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>Crear Nuevo Quiz</h3>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Título del Quiz"
                  value={newQuiz.title}
                  onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
                <textarea
                  placeholder="Descripción"
                  value={newQuiz.description}
                  onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
                <h4>Agregar Pregunta</h4>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Texto de la pregunta"
                    value={currentQuestion.question_text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Opción A"
                    value={currentQuestion.option_a}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '5px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Opción B"
                    value={currentQuestion.option_b}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '5px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Opción C"
                    value={currentQuestion.option_c}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '5px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <input
                    type="text"
                    placeholder="Opción D"
                    value={currentQuestion.option_d}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <select
                    value={currentQuestion.correct_answer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  >
                    <option value="a">Opción A es correcta</option>
                    <option value="b">Opción B es correcta</option>
                    <option value="c">Opción C es correcta</option>
                    <option value="d">Opción D es correcta</option>
                  </select>
                </div>
                <button
                  onClick={addQuestion}
                  style={{ padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  Agregar Pregunta
                </button>
              </div>

              {newQuiz.questions.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <h4>Preguntas agregadas ({newQuiz.questions.length})</h4>
                  {newQuiz.questions.map((q, idx) => (
                    <div key={idx} style={{ padding: '10px', backgroundColor: 'white', marginBottom: '5px', borderRadius: '3px' }}>
                      <p><strong>{idx + 1}. {q.question_text}</strong></p>
                      <p style={{ fontSize: '12px' }}>Correcta: {q.correct_answer.toUpperCase()}</p>
                      <button
                        onClick={() => removeQuestion(idx)}
                        style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleCreateQuiz}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Guardar Quiz
              </button>
            </div>
          )}

          {quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              No hay quizzes creados
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {quizzes.map((quiz) => (
                <div key={quiz.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{quiz.title}</h4>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>{quiz.description}</p>
                      <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                        Creado: {new Date(quiz.created_at).toLocaleDateString()} | Estado: {getStatusBadge(quiz.status)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleViewQuizResults(quiz.id, quiz.title)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Ver Resultados
                      </button>
                      {quiz.status !== 'closed' && (
                        <button
                          onClick={() => handleQuizStatus(quiz.id, quiz.status)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: quiz.status === 'draft' ? '#28a745' : '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          {quiz.status === 'draft' ? 'Publicar' : 'Cerrar'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Entregas de Tareas */}
      {showTaskSubmissions && selectedTaskSubmissions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Entregas: {selectedTaskTitle}</h3>
              <button
                onClick={() => setShowTaskSubmissions(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
            
            {loadingSubmissions ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Cargando entregas...</div>
            ) : selectedTaskSubmissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay entregas aún</div>
            ) : (
              <>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                                    <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Estudiante</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Archivo</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Calificación</th>
                      <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Fecha Entrega</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTaskSubmissions.map((submission, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '10px' }}>
                          <div><strong>{submission.studentname}</strong></div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{submission.studentemail}</div>
                        </td>
                        <td style={{ padding: '10px' }}>{submission.originalname || submission.filename || 'Archivo'}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {submission.grade !== null && submission.grade !== undefined ? (
                            <div>
                              <span style={{ fontWeight: 'bold', color: '#28a745' }}>{submission.grade}/100</span>
                              {submission.feedback && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '3px' }}>"{submission.feedback}"</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999' }}>Sin calificar</span>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>{new Date(submission.submittedat).toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleViewSubmission(submission.id)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              👁️ Ver
                            </button>
                            <button
                              onClick={() => handleDownloadSubmission(submission.id, submission.originalname || submission.filename || 'entrega')}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              ⬇️ Descargar
                            </button>
                            <button
                              onClick={() => handleOpenGradeModal(submission)}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: submission.grade !== null && submission.grade !== undefined ? '#ffc107' : '#007bff',
                                color: submission.grade !== null && submission.grade !== undefined ? '#212529' : 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              {submission.grade !== null && submission.grade !== undefined ? '✏️ Editar' : '📝 Calificar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Modal interno para calificar */}
                {showGradeModal && selectedSubmission && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1001
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '25px',
                      width: '400px',
                      maxWidth: '90%',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                    }}>
                      <h3 style={{ marginTop: 0 }}>Calificar Entrega</h3>
                      <p><strong>Estudiante:</strong> {selectedSubmission.studentname}</p>
                      <p><strong>Archivo:</strong> {selectedSubmission.originalname || selectedSubmission.filename || 'Archivo'}</p>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Calificación (0-100):</label>
                        <input
                          type="number"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          min="0"
                          max="100"
                          step="0.5"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                          }}
                          autoFocus
                        />
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Comentario (opcional):</label>
                        <textarea
                          value={feedbackValue}
                          onChange={(e) => setFeedbackValue(e.target.value)}
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            resize: 'vertical'
                          }}
                          placeholder="Escribe un comentario para el estudiante..."
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setShowGradeModal(false);
                            setSelectedSubmission(null);
                            setGradeValue('');
                            setFeedbackValue('');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveGrade}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Guardar Calificación
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Resultados de Quiz */}
      {showQuizResults && selectedQuizResults && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Resultados: {selectedQuizTitle}</h3>
              <button
                onClick={() => setShowQuizResults(false)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
            
            {loadingResults ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Cargando resultados...</div>
            ) : !selectedQuizResults || selectedQuizResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay intentos aún</div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>ID Estudiante</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Nombre</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Puntuación</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Fecha Envío</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuizResults.map((result, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '10px' }}>{result.student_id}</td>
                      <td style={{ padding: '10px' }}>{result.student_name}</td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#007bff' }}>{Number(result.score || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '3px',
                          backgroundColor: result.status === 'submitted' ? '#28a745' : '#ffc107',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {result.status === 'submitted' ? 'Entregado' : result.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{result.finished_at ? new Date(result.finished_at).toLocaleString() : new Date(result.started_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Pestaña Tareas */}
      {activeTab === 'tasks' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => {
                setShowTaskForm(!showTaskForm);
                if (!showTaskForm) {
                  setEditingTask(null);
                  setNewTask({ title: '', description: '', due_date: '' });
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              {showTaskForm ? 'Cancelar' : '+ Nueva Tarea'}
            </button>
          </div>

          {showTaskForm && (
            <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>{editingTask ? 'Editar Tarea' : 'Crear Tarea'}</h3>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Título"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
                <textarea
                  placeholder="Descripción"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                />
              </div>
              <button
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                {editingTask ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          )}

          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              No hay tareas creadas
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>{task.description}</p>
                      <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                        {task.due_date && `Fecha límite: ${new Date(task.due_date).toLocaleDateString()} | `}
                        Estado: {task.status === 'active' ? 'Activa' : 'Cerrada'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => handleViewTaskSubmissions(task.id, task.title)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Ver Entregas
                      </button>
                      <button
                        onClick={() => handleEditTask(task)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherClassDetailPage;