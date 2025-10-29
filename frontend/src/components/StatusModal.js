import React, { useEffect } from 'react';
import './StatusModal.css';

const StatusModal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  autoClose = false, 
  autoCloseDelay = 3000,
  showCloseButton = true,
  actionButton = null 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="status-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M20 6L9 17L4 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="status-icon error">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="status-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 0 0 3.24 21H20.76A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="status-icon info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className={`modal-content ${type}`}>
        <div className="modal-header">
          {getStatusIcon()}
          <div className="modal-text">
            <h3 id="modal-title" className="modal-title">{title}</h3>
            <p id="modal-description" className="modal-message">{message}</p>
          </div>
          {showCloseButton && (
            <button 
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M18 6L6 18M6 6L18 18" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {actionButton && (
          <div className="modal-actions">
            {actionButton}
          </div>
        )}

        {autoClose && (
          <div className="modal-progress">
            <div 
              className="progress-bar"
              style={{ 
                animationDuration: `${autoCloseDelay}ms` 
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusModal;