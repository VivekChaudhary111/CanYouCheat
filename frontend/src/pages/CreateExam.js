import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CreateExam.css';

const CreateExam = () => {
  const { token, isInstructor } = useAuth();
  const navigate = useNavigate();
  
  // Form state management for AI-Enhanced Exam Proctoring
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingScore: 60,
    startDate: '',
    endDate: '',
    allowedStudents: [],
    questions: [],
    // AI Proctoring Settings - Core Features
    proctoringSettings: {
      faceDetectionEnabled: true,
      eyeTrackingEnabled: true,
      voiceDetectionEnabled: true,
      multiplePersonDetection: true,
      browserActivityMonitoring: true,
      riskThreshold: 70,
      allowedViolations: 3,
      // Advanced AI features
      suspiciousBehaviorDetection: true,
      backgroundNoiseMonitoring: true,
      screenSharingBlocked: true,
      tabSwitchingBlocked: true,
      lowBandwidthMode: false
    }
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'multiple-choice',
    options: [{ text: '', isCorrect: false }],
    correctAnswer: '',
    marks: 1,
    timeLimit: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  // Check if user is authorized (instructor only)
  if (!isInstructor) {
    return (
      <div className="create-exam-container">
        <div className="error-state">
          <h2>🚫 Access Denied</h2>
          <p>Only instructors can create AI-proctored exams in the system.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('proctoring.')) {
      const settingName = name.replace('proctoring.', '');
      setFormData(prev => ({
        ...prev,
        proctoringSettings: {
          ...prev.proctoringSettings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const updateOption = (index, field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.questionType === 'multiple-choice' && 
        !currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now() // Temporary ID
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    // Reset current question
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: [{ text: '', isCorrect: false }],
      correctAnswer: '',
      marks: 1,
      timeLimit: null
    });

    setError('');
    setSuccess('Question added successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Exam title is required';
    if (!formData.description.trim()) return 'Exam description is required';
    if (formData.duration < 5) return 'Exam duration must be at least 5 minutes';
    if (formData.totalMarks < 1) return 'Total marks must be at least 1';
    if (formData.passingScore < 0 || formData.passingScore > formData.totalMarks) {
      return 'Passing score must be between 0 and total marks';
    }
    if (!formData.startDate) return 'Start date is required';
    if (!formData.endDate) return 'End date is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      return 'Start date must be before end date';
    }
    if (formData.questions.length === 0) return 'At least one question is required';
    
    return null;
  };

  // Update the handleSubmit function in CreateExam.js
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const validationError = validateForm();
  if (validationError) {
    setError(validationError);
    return;
  }

  setLoading(true);
  setError('');

  try {
    console.log('🎯 Creating AI-proctored exam:', formData.title);
    
    // ✅ Clean the form data - remove all temporary IDs and unwanted fields
    const cleanedFormData = {
      ...formData,
      questions: formData.questions.map(question => {
        // Remove any ID fields that might cause issues
        const { tempId, id, _id, ...cleanQuestion } = question;
        
        // Also clean options if they exist
        if (cleanQuestion.options) {
          cleanQuestion.options = cleanQuestion.options.map(option => {
            const { id, _id, tempId, ...cleanOption } = option;
            return cleanOption;
          });
        }
        
        return cleanQuestion;
      })
    };
    
    console.log('📋 Cleaned exam data for AI proctoring system:', cleanedFormData);
    
    const response = await fetch('http://localhost:5000/api/exams', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanedFormData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ AI-proctored exam created successfully with behavior analysis features');
      setSuccess('AI-proctored exam created successfully with advanced monitoring features!');
      
      // Redirect to exam list after showing success
      setTimeout(() => {
        navigate('/exams');
      }, 2000);
    } else {
      throw new Error(data.message || 'Failed to create AI-proctored exam');
    }
  } catch (error) {
    console.error('💥 Error creating AI-proctored exam:', error);
    setError(error.message || 'Failed to create exam with AI proctoring features');
  } finally {
    setLoading(false);
  }
};

  const getProctoringScore = () => {
    const settings = formData.proctoringSettings;
    const enabledFeatures = Object.values(settings).filter(Boolean).length;
    const totalFeatures = Object.keys(settings).length - 2; // Exclude numeric settings
    return Math.round((enabledFeatures / totalFeatures) * 100);
  };

  return (
    <div className="create-exam-container">
      <div className="create-exam-header">
        <h1>🎓 Create AI-Proctored Exam</h1>
        <p>Build your exam with advanced AI monitoring and cheating detection</p>
        <div className="proctoring-score">
          <span className="score-label">AI Security Level:</span>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${getProctoringScore()}%` }}
            ></div>
          </div>
          <span className="score-value">{getProctoringScore()}%</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-exam-form">
        <div className="form-tabs">
          <button 
            type="button"
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            📋 Basic Details
          </button>
          <button 
            type="button"
            className={`tab ${activeTab === 'proctoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('proctoring')}
          >
            🤖 AI Proctoring
          </button>
          <button 
            type="button"
            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            ❓ Questions ({formData.questions.length})
          </button>
        </div>

        {/* Basic Details Tab */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <h3>📋 Exam Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Exam Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter exam title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the exam content and objectives"
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="5"
                  max="480"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalMarks">Total Marks *</label>
                <input
                  type="number"
                  id="totalMarks"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="passingScore">Passing Score *</label>
                <input
                  type="number"
                  id="passingScore"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  max={formData.totalMarks}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date & Time *</label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Proctoring Settings Tab */}
        {activeTab === 'proctoring' && (
          <div className="tab-content">
            <h3>🤖 AI Proctoring Configuration</h3>
            <p className="proctoring-description">
              Configure AI monitoring features to detect suspicious behavior and prevent cheating.
              These features align with your system's core objectives.
            </p>

            <div className="proctoring-sections">
              <div className="proctoring-section">
                <h4>👁️ Visual Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.faceDetectionEnabled"
                      checked={formData.proctoringSettings.faceDetectionEnabled}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Face Detection and Tracking
                    <small>Identify and follow the test-taker's face throughout the exam</small>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.eyeTrackingEnabled"
                      checked={formData.proctoringSettings.eyeTrackingEnabled}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Eye Movement Analysis
                    <small>Analyze eye movements to detect suspicious looking patterns</small>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.multiplePersonDetection"
                      checked={formData.proctoringSettings.multiplePersonDetection}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Multiple-Person Detection
                    <small>Ensure the test-taker is alone during the exam</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>🔊 Audio Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.voiceDetectionEnabled"
                      checked={formData.proctoringSettings.voiceDetectionEnabled}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Voice and Background Noise Detection
                    <small>Monitor for unusual sounds, voices, or conversations</small>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.backgroundNoiseMonitoring"
                      checked={formData.proctoringSettings.backgroundNoiseMonitoring}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Advanced Background Noise Analysis
                    <small>Detect suspicious background activities and sounds</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>💻 Browser Activity Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.browserActivityMonitoring"
                      checked={formData.proctoringSettings.browserActivityMonitoring}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Browser Activity Tracking
                    <small>Monitor on-screen activity to prevent unauthorized information access</small>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.tabSwitchingBlocked"
                      checked={formData.proctoringSettings.tabSwitchingBlocked}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Block Tab Switching
                    <small>Prevent students from switching to other tabs or applications</small>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.screenSharingBlocked"
                      checked={formData.proctoringSettings.screenSharingBlocked}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Block Screen Sharing
                    <small>Prevent unauthorized screen sharing during the exam</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>⚙️ AI Risk Scoring Settings</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="riskThreshold">Risk Threshold (%)</label>
                    <input
                      type="range"
                      id="riskThreshold"
                      name="proctoring.riskThreshold"
                      value={formData.proctoringSettings.riskThreshold}
                      onChange={handleInputChange}
                      min="30"
                      max="90"
                      step="5"
                    />
                    <span className="range-value">{formData.proctoringSettings.riskThreshold}%</span>
                    <small>Alert threshold for suspicious behavior detection</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="allowedViolations">Allowed Violations</label>
                    <input
                      type="number"
                      id="allowedViolations"
                      name="proctoring.allowedViolations"
                      value={formData.proctoringSettings.allowedViolations}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                    />
                    <small>Number of violations before automatic exam termination</small>
                  </div>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.lowBandwidthMode"
                      checked={formData.proctoringSettings.lowBandwidthMode}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Low Bandwidth Mode
                    <small>Optimize for slow internet connections (reduces video quality)</small>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="tab-content">
            <h3>❓ Exam Questions</h3>
            
            {/* Add Question Section */}
            <div className="add-question-section">
              <h4>Add New Question</h4>
              
              <div className="form-group">
                <label htmlFor="questionText">Question Text *</label>
                <textarea
                  id="questionText"
                  name="questionText"
                  value={currentQuestion.questionText}
                  onChange={handleQuestionChange}
                  placeholder="Enter your question here"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="questionType">Question Type</label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={currentQuestion.questionType}
                    onChange={handleQuestionChange}
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="marks">Marks</label>
                  <input
                    type="number"
                    id="marks"
                    name="marks"
                    value={currentQuestion.marks}
                    onChange={handleQuestionChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="timeLimit">Time Limit (seconds)</label>
                  <input
                    type="number"
                    id="timeLimit"
                    name="timeLimit"
                    value={currentQuestion.timeLimit || ''}
                    onChange={handleQuestionChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Options for Multiple Choice */}
              {currentQuestion.questionType === 'multiple-choice' && (
                <div className="options-section">
                  <h5>Answer Options</h5>
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="option-row">
                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(index, 'text', e.target.value)}
                      />
                      <label className="correct-option">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={option.isCorrect}
                          onChange={() => {
                            setCurrentQuestion(prev => ({
                              ...prev,
                              options: prev.options.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              }))
                            }));
                          }}
                        />
                        Correct
                      </label>
                      {currentQuestion.options.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeOption(index)}
                          className="btn btn-danger btn-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addOption} className="btn btn-secondary btn-sm">
                    + Add Option
                  </button>
                </div>
              )}

              {/* Correct Answer for other types */}
              {currentQuestion.questionType !== 'multiple-choice' && (
                <div className="form-group">
                  <label htmlFor="correctAnswer">
                    {currentQuestion.questionType === 'essay' ? 'Sample Answer' : 'Correct Answer'}
                  </label>
                  <textarea
                    id="correctAnswer"
                    name="correctAnswer"
                    value={currentQuestion.correctAnswer}
                    onChange={handleQuestionChange}
                    placeholder={currentQuestion.questionType === 'essay' 
                      ? 'Provide a sample answer for reference' 
                      : 'Enter the correct answer'
                    }
                    rows="2"
                  />
                </div>
              )}

              <button type="button" onClick={addQuestion} className="btn btn-primary">
                ➕ Add Question
              </button>
            </div>

            {/* Questions List */}
            <div className="questions-list">
              <h4>Added Questions ({formData.questions.length})</h4>
              {formData.questions.length === 0 ? (
                <p className="no-questions">No questions added yet. Add your first question above.</p>
              ) : (
                formData.questions.map((question, index) => (
                  <div key={question.id} className="question-item">
                    <div className="question-header">
                      <span className="question-number">Q{index + 1}</span>
                      <span className="question-type">{question.questionType}</span>
                      <span className="question-marks">{question.marks} marks</span>
                      <button 
                        type="button" 
                        onClick={() => removeQuestion(index)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                    <div className="question-content">
                      <p><strong>Question:</strong> {question.questionText}</p>
                      {question.questionType === 'multiple-choice' && (
                        <div className="question-options">
                          <strong>Options:</strong>
                          <ul>
                            {question.options.map((option, optIndex) => (
                              <li key={optIndex} className={option.isCorrect ? 'correct-option' : ''}>
                                {option.text} {option.isCorrect && '✓'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {question.correctAnswer && (
                        <p><strong>Answer:</strong> {question.correctAnswer}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/exams')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || formData.questions.length === 0}
          >
            {loading ? '🔄 Creating...' : '🎯 Create AI-Proctored Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;