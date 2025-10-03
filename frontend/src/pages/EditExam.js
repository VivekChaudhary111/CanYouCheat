import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EditExam.css';

const EditExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, isInstructor } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingScore: 60,
    startDate: '',
    endDate: '',
    questions: [],
    proctoringSettings: {
      faceDetectionEnabled: true,
      eyeTrackingEnabled: true,
      voiceDetectionEnabled: true,
      multiplePersonDetection: true,
      browserActivityMonitoring: true,
      riskThreshold: 70,
      allowedViolations: 3
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (!isInstructor) {
      navigate('/dashboard');
      return;
    }
    
    if (examId && token) {
      fetchExamData();
    }
  }, [examId, token, isInstructor]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        const exam = data.exam;
        
        // Format dates for datetime-local input
        const formatDate = (dateString) => {
          const date = new Date(dateString);
          return date.toISOString().slice(0, 16);
        };

        setFormData({
          title: exam.title || '',
          description: exam.description || '',
          duration: exam.duration || 60,
          totalMarks: exam.totalMarks || 100,
          passingScore: exam.passingScore || 60,
          startDate: formatDate(exam.startDate),
          endDate: formatDate(exam.endDate),
          questions: exam.questions || [],
          proctoringSettings: {
            ...exam.proctoringSettings,
            riskThreshold: exam.proctoringSettings?.riskThreshold || 70,
            allowedViolations: exam.proctoringSettings?.allowedViolations || 3
          }
        });
      } else {
        throw new Error(data.message || 'Failed to fetch exam data');
      }

    } catch (error) {
      console.error('Error fetching exam data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Exam updated successfully!');
        setTimeout(() => {
          navigate('/exams');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to update exam');
      }

    } catch (error) {
      console.error('Error updating exam:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-exam-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h2>Loading Exam Data</h2>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="edit-exam-container">
        <div className="error-state">
          <h2>Error Loading Exam</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/exams')}>
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-exam-container">
      <div className="page-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/exams')}>
            ← Back to Exams
          </button>
          <h1>Edit Exam</h1>
          <p className="exam-title">Modifying: {formData.title}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-exam-form">
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
            AI Proctoring Settings
          </button>
        </div>

        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-section">
              <h3>Exam Information</h3>
              
              <div className="form-group">
                <label htmlFor="title">Exam Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes)</label>
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
                  <label htmlFor="totalMarks">Total Marks</label>
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
                  <label htmlFor="passingScore">Passing Score</label>
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
                  <label htmlFor="startDate">Start Date & Time</label>
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
                  <label htmlFor="endDate">End Date & Time</label>
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
          </div>
        )}

        {activeTab === 'proctoring' && (
          <div className="tab-content">
            <div className="form-section">
              <h3>AI Proctoring Configuration</h3>
              <p className="section-description">
                Configure AI monitoring features for behavior analysis and cheating detection.
              </p>

              <div className="proctoring-grid">
                <div className="proctoring-group">
                  <h4>Visual Monitoring</h4>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.faceDetectionEnabled"
                      checked={formData.proctoringSettings.faceDetectionEnabled}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Face Detection and Tracking
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
                  </label>
                </div>

                <div className="proctoring-group">
                  <h4>Audio Monitoring</h4>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.voiceDetectionEnabled"
                      checked={formData.proctoringSettings.voiceDetectionEnabled}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Voice and Background Noise Detection
                  </label>
                </div>

                <div className="proctoring-group">
                  <h4>Browser Activity</h4>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="proctoring.browserActivityMonitoring"
                      checked={formData.proctoringSettings.browserActivityMonitoring}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    Browser Activity Monitoring
                  </label>
                </div>

                <div className="proctoring-group">
                  <h4>Risk Scoring Settings</h4>
                  
                  <div className="form-group">
                    <label htmlFor="riskThreshold">
                      Risk Threshold: {formData.proctoringSettings.riskThreshold}%
                    </label>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/exams')}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Updating...' : 'Update Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditExam;