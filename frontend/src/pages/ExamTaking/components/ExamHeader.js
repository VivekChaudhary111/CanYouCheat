import React from 'react';

const ExamHeader = ({ 
  exam, 
  currentQuestion, 
  totalQuestions, 
  timeRemaining, 
  isMonitoring 
}) => {
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeStatus = () => {
    const totalTime = exam.duration * 60;
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage <= 10) return 'critical';
    if (percentage <= 25) return 'warning';
    if (percentage <= 50) return 'caution';
    return 'normal';
  };

  const timeStatus = getTimeStatus();

  return (
    <header className="exam-header">
      <div className="exam-header-left">
        <div className="exam-title">
          <h1>{exam.title}</h1>
          <div className="exam-progress-text">
            Question {currentQuestion + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      <div className="exam-header-center">
        <div className="monitoring-status">
          <div className={`monitoring-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
            <div className="status-dot"></div>
            <div className="monitoring-text">
              <span className="status-label">AI Monitoring</span>
              <span className="status-value">{isMonitoring ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="exam-header-right">
        <div className="exam-info">
          <div className="info-item">
            <span className="info-label">Total Marks</span>
            <span className="info-value">{exam.totalMarks}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Duration</span>
            <span className="info-value">{exam.duration} min</span>
          </div>
        </div>
        
        <div className={`time-display ${timeStatus}`}>
          <div className="time-label">Time Remaining</div>
          <div className="time-value">{formatTime(timeRemaining)}</div>
          <div className="time-progress">
            <div 
              className="time-progress-bar"
              style={{ 
                width: `${(timeRemaining / (exam.duration * 60)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;