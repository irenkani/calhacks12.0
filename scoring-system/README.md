# Eating Pace Scoring System

A comprehensive scoring system for evaluating eating pace based on food remaining samples over time. This system provides real-time feedback, streak bonuses, and detailed analytics to help users maintain healthy eating habits.

## Features

- **Interval Rate Calculations**: Analyzes consumption rate between food samples
- **Dual Scoring Algorithms**: Exponential decay and threshold-based scoring
- **Streak Bonus System**: Rewards consistent ideal eating pace
- **Duration Multipliers**: Adjusts scores based on session length
- **Real-time Pace Indicators**: Provides immediate feedback on eating speed
- **Comprehensive Visualizations**: Charts and graphs for detailed analysis
- **TypeScript Support**: Full type safety and IntelliSense

## Quick Start

### Installation

```bash
cd scoring-system
npm install
```

### Running Tests

```bash
npm test
```

### Running the Demo

```bash
cd demo
npm install
npm run dev
```

## Usage

### Basic Usage

```typescript
import { ScoringEngine, FoodSample } from './src/ScoringEngine';

// Create scoring engine with default configuration
const engine = new ScoringEngine();

// Sample data (food remaining percentages over time)
const samples: FoodSample[] = [
  { timestamp: 1000, foodRemaining: 100 },
  { timestamp: 2000, foodRemaining: 95 },
  { timestamp: 3000, foodRemaining: 90 },
  // ... more samples
];

// Calculate score
const result = engine.calculateScore(samples);

console.log(`Final Score: ${result.totalScore}`);
console.log(`Grade: ${result.grade}`);
console.log(`Streaks: ${result.streaks.length}`);
```

### Custom Configuration

```typescript
const engine = new ScoringEngine({
  idealRate: 0.5, // 0.5% per second
  tolerance: 0.2, // ±0.2% tolerance
  scoringAlgorithm: 'exponential',
  exponentialDecay: 0.8,
  streakBonus: {
    minStreakLength: 3,
    bonusMultiplier: 1.2,
    maxBonusMultiplier: 2.0
  }
});
```

### Real-time Pace Monitoring

```typescript
// Generate pace indicators for real-time feedback
const indicators = engine.generatePaceIndicators(result.intervals);

indicators.forEach((indicator, index) => {
  console.log(`Interval ${index + 1}: ${indicator.status}`);
  console.log(`Recommendation: ${indicator.recommendation}`);
});
```

## API Reference

### ScoringEngine Class

#### Constructor
```typescript
new ScoringEngine(config?: Partial<ScoringConfig>)
```

#### Methods

- `calculateScore(samples: FoodSample[]): ScoringResult`
- `generatePaceIndicators(intervals: IntervalData[]): PaceIndicator[]`
- `generateVisualizationData(result: ScoringResult): VisualizationData`
- `updateConfig(newConfig: Partial<ScoringConfig>): void`
- `getConfig(): ScoringConfig`

### Types

#### FoodSample
```typescript
interface FoodSample {
  timestamp: number;
  foodRemaining: number;
  confidence?: number;
}
```

#### ScoringResult
```typescript
interface ScoringResult {
  totalScore: number;
  baseScore: number;
  durationMultiplier: number;
  intervals: IntervalData[];
  streaks: StreakInfo[];
  sessionStats: SessionStats;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
}
```

## Scoring Algorithm

### Exponential Scoring
Uses exponential decay to penalize deviations from the ideal rate:
```
score = 100 * decayFactor^(deviation/tolerance)
```

### Threshold Scoring
Uses predefined thresholds for different performance levels:
- Excellent: 90+ points
- Good: 75-89 points
- Fair: 60-74 points
- Poor: 40-59 points
- Very Poor: <40 points

### Streak Bonuses
- Minimum streak length: 3 intervals
- Bonus multiplier: 1.2x per streak interval
- Maximum bonus: 2.0x

### Duration Multipliers
- Short sessions (<1 min): 0.8x multiplier
- Long sessions (>30 min): 1.2x multiplier
- Linear interpolation between thresholds

## Demo Application

The demo application provides:

- **Interactive Configuration Panel**: Adjust scoring parameters in real-time
- **Sample Data Generation**: Create realistic eating patterns
- **Real-time Simulation**: Simulate eating sessions with live updates
- **Comprehensive Visualizations**: 
  - Food remaining over time
  - Consumption rate vs ideal rate
  - Interval scores
- **Pace Indicators**: Real-time feedback on eating speed
- **Score Breakdown**: Detailed analysis of final scores

## Integration with Existing Project

This scoring system can be integrated with the existing CalHacks eating support agent:

```python
# In your Python backend
def calculate_eating_score(session_data):
    # Convert session data to FoodSample format
    samples = []
    for capture in session_data['captures']:
        samples.append({
            'timestamp': capture['timestamp'],
            'foodRemaining': capture['remaining_percent'],
            'confidence': capture['confidence']
        })
    
    # Call TypeScript scoring engine via API
    # or implement similar logic in Python
    return scoring_result
```

## Testing

Run the comprehensive test suite:

```bash
npm test
npm run test:coverage
```

Tests cover:
- Basic functionality
- Interval calculations
- Scoring algorithms
- Streak bonuses
- Duration multipliers
- Edge cases
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
