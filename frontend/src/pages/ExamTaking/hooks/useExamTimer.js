import { useState, useEffect, useCallback, useRef } from 'react';

export const useExamTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  // Start the timer with given duration in seconds
  const startTimer = useCallback((durationInSeconds) => {
    setTimeRemaining(durationInSeconds);
    setIsActive(true);
  }, []);

  // Stop the timer
  const stopTimer = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Pause/Resume the timer
  const toggleTimer = useCallback(() => {
    setIsActive(prev => !prev);
  }, []);

  // Add time to the timer (for extensions)
  const addTime = useCallback((seconds) => {
    setTimeRemaining(prev => Math.max(0, prev + seconds));
  }, []);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = useCallback((seconds) => {
    if (seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get time progress as percentage
  const getTimeProgress = useCallback((initialDuration) => {
    if (!initialDuration) return 0;
    return Math.max(0, Math.min(100, ((initialDuration - timeRemaining) / initialDuration) * 100));
  }, [timeRemaining]);

  // Check if time is running low (last 10% or 5 minutes)
  const isTimeRunningLow = useCallback((initialDuration) => {
    const tenPercentTime = initialDuration * 0.1;
    const fiveMinutes = 300; // 5 minutes in seconds
    return timeRemaining <= Math.max(tenPercentTime, fiveMinutes);
  }, [timeRemaining]);

  // Check if time is critically low (last 5% or 2 minutes)
  const isTimeCritical = useCallback((initialDuration) => {
    const fivePercentTime = initialDuration * 0.05;
    const twoMinutes = 120; // 2 minutes in seconds
    return timeRemaining <= Math.max(fivePercentTime, twoMinutes);
  }, [timeRemaining]);

  // Timer effect
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining]);

  // Save timer state to localStorage for persistence
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      localStorage.setItem('examTimer', JSON.stringify({
        timeRemaining,
        timestamp: Date.now()
      }));
    }
  }, [timeRemaining, isActive]);

  // Restore timer state from localStorage
  const restoreTimer = useCallback(() => {
    try {
      const saved = localStorage.getItem('examTimer');
      if (saved) {
        const { timeRemaining: savedTime, timestamp } = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - timestamp) / 1000);
        const adjustedTime = Math.max(0, savedTime - elapsed);
        
        if (adjustedTime > 0) {
          setTimeRemaining(adjustedTime);
          setIsActive(true);
          return true;
        } else {
          localStorage.removeItem('examTimer');
        }
      }
    } catch (error) {
      console.error('Error restoring timer:', error);
      localStorage.removeItem('examTimer');
    }
    return false;
  }, []);

  // Clear timer state from localStorage
  const clearSavedTimer = useCallback(() => {
    localStorage.removeItem('examTimer');
  }, []);

  return {
    timeRemaining,
    isActive,
    startTimer,
    stopTimer,
    toggleTimer,
    addTime,
    formatTime,
    getTimeProgress,
    isTimeRunningLow,
    isTimeCritical,
    restoreTimer,
    clearSavedTimer
  };
};