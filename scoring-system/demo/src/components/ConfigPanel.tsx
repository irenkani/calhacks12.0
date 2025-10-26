import React from 'react';
import { ScoringConfig } from '../../src/types';

interface ConfigPanelProps {
  config: ScoringConfig;
  onConfigChange: (config: ScoringConfig) => void;
  onGenerateData: () => void;
  onSimulateEating: () => void;
  isSimulating: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onConfigChange,
  onGenerateData,
  onSimulateEating,
  isSimulating
}) => {
  const handleConfigChange = (key: keyof ScoringConfig, value: any) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };

  const handleNestedConfigChange = (parentKey: keyof ScoringConfig, childKey: string, value: any) => {
    onConfigChange({
      ...config,
      [parentKey]: {
        ...(config[parentKey] as any),
        [childKey]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Configuration</h3>
      
      <div className="space-y-4">
        {/* Ideal Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ideal Rate (%/s)
          </label>
          <input
            type="number"
            step="0.1"
            value={config.idealRate}
            onChange={(e) => handleConfigChange('idealRate', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tolerance (±%/s)
          </label>
          <input
            type="number"
            step="0.1"
            value={config.tolerance}
            onChange={(e) => handleConfigChange('tolerance', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Scoring Algorithm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scoring Algorithm
          </label>
          <select
            value={config.scoringAlgorithm}
            onChange={(e) => handleConfigChange('scoringAlgorithm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="exponential">Exponential</option>
            <option value="threshold">Threshold</option>
          </select>
        </div>

        {/* Exponential Decay */}
        {config.scoringAlgorithm === 'exponential' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exponential Decay
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.exponentialDecay || 0.8}
              onChange={(e) => handleConfigChange('exponentialDecay', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Streak Bonus */}
        <div className="border-t pt-4">
          <h4 className="text-lg font-medium mb-3">Streak Bonus</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Streak Length
              </label>
              <input
                type="number"
                min="1"
                value={config.streakBonus.minStreakLength}
                onChange={(e) => handleNestedConfigChange('streakBonus', 'minStreakLength', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.streakBonus.bonusMultiplier}
                onChange={(e) => handleNestedConfigChange('streakBonus', 'bonusMultiplier', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Bonus Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.streakBonus.maxBonusMultiplier}
                onChange={(e) => handleNestedConfigChange('streakBonus', 'maxBonusMultiplier', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 space-y-3">
          <button
            onClick={onGenerateData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Sample Data
          </button>
          
          <button
            onClick={onSimulateEating}
            disabled={isSimulating}
            className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 ${
              isSimulating
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isSimulating ? 'Simulating...' : 'Simulate Real-time Eating'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
