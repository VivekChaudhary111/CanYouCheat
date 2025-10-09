import React, { useState } from 'react';

const QuestionDisplay = ({ 
  question, 
  questionIndex, 
  answer, 
  onAnswerChange, 
  totalQuestions 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleOptionChange = (optionText) => {
    onAnswerChange(questionIndex, optionText);
  };

  const handleInputChange = (value) => {
    onAnswerChange(questionIndex, value);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    console.error('Failed to load question image for question', questionIndex + 1);
    setImageError(true);
    setImageLoading(false);
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  const renderQuestionContent = () => {
    switch (question.questionType) {
      case 'multiple-choice':
        return (
          <div className="answer-section">
            <div className="answer-instruction">
              Choose the best answer:
            </div>
            <div className="options-container">
              {question.options?.map((option, index) => (
                <label 
                  key={index} 
                  className={`option ${answer === option.text ? 'selected' : ''}`}
                >
                  <div className="option-indicator">
                    <input
                      type="radio"
                      name={`question-${questionIndex}`}
                      value={option.text}
                      checked={answer === option.text}
                      onChange={() => handleOptionChange(option.text)}
                    />
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  </div>
                  <span className="option-text">{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'true-false':
        return (
          <div className="answer-section">
            <div className="answer-instruction">
              Select True or False:
            </div>
            <div className="options-container true-false">
              <label className={`option ${answer === 'true' ? 'selected' : ''}`}>
                <div className="option-indicator">
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value="true"
                    checked={answer === 'true'}
                    onChange={() => handleInputChange('true')}
                  />
                  <span className="tf-icon">T</span>
                </div>
                <span className="option-text">True</span>
              </label>
              <label className={`option ${answer === 'false' ? 'selected' : ''}`}>
                <div className="option-indicator">
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value="false"
                    checked={answer === 'false'}
                    onChange={() => handleInputChange('false')}
                  />
                  <span className="tf-icon">F</span>
                </div>
                <span className="option-text">False</span>
              </label>
            </div>
          </div>
        );
      
      case 'short-answer':
        return (
          <div className="answer-section">
            <div className="answer-instruction">
              Enter your answer in the text box below:
            </div>
            <div className="text-answer-container">
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answer || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-answer-input"
                maxLength={500}
              />
              <div className="character-count">
                {(answer || '').length}/500 characters
              </div>
            </div>
          </div>
        );
      
      case 'essay':
        return (
          <div className="answer-section">
            <div className="answer-instruction">
              Write your detailed answer in the text area below:
            </div>
            <div className="text-answer-container">
              <textarea
                placeholder="Write your comprehensive answer here. Take your time to explain your thoughts clearly..."
                value={answer || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-answer-input essay-input"
                rows="12"
                maxLength={5000}
              />
              <div className="character-count">
                {(answer || '').length}/5000 characters
              </div>
              <div className="essay-tips">
                <small>Tips: Structure your answer clearly, use examples when relevant, and check your spelling.</small>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div className="unsupported-question">Unsupported question type</div>;
    }
  };

  return (
    <div className="question-display">
      {/* Question Header */}
      <div className="question-header">
        <div className="question-progress">
          <div className="progress-indicator">
            <span className="current-question">{questionIndex + 1}</span>
            <span className="separator">of</span>
            <span className="total-questions">{totalQuestions}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="question-points">
          <span className="points-label">Points:</span>
          <span className="points-value">{question.marks}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="question-content">
        <div className="question-text-container">
          <h2 className="question-text">{question.questionText}</h2>
          
          {/* Time limit indicator if present */}
          {question.timeLimit && (
            <div className="time-limit-notice">
              <span className="time-icon">Time:</span>
              Suggested time: ${question.timeLimit === 60 ? 'No time limit' : question.timeLimit + ' seconds'} 
            </div>
          )}
        </div>
        
        {/* Image Section */}
        {question.image && question.image.data && !imageError && (
          <div className="question-image-section">
            {imageLoading && (
              <div className="image-loading-state">
                <div className="image-skeleton"></div>
                <span>Loading diagram...</span>
              </div>
            )}
            <div 
              className={`question-image-container ${imageLoading ? 'loading' : ''}`}
              style={{ display: imageLoading ? 'none' : 'block' }}
            >
              <img
                src={question.image.data}
                alt={question.image.altText || 'Question diagram'}
                className="question-image"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={openImageModal}
              />
              <div className="image-actions">
                <button 
                  className="zoom-btn"
                  onClick={openImageModal}
                  type="button"
                >
                  Click to enlarge
                </button>
              </div>
              {question.image.altText && (
                <div className="image-description">
                  {question.image.altText}
                </div>
              )}
            </div>
          </div>
        )}
        
        {imageError && (
          <div className="image-error-state">
            <div className="error-icon">Image Error</div>
            <span>Image could not be loaded</span>
            <small>Please continue with the question text above</small>
          </div>
        )}
        
        {/* Answer Section */}
        {renderQuestionContent()}
        
        {/* Answer Status */}
        <div className="answer-status">
          {answer ? (
            <div className="status-indicator answered">
              <span className="status-icon">Done</span>
              <span>Answer provided</span>
            </div>
          ) : (
            <div className="status-indicator not-answered">
              <span className="status-icon">Pending</span>
              <span>Not answered yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && question.image && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="close-modal-btn"
              onClick={closeImageModal}
              type="button"
            >
              Close
            </button>
            <img
              src={question.image.data}
              alt={question.image.altText || 'Question diagram - enlarged view'}
              className="modal-image"
            />
            {question.image.altText && (
              <div className="modal-image-caption">
                {question.image.altText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionDisplay;