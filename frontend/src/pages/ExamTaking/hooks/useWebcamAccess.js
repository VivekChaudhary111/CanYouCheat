import { useState, useEffect, useCallback, useRef } from 'react';

export const useWebcamAccess = () => {
  const [webcamStream, setWebcamStream] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const streamRef = useRef(null);

  // Get available camera devices
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      return videoDevices;
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  }, []);

  // Start webcam with specific constraints
  const startWebcam = useCallback(async (constraints = {}) => {
    setIsLoading(true);
    setWebcamError(null);

    try {
      // Default constraints for AI proctoring
      const defaultConstraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          frameRate: { ideal: 15, min: 10 },
          facingMode: 'user'
        },
        audio: false // Audio handled separately for proctoring
      };

      const finalConstraints = {
        ...defaultConstraints,
        ...constraints
      };

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
      
      // Get device information
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      setDeviceInfo({
        deviceId: settings.deviceId,
        label: videoTrack.label,
        resolution: `${settings.width}x${settings.height}`,
        frameRate: settings.frameRate
      });

      streamRef.current = stream;
      setWebcamStream(stream);
      setIsWebcamActive(true);
      setIsLoading(false);

      return true;
    } catch (error) {
      console.error('Webcam access error:', error);
      
      let errorMessage = 'Failed to access camera';
      
      switch (error.name) {
        case 'NotFoundError':
          errorMessage = 'No camera device found';
          break;
        case 'NotAllowedError':
          errorMessage = 'Camera access denied by user';
          break;
        case 'NotReadableError':
          errorMessage = 'Camera is already in use by another application';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera does not meet the required constraints';
          break;
        case 'SecurityError':
          errorMessage = 'Camera access blocked by security policy';
          break;
        default:
          errorMessage = `Camera error: ${error.message}`;
      }

      setWebcamError(errorMessage);
      setIsWebcamActive(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    setWebcamStream(null);
    setIsWebcamActive(false);
    setWebcamError(null);
    setDeviceInfo(null);
  }, []);

  // Switch to different camera device
  const switchCamera = useCallback(async (deviceId) => {
    if (!deviceId) return false;

    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        frameRate: { ideal: 15, min: 10 }
      }
    };

    return await startWebcam(constraints);
  }, [startWebcam]);

  // Check camera permissions
  const checkCameraPermissions = useCallback(async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      return permissionStatus.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return 'unknown';
    }
  }, []);

  // Take a snapshot from the webcam
  const takeSnapshot = useCallback(() => {
    if (!webcamStream || !isWebcamActive) {
      return null;
    }

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    return new Promise((resolve) => {
      video.srcObject = webcamStream;
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          resolve({
            blob,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            timestamp: new Date().toISOString(),
            dimensions: {
              width: canvas.width,
              height: canvas.height
            }
          });
        }, 'image/jpeg', 0.8);
      };
    });
  }, [webcamStream, isWebcamActive]);

  // Monitor webcam status
  useEffect(() => {
    if (webcamStream) {
      const videoTrack = webcamStream.getVideoTracks()[0];
      
      const handleTrackEnd = () => {
        console.log('Webcam track ended');
        setIsWebcamActive(false);
        setWebcamError('Camera connection lost');
      };

      videoTrack.addEventListener('ended', handleTrackEnd);

      return () => {
        videoTrack.removeEventListener('ended', handleTrackEnd);
      };
    }
  }, [webcamStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return {
    webcamStream,
    isWebcamActive,
    webcamError,
    isLoading,
    deviceInfo,
    startWebcam,
    stopWebcam,
    switchCamera,
    getVideoDevices,
    checkCameraPermissions,
    takeSnapshot
  };
};