import React, { useEffect, useRef } from 'react';

const WebcamMonitor = ({ stream, isActive, error, compact = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const renderWebcamContent = () => {
    if (error) {
      return (
        <div className="webcam-error">
          <div className="error-icon">📷</div>
          <p>{error}</p>
        </div>
      );
    }

    if (!isActive || !stream) {
      return (
        <div className="webcam-placeholder">
          <div className="camera-icon">📹</div>
          <p>Camera not active</p>
        </div>
      );
    }

    return (
      <div className="webcam-video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="webcam-video"
        />
        <div className="webcam-overlay">
          {/* Face detection boxes would go here in real implementation */}
        </div>
      </div>
    );
  };

  return (
    <div className={`webcam-monitor ${isActive ? 'active' : ''} ${compact ? 'compact' : ''}`}>
      <div className="webcam-header">
        <h4>Camera Monitor</h4>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span>{isActive ? 'Recording' : 'Inactive'}</span>
        </div>
      </div>
      
      <div className="webcam-content">
        {renderWebcamContent()}
      </div>
      
      {isActive && (
        <div className="webcam-info">
          <p>🤖 AI Proctoring Active</p>
          <ul>
            <li>Face detection enabled</li>
            <li>Eye tracking active</li>
            <li>Movement monitoring</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WebcamMonitor;