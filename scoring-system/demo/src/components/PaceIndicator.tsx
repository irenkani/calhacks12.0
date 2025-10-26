import React from 'react';
import { PaceIndicator as PaceIndicatorType } from '../../src/types';

interface PaceIndicatorProps {
  indicator: PaceIndicatorType;
  intervalNumber: number;
}

const PaceIndicator: React.FC<PaceIndicatorProps> = ({ indicator, intervalNumber }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ideal': return '✅';
      case 'too-fast': return '⚡';
      case 'too-slow': return '🐌';
      case 'stopped': return '⏸️';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ideal': return 'Ideal';
      case 'too-fast': return 'Too Fast';
      case 'too-slow': return 'Too Slow';
      case 'stopped': return 'Stopped';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <div className="text-2xl mb-2">{getStatusIcon(indicator.status)}</div>
      <div className="text-sm font-medium text-gray-900 mb-1">
        Interval {intervalNumber}
      </div>
      <div className="text-xs text-gray-600 mb-2">
        {getStatusText(indicator.status)}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {indicator.deviation > 0 ? '+' : ''}{indicator.deviation.toFixed(2)}%/s
      </div>
      <div className="text-xs text-gray-500 leading-tight">
        {indicator.recommendation}
      </div>
    </div>
  );
};

export default PaceIndicator;
