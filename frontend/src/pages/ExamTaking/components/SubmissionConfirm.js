import React from 'react';

const SubmissionConfirm = ({ exam, answers, onConfirm, onCancel, loading }) => {
  const getAnsweredCount = () => {
    return Object.values(answers).filter(answer => 
      answer !== null && answer !== ''
    ).length;
  };

  const getUnansweredQuestions = () => {
    const unanswered = [];
    Object.entries(answers).forEach(([index, answer]) => {
      if (answer === null || answer === '') {
        unanswered.push(parseInt(index) + 1);
      }
    });
    return unanswered;
  };

  const answeredCount = getAnsweredCount();
  const totalQuestions = exam.questions.length;
  const unansweredQuestions = getUnansweredQuestions();
  const hasUnanswered = unansweredQuestions.length > 0;

  return (
    <div className="submission-confirm-overlay">
      <div className="submission-confirm-modal">
        <div className="modal-header-submission">
          <h2>Confirm Exam Submission</h2>
        </div>

        <div className="modal-body">
          <div className="submission-warning">
            <div className="warning-icon">⚠️</div>
            <p>
              Once you submit your exam, you will not be able to make any changes.
              Please review your answers before proceeding.
            </p>
          </div>

          <div className="submission-summary">
            <h4>Submission Summary</h4>
            
            <div className="summary-stats">
              <div className="stat-item">
                <span className="label">Total Questions:</span>
                <span className="value">{totalQuestions}</span>
              </div>
              
              <div className="stat-item">
                <span className="label">Answered:</span>
                <span className="value">{answeredCount}</span>
              </div>
              
              <div className="stat-item">
                <span className="label">Unanswered:</span>
                <span className="value">{unansweredQuestions.length}</span>
              </div>

              <div className="stat-item">
                <span className="label">Completion:</span>
                <span className="value">
                  {Math.round((answeredCount / totalQuestions) * 100)}%
                </span>
              </div>
            </div>

            {hasUnanswered && (
              <div className="unanswered-warning">
                <h5>Unanswered Questions:</h5>
                <div className="unanswered-list">
                  {unansweredQuestions.slice(0, 10).map(questionNum => (
                    <span key={questionNum} className="question-number">
                      {questionNum}
                    </span>
                  ))}
                  {unansweredQuestions.length > 10 && (
                    <span className="more-count">
                      +{unansweredQuestions.length - 10} more
                    </span>
                  )}
                </div>
                <p className="warning-text">
                  These questions will be marked as incorrect if left unanswered.
                </p>
              </div>
            )}
          </div>

          <div className="proctoring-notice">
            <h5>AI Proctoring Summary</h5>
            <p>
              Your exam session has been monitored using AI-enhanced proctoring technology.
              All activities have been recorded and will be reviewed as part of the assessment process.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Review Answers
          </button>
          
          <button 
            className="btn btn-submit"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner small"></span>
                Submitting...
              </>
            ) : (
              'Submit Final Exam'
            )}
          </button>
        </div>

        <div className="modal-footer">
          <small>
            By submitting this exam, you acknowledge that your responses are final
            and that the session was monitored for academic integrity.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SubmissionConfirm;