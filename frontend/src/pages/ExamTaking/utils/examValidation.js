/**
 * Exam validation utilities for AI-Enhanced Online Exam Proctoring System
 * Handles validation logic for exam taking functionality
 */

// Validate exam access permissions
export const validateExamAccess = (exam, user) => {
  const now = new Date();
  const startDate = new Date(exam.startDate);
  const endDate = new Date(exam.endDate);

  const validations = {
    isActive: {
      valid: exam.isActive,
      message: 'This exam is not currently active'
    },
    timeWindow: {
      valid: now >= startDate && now <= endDate,
      message: `Exam is only available from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`
    },
    studentAllowed: {
      valid: exam.allowedStudents.some(student => 
        (student._id || student.id || student) === user.id
      ),
      message: 'You are not authorized to take this exam'
    },
    alreadyTaken: {
      valid: !exam.submissions?.some(submission => 
        (submission.student._id || submission.student.id || submission.student) === user.id
      ),
      message: 'You have already submitted this exam'
    }
  };

  const failed = Object.entries(validations).filter(([key, validation]) => !validation.valid);
  
  return {
    valid: failed.length === 0,
    errors: failed.map(([key, validation]) => validation.message),
    validations
  };
};

// Validate system requirements for proctored exam
export const validateSystemRequirements = async () => {
  const requirements = [];

  // Camera check
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    requirements.push({
      name: 'Camera',
      status: 'success',
      message: 'Camera access available'
    });
  } catch (error) {
    requirements.push({
      name: 'Camera',
      status: 'error',
      message: 'Camera access required for proctored exam'
    });
  }

  // Microphone check (optional)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    requirements.push({
      name: 'Microphone',
      status: 'success',
      message: 'Microphone access available'
    });
  } catch (error) {
    requirements.push({
      name: 'Microphone',
      status: 'warning',
      message: 'Microphone access recommended but not required'
    });
  }

  // Browser compatibility
  const browserSupport = checkBrowserSupport();
  requirements.push({
    name: 'Browser',
    status: browserSupport.supported ? 'success' : 'error',
    message: browserSupport.message
  });

  // Internet connection
  requirements.push({
    name: 'Internet',
    status: navigator.onLine ? 'success' : 'error',
    message: navigator.onLine ? 'Internet connection active' : 'Internet connection required'
  });

  // Fullscreen capability
  const canFullscreen = document.documentElement.requestFullscreen !== undefined ||
                       document.documentElement.webkitRequestFullscreen !== undefined ||
                       document.documentElement.mozRequestFullScreen !== undefined;
  
  requirements.push({
    name: 'Fullscreen',
    status: canFullscreen ? 'success' : 'warning',
    message: canFullscreen ? 'Fullscreen mode supported' : 'Fullscreen mode not available'
  });

  const hasErrors = requirements.some(req => req.status === 'error');
  
  return {
    valid: !hasErrors,
    requirements,
    canProceed: requirements.filter(req => req.status === 'success').length >= 3
  };
};

// Check browser support for proctoring features
export const checkBrowserSupport = () => {
  const requiredFeatures = [
    { name: 'getUserMedia', check: () => navigator.mediaDevices?.getUserMedia },
    { name: 'WebRTC', check: () => window.RTCPeerConnection },
    { name: 'LocalStorage', check: () => window.localStorage },
    { name: 'SessionStorage', check: () => window.sessionStorage },
    { name: 'Fullscreen API', check: () => document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen }
  ];

  const unsupported = requiredFeatures.filter(feature => !feature.check());
  
  return {
    supported: unsupported.length === 0,
    message: unsupported.length === 0 
      ? 'Browser fully supports proctoring features'
      : `Missing support for: ${unsupported.map(f => f.name).join(', ')}`,
    missingFeatures: unsupported.map(f => f.name)
  };
};

// Validate individual answer format
export const validateAnswer = (question, answer) => {
  if (answer === null || answer === undefined || answer === '') {
    return {
      valid: !question.required,
      message: question.required ? 'This question is required' : null
    };
  }

  switch (question.type) {
    case 'multiple-choice':
      const isValidIndex = typeof answer === 'number' && 
                          answer >= 0 && 
                          answer < question.options.length;
      return {
        valid: isValidIndex,
        message: isValidIndex ? null : 'Invalid option selected'
      };

    case 'text':
      const textValid = typeof answer === 'string' && answer.trim().length > 0;
      const withinLimit = !question.maxLength || answer.length <= question.maxLength;
      const meetsMinimum = !question.minLength || answer.length >= question.minLength;
      
      return {
        valid: textValid && withinLimit && meetsMinimum,
        message: !textValid ? 'Text answer required' :
                !withinLimit ? `Answer exceeds maximum length of ${question.maxLength} characters` :
                !meetsMinimum ? `Answer must be at least ${question.minLength} characters` :
                null
      };

    case 'number':
      const numAnswer = parseFloat(answer);
      const isNumber = !isNaN(numAnswer);
      const withinRange = (!question.min || numAnswer >= question.min) &&
                         (!question.max || numAnswer <= question.max);
      
      return {
        valid: isNumber && withinRange,
        message: !isNumber ? 'Valid number required' :
                !withinRange ? `Number must be between ${question.min || 0} and ${question.max || 'unlimited'}` :
                null
      };

    default:
      return { valid: true, message: null };
  }
};

// Validate all answers before submission
export const validateAllAnswers = (questions, answers) => {
  const validationResults = {};
  let hasErrors = false;
  let totalRequired = 0;
  let requiredAnswered = 0;

  questions.forEach((question, index) => {
    const answer = answers[index];
    const validation = validateAnswer(question, answer);
    
    validationResults[index] = validation;
    
    if (!validation.valid) {
      hasErrors = true;
    }

    if (question.required) {
      totalRequired++;
      if (answer !== null && answer !== undefined && answer !== '') {
        requiredAnswered++;
      }
    }
  });

  const completionRate = questions.length > 0 
    ? Object.keys(answers).filter(index => {
        const answer = answers[index];
        return answer !== null && answer !== undefined && answer !== '';
      }).length / questions.length * 100
    : 0;

  return {
    valid: !hasErrors,
    validationResults,
    summary: {
      totalQuestions: questions.length,
      totalRequired,
      requiredAnswered,
      totalAnswered: Object.keys(answers).filter(index => {
        const answer = answers[index];
        return answer !== null && answer !== undefined && answer !== '';
      }).length,
      completionRate: Math.round(completionRate),
      hasErrors
    }
  };
};

// Validate exam submission timing
export const validateSubmissionTiming = (exam, startTime, endTime) => {
  const examStart = new Date(startTime);
  const examEnd = new Date(endTime);
  const duration = (examEnd - examStart) / 1000 / 60; // in minutes
  const allowedDuration = exam.duration;

  const validations = {
    durationValid: {
      valid: duration <= (allowedDuration * 1.1), // Allow 10% buffer
      message: `Exam duration exceeded allowed time of ${allowedDuration} minutes`
    },
    minimumTime: {
      valid: duration >= 1, // At least 1 minute
      message: 'Exam submission too quick - minimum time not met'
    },
    chronological: {
      valid: examEnd > examStart,
      message: 'Invalid submission times'
    }
  };

  const failed = Object.entries(validations).filter(([key, validation]) => !validation.valid);

  return {
    valid: failed.length === 0,
    duration: Math.round(duration),
    allowedDuration,
    errors: failed.map(([key, validation]) => validation.message)
  };
};

// Security validation for exam environment
export const validateExamEnvironment = () => {
  const issues = [];

  // Configurable percentage threshold for developer tools detection
  const DEVTOOLS_HEIGHT_DIFF_PERCENT = 0.2; // 20%
  // Check for developer tools (basic detection)
  if (
    window.outerHeight > 0 && // avoid division by zero
    (window.outerHeight - window.innerHeight) > window.outerHeight * DEVTOOLS_HEIGHT_DIFF_PERCENT
  ) {
    issues.push('Developer tools may be open');
  }

  // Check for multiple tabs/windows (basic detection)
  if (document.hidden) {
    issues.push('Tab is not currently active');
  }

  // Check for fullscreen mode (if required)
  const isFullscreen = !!(document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement);
  
  if (!isFullscreen) {
    issues.push('Fullscreen mode recommended for secure exam environment');
  }

  return {
    secure: issues.length === 0,
    issues,
    recommendations: [
      'Keep the exam tab active and focused',
      'Close unnecessary applications',
      'Use fullscreen mode if possible',
      'Ensure stable internet connection'
    ]
  };
};

// Rate limiting for API calls
export const createRateLimiter = (maxCalls, timeWindow) => {
  const calls = [];
  
  return () => {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    // Remove calls outside the window
    while (calls.length > 0 && calls[0] < windowStart) {
      calls.shift();
    }
    
    if (calls.length >= maxCalls) {
      return false; // Rate limit exceeded
    }
    
    calls.push(now);
    return true;
  };
};