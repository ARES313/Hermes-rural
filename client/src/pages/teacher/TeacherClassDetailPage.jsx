import React, { useState, useEffect, useMemo } from 'react';
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

  const particles = useMemo(() => generateParticles(20), []);

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
    return (
      <>
        <style>{`
          @keyframes floatParticle {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            10% { opacity: 0.2; }
            90% { opacity: 0.2; }
            100% { transform: translateY(-120px) translateX(40px); opacity: 0; }
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
        `}</style>
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
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '1.2rem',
        }}>
          Cargando...
        </div>
      </>
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
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          width: 95%;
        }

        .modal-content h3 {
          color: #f5e6b8;
          margin: 0;
        }

        .modal-content table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .modal-content th {
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          color: #f5e6b8;
        }

        .modal-content td {
          padding: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          color: #e0e0e0;
        }

        .modal-content td .filename-cell {
          color: #e0e0e0;
        }

        .actions-cell {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
          justify-content: center;
        }

        .actions-cell .action-btn {
          padding: 6px 12px;
          font-size: 12px;
          white-space: nowrap;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .actions-cell .action-btn:hover {
          transform: scale(1.05);
        }

        .actions-cell .btn-view {
          background: linear-gradient(135deg, #17a2b8, #20c997);
          color: white;
        }

        .actions-cell .btn-download {
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
        }

        .actions-cell .btn-grade {
          background: linear-gradient(135deg, #6c5ce7, #0984e3);
          color: white;
        }

        .actions-cell .btn-edit-grade {
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          color: #212529;
        }

        .modal-content input,
        .modal-content textarea,
        .modal-content select {
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

        .modal-content input:focus,
        .modal-content textarea:focus,
        .modal-content select:focus {
          border-color: #f0c040;
        }

        .modal-content label {
          display: block;
          margin-bottom: 5px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
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

        .form-card h4 {
          color: #f5e6b8;
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

        .form-card .question-item {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 5px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-card .question-item p {
          color: rgba(255, 255, 255, 0.8);
        }

        .grade-modal-inner {
          background: rgba(30, 30, 47, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          padding: 25px;
          width: 400px;
          max-width: 90%;
        }

        .grade-modal-inner h3 {
          color: #f5e6b8;
          margin-top: 0;
        }

        .grade-modal-inner p {
          color: rgba(255, 255, 255, 0.8);
        }

        .grade-modal-inner input,
        .grade-modal-inner textarea {
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

        .grade-modal-inner input:focus,
        .grade-modal-inner textarea:focus {
          border-color: #f0c040;
        }

        .grade-modal-inner label {
          display: block;
          margin-bottom: 5px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
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
        <div style={{ marginBottom: '20px' }}>
          <Link to="/teacher/classes" className="back-link">
            ← Volver a Mis Clases
          </Link>
        </div>

        <h1 style={{ color: '#f5e6b8', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 300, letterSpacing: '2px', marginBottom: '8px' }}>
          Gestión de Clase
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>ID de Clase: {classId}</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(119, 116, 116, 0.74)', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('content')}
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          >
            Contenido
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
          >
            Quizzes
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
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
                className={showQuizForm ? 'btn-secondary' : 'btn-success'}
              >
                {showQuizForm ? 'Cancelar' : '+ Nuevo Quiz'}
              </button>
            </div>

            {showQuizForm && (
              <div className="form-card">
                <h3>Crear Nuevo Quiz</h3>
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Título del Quiz"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <textarea
                    placeholder="Descripción"
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4>Agregar Pregunta</h4>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Texto de la pregunta"
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <input
                      type="text"
                      placeholder="Opción A"
                      value={currentQuestion.option_a}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_a: e.target.value })}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <input
                      type="text"
                      placeholder="Opción B"
                      value={currentQuestion.option_b}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_b: e.target.value })}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <input
                      type="text"
                      placeholder="Opción C"
                      value={currentQuestion.option_c}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_c: e.target.value })}
                      style={{ width: '100%', marginBottom: '5px' }}
                    />
                    <input
                      type="text"
                      placeholder="Opción D"
                      value={currentQuestion.option_d}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, option_d: e.target.value })}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />
                    <select
                      value={currentQuestion.correct_answer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="a">Opción A es correcta</option>
                      <option value="b">Opción B es correcta</option>
                      <option value="c">Opción C es correcta</option>
                      <option value="d">Opción D es correcta</option>
                    </select>
                  </div>
                  <button
                    onClick={addQuestion}
                    className="btn-info"
                    style={{ padding: '8px 16px', fontSize: '13px' }}
                  >
                    Agregar Pregunta
                  </button>
                </div>

                {newQuiz.questions.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <h4>Preguntas agregadas ({newQuiz.questions.length})</h4>
                    {newQuiz.questions.map((q, idx) => (
                      <div key={idx} className="question-item">
                        <p><strong>{idx + 1}. {q.question_text}</strong></p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Correcta: {q.correct_answer.toUpperCase()}</p>
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="btn-danger"
                          style={{ fontSize: '12px', padding: '2px 8px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleCreateQuiz}
                  className="btn-primary"
                >
                  Guardar Quiz
                </button>
              </div>
            )}

            {quizzes.length === 0 ? (
              <div className="empty-state">
                No hay quizzes creados
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4>{quiz.title}</h4>
                        <p style={{ fontSize: '14px' }}>{quiz.description}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          Creado: {new Date(quiz.created_at).toLocaleDateString()} | Estado: {getStatusBadge(quiz.status)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleViewQuizResults(quiz.id, quiz.title)}
                          className="btn-info"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Ver Resultados
                        </button>
                        {quiz.status !== 'closed' && (
                          <button
                            onClick={() => handleQuizStatus(quiz.id, quiz.status)}
                            className={quiz.status === 'draft' ? 'btn-success' : 'btn-danger'}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
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
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Entregas: {selectedTaskTitle}</h3>
                <button
                  onClick={() => setShowTaskSubmissions(false)}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Cerrar
                </button>
              </div>
              
              {loadingSubmissions ? (
                <div className="loading-text">Cargando entregas...</div>
              ) : selectedTaskSubmissions.length === 0 ? (
                <div className="empty-state">No hay entregas aún</div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Archivo</th>
                        <th style={{ textAlign: 'center' }}>Calificación</th>
                        <th>Fecha Entrega</th>
                        <th style={{ textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTaskSubmissions.map((submission, idx) => (
                        <tr key={idx}>
                          <td>
                            <div><strong style={{ color: '#f5e6b8' }}>{submission.student_name}</strong></div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{submission.student_email}</div>
                          </td>
                          <td style={{ color: '#e0e0e0' }}>{submission.original_name || submission.filename || 'Archivo'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {submission.grade !== null && submission.grade !== undefined ? (
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{submission.grade}/100</span>
                                {submission.feedback && (
                                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>"{submission.feedback}"</div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Sin calificar</span>
                            )}
                          </td>
                          <td style={{ color: '#cccccc' }}>{new Date(submission.submitted_at).toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="actions-cell">
                              <button
                                onClick={() => handleViewSubmission(submission.id)}
                                className="action-btn btn-view"
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => handleDownloadSubmission(submission.id, submission.original_name || submission.filename || 'entrega')}
                                className="action-btn btn-download"
                              >
                                ⬇️ Descargar
                              </button>
                              <button
                                onClick={() => handleOpenGradeModal(submission)}
                                className={`action-btn ${submission.grade !== null && submission.grade !== undefined ? 'btn-edit-grade' : 'btn-grade'}`}
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
                    <div className="modal-overlay" style={{ zIndex: 1001 }}>
                      <div className="grade-modal-inner">
                        <h3>Calificar Entrega</h3>
                        <p><strong style={{ color: '#f5e6b8' }}>Estudiante:</strong> {selectedSubmission.student_name}</p>
                        <p><strong style={{ color: '#f5e6b8' }}>Archivo:</strong> {selectedSubmission.original_name || selectedSubmission.filename || 'Archivo'}</p>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <label>Calificación (0-100):</label>
                          <input
                            type="number"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            min="0"
                            max="100"
                            step="0.5"
                            autoFocus
                          />
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                          <label>Comentario (opcional):</label>
                          <textarea
                            value={feedbackValue}
                            onChange={(e) => setFeedbackValue(e.target.value)}
                            rows="3"
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
                            className="btn-secondary"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveGrade}
                            className="btn-primary"
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
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Resultados: {selectedQuizTitle}</h3>
                <button
                  onClick={() => setShowQuizResults(false)}
                  className="btn-secondary"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Cerrar
                </button>
              </div>
              
              {loadingResults ? (
                <div className="loading-text">Cargando resultados...</div>
              ) : !selectedQuizResults || selectedQuizResults.length === 0 ? (
                <div className="empty-state">No hay intentos aún</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID Estudiante</th>
                      <th>Nombre</th>
                      <th style={{ textAlign: 'center' }}>Puntuación</th>
                      <th>Estado</th>
                      <th>Fecha Envío</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuizResults.map((result, idx) => (
                      <tr key={idx}>
                        <td>{result.student_id}</td>
                        <td>{result.student_name}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#f5e6b8' }}>{Number(result.score || 0).toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: result.status === 'submitted' ? 'rgba(46,204,113,0.3)' : 'rgba(241,196,15,0.3)',
                            color: result.status === 'submitted' ? '#2ecc71' : '#f1c40f',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {result.status === 'submitted' ? 'Entregado' : result.status}
                          </span>
                        </td>
                        <td>{result.finished_at ? new Date(result.finished_at).toLocaleString() : new Date(result.started_at).toLocaleString()}</td>
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
                className={showTaskForm ? 'btn-secondary' : 'btn-success'}
              >
                {showTaskForm ? 'Cancelar' : '+ Nueva Tarea'}
              </button>
            </div>

            {showTaskForm && (
              <div className="form-card">
                <h3>{editingTask ? 'Editar Tarea' : 'Crear Tarea'}</h3>
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Título"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <textarea
                    placeholder="Descripción"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                  className="btn-primary"
                >
                  {editingTask ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="empty-state">
                No hay tareas creadas
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {tasks.map((task) => (
                  <div key={task.id} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4>{task.title}</h4>
                        <p style={{ fontSize: '14px' }}>{task.description}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {task.due_date && `Fecha límite: ${new Date(task.due_date).toLocaleDateString()} | `}
                          Estado: {task.status === 'active' ? 'Activa' : 'Cerrada'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => handleViewTaskSubmissions(task.id, task.title)}
                          className="btn-info"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Ver Entregas
                        </button>
                        <button
                          onClick={() => handleEditTask(task)}
                          className="btn-warning"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="btn-danger"
                          style={{ padding: '5px 10px', fontSize: '12px' }}
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
    </>
  );
};

export default TeacherClassDetailPage;
