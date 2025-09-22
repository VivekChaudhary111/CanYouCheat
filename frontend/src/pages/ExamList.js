import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ExamList.css';

const ExamList = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchExams();
  }, [token, navigate]);

  const fetchExams = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/exams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        setError('Failed to fetch exams');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Network error occurred');
    }
    setLoading(false);
  };

  const handleTakeExam = (examId) => {
    navigate(`/exam/${examId}/take`);
  };

  const handleEditExam = (examId) => {
    navigate(`/create-exam?edit=${examId}`);
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setExams(exams.filter(exam => exam._id !== examId));
      } else {
        alert('Failed to delete exam');
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Network error occurred');
    }
  };

  if (loading) {
    return <div className="loading">Loading exams...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="exam-list">
      <div className="exam-list-header">
        <h1>
          {user?.role === 'instructor' ? 'My Exams' : 'Available Exams'}
        </h1>
        {user?.role === 'instructor' && (
          <button 
            className="create-exam-btn"
            onClick={() => navigate('/create-exam')}
          >
            + Create New Exam
          </button>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="no-exams">
          <div className="no-exams-icon">📝</div>
          <h2>No exams {user?.role === 'instructor' ? 'created' : 'available'}</h2>
          <p>
            {user?.role === 'instructor' 
              ? 'Create your first exam to get started!' 
              : 'Check back later for new exams.'
            }
          </p>
          {user?.role === 'instructor' && (
            <button 
              className="create-exam-btn"
              onClick={() => navigate('/create-exam')}
            >
              Create Your First Exam
            </button>
          )}
        </div>
      ) : (
        <div className="exams-grid">
          {exams.map(exam => (
            <ExamCard 
              key={exam._id} 
              exam={exam} 
              user={user}
              onTake={() => handleTakeExam(exam._id)}
              onEdit={() => handleEditExam(exam._id)}
              onDelete={() => handleDeleteExam(exam._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ExamCard = ({ exam, user, onTake, onEdit, onDelete }) => {
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  const now = new Date();
  
  const isUpcoming = now < startTime;
  const isActive = now >= startTime && now <= endTime;
  const isPast = now > endTime;

  const getStatusInfo = () => {
    if (isUpcoming) return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
    if (isActive) return { status: 'active', color: 'green', text: 'Active' };
    return { status: 'past', color: 'gray', text: 'Ended' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="exam-card">
      <div className="exam-header">
        <h3>{exam.title}</h3>
        <span className={`exam-status ${statusInfo.status}`}>
          {statusInfo.text}
        </span>
      </div>
      
      <p className="exam-description">{exam.description}</p>
      
      <div className="exam-details">
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span>{exam.duration} minutes</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Start Time:</span>
          <span>{startTime.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">End Time:</span>
          <span>{endTime.toLocaleString()}</span>
        </div>
        {user?.role === 'instructor' && (
          <div className="detail-item">
            <span className="detail-label">Enrolled Students:</span>
            <span>{exam.enrolledStudents?.length || 0}</span>
          </div>
        )}
      </div>
      
      <div className="exam-actions">
        {user?.role === 'student' ? (
          <>
            {isActive && (
              <button 
                className="action-btn primary"
                onClick={onTake}
              >
                Take Exam
              </button>
            )}
            {isUpcoming && (
              <button className="action-btn disabled" disabled>
                Starts {startTime.toLocaleDateString()}
              </button>
            )}
            {isPast && (
              <button className="action-btn disabled" disabled>
                Exam Ended
              </button>
            )}
          </>
        ) : (
          <>
            <button 
              className="action-btn"
              onClick={onEdit}
            >
              Edit
            </button>
            <button 
              className="action-btn danger"
              onClick={onDelete}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamList;