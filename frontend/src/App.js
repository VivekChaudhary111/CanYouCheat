import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute'; // ✅ new import

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamTaking from './pages/ExamTaking/ExamTaking';
import ProctoringDashboard from './pages/ProctoringDashboard';
import CreateExam from './pages/CreateExam';
import ManageStudents from './pages/ManageStudents';
import ExamResults from './pages/ExamResults';
import EditExam from './pages/EditExam';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<PrivateRoute element={Dashboard} />} />
              <Route path="/exams" element={<PrivateRoute element={ExamList} />} />
              <Route path="/exams/:examId/take" element={<PrivateRoute element={ExamTaking} />} />
              <Route path="/proctoring" element={<PrivateRoute element={ProctoringDashboard} />} />
              <Route path="/create-exam" element={<PrivateRoute element={CreateExam} />} />
              <Route path="/exams/:examId/students" element={<PrivateRoute element={ManageStudents} />} />
              <Route path="/exams/:examId/results" element={<PrivateRoute element={ExamResults} />} />
              <Route path="/exams/:examId/edit" element={<PrivateRoute element={EditExam} />} />
              <Route path="/profile" element={<PrivateRoute element={Profile} />} />
              <Route path="/settings" element={<PrivateRoute element={Settings} />} />
              <Route path="/change-password" element={<PrivateRoute element={ChangePassword} />} />

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
