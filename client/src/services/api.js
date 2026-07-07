import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/private/me');

// Classes endpoints (admin)
export const getClasses = () => api.get('/classes');
export const getClassById = (id) => api.get(`/classes/${id}`);
export const createClass = (data) => api.post('/classes', data);
export const updateClass = (id, data) => api.put(`/classes/${id}`, data);
export const deleteClass = (id, hardDelete = false) => api.delete(`/classes/${id}${hardDelete ? '?hard_delete=true' : ''}`);

// Students endpoints
export const getStudents = () => api.get('/students');
export const getStudentById = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id, hardDelete = false) => api.delete(`/students/${id}${hardDelete ? '?hard_delete=true' : ''}`);
export const changeStudentPassword = (id, newPassword) => api.put(`/students/${id}/password`, { newPassword });

// Teachers endpoints (admin)
export const getTeachers = () => api.get('/teachers');
export const getTeacherById = (id) => api.get(`/teachers/${id}`);
export const createTeacher = (data) => api.post('/teachers', data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const deleteTeacher = (id, hardDelete = false) => api.delete(`/teachers/${id}${hardDelete ? '?hard_delete=true' : ''}`);
export const changeTeacherPassword = (id, newPassword) => api.put(`/teachers/${id}/password`, { newPassword });

// Class-Students endpoints
export const getStudentsByClass = (classId) => api.get(`/classes/${classId}/students`);
export const assignStudentToClass = (classId, studentId) => api.post(`/classes/${classId}/students`, { studentId });
export const removeStudentFromClass = (classId, studentId, hardDelete = false) => 
  api.delete(`/classes/${classId}/students/${studentId}${hardDelete ? '?hard_delete=true' : ''}`);

// Teacher endpoints
export const getMyClasses = () => api.get('/teacher/my-classes');

// Content endpoints
export const getClassContent = (classId) => api.get(`/classes/${classId}/content`);
export const uploadContent = (classId, formData) => api.post(`/classes/${classId}/content`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});


// Quiz endpoints
export const getClassQuizzes = (classId) => api.get(`/classes/${classId}/quizzes`);
export const createQuiz = (classId, data) => api.post(`/classes/${classId}/quizzes`, data);
export const getQuizById = (quizId) => api.get(`/quizzes/${quizId}`);
export const updateQuizStatus = (quizId, status) => api.put(`/quizzes/${quizId}/status`, { status });
export const getQuizResults = (quizId) => api.get(`/quizzes/${quizId}/submissions`);

// Task endpoints
export const getClassTasks = (classId) => api.get(`/classes/${classId}/tasks`);
export const createTask = (classId, data) => api.post(`/classes/${classId}/tasks`, data);
export const updateTask = (taskId, data) => api.put(`/tasks/${taskId}`, data);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
export const getTaskSubmissions = (taskId) => api.get(`/tasks/${taskId}/submissions`);

// ========== STUDENT ENDPOINTS ==========
export const getStudentMyClasses = () => api.get('/student/my-classes');
export const getStudentClassContent = (classId) => api.get(`/student/classes/${classId}/content`);
export const getStudentQuizzes = (classId) => api.get(`/student/classes/${classId}/quizzes`);
export const getStudentQuizById = (quizId) => api.get(`/student/quizzes/${quizId}`);
export const getStudentQuizResult = (quizId) => api.get(`/student/quizzes/${quizId}/result`);
export const submitStudentQuiz = (quizId, answers) => api.post(`/student/quizzes/${quizId}/submit`, { answers });
export const getStudentTasks = (classId) => api.get(`/student/classes/${classId}/tasks`);
export const submitStudentTask = (taskId, formData) => 
  api.post(`/student/tasks/${taskId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
// ============================================
// GESTIÓN DE CARPETAS Y CONTENIDO (DOCENTE)
// ============================================

export const getFolders = (classId) => {
    return api.get(`/teacher/classes/${classId}/folders`);
};

export const createFolder = (classId, data) => {
    return api.post(`/teacher/classes/${classId}/folders`, data);
};

export const deleteFolder = (classId, folderId) => {
    return api.delete(`/teacher/classes/${classId}/folders/${folderId}`);
};

export const moveContent = (classId, fileId, data) => {
    return api.patch(`/teacher/classes/${classId}/content/${fileId}/move`, data);
};

export const getClassContentByFolder = (classId, folderId = null) => {
    const url = folderId !== null && folderId !== undefined && folderId !== ''
        ? `/classes/${classId}/content?folder_id=${folderId}`
        : `/classes/${classId}/content`;
    return api.get(url);
};

export const deleteContent = (classId, contentId) => {
    return api.delete(`/classes/${classId}/content/${contentId}`);
};

export const getStudentSubmission = (taskId) => api.get(`/student/tasks/${taskId}/submission`);

export default api;