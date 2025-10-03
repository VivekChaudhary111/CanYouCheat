import React, { useState, useEffect, useCallback } from 'react';

const SystemCheck = ({ exam, onSystemCheckComplete, onCancel }) => {
  const [checks, setChecks] = useState({
    camera: { status: 'checking', message: 'Checking camera access...' },
    microphone: { status: 'checking', message: 'Checking microphone access...' },
    browser: { status: 'checking', message: 'Checking browser compatibility...' },
    internet: { status: 'checking', message: 'Checking internet connection...' },
    fullscreen: { status: 'checking', message: 'Checking fullscreen capability...' }
  });

  const [overallStatus, setOverallStatus] = useState('checking');

  // Wrap in useCallback to fix dependency warning
  const performSystemChecks = useCallback(async () => {
    // Camera check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setChecks(prev => ({
        ...prev,
        camera: { status: 'success', message: 'Camera access granted' }
      }));
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        camera: { status: 'error', message: 'Camera access denied or unavailable' }
      }));
    }

    // Microphone check
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setChecks(prev => ({
        ...prev,
        microphone: { status: 'success', message: 'Microphone access granted' }
      }));
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setChecks(prev => ({
        ...prev,
        microphone: { status: 'warning', message: 'Microphone access denied (optional)' }
      }));
    }

    // Browser compatibility check
    const isCompatible = checkBrowserCompatibility();
    setChecks(prev => ({
      ...prev,
      browser: { 
        status: isCompatible ? 'success' : 'error', 
        message: isCompatible ? 'Browser is compatible' : 'Browser not fully compatible' 
      }
    }));

    // Internet connection check
    const internetOk = navigator.onLine;
    setChecks(prev => ({
      ...prev,
      internet: { 
        status: internetOk ? 'success' : 'error', 
        message: internetOk ? 'Internet connection stable' : 'No internet connection' 
      }
    }));

    // Fullscreen capability check
    const canFullscreen = document.documentElement.requestFullscreen !== undefined;
    setChecks(prev => ({
      ...prev,
      fullscreen: { 
        status: canFullscreen ? 'success' : 'warning', 
        message: canFullscreen ? 'Fullscreen mode available' : 'Fullscreen mode not supported' 
      }
    }));

    // Determine overall status
    setTimeout(() => {
      setOverallStatus('complete');
    }, 2000);
  }, []);

  useEffect(() => {
    performSystemChecks();
  }, [performSystemChecks]);

  const checkBrowserCompatibility = () => {
    const requiredFeatures = [
      'mediaDevices' in navigator,
      'getUserMedia' in navigator.mediaDevices,
      'requestFullscreen' in document.documentElement || 
      'webkitRequestFullscreen' in document.documentElement ||
      'mozRequestFullScreen' in document.documentElement
    ];

    return requiredFeatures.every(feature => feature);
  };

  const getCheckIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const handleContinue = () => {
    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const cameraOk = checks.camera.status === 'success';
    
    onSystemCheckComplete({
      passed: !hasErrors && cameraOk,
      checks,
      requiredPassed: cameraOk
    });
  };

  const allChecksComplete = overallStatus === 'complete';
  const hasErrors = Object.values(checks).some(check => check.status === 'error');
  const canProceed = checks.camera.status === 'success' && !hasErrors;

  return (
    <div className="system-check-container">
      <div className="system-check-card">
        <div className="system-check-header">
          <h2>System Requirements Check</h2>
          <p>Please ensure your system meets the requirements for this proctored exam.</p>
        </div>

        <div className="exam-info">
          <h3>{exam.title}</h3>
          <div className="exam-requirements">
            <div className="requirement-item">
              <span className="label">Duration:</span>
              <span className="value">{exam.duration} minutes</span>
            </div>
            <div className="requirement-item">
              <span className="label">Questions:</span>
              <span className="value">{exam.questions.length}</span>
            </div>
            <div className="requirement-item">
              <span className="label">Proctoring:</span>
              <span className="value">AI Enhanced</span>
            </div>
          </div>
        </div>

        <div className="checks-list">
          {Object.entries(checks).map(([key, check]) => (
            <div key={key} className={`check-item ${check.status}`}>
              <div className="check-icon">
                {getCheckIcon(check.status)}
              </div>
              <div className="check-content">
                <div className="check-title">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Check
                </div>
                <div className="check-message">
                  {check.message}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allChecksComplete && (
          <div className={`system-check-result ${canProceed ? 'success' : 'error'}`}>
            {canProceed ? (
              <>
                <h4>✅ System Check Passed</h4>
                <p>Your system meets all requirements for the proctored exam.</p>
              </>
            ) : (
              <>
                <h4>❌ System Check Failed</h4>
                <p>Please resolve the errors above before proceeding with the exam.</p>
              </>
            )}
          </div>
        )}

        <div className="system-check-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          {allChecksComplete && (
            <button 
              className={`btn ${canProceed ? 'btn-primary' : 'btn-disabled'}`}
              onClick={handleContinue}
              disabled={!canProceed}
            >
              {canProceed ? 'Continue to Exam' : 'Resolve Issues First'}
            </button>
          )}
        </div>

        <div className="system-check-footer">
          <small>
            This exam requires camera access for proctoring. Please ensure your 
            camera is working and grant permission when prompted.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SystemCheck;