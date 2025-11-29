import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CreateExam.css';

const CreateExam = () => {
  const { token, isInstructor } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
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
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '',
    marks: 1,
    timeLimit: null,
    hasImage: false,
    imageFile: null,
    imagePreview: null,
    imageAltText: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [questionPreview, setQuestionPreview] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user is authorized (instructor only)
  if (!isInstructor) {
    return (
      <div className="create-exam-container">
        <div className="error-state">
          <h2>Access Denied</h2>
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

  // Image handling functions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentQuestion(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: e.target.result,
          hasImage: true
        }));
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null,
      hasImage: false,
      imageAltText: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  // Edit question functionality
  const editQuestion = (index) => {
    const questionToEdit = formData.questions[index];
    setCurrentQuestion({
      ...questionToEdit,
      imageFile: null,
      imagePreview: questionToEdit.image ? questionToEdit.image.data : null,
      hasImage: !!questionToEdit.image,
      imageAltText: questionToEdit.image ? questionToEdit.image.altText : ''
    });
    setEditingQuestionIndex(index);
    setIsEditing(true);
    setQuestionPreview(false);
    
    // Scroll to question form
    document.querySelector('.add-question-section')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingQuestionIndex(null);
    resetCurrentQuestion();
  };

  const saveEdit = async () => {
    if (!currentQuestion.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.questionType === 'multiple-choice' && 
        !currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    // Handle image update if present
    let imageData = null;
    if (currentQuestion.hasImage && currentQuestion.imageFile) {
      // New image uploaded
      const reader = new FileReader();
      reader.onload = () => {
        imageData = {
          data: reader.result,
          name: currentQuestion.imageFile.name,
          type: currentQuestion.imageFile.type,
          altText: currentQuestion.imageAltText || 'Question diagram'
        };
        
        updateQuestionInList(imageData);
      };
      reader.readAsDataURL(currentQuestion.imageFile);
    } else if (currentQuestion.hasImage && currentQuestion.imagePreview) {
      // Existing image kept
      imageData = {
        data: currentQuestion.imagePreview,
        altText: currentQuestion.imageAltText || 'Question diagram'
      };
      updateQuestionInList(imageData);
    } else {
      // No image
      updateQuestionInList(null);
    }
  };

  const updateQuestionInList = (imageData) => {
    const { imageFile, imagePreview, ...questionData } = currentQuestion;
    
    const updatedQuestion = {
      ...questionData,
      id: formData.questions[editingQuestionIndex].id,
      image: imageData
    };

    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === editingQuestionIndex ? updatedQuestion : q
      )
    }));

    setIsEditing(false);
    setEditingQuestionIndex(null);
    resetCurrentQuestion();
    setSuccess('Question updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const addQuestion = async () => {
    if (!currentQuestion.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (currentQuestion.questionType === 'multiple-choice' && 
        !currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('At least one option must be marked as correct');
      return;
    }

    // Handle image upload if present
    let imageData = null;
    if (currentQuestion.hasImage && currentQuestion.imageFile) {
      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        imageData = {
          data: reader.result,
          name: currentQuestion.imageFile.name,
          type: currentQuestion.imageFile.type,
          altText: currentQuestion.imageAltText || 'Question diagram'
        };
        
        const newQuestion = {
          ...currentQuestion,
          id: Date.now(),
          image: imageData
        };

        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, newQuestion]
        }));

        resetCurrentQuestion();
      };
      reader.readAsDataURL(currentQuestion.imageFile);
    } else {
      const newQuestion = {
        ...currentQuestion,
        id: Date.now()
      };

      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));

      resetCurrentQuestion();
    }
  };

  const resetCurrentQuestion = () => {
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      marks: 1,
      timeLimit: null,
      hasImage: false,
      imageFile: null,
      imagePreview: null,
      imageAltText: ''
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setError('');
    if (!isEditing) {
      setSuccess('Question added successfully');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    
    // If editing this question, cancel edit
    if (editingQuestionIndex === index) {
      cancelEdit();
    }
  };

  const duplicateQuestion = (index) => {
    const questionToDuplicate = { ...formData.questions[index] };
    questionToDuplicate.id = Date.now();
    questionToDuplicate.questionText = questionToDuplicate.questionText + ' (Copy)';
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, questionToDuplicate]
    }));
  };

  // Handle question type change to reset options appropriately
  const handleQuestionTypeChange = (e) => {
    const newType = e.target.value;
    setCurrentQuestion(prev => ({
      ...prev,
      questionType: newType,
      options: newType === 'multiple-choice' ? [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ] : [{ text: '', isCorrect: false }],
      correctAnswer: newType === 'multiple-choice' ? '' : prev.correctAnswer
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
      console.log('Creating AI-proctored exam:', formData.title);
      
      const cleanedFormData = {
        ...formData,
        questions: formData.questions.map(question => {
          const { tempId, id, _id, imageFile, imagePreview, ...cleanQuestion } = question;
          
          if (cleanQuestion.options) {
            cleanQuestion.options = cleanQuestion.options.map(option => {
              const { id, _id, tempId, ...cleanOption } = option;
              return cleanOption;
            });
          }
          // Handle image data properly
          if (question.image && question.image.data) {
            // Image exists, keep the structured format
            cleanQuestion.image = {
              data: question.image.data,
              name: question.image.name || '',
              type: question.image.type || '',
              altText: question.image.altText || ''
            };
          } else {
            // No image or invalid image data, remove image field
            delete cleanQuestion.image;
          }
          return cleanQuestion;
        })
      };
      
      console.log('Cleaned exam data for AI proctoring system:', {
        ...cleanedFormData,
        questions: cleanedFormData.questions.map((q, index) => ({
          index,
          questionText: q.questionText.substring(0, 50) + '...',
          hasImage: !!q.image,
          imageDataLength: q.image?.data?.length || 0
        }))
      });
      
      const response = await fetch('https://canyoucheat.onrender.com/api/exams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedFormData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('AI-proctored exam created successfully with behavior analysis features');
        setSuccess('AI-proctored exam created successfully with advanced monitoring features');
        
        setTimeout(() => {
          navigate('/exams');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to create AI-proctored exam');
      }
    } catch (error) {
      console.error('Error creating AI-proctored exam:', error);
      setError(error.message || 'Failed to create exam with AI proctoring features');
    } finally {
      setLoading(false);
    }
  };

  const getProctoringScore = () => {
    const settings = formData.proctoringSettings;
    const enabledFeatures = Object.values(settings).filter(Boolean).length;
    const totalFeatures = Object.keys(settings).length;
    return Math.round((enabledFeatures / totalFeatures) * 100);
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple-choice': return 'MC';
      case 'true-false': return 'TF';
      case 'short-answer': return 'SA';
      case 'essay': return 'ES';
      default: return 'Q';
    }
  };

  return (
    <div className="create-exam-container">
      <div className="create-exam-header">
        <h1>Create AI-Proctored Exam</h1>
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
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-exam-form">
        <div className="form-tabs">
          <button 
            type="button"
            className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Details
          </button>
          <button 
            type="button"
            className={`tab ${activeTab === 'proctoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('proctoring')}
          >
            AI Proctoring
          </button>
          <button 
            type="button"
            className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions ({formData.questions.length})
          </button>
        </div>

        {/* Basic Details Tab */}
        {activeTab === 'basic' && (
          <div className="tab-content">
            <h3>Exam Information</h3>
            
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
            <h3>AI Proctoring Configuration</h3>
            <p className="proctoring-description">
              Configure AI monitoring features to detect suspicious behavior and prevent cheating.
              These features align with your system's core objectives.
            </p>

            <div className="proctoring-sections">
              <div className="proctoring-section">
                <h4>Visual Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.faceDetectionEnabled"
                      checked={formData.proctoringSettings.faceDetectionEnabled}
                      onChange={handleInputChange}
                    />
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
                    Multiple-Person Detection
                    <small>Ensure the test-taker is alone during the exam</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>Audio Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.voiceDetectionEnabled"
                      checked={formData.proctoringSettings.voiceDetectionEnabled}
                      onChange={handleInputChange}
                    />
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
                    Advanced Background Noise Analysis
                    <small>Detect suspicious background activities and sounds</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>Browser Activity Monitoring</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.browserActivityMonitoring"
                      checked={formData.proctoringSettings.browserActivityMonitoring}
                      onChange={handleInputChange}
                    />
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
                    Block Screen Sharing
                    <small>Prevent unauthorized screen sharing during the exam</small>
                  </label>
                </div>
              </div>

              <div className="proctoring-section">
                <h4>AI Risk Scoring Settings</h4>
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
                    Low Bandwidth Mode
                    <small>Optimize for slow internet connections (reduces video quality)</small>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Questions Tab */}
        {activeTab === 'questions' && (
          <div className="tab-content">
            <div className="questions-header">
              <h3>Exam Questions</h3>
              <div className="questions-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Questions:</span>
                  <span className="stat-value">{formData.questions.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Marks:</span>
                  <span className="stat-value">
                    {formData.questions.reduce((sum, q) => sum + parseInt(q.marks || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Add Question Section */}
            <div className="add-question-section">
              <div className="question-form-header">
                <h4>{isEditing ? 'Edit Question' : 'Add New Question'}</h4>
                <div className="question-controls">
                  {isEditing && (
                    <button 
                      type="button" 
                      onClick={cancelEdit}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setQuestionPreview(!questionPreview)}
                    className="btn btn-secondary btn-sm"
                  >
                    {questionPreview ? 'Edit Mode' : 'Preview Mode'}
                  </button>
                </div>
              </div>

              {!questionPreview ? (
                <div className="question-form">
                  <div className="form-row">
                    <div className="form-group question-type-group">
                      <label htmlFor="questionType">Question Type</label>
                      <select
                        id="questionType"
                        name="questionType"
                        value={currentQuestion.questionType}
                        onChange={handleQuestionTypeChange}
                        className="question-type-select"
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
                        max="100"
                        className="marks-input"
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
                        className="time-input"
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="image-upload-section">
                    <div className="image-upload-header">
                      <label className="checkbox-label image-checkbox">
                        <input
                          type="checkbox"
                          checked={currentQuestion.hasImage}
                          onChange={(e) => {
                            setCurrentQuestion(prev => ({
                              ...prev,
                              hasImage: e.target.checked
                            }));
                            if (!e.target.checked) {
                              removeImage();
                            }
                          }}
                        />
                        Include Image/Diagram
                        <small>Add visual content to support your question</small>
                      </label>
                    </div>

                    {currentQuestion.hasImage && (
                      <div className="image-upload-container">
                        {!currentQuestion.imagePreview ? (
                          <div className="image-upload-area">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="image-input"
                              id="questionImage"
                            />
                            <label htmlFor="questionImage" className="image-upload-label">
                              <div className="upload-icon">+</div>
                              <div className="upload-text">
                                <strong>Click to upload image</strong>
                                <span>or drag and drop</span>
                              </div>
                              <div className="upload-info">
                                Supports: JPEG, PNG, GIF, WebP (Max: 5MB)
                              </div>
                            </label>
                          </div>
                        ) : (
                          <div className="image-preview-container">
                            <div className="image-preview">
                              <img 
                                src={currentQuestion.imagePreview} 
                                alt="Question preview"
                                className="preview-image"
                              />
                              <button 
                                type="button" 
                                onClick={removeImage}
                                className="remove-image-btn"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="form-group">
                              <label htmlFor="imageAltText">Image Description (Alt Text)</label>
                              <input
                                type="text"
                                id="imageAltText"
                                name="imageAltText"
                                value={currentQuestion.imageAltText}
                                onChange={handleQuestionChange}
                                placeholder="Describe the image for accessibility"
                                className="alt-text-input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="questionText">Question Text *</label>
                    <textarea
                      id="questionText"
                      name="questionText"
                      value={currentQuestion.questionText}
                      onChange={handleQuestionChange}
                      placeholder="Enter your question here"
                      rows="4"
                      className="question-textarea"
                    />
                  </div>

                  {/* Enhanced MCQ Options Section */}
                  {currentQuestion.questionType === 'multiple-choice' && (
                    <div className="mcq-options-section">
                      <div className="options-header">
                        <h5>Answer Options</h5>
                        <button 
                          type="button" 
                          onClick={addOption} 
                          className="btn btn-secondary btn-sm"
                          disabled={currentQuestion.options.length >= 6}
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="mcq-options-grid">
                        {currentQuestion.options.map((option, index) => (
                          <div key={index} className="mcq-option-card">
                            <div className="option-header">
                              <div className="option-identifier">
                                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                              </div>
                              <div className="option-controls">
                                <label className="correct-toggle">
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
                                  <span className="correct-label">
                                    {option.isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                                  </span>
                                </label>
                                {currentQuestion.options.length > 2 && (
                                  <button 
                                    type="button" 
                                    onClick={() => removeOption(index)}
                                    className="btn btn-danger btn-xs"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="option-input-container">
                              <textarea
                                placeholder={`Enter option ${String.fromCharCode(65 + index)} text`}
                                value={option.text}
                                onChange={(e) => updateOption(index, 'text', e.target.value)}
                                className="mcq-option-input"
                                rows="2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
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
                        rows="3"
                        className="answer-textarea"
                      />
                    </div>
                  )}

                  <div className="question-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        resetCurrentQuestion();
                        if (isEditing) {
                          cancelEdit();
                        }
                      }}
                      className="btn btn-secondary"
                    >
                      {isEditing ? 'Cancel' : 'Clear Form'}
                    </button>
                    <button 
                      type="button" 
                      onClick={isEditing ? saveEdit : addQuestion} 
                      className="btn btn-primary"
                    >
                      {isEditing ? 'Save Changes' : 'Add Question'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="question-preview">
                  <div className="preview-header">
                    <span className="preview-type">{getQuestionTypeIcon(currentQuestion.questionType)} {currentQuestion.questionType}</span>
                    <span className="preview-marks">{currentQuestion.marks} marks</span>
                  </div>
                  
                  {currentQuestion.imagePreview && (
                    <div className="preview-image-container">
                      <img 
                        src={currentQuestion.imagePreview} 
                        alt={currentQuestion.imageAltText || "Question diagram"}
                        className="preview-question-image"
                      />
                    </div>
                  )}
                  
                  <div className="preview-question">
                    {currentQuestion.questionText || 'Enter question text...'}
                  </div>
                  
                  {currentQuestion.questionType === 'multiple-choice' && (
                    <div className="preview-options">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className={`preview-option ${option.isCorrect ? 'correct' : ''}`}>
                          {String.fromCharCode(65 + index)}. {option.text || `Option ${String.fromCharCode(65 + index)}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Questions List */}
            <div className="questions-list">
              <div className="list-header">
                <h4>Added Questions ({formData.questions.length})</h4>
                {formData.questions.length > 0 && (
                  <div className="list-actions">
                    <button 
                      type="button" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove all questions?')) {
                          setFormData(prev => ({ ...prev, questions: [] }));
                          if (isEditing) cancelEdit();
                        }
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {formData.questions.length === 0 ? (
                <div className="no-questions">
                  <div className="no-questions-text">No questions added yet</div>
                  <small>Add your first question using the form above</small>
                </div>
              ) : (
                <div className="questions-grid">
                  {formData.questions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className={`question-card ${editingQuestionIndex === index ? 'editing' : ''}`}
                    >
                      <div className="question-card-header">
                        <div className="question-meta">
                          <span className="question-number">Q{index + 1}</span>
                          <span className="question-type-badge">{getQuestionTypeIcon(question.questionType)}</span>
                          <span className="question-marks">{question.marks} marks</span>
                        </div>
                        <div className="question-actions">
                          <button 
                            type="button" 
                            onClick={() => editQuestion(index)}
                            className="btn btn-primary btn-sm"
                            title="Edit question"
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            onClick={() => duplicateQuestion(index)}
                            className="btn btn-secondary btn-sm"
                            title="Duplicate question"
                          >
                            Copy
                          </button>
                          <button 
                            type="button" 
                            onClick={() => removeQuestion(index)}
                            className="btn btn-danger btn-sm"
                            title="Remove question"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      
                      <div className="question-card-content">
                        {question.image && (
                          <div className="card-image">
                            <img 
                              src={question.image.data} 
                              alt={question.image.altText}
                              className="question-image"
                            />
                          </div>
                        )}
                        
                        <div className="question-text">
                          {question.questionText}
                        </div>
                        
                        {question.questionType === 'multiple-choice' && (
                          <div className="card-options">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className={`card-option ${option.isCorrect ? 'correct' : ''}`}>
                                <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                                <span className="option-text">{option.text}</span>
                                {option.isCorrect && <span className="correct-mark">✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.correctAnswer && question.questionType !== 'multiple-choice' && (
                          <div className="card-answer">
                            <strong>Answer:</strong> {question.correctAnswer}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
            {loading ? 'Creating...' : 'Create AI-Proctored Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExam;