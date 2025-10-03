// Risk Scoring Algorithm
class RiskScorer {
  constructor() {
    this.riskLevels = {
      LOW: { min: 0, max: 0.3, color: 'green' },
      MEDIUM: { min: 0.3, max: 0.7, color: 'yellow' },
      HIGH: { min: 0.7, max: 1, color: 'red' }
    };
  }

  // Calculate risk level based on score
  getRiskLevel(score) {
    if (score <= this.riskLevels.LOW.max) return 'LOW';
    if (score <= this.riskLevels.MEDIUM.max) return 'MEDIUM';
    return 'HIGH';
  }

  // Generate risk report
  generateRiskReport(sessionId, analyses, duration) {
    const overallScore = this.calculateWeightedScore(analyses);
    const riskLevel = this.getRiskLevel(overallScore);
    
    return {
      sessionId,
      timestamp: new Date(),
      duration,
      overallRiskScore: overallScore,
      riskLevel,
      color: this.riskLevels[riskLevel].color,
      incidents: this.extractIncidents(analyses),
      recommendations: this.generateRecommendations(riskLevel, analyses),
      summary: this.generateSummary(analyses)
    };
  }

  // Calculate weighted risk score
  calculateWeightedScore(analyses) {
    if (!analyses.length) return 0;
    
    const weights = {
      face_detection: 0.3,
      eye_movement: 0.25,
      audio_analysis: 0.25,
      browser_activity: 0.2
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    analyses.forEach(analysis => {
      const weight = weights[analysis.category] || 0.1;
      totalScore += analysis.riskScore * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  // Extract incidents from analyses
  extractIncidents(analyses) {
    return analyses
      .filter(analysis => analysis.alert)
      .map(analysis => ({
        category: analysis.category,
        timestamp: analysis.timestamp || new Date(),
        riskScore: analysis.riskScore,
        description: this.getIncidentDescription(analysis)
      }));
  }

  // Generate incident descriptions
  getIncidentDescription(analysis) {
    const descriptions = {
      face_detection: 'Suspicious face detection activity',
      eye_movement: 'Unusual eye movement patterns detected',
      audio_analysis: 'Audio anomalies detected',
      browser_activity: 'Suspicious browser activity'
    };
    
    return descriptions[analysis.category] || 'Unknown incident';
  }

  // Generate recommendations based on risk level
  generateRecommendations(riskLevel, analyses) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'HIGH':
        recommendations.push('Immediate manual review required');
        recommendations.push('Consider flagging exam for investigation');
        break;
      case 'MEDIUM':
        recommendations.push('Monitor closely for additional suspicious activity');
        recommendations.push('Review specific incidents');
        break;
      case 'LOW':
        recommendations.push('Continue normal monitoring');
        break;
    }
    
    return recommendations;
  }

  // Generate summary statistics
  generateSummary(analyses) {
    const categoryCounts = {};
    const totalAlerts = analyses.filter(a => a.alert).length;
    
    analyses.forEach(analysis => {
      categoryCounts[analysis.category] = (categoryCounts[analysis.category] || 0) + 1;
    });
    
    return {
      totalAnalyses: analyses.length,
      totalAlerts,
      alertRate: analyses.length > 0 ? (totalAlerts / analyses.length) * 100 : 0,
      categoryBreakdown: categoryCounts
    };
  }
}

module.exports = RiskScorer;