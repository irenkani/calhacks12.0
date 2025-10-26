# Eating Pace Scoring System - AR Integration

This document describes the complete integration of the eating pace scoring system into the existing Snap Spectacles AR project.

## 🎯 Overview

The scoring system has been fully integrated into the CalHacks eating support agent, providing real-time evaluation of eating pace based on food remaining samples over time. The system calculates interval rates, compares them to ideal rates, assigns points using exponential or threshold rules, applies streak bonuses, and adjusts scores with duration multipliers.

## 📁 File Structure

### New Files Added to Scripts Folder

```
Depth Cache/Assets/Scripts/
├── ScoringTypes.ts          # TypeScript type definitions
├── ScoringEngine.ts         # Main scoring engine implementation
└── SceneController.ts       # Modified to include scoring integration
```

### Backend Integration

```
backend/
└── test.py                  # Modified to include scoring data in responses
```

## 🔧 Integration Details

### 1. TypeScript Components

#### ScoringTypes.ts
- Defines all interfaces and types for the scoring system
- Includes `FoodSample`, `ScoringResult`, `PaceIndicator`, etc.
- Compatible with Snap Lens Studio TypeScript environment

#### ScoringEngine.ts
- Main scoring engine class extending `BaseScriptComponent`
- Implements interval rate calculations
- Supports both exponential and threshold scoring algorithms
- Includes streak bonus and duration multiplier systems
- Generates pace indicators for real-time feedback

#### SceneController.ts (Modified)
- Added scoring engine integration
- Collects food samples from tracked objects
- Displays scoring results through ResponseUI
- Provides comprehensive scoring feedback to users

### 2. Backend Integration

#### Enhanced Response Model
```python
class ScoringData(BaseModel):
    total_score: float
    grade: str
    session_duration: float
    food_consumed: float
    average_rate: float
    consistency: float
    streak_count: int
    interval_count: int
    ideal_rate_count: int
    pace_status: str
    recommendation: str

class DogState(BaseModel):
    # ... existing fields ...
    scoring_data: Optional[ScoringData] = None
```

#### Scoring Calculation
- Implements simplified scoring algorithm in Python
- Calculates eating pace based on consumption rate
- Provides grades (A+ to F) and recommendations
- Includes duration multipliers and consistency metrics

## 🚀 Setup Instructions

### 1. Lens Studio Setup

1. **Open the Snap Spectacles project** in Lens Studio
2. **Add the new components** to your scene:
   - Drag `ScoringEngine.ts` to create a ScoringEngine component
   - Assign it to the SceneController's `scoringEngine` field

3. **Configure the SceneController**:
   - Ensure the `scoringEngine` field is assigned
   - The system will automatically start collecting food samples

### 2. Backend Setup

1. **Install dependencies** (if not already done):
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the backend**:
   ```bash
   python test.py
   ```

3. **Test the integration**:
   ```bash
   python test_integration.py
   ```

## 📊 How It Works

### 1. Data Collection
- SceneController tracks food objects and their remaining percentages
- Creates `FoodSample` objects with timestamps and food remaining data
- Samples are collected every 30 seconds (configurable)

### 2. Scoring Calculation
- ScoringEngine processes food samples to calculate intervals
- Each interval represents consumption rate between samples
- Scores are calculated based on deviation from ideal rate (0.5%/s)

### 3. Real-time Feedback
- Pace indicators show current eating status (ideal, too-fast, too-slow, stopped)
- Recommendations are provided based on current pace
- Streak bonuses reward consistent ideal eating pace

### 4. Display Integration
- Scoring results are displayed through ResponseUI
- Comprehensive messages include score, grade, and recommendations
- Console logging provides detailed debugging information

## 🎮 User Experience

### Visual Feedback
- **Score Display**: Shows total score and letter grade (A+ to F)
- **Pace Indicators**: Real-time status of eating pace
- **Recommendations**: Personalized advice based on current performance
- **Session Stats**: Duration, food consumed, consistency metrics

### Example Scoring Message
```
🍽️ Eating Pace Score: 87.5 (B+)

📊 Session Stats:
• Duration: 2:30
• Food Consumed: 25.0%
• Average Rate: 0.17%/s
• Consistency: 85.2%

🔥 Streaks: 1 streak(s) detected!
• Streak 1: 3 intervals (1.2x bonus)

💡 Current Pace: IDEAL
📝 Recommendation: Perfect pace! Keep it up
```

## 🔧 Configuration

### ScoringEngine Configuration
```typescript
const config = {
  idealRate: 0.5,           // Ideal consumption rate (%/s)
  tolerance: 0.2,          // Tolerance around ideal rate
  scoringAlgorithm: 'exponential', // or 'threshold'
  streakBonus: {
    minStreakLength: 3,
    bonusMultiplier: 1.2,
    maxBonusMultiplier: 2.0
  },
  durationMultiplier: {
    minDuration: 60,        // 1 minute
    maxDuration: 1800,      // 30 minutes
    shortSessionMultiplier: 0.8,
    longSessionMultiplier: 1.2
  }
};
```

## 🧪 Testing

### 1. Unit Tests
Run the comprehensive test suite:
```bash
cd scoring-system
npm test
```

### 2. Integration Tests
Test the complete system:
```bash
python test_integration.py
```

### 3. AR Testing
1. Deploy the Lens to Snap Spectacles
2. Start eating and observe scoring feedback
3. Check console logs for detailed scoring information

## 📈 Scoring Algorithm Details

### Interval Calculation
- Intervals are calculated between consecutive food samples
- Duration must be between 5-60 seconds (configurable)
- Consumption rate = food consumed / duration

### Scoring Methods

#### Exponential Scoring
```
score = 100 * decayFactor^(deviation/tolerance)
```

#### Threshold Scoring
- Perfect (≤tolerance): 100 points
- Excellent: 90 points
- Good: 75 points
- Fair: 60 points
- Poor: 40 points
- Very Poor: 20 points

### Streak Bonuses
- Minimum streak length: 3 intervals
- Bonus multiplier: 1.2x per streak interval
- Maximum bonus: 2.0x

### Duration Multipliers
- Short sessions (<1 min): 0.8x
- Long sessions (>30 min): 1.2x
- Linear interpolation between thresholds

## 🐛 Troubleshooting

### Common Issues

1. **ScoringEngine not assigned**
   - Ensure the ScoringEngine component is assigned to SceneController
   - Check console for "Scoring Engine not assigned" warning

2. **No scoring data in responses**
   - Verify backend is running and accessible
   - Check that session has enough captures (≥2)

3. **TypeScript compilation errors**
   - Ensure all imports are correct
   - Check that ScoringTypes.ts is properly referenced

### Debug Information

Enable debug logging by checking the console output:
- `📊 Added food sample: X% remaining`
- `🏆 === SCORING RESULTS ===`
- `🎯 === PACE INDICATORS ===`

## 🔮 Future Enhancements

1. **Machine Learning Integration**: Use ML models for more accurate pace prediction
2. **Personalized Recommendations**: Adapt ideal rates based on user history
3. **Social Features**: Share scores and compete with friends
4. **Health Integration**: Connect with health apps and nutrition tracking
5. **Advanced Visualizations**: 3D charts and graphs in AR space

## 📞 Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all components are properly assigned
3. Test with the integration test script
4. Review the configuration settings

The scoring system is now fully integrated and ready to provide real-time eating pace evaluation through the Snap Spectacles AR experience!
