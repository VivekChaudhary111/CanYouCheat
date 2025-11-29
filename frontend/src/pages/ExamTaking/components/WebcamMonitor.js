import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

const WebcamMonitor = forwardRef(({ 
  stream, 
  isActive, 
  error, 
  compact = false 
}, ref) => {
  return (
    <div className={`webcam-monitor-container ${compact ? 'compact' : ''}`}>
      <div className="webcam-header">
        <h4>Camera Monitor</h4>
        <div className="status-indicator">
          <span className={`status-dot ${isActive ? 'active' : ''}`}></span>
          <span>{isActive ? 'Recording' : 'Inactive'}</span>
        </div>
      </div>
      
      <div className="webcam-display">
        {error ? (
          <div className="webcam-error">
            <span>❌ Camera Error</span>
            <p>{error}</p>
          </div>
        ) : (
          <Webcam
            ref={ref}
            audio={false}
            screenshotFormat="image/jpeg"
            width={compact ? 200 : 240}
            height={compact ? 150 : 180}
            className="webcam-video"
            style={{ 
              width: compact ? '200px' : '240px', 
              height: compact ? '150px' : '180px',
              borderRadius: '6px'
            }}
          />
        )}
      </div>
      
      {isActive && (
        <div className="webcam-info">
          <p>🤖 AI Monitoring Active</p>
          <div className="proctoring-features">
            <span className="feature">Face Detection</span>
            <span className="feature">Object Detection</span>
          </div>
        </div>
      )}
    </div>
  );
});

WebcamMonitor.displayName = 'WebcamMonitor';

export default WebcamMonitor;