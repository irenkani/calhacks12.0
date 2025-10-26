import React from 'react';
import { ScoringResult } from '../../src/types';

interface ScoreCardProps {
  result: ScoringResult;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ result }) => {
  const getGradeColor = (grade: string) => {
    switch (grade.charAt(0)) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Final Score</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Score */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {result.totalScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Total Score</div>
        </div>

        {/* Grade */}
        <div className="text-center">
          <div className={`text-4xl font-bold px-4 py-2 rounded-lg inline-block ${getGradeColor(result.grade)}`}>
            {result.grade}
          </div>
          <div className="text-sm text-gray-600 mt-2">Final Grade</div>
        </div>

        {/* Duration Multiplier */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {result.durationMultiplier.toFixed(2)}x
          </div>
          <div className="text-sm text-gray-600">Duration Multiplier</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-lg font-medium mb-3">Score Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Base Score</div>
            <div className="text-2xl font-semibold">{result.baseScore.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Streak Bonuses</div>
            <div className="text-2xl font-semibold">
              {result.streaks.reduce((sum, streak) => sum + streak.bonusPoints, 0).toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Streaks */}
      {result.streaks.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-lg font-medium mb-3">Streaks</h4>
          <div className="space-y-2">
            {result.streaks.map((streak, index) => (
              <div key={index} className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Streak {index + 1}: {streak.length} intervals
                  </span>
                  <span className="text-sm text-green-600">
                    +{streak.bonusPoints.toFixed(1)} points ({streak.bonusMultiplier.toFixed(1)}x)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreCard;
