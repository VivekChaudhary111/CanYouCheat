import React from 'react';

const ExamFooter = ({ 
  currentQuestion, 
  totalQuestions, 
  onPrevious, 
  onNext, 
  onSubmit, 
  answeredQuestions, 
  canSubmit 
}) => {
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;
  const answeredCount = answeredQuestions.length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <footer className="exam-footer">
      <div className="footer-content">
        <div className="footer-left">
          <div className="question-progress">
            <div className="progress-stats">
              <div className="stat-item answered">
                <span className="stat-number">{answeredCount}</span>
                <span className="stat-label">Answered</span>
              </div>
              <div className="stat-item unanswered">
                <span className="stat-number">{unansweredCount}</span>
                <span className="stat-label">Remaining</span>
              </div>
            </div>
            <div className="overall-progress">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-text">
                {Math.round(progressPercentage)}% Complete
              </div>
            </div>
          </div>
        </div>

        <div className="footer-center">
          <div className="navigation-controls">
            <button 
              className="nav-btn previous"
              onClick={onPrevious}
              disabled={currentQuestion === 0}
              type="button"
            >
              <span className="btn-icon">←</span>
              <span className="btn-text">Previous</span>
            </button>

            <div className="question-indicator">
              <span className="current-q">Q{currentQuestion + 1}</span>
              <span className="total-q">of {totalQuestions}</span>
            </div>

            <button 
              className="nav-btn next"
              onClick={onNext}
              disabled={currentQuestion === totalQuestions - 1}
              type="button"
            >
              <span className="btn-text">Next</span>
              <span className="btn-icon">→</span>
            </button>
          </div>
        </div>

        <div className="footer-right">
          <div className="submission-area">
            <div className="submission-info">
              <div className="completion-status">
                <span className="completion-percentage">
                  {answeredCount}/{totalQuestions}
                </span>
                <span className="completion-text">Questions</span>
              </div>
            </div>
            <button 
              className={`submit-btn ${canSubmit ? 'ready' : 'disabled'}`}
              onClick={onSubmit}
              disabled={!canSubmit}
              type="button"
            >
              <span className="submit-text">Submit Exam</span>
              <span className="submit-icon">✓</span>
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="exam-notice">
          <span className="notice-text">
            AI proctoring is monitoring this session. Ensure your face remains visible and avoid suspicious behavior.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default ExamFooter;