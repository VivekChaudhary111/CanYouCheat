import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import ExamTaking from './pages/ExamTaking/ExamTaking'; // Updated import path
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
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/exams" element={<ExamList />} />
              {/* Fixed route path to match ExamList navigation */}
              <Route path="/exams/:examId/take" element={<ExamTaking />} />
              <Route path="/proctoring" element={<ProctoringDashboard />} />
              <Route path="/create-exam" element={<CreateExam />} />
              <Route path="/exams/:examId/students" element={<ManageStudents />} />
              <Route path="/exams/:examId/results" element={<ExamResults />} />
              <Route path="/exams/:examId/edit" element={<EditExam />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
 