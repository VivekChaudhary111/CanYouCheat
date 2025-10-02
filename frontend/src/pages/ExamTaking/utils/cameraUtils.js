/**
 * Camera utilities for AI-Enhanced Online Exam Proctoring System
 * Provides helper functions for webcam management and proctoring features
 */

// Check if browser supports required camera features
export const isCameraSupported = () => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
};

// Get optimal camera constraints for proctoring
export const getProctoringConstraints = (quality = 'standard') => {
  const constraints = {
    standard: {
      video: {
        width: { ideal: 640, min: 320, max: 1280 },
        height: { ideal: 480, min: 240, max: 720 },
        frameRate: { ideal: 15, min: 10, max: 30 },
        facingMode: 'user'
      },
      audio: false
    },
    high: {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, min: 15 },
        facingMode: 'user'
      },
      audio: false
    },
    low: {
      video: {
        width: { ideal: 320, max: 640 },
        height: { ideal: 240, max: 480 },
        frameRate: { ideal: 10, max: 15 },
        facingMode: 'user'
      },
      audio: false
    }
  };

  return constraints[quality] || constraints.standard;
};

// Create canvas from video stream for image processing
export const createCanvasFromVideo = (videoElement) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  context.drawImage(videoElement, 0, 0);
  
  return canvas;
};

// Capture frame from video stream
export const captureFrame = async (stream) => {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      
      video.onloadedmetadata = () => {
        video.play();
        
        video.addEventListener('loadeddata', () => {
          const canvas = createCanvasFromVideo(video);
          
          canvas.toBlob((blob) => {
            resolve({
              blob,
              dataUrl: canvas.toDataURL('image/jpeg', 0.8),
              timestamp: Date.now(),
              width: canvas.width,
              height: canvas.height
            });
          }, 'image/jpeg', 0.8);
        });
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
    } catch (error) {
      reject(error);
    }
  });
};

// Convert blob to base64 for API transmission
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Validate video stream quality
export const validateStreamQuality = (stream) => {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    return { valid: false, error: 'No video track found' };
  }

  const settings = videoTrack.getSettings();
  const capabilities = videoTrack.getCapabilities();

  const issues = [];

  // Check resolution
  if (settings.width < 320 || settings.height < 240) {
    issues.push('Video resolution too low for effective monitoring');
  }

  // Check frame rate
  if (settings.frameRate < 10) {
    issues.push('Frame rate too low for smooth monitoring');
  }

  // Check if camera is active
  if (videoTrack.readyState !== 'live') {
    issues.push('Camera is not active');
  }

  return {
    valid: issues.length === 0,
    issues,
    settings,
    capabilities
  };
};

// Calculate video quality score
export const calculateQualityScore = (settings) => {
  let score = 0;
  
  // Resolution score (0-40 points)
  const pixels = settings.width * settings.height;
  if (pixels >= 921600) score += 40; // 1280x720 or higher
  else if (pixels >= 307200) score += 30; // 640x480
  else if (pixels >= 76800) score += 20; // 320x240
  else score += 10;

  // Frame rate score (0-30 points)
  if (settings.frameRate >= 25) score += 30;
  else if (settings.frameRate >= 15) score += 20;
  else if (settings.frameRate >= 10) score += 15;
  else score += 5;

  // Lighting conditions (0-30 points) - placeholder for future AI integration
  score += 25; // Default good lighting score

  return Math.min(100, score);
};

// Get camera device information
export const getCameraDeviceInfo = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    
    return cameras.map(camera => ({
      deviceId: camera.deviceId,
      label: camera.label || `Camera ${camera.deviceId.substr(0, 8)}`,
      groupId: camera.groupId
    }));
  } catch (error) {
    console.error('Error getting camera devices:', error);
    return [];
  }
};

// Monitor stream health
export const monitorStreamHealth = (stream, callback) => {
  const videoTrack = stream.getVideoTracks()[0];
  
  const checkHealth = () => {
    const health = {
      active: videoTrack.readyState === 'live',
      muted: videoTrack.muted,
      enabled: videoTrack.enabled,
      settings: videoTrack.getSettings()
    };
    
    callback(health);
  };

  // Check immediately
  checkHealth();

  // Set up periodic health checks
  const healthInterval = setInterval(checkHealth, 5000);

  // Listen for track events
  videoTrack.addEventListener('ended', () => {
    callback({ active: false, ended: true });
    clearInterval(healthInterval);
  });

  videoTrack.addEventListener('mute', () => {
    callback({ active: true, muted: true });
  });

  videoTrack.addEventListener('unmute', () => {
    callback({ active: true, muted: false });
  });

  // Return cleanup function
  return () => {
    clearInterval(healthInterval);
  };
};

// Detect browser-specific camera issues
export const detectBrowserIssues = () => {
  const userAgent = navigator.userAgent;
  const issues = [];

  // Chrome-specific issues
  if (userAgent.includes('Chrome')) {
    if (!window.isSecureContext) {
      issues.push('Camera access requires HTTPS in Chrome');
    }
  }

  // Firefox-specific issues
  if (userAgent.includes('Firefox')) {
    // Firefox-specific checks can be added here
  }

  // Safari-specific issues
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    // Safari-specific checks can be added here
  }

  return issues;
};

// Prepare image data for AI analysis (placeholder for future integration)
export const prepareImageForAI = async (imageBlob) => {
  try {
    const base64 = await blobToBase64(imageBlob);
    
    return {
      image: base64,
      format: 'jpeg',
      timestamp: Date.now(),
      metadata: {
        size: imageBlob.size,
        type: imageBlob.type
      }
    };
  } catch (error) {
    console.error('Error preparing image for AI:', error);
    throw error;
  }
};