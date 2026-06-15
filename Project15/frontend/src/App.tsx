import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

import TeacherLayout from './layouts/TeacherLayout';
import TeacherDashboard from './pages/teacher/Dashboard';
import QuestionManage from './pages/teacher/QuestionManage';
import PaperManage from './pages/teacher/PaperManage';
import ExamManage from './pages/teacher/ExamManage';
import KnowledgeManage from './pages/teacher/KnowledgeManage';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudentExam from './pages/student/Exam';
import ExamDetail from './pages/student/ExamDetail';
import ExamResult from './pages/student/ExamResult';
import WrongBook from './pages/student/WrongBook';
import StudyProgress from './pages/student/StudyProgress';
import KnowledgeAnalysis from './pages/student/KnowledgeAnalysis';
import Practice from './pages/student/Practice';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRole?: number }> = ({
  children,
  requireRole,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireRole && user.role !== requireRole) {
    return <Navigate to={user.role === 1 ? '/teacher' : '/student'} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute requireRole={1}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="questions" element={<QuestionManage />} />
        <Route path="papers" element={<PaperManage />} />
        <Route path="exams" element={<ExamManage />} />
        <Route path="knowledge" element={<KnowledgeManage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute requireRole={2}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="exams" element={<StudentExam />} />
        <Route path="exam/:examId" element={<ExamDetail />} />
        <Route path="result/:examStudentId" element={<ExamResult />} />
        <Route path="wrong-book" element={<WrongBook />} />
        <Route path="progress" element={<StudyProgress />} />
        <Route path="knowledge" element={<KnowledgeAnalysis />} />
        <Route path="practice" element={<Practice />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 1 ? '/teacher' : '/student'} replace />;
};

export default App;
