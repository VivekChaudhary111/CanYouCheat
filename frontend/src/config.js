const config = {
  // API URLs
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  AI_SERVICE_URL: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000',
  SERVER_URL: process.env.REACT_APP_SERVER_URL || 'http://localhost:5000',
  
  // Proctoring Settings - IMPROVED PARSING
  FRAME_CAPTURE_RATE: parseInt(process.env.REACT_APP_FRAME_CAPTURE_RATE, 10) || 2,
  RISK_THRESHOLD: parseInt(process.env.REACT_APP_RISK_THRESHOLD, 10) || 70,
  MAX_ALERTS: parseInt(process.env.REACT_APP_MAX_ALERTS, 10) || 10,
  
  // Feature Flags
  DEBUG_MODE: process.env.REACT_APP_DEBUG_MODE === 'true',
  ENABLE_AI_PROCTORING: process.env.REACT_APP_ENABLE_AI_PROCTORING !== 'false', // Default to true
  ENABLE_FACE_DETECTION: process.env.REACT_APP_ENABLE_FACE_DETECTION !== 'false', // Default to true
  ENABLE_OBJECT_DETECTION: process.env.REACT_APP_ENABLE_OBJECT_DETECTION !== 'false', // Default to true
  
  // Performance
  OPTIMIZE_IMAGES: process.env.REACT_APP_OPTIMIZE_IMAGES === 'true',
  
  // Development
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

export default config;