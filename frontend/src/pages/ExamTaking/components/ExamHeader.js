import React from 'react';

const ExamHeader = ({ 
  exam, 
  timeRemaining, 
  formatTime, 
  currentQuestion, 
  totalQuestions, 
  onSubmit 
}) => {
  const getTimeClass = () => {
    if (timeRemaining <= 300) return 'time-critical'; // 5 minutes
    if (timeRemaining <= 600) return 'time-warning'; // 10 minutes
    return 'time-normal';
  };

  return (
    <div className="exam-header">
      <div className="exam-header-left">
        <h1>{exam.title}</h1>
        <div className="exam-progress">
          Question {currentQuestion} of {totalQuestions}
        </div>
      </div>
      
      <div className="exam-header-center">
        <div className="proctoring-status">
          <span className="status-dot active"></span>
          <span>AI Proctoring Active</span>
        </div>
      </div>
      
      <div className="exam-header-right">
        <div className={`timer ${getTimeClass()}`}>
          <span className="timer-icon">⏰</span>
          <span className="timer-text">{formatTime(timeRemaining)}</span>
        </div>
        
        <button 
          className="btn btn-primary submit-btn"
          onClick={onSubmit}
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
};

export default ExamHeader;