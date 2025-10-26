import {
  FoodSample,
  IntervalData,
  ScoringConfig,
  ScoringResult,
  StreakInfo,
  SessionStats,
  PaceIndicator,
  VisualizationData,
  ChartDataPoint
} from './types';

/**
 * Main scoring engine for evaluating eating pace based on food remaining samples
 */
export class ScoringEngine {
  private config: ScoringConfig;

  constructor(config?: Partial<ScoringConfig>) {
    this.config = {
      idealRate: 0.5, // 0.5% per second (30% per minute)
      tolerance: 0.2, // ±0.2% per second
      minIntervalDuration: 5, // 5 seconds minimum
      maxIntervalDuration: 60, // 60 seconds maximum
      scoringAlgorithm: 'exponential',
      exponentialDecay: 0.8,
      thresholdValues: {
        excellent: 0.6,
        good: 0.4,
        fair: 0.2,
        poor: 0.1
      },
      streakBonus: {
        minStreakLength: 3,
        bonusMultiplier: 1.2,
        maxBonusMultiplier: 2.0
      },
      durationMultiplier: {
        minDuration: 60, // 1 minute
        maxDuration: 1800, // 30 minutes
        shortSessionMultiplier: 0.8,
        longSessionMultiplier: 1.2
      },
      ...config
    };
  }

  /**
   * Calculate scores for a complete eating session
   */
  calculateScore(samples: FoodSample[]): ScoringResult {
    if (samples.length < 2) {
      throw new Error('At least 2 samples are required for scoring');
    }

    // Sort samples by timestamp
    const sortedSamples = [...samples].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate intervals
    const intervals = this.calculateIntervals(sortedSamples);

    // Calculate individual interval scores
    const scoredIntervals = intervals.map(interval => ({
      ...interval,
      score: this.calculateIntervalScore(interval),
      meetsIdealRate: this.meetsIdealRate(interval.consumptionRate)
    }));

    // Calculate streaks and apply bonuses
    const { intervalsWithBonuses, streaks } = this.calculateStreaks(scoredIntervals);

    // Calculate base score
    const baseScore = intervalsWithBonuses.reduce((sum, interval) => sum + interval.score, 0);

    // Calculate session statistics
    const sessionStats = this.calculateSessionStats(sortedSamples, intervalsWithBonuses);

    // Apply duration multiplier
    const durationMultiplier = this.calculateDurationMultiplier(sessionStats.totalDuration);
    const totalScore = baseScore * durationMultiplier;

    // Calculate final grade
    const grade = this.calculateGrade(totalScore, sessionStats);

    return {
      totalScore,
      baseScore,
      durationMultiplier,
      intervals: intervalsWithBonuses,
      streaks,
      sessionStats,
      grade
    };
  }

  /**
   * Calculate intervals from food samples
   */
  private calculateIntervals(samples: FoodSample[]): IntervalData[] {
    const intervals: IntervalData[] = [];

    for (let i = 0; i < samples.length - 1; i++) {
      const current = samples[i];
      const next = samples[i + 1];

      const duration = (next.timestamp - current.timestamp) / 1000; // Convert to seconds

      // Skip intervals that are too short or too long
      if (duration < this.config.minIntervalDuration || duration > this.config.maxIntervalDuration) {
        continue;
      }

      const foodConsumed = Math.max(0, current.foodRemaining - next.foodRemaining);
      const consumptionRate = foodConsumed / duration;

      intervals.push({
        startTime: current.timestamp,
        endTime: next.timestamp,
        duration,
        foodConsumed,
        consumptionRate,
        score: 0, // Will be calculated later
        meetsIdealRate: false // Will be calculated later
      });
    }

    return intervals;
  }

  /**
   * Calculate score for a single interval
   */
  private calculateIntervalScore(interval: IntervalData): number {
    const rate = interval.consumptionRate;
    const idealRate = this.config.idealRate;
    const tolerance = this.config.tolerance;

    if (this.config.scoringAlgorithm === 'exponential') {
      return this.calculateExponentialScore(rate, idealRate, tolerance);
    } else {
      return this.calculateThresholdScore(rate, idealRate, tolerance);
    }
  }

  /**
   * Calculate score using exponential decay
   */
  private calculateExponentialScore(rate: number, idealRate: number, tolerance: number): number {
    const deviation = Math.abs(rate - idealRate);
    const decayFactor = this.config.exponentialDecay || 0.8;
    
    if (deviation <= tolerance) {
      return 100; // Perfect score
    }

    // Exponential decay: score = 100 * decayFactor^(deviation/tolerance)
    const score = 100 * Math.pow(decayFactor, deviation / tolerance);
    return Math.max(0, score);
  }

  /**
   * Calculate score using threshold-based system
   */
  private calculateThresholdScore(rate: number, idealRate: number, tolerance: number): number {
    const deviation = Math.abs(rate - idealRate);
    const thresholds = this.config.thresholdValues!;

    if (deviation <= tolerance) {
      return 100; // Perfect score
    } else if (deviation <= tolerance + thresholds.excellent) {
      return 90; // Excellent
    } else if (deviation <= tolerance + thresholds.good) {
      return 75; // Good
    } else if (deviation <= tolerance + thresholds.fair) {
      return 60; // Fair
    } else if (deviation <= tolerance + thresholds.poor) {
      return 40; // Poor
    } else {
      return 20; // Very poor
    }
  }

  /**
   * Check if a consumption rate meets the ideal rate
   */
  private meetsIdealRate(rate: number): boolean {
    const idealRate = this.config.idealRate;
    const tolerance = this.config.tolerance;
    return Math.abs(rate - idealRate) <= tolerance;
  }

  /**
   * Calculate streaks and apply bonuses
   */
  private calculateStreaks(intervals: IntervalData[]): {
    intervalsWithBonuses: IntervalData[];
    streaks: StreakInfo[];
  } {
    const streaks: StreakInfo[] = [];
    const intervalsWithBonuses = [...intervals];

    let currentStreakStart = -1;
    let currentStreakLength = 0;

    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];

      if (interval.meetsIdealRate) {
        if (currentStreakStart === -1) {
          currentStreakStart = i;
        }
        currentStreakLength++;
      } else {
        // End current streak if it meets minimum length
        if (currentStreakLength >= this.config.streakBonus.minStreakLength) {
          const bonusMultiplier = Math.min(
            this.config.streakBonus.bonusMultiplier * currentStreakLength,
            this.config.streakBonus.maxBonusMultiplier
          );

          streaks.push({
            startIndex: currentStreakStart,
            endIndex: i - 1,
            length: currentStreakLength,
            bonusMultiplier,
            bonusPoints: 0
          });

          // Apply bonus to streak intervals
          for (let j = currentStreakStart; j < i; j++) {
            const originalScore = intervalsWithBonuses[j].score;
            const bonusPoints = originalScore * (bonusMultiplier - 1);
            intervalsWithBonuses[j].score += bonusPoints;
            streaks[streaks.length - 1].bonusPoints += bonusPoints;
          }
        }

        currentStreakStart = -1;
        currentStreakLength = 0;
      }
    }

    // Handle streak that goes to the end
    if (currentStreakLength >= this.config.streakBonus.minStreakLength) {
      const bonusMultiplier = Math.min(
        this.config.streakBonus.bonusMultiplier * currentStreakLength,
        this.config.streakBonus.maxBonusMultiplier
      );

      streaks.push({
        startIndex: currentStreakStart,
        endIndex: intervals.length - 1,
        length: currentStreakLength,
        bonusMultiplier,
        bonusPoints: 0
      });

      // Apply bonus to streak intervals
      for (let j = currentStreakStart; j < intervals.length; j++) {
        const originalScore = intervalsWithBonuses[j].score;
        const bonusPoints = originalScore * (bonusMultiplier - 1);
        intervalsWithBonuses[j].score += bonusPoints;
        streaks[streaks.length - 1].bonusPoints += bonusPoints;
      }
    }

    return { intervalsWithBonuses, streaks };
  }

  /**
   * Calculate session statistics
   */
  private calculateSessionStats(samples: FoodSample[], intervals: IntervalData[]): SessionStats {
    const startTime = samples[0].timestamp;
    const endTime = samples[samples.length - 1].timestamp;
    const totalDuration = (endTime - startTime) / 1000;

    const totalFoodConsumed = samples[0].foodRemaining - samples[samples.length - 1].foodRemaining;
    const averageRate = intervals.length > 0 
      ? intervals.reduce((sum, interval) => sum + interval.consumptionRate, 0) / intervals.length
      : 0;

    const idealRateCount = intervals.filter(interval => interval.meetsIdealRate).length;
    
    // Calculate consistency (lower standard deviation = higher consistency)
    const rates = intervals.map(interval => interval.consumptionRate);
    const mean = averageRate;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rates.length;
    const standardDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (standardDeviation / (this.config.idealRate * 2)));

    return {
      totalDuration,
      totalFoodConsumed,
      averageRate,
      intervalCount: intervals.length,
      idealRateCount,
      consistency,
      startTime,
      endTime
    };
  }

  /**
   * Calculate duration multiplier
   */
  private calculateDurationMultiplier(duration: number): number {
    const { minDuration, maxDuration, shortSessionMultiplier, longSessionMultiplier } = 
      this.config.durationMultiplier;

    if (duration < minDuration) {
      return shortSessionMultiplier;
    } else if (duration > maxDuration) {
      return longSessionMultiplier;
    } else {
      // Linear interpolation between short and long multipliers
      const ratio = (duration - minDuration) / (maxDuration - minDuration);
      return shortSessionMultiplier + (longSessionMultiplier - shortSessionMultiplier) * ratio;
    }
  }

  /**
   * Calculate final grade based on score and statistics
   */
  private calculateGrade(totalScore: number, sessionStats: SessionStats): ScoringResult['grade'] {
    const normalizedScore = totalScore / (sessionStats.intervalCount * 100); // Normalize to 0-1
    const consistencyBonus = sessionStats.consistency * 0.1; // Up to 10% bonus for consistency
    const finalScore = Math.min(1, normalizedScore + consistencyBonus);

    if (finalScore >= 0.95) return 'A+';
    if (finalScore >= 0.90) return 'A';
    if (finalScore >= 0.85) return 'A-';
    if (finalScore >= 0.80) return 'B+';
    if (finalScore >= 0.75) return 'B';
    if (finalScore >= 0.70) return 'B-';
    if (finalScore >= 0.65) return 'C+';
    if (finalScore >= 0.60) return 'C';
    if (finalScore >= 0.55) return 'C-';
    if (finalScore >= 0.50) return 'D';
    return 'F';
  }

  /**
   * Generate pace indicators for real-time feedback
   */
  generatePaceIndicators(intervals: IntervalData[]): PaceIndicator[] {
    return intervals.map(interval => {
      const rate = interval.consumptionRate;
      const idealRate = this.config.idealRate;
      const tolerance = this.config.tolerance;
      const deviation = rate - idealRate;

      if (rate === 0) {
        return {
          status: 'stopped',
          deviation: 0,
          recommendation: 'Try taking a small bite to get started',
          color: '#ff6b6b'
        };
      } else if (deviation > tolerance) {
        return {
          status: 'too-fast',
          deviation,
          recommendation: 'Slow down a bit - savor each bite',
          color: '#ffa726'
        };
      } else if (deviation < -tolerance) {
        return {
          status: 'too-slow',
          deviation,
          recommendation: 'Try to maintain a steady pace',
          color: '#42a5f5'
        };
      } else {
        return {
          status: 'ideal',
          deviation,
          recommendation: 'Perfect pace! Keep it up',
          color: '#66bb6a'
        };
      }
    });
  }

  /**
   * Generate visualization data for charts and graphs
   */
  generateVisualizationData(result: ScoringResult): VisualizationData {
    const { intervals, sessionStats } = result;

    // Consumption over time
    const consumptionChart: ChartDataPoint[] = intervals.map((interval, index) => ({
      x: interval.startTime,
      y: interval.foodConsumed,
      label: `Interval ${index + 1}`,
      color: interval.meetsIdealRate ? '#66bb6a' : '#ffa726'
    }));

    // Rate over time
    const rateChart: ChartDataPoint[] = intervals.map((interval, index) => ({
      x: interval.startTime,
      y: interval.consumptionRate,
      label: `Rate ${index + 1}`,
      color: interval.meetsIdealRate ? '#66bb6a' : '#ffa726'
    }));

    // Score over time
    const scoreChart: ChartDataPoint[] = intervals.map((interval, index) => ({
      x: interval.startTime,
      y: interval.score,
      label: `Score ${index + 1}`,
      color: interval.score >= 80 ? '#66bb6a' : interval.score >= 60 ? '#ffa726' : '#ff6b6b'
    }));

    // Pace indicators
    const paceIndicators = this.generatePaceIndicators(intervals);

    return {
      consumptionChart,
      rateChart,
      scoreChart,
      paceIndicators
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }
}
