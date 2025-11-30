import { useState } from 'react';
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useExamSubmission = () => {
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const submitExam = async (submissionData) => {
    setSubmissionLoading(true);
    setSubmissionError(null);

    try {
      console.log('🚀 Submitting AI-proctored exam with behavior analysis...', {
        examId: submissionData.examId,
        sessionId: submissionData.sessionId,
        answerCount: Object.keys(submissionData.answers || {}).length,
        submissionType: submissionData.submissionType
      });

      const response = await fetch(`${API_BASE_URL}/api/exams/${submissionData.examId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: submissionData.sessionId,
          answers: submissionData.answers || {},
          endTime: submissionData.endTime || new Date().toISOString(),
          submissionType: submissionData.submissionType || 'manual'
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ AI-proctored exam submitted successfully:', {
          submissionId: data.submission.id,
          score: data.submission.percentage,
          riskScore: data.submission.aiRiskScore,
          flagged: data.submission.flaggedForReview
        });
        
        return {
          success: true,
          message: data.message,
          submission: data.submission,
          aiAnalysis: data.aiAnalysis,
          nextSteps: data.nextSteps
        };
      } else {
        throw new Error(data.message || 'Failed to submit AI-proctored exam');
      }
    } catch (error) {
      console.error('❌ Error submitting AI-proctored exam:', error);
      setSubmissionError(error.message);
      return {
        success: false,
        message: error.message
      };
    } finally {
      setSubmissionLoading(false);
    }
  };

  const autoSaveAnswers = async (examId, sessionId, answers) => {
    try {
      console.log('💾 Auto-saving answers for AI-proctored exam...', {
        examId,
        sessionId,
        answerCount: Object.keys(answers || {}).length
      });

      const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/autosave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, answers })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Answers auto-saved successfully at:', data.savedAt);
      }
      
      return data.success;
    } catch (error) {
      console.error('❌ Error auto-saving answers:', error);
      return false;
    }
  };

  return {
    submitExam,
    autoSaveAnswers,
    submissionLoading,
    submissionError
  };
};