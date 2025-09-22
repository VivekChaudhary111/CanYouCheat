// AI Behavior Analysis Engine
class BehaviorAnalyzer {
  constructor() {
    this.riskThreshold = 0.7;
  }

  // Face Detection Analysis
  analyzeFaceDetection(faceData) {
    let riskScore = 0;
    
    // No face detected
    if (!faceData.faceDetected) {
      riskScore += 0.3;
    }
    
    // Multiple faces detected
    if (faceData.faceCount > 1) {
      riskScore += 0.5;
    }
    
    // Face position changed significantly
    if (faceData.positionChanged > 0.3) {
      riskScore += 0.2;
    }
    
    return {
      category: 'face_detection',
      riskScore: Math.min(riskScore, 1),
      alert: riskScore > this.riskThreshold,
      details: faceData
    };
  }

  // Eye Movement Analysis
  analyzeEyeMovement(eyeData) {
    let riskScore = 0;
    
    // Looking away from screen frequently
    if (eyeData.lookAwayFrequency > 5) {
      riskScore += 0.4;
    }
    
    // Eyes closed for too long
    if (eyeData.eyesClosedDuration > 3000) {
      riskScore += 0.3;
    }
    
    // Rapid eye movements (reading from another source)
    if (eyeData.rapidMovements > 10) {
      riskScore += 0.3;
    }
    
    return {
      category: 'eye_movement',
      riskScore: Math.min(riskScore, 1),
      alert: riskScore > this.riskThreshold,
      details: eyeData
    };
  }

  // Audio Analysis
  analyzeAudio(audioData) {
    let riskScore = 0;
    
    // Multiple voices detected
    if (audioData.voiceCount > 1) {
      riskScore += 0.6;
    }
    
    // Background noise level too high
    if (audioData.noiseLevel > 0.7) {
      riskScore += 0.2;
    }
    
    // Suspicious keywords detected
    if (audioData.suspiciousKeywords.length > 0) {
      riskScore += 0.4;
    }
    
    return {
      category: 'audio_analysis',
      riskScore: Math.min(riskScore, 1),
      alert: riskScore > this.riskThreshold,
      details: audioData
    };
  }

  // Browser Activity Analysis
  analyzeBrowserActivity(browserData) {
    let riskScore = 0;
    
    // Tab switching
    if (browserData.tabSwitches > 3) {
      riskScore += 0.5;
    }
    
    // Window focus lost
    if (browserData.focusLost > 2) {
      riskScore += 0.4;
    }
    
    // Copy/paste activities
    if (browserData.copyPasteCount > 0) {
      riskScore += 0.3;
    }
    
    return {
      category: 'browser_activity',
      riskScore: Math.min(riskScore, 1),
      alert: riskScore > this.riskThreshold,
      details: browserData
    };
  }

  // Calculate overall risk score
  calculateOverallRisk(analyses) {
    const weights = {
      face_detection: 0.3,
      eye_movement: 0.25,
      audio_analysis: 0.25,
      browser_activity: 0.2
    };
    
    let overallScore = 0;
    let totalWeight = 0;
    
    analyses.forEach(analysis => {
      const weight = weights[analysis.category] || 0;
      overallScore += analysis.riskScore * weight;
      totalWeight += weight;
    });
    
    return {
      overallRiskScore: totalWeight > 0 ? overallScore / totalWeight : 0,
      highRisk: overallScore > this.riskThreshold,
      analyses
    };
  }
}

module.exports = BehaviorAnalyzer;