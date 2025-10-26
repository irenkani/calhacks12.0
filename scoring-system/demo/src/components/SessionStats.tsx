import React from 'react';
import { SessionStats } from '../../src/types';

interface SessionStatsProps {
  stats: SessionStats;
}

const SessionStats: React.FC<SessionStatsProps> = ({ stats }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConsistencyColor = (consistency: number) => {
    if (consistency >= 0.8) return 'text-green-600';
    if (consistency >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Session Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Duration */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatDuration(stats.totalDuration)}
          </div>
          <div className="text-sm text-gray-600">Duration</div>
        </div>

        {/* Food Consumed */}
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.totalFoodConsumed.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Food Consumed</div>
        </div>

        {/* Average Rate */}
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {stats.averageRate.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Avg Rate (%/s)</div>
        </div>

        {/* Consistency */}
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className={`text-2xl font-bold mb-1 ${getConsistencyColor(stats.consistency)}`}>
            {(stats.consistency * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Consistency</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {stats.intervalCount}
            </div>
            <div className="text-sm text-gray-600">Total Intervals</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {stats.idealRateCount}
            </div>
            <div className="text-sm text-gray-600">Ideal Rate Intervals</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {stats.intervalCount > 0 ? ((stats.idealRateCount / stats.intervalCount) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-600">Ideal Rate %</div>
          </div>
        </div>
      </div>

      {/* Time Range */}
      <div className="mt-6 pt-6 border-t">
        <div className="text-sm text-gray-600">
          <div>Session Start: {new Date(stats.startTime).toLocaleTimeString()}</div>
          <div>Session End: {new Date(stats.endTime).toLocaleTimeString()}</div>
        </div>
      </div>
    </div>
  );
};

export default SessionStats;
