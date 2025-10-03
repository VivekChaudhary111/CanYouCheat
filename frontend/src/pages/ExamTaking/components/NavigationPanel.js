import React from 'react';

const NavigationPanel = ({ 
  questions, 
  answers, 
  currentQuestionIndex, 
  onQuestionNavigation, 
  onQuestionJump, 
  onSubmit 
}) => {
  const getQuestionStatus = (index) => {
    if (answers[index] !== null && answers[index] !== undefined && answers[index] !== '') {
      return 'answered';
    }
    return 'unanswered';
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => 
      answer !== null && answer !== undefined && answer !== ''
    ).length;
  };

  return (
    <div className="navigation-panel">
      <div className="nav-header">
        <h3>Question Navigator</h3>
        <div className="progress-summary">
          {getAnsweredCount()} of {questions.length} answered
        </div>
      </div>
      
      <div className="question-grid">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`question-nav-btn ${getQuestionStatus(index)} ${
              index === currentQuestionIndex ? 'current' : ''
            }`}
            onClick={() => onQuestionJump(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      
      <div className="nav-controls">
        <button
          className="btn btn-secondary"
          onClick={() => onQuestionNavigation('prev')}
          disabled={currentQuestionIndex === 0}
        >
          ← Previous
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={() => onQuestionNavigation('next')}
          disabled={currentQuestionIndex === questions.length - 1}
        >
          Next →
        </button>
      </div>
      
      <div className="nav-actions">
        <button
          className="btn btn-primary btn-large"
          onClick={onSubmit}
        >
          Submit Exam
        </button>
      </div>
      
      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot answered"></span>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot unanswered"></span>
          <span>Not Answered</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot current"></span>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;