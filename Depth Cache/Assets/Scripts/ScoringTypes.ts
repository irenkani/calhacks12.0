/**
 * Core types for the eating pace scoring system
 */

export interface FoodSample {
  /** Timestamp when the sample was taken */
  timestamp: number;
  /** Percentage of food remaining (0-100) */
  foodRemaining: number;
  /** Optional confidence score for the measurement */
  confidence?: number;
}

export interface IntervalData {
  /** Start timestamp of the interval */
  startTime: number;
  /** End timestamp of the interval */
  endTime: number;
  /** Duration in seconds */
  duration: number;
  /** Food consumed during this interval (percentage) */
  foodConsumed: number;
  /** Rate of consumption (percentage per second) */
  consumptionRate: number;
  /** Score for this interval */
  score: number;
  /** Whether this interval meets the ideal rate */
  meetsIdealRate: boolean;
}

export interface ScoringConfig {
  /** Ideal consumption rate (percentage per second) */
  idealRate: number;
  /** Tolerance around ideal rate (±percentage) */
  tolerance: number;
  /** Minimum interval duration in seconds */
  minIntervalDuration: number;
  /** Maximum interval duration in seconds */
  maxIntervalDuration: number;
  /** Scoring algorithm to use */
  scoringAlgorithm: 'exponential' | 'threshold';
  /** Exponential decay factor for exponential scoring */
  exponentialDecay?: number;
  /** Threshold values for threshold scoring */
  thresholdValues?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  /** Streak bonus configuration */
  streakBonus: {
    /** Minimum consecutive intervals for streak */
    minStreakLength: number;
    /** Bonus multiplier per streak interval */
    bonusMultiplier: number;
    /** Maximum streak bonus multiplier */
    maxBonusMultiplier: number;
  };
  /** Duration multiplier configuration */
  durationMultiplier: {
    /** Minimum session duration for multiplier */
    minDuration: number;
    /** Maximum session duration for multiplier */
    maxDuration: number;
    /** Multiplier for short sessions */
    shortSessionMultiplier: number;
    /** Multiplier for long sessions */
    longSessionMultiplier: number;
  };
}

export interface ScoringResult {
  /** Total score for the session */
  totalScore: number;
  /** Score before duration multiplier */
  baseScore: number;
  /** Duration multiplier applied */
  durationMultiplier: number;
  /** All interval data */
  intervals: IntervalData[];
  /** Streak information */
  streaks: StreakInfo[];
  /** Session statistics */
  sessionStats: SessionStats;
  /** Final grade/rating */
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
}

export interface StreakInfo {
  /** Start index of the streak */
  startIndex: number;
  /** End index of the streak */
  endIndex: number;
  /** Length of the streak */
  length: number;
  /** Bonus multiplier applied */
  bonusMultiplier: number;
  /** Total bonus points */
  bonusPoints: number;
}

export interface SessionStats {
  /** Total session duration in seconds */
  totalDuration: number;
  /** Total food consumed (percentage) */
  totalFoodConsumed: number;
  /** Average consumption rate */
  averageRate: number;
  /** Number of intervals */
  intervalCount: number;
  /** Number of intervals meeting ideal rate */
  idealRateCount: number;
  /** Consistency score (0-1) */
  consistency: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
}

export interface PaceIndicator {
  /** Current pace status */
  status: 'too-fast' | 'ideal' | 'too-slow' | 'stopped';
  /** Deviation from ideal rate */
  deviation: number;
  /** Recommendation message */
  recommendation: string;
  /** Color for UI display */
  color: string;
}
