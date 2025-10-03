import React from 'react';

const QuestionDisplay = ({ 
  question, 
  questionIndex, 
  answer, 
  onAnswerChange, 
  totalQuestions 
}) => {
  const handleOptionChange = (optionText) => {
    onAnswerChange(questionIndex, optionText);
  };

  const handleInputChange = (value) => {
    onAnswerChange(questionIndex, value);
  };

  const renderQuestionContent = () => {
    switch (question.questionType) {
      case 'multiple-choice':
        return (
          <div className="question-options">
            {question.options.map((option, index) => (
              <label key={index} className="option-label">
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={option.text}
                  checked={answer === option.text}
                  onChange={() => handleOptionChange(option.text)}
                />
                <span className="option-text">{option.text}</span>
              </label>
            ))}
          </div>
        );
      
      case 'true-false':
        return (
          <div className="question-options">
            <label className="option-label">
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value="true"
                checked={answer === 'true'}
                onChange={() => handleInputChange('true')}
              />
              <span className="option-text">True</span>
            </label>
            <label className="option-label">
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value="false"
                checked={answer === 'false'}
                onChange={() => handleInputChange('false')}
              />
              <span className="option-text">False</span>
            </label>
          </div>
        );
      
      case 'short-answer':
        return (
          <div className="question-input">
            <input
              type="text"
              placeholder="Enter your answer..."
              value={answer || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              className="answer-input"
            />
          </div>
        );
      
      case 'essay':
        return (
          <div className="question-input">
            <textarea
              placeholder="Write your essay answer..."
              value={answer || ''}
              onChange={(e) => handleInputChange(e.target.value)}
              className="answer-textarea"
              rows="10"
            />
          </div>
        );
      
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="question-display">
      <div className="question-header">
        <div className="question-number">
          Question {questionIndex + 1} of {totalQuestions}
        </div>
        <div className="question-marks">
          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
        </div>
      </div>
      
      <div className="question-content">
        <h3 className="question-text">{question.questionText}</h3>
        {renderQuestionContent()}
      </div>
    </div>
  );
};

export default QuestionDisplay;