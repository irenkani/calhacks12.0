import { ScoringEngine } from './ScoringEngine';
import { FoodSample } from './types';

export { ScoringEngine };
export * from './types';

// Example usage and demo data
export function createSampleData(): FoodSample[] {
  const now = Date.now();
  const samples: FoodSample[] = [
    { timestamp: now, foodRemaining: 100 },
    { timestamp: now + 5000, foodRemaining: 95 },
    { timestamp: now + 10000, foodRemaining: 90 },
    { timestamp: now + 15000, foodRemaining: 85 },
    { timestamp: now + 20000, foodRemaining: 80 },
    { timestamp: now + 25000, foodRemaining: 75 },
    { timestamp: now + 30000, foodRemaining: 70 },
    { timestamp: now + 35000, foodRemaining: 65 },
    { timestamp: now + 40000, foodRemaining: 60 },
    { timestamp: now + 45000, foodRemaining: 55 },
    { timestamp: now + 50000, foodRemaining: 50 },
    { timestamp: now + 55000, foodRemaining: 45 },
    { timestamp: now + 60000, foodRemaining: 40 },
    { timestamp: now + 65000, foodRemaining: 35 },
    { timestamp: now + 70000, foodRemaining: 30 },
    { timestamp: now + 75000, foodRemaining: 25 },
    { timestamp: now + 80000, foodRemaining: 20 },
    { timestamp: now + 85000, foodRemaining: 15 },
    { timestamp: now + 90000, foodRemaining: 10 },
    { timestamp: now + 95000, foodRemaining: 5 },
    { timestamp: now + 100000, foodRemaining: 0 }
  ];
  
  return samples;
}

// Quick demo function
export function runDemo(): void {
  console.log('🍽️ Eating Pace Scoring System Demo');
  console.log('=====================================');
  
  const engine = new ScoringEngine();
  const samples = createSampleData();
  
  try {
    const result = engine.calculateScore(samples);
    
    console.log(`📊 Final Score: ${result.totalScore.toFixed(2)}`);
    console.log(`📈 Grade: ${result.grade}`);
    console.log(`⏱️ Session Duration: ${result.sessionStats.totalDuration.toFixed(1)}s`);
    console.log(`🍎 Total Food Consumed: ${result.sessionStats.totalFoodConsumed}%`);
    console.log(`📊 Average Rate: ${result.sessionStats.averageRate.toFixed(2)}%/s`);
    console.log(`🎯 Ideal Rate Intervals: ${result.sessionStats.idealRateCount}/${result.sessionStats.intervalCount}`);
    console.log(`🔥 Streaks: ${result.streaks.length}`);
    console.log(`📊 Consistency: ${(result.sessionStats.consistency * 100).toFixed(1)}%`);
    
    console.log('\n📈 Interval Breakdown:');
    result.intervals.forEach((interval: any, index: number) => {
      const paceIndicator = engine.generatePaceIndicators([interval])[0];
      console.log(`  Interval ${index + 1}: ${interval.consumptionRate.toFixed(2)}%/s (${paceIndicator.status}) - Score: ${interval.score.toFixed(1)}`);
    });
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}
