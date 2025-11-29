import React from 'react';

const ProctoringDebug = ({ 
  socket, 
  proctoringActive, 
  currentRiskScore, 
  proctoringAlerts 
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="proctoring-debug" style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.75rem',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Proctoring Debug</h4>
      <div>Socket: {socket?.connected ? '✅ Connected' : '❌ Disconnected'}</div>
      <div>Active: {proctoringActive ? '✅ Yes' : '❌ No'}</div>
      <div>Risk Score: {currentRiskScore}%</div>
      <div>Alerts: {proctoringAlerts?.length || 0}</div>
      <div>Last Alert: {proctoringAlerts?.[proctoringAlerts.length - 1]?.message || 'None'}</div>
    </div>
  );
};

export default ProctoringDebug;