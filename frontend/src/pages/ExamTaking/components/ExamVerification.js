import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAuth } from '../../../context/AuthContext'; // Adjust path if needed
const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Simple loading spinner component (or use a library)
const Spinner = () => <div className="loading-spinner"></div>; 

const ExamVerification = ({ examId, onVerificationSuccess, onVerificationFail, onCancel }) => {
  const webcamRef = useRef(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null); // Optional countdown before capture
  const { token } = useAuth(); // Get token for API call

  // Function to handle the verification process
  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    // Capture image
    const live_image_base64 = webcamRef.current.getScreenshot();
    if (!live_image_base64) {
      setError('Could not capture image. Please ensure webcam access.');
      setIsVerifying(false);
      return;
    }

    try {
      // Send to backend endpoint (you defined this earlier)
      const response = await fetch(`${API_BASE_URL}/api/exams/${examId}/verify-identity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ live_image_base64 })
      });

      const data = await response.json();

      if (response.ok && data.success && data.verified) {
        console.log('✅ Verification successful:', data.details);
        onVerificationSuccess(); // Call the callback from ExamTaking.js
      } else {
        const failureReason = data.details?.error || data.message || 'Verification failed';
        console.error('❌ Verification failed:', data);
        setError(`Verification Failed: ${failureReason}. Please ensure you are centered, well-lit, and match your registration photo.`);
        // Call the failure callback (optional)
        if (onVerificationFail) {
           onVerificationFail(failureReason);
        }
      }
    } catch (err) {
      console.error('❌ Verification API error:', err);
      setError('A network error occurred during verification. Please try again.');
       if (onVerificationFail) {
           onVerificationFail('Network error');
       }
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Optional: Start countdown on button click before capturing
  const startCaptureCountdown = () => {
    setError('');
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setCountdown(null);
        handleVerify(); // Capture after countdown
      }
    }, 1000);
  };

  return (
    <div className="exam-verification-container">
      <div className="verification-card">
        <h2>Identity Verification</h2>
        <p>Please position your face clearly in the frame below and click "Verify Identity".</p>
        
        <div className="webcam-container verification-webcam">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam-element"
            videoConstraints={{ width: 640, height: 480, facingMode: "user" }} // Larger size for verification
          />
          {countdown !== null && <div className="countdown-overlay">{countdown > 0 ? countdown : '📸'}</div>}
        </div>

        {error && <p className="error-message verification-error">{error}</p>}

        <div className="verification-actions">
          <button 
            className="btn btn-secondary" 
            onClick={onCancel} 
            disabled={isVerifying}
          >
            Cancel Exam
          </button>
          <button 
            className="btn btn-primary" 
            onClick={startCaptureCountdown} // Use countdown or handleVerify directly
            disabled={isVerifying || countdown !== null}
          >
            {isVerifying ? <Spinner /> : 'Verify Identity'}
          </button>
        </div>
      </div>
       {/* Basic styles - add to ExamTaking.css or a new file */}
       <style>{`
        .exam-verification-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh; /* Adjust as needed */
            padding: 2rem;
        }
        .verification-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 700px;
        }
        .verification-webcam {
            margin: 1.5rem auto;
            border-radius: 8px; /* Consistent rounding */
        }
        .countdown-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 5rem;
            color: rgba(255, 255, 255, 0.8);
            background-color: rgba(0,0,0,0.3);
            border-radius: 8px; /* Match webcam */
        }
        .verification-actions {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        .verification-error {
           color: #dc2626; /* Red error text */
           margin-top: 1rem;
           font-weight: 500;
        }
        /* Make spinner visible */
         .loading-spinner { 
             display: inline-block; /* Make it visible */
             width: 1em; height: 1em; 
             border: 2px solid rgba(0,0,0,0.1); 
             border-top-color: currentColor; 
             border-radius: 50%; 
             animation: spin 1s linear infinite;
          }
         @keyframes spin { 0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
      `}</style>
    </div>
  );
};

export default ExamVerification;