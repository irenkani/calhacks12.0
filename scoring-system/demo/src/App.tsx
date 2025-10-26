import React, { useState, useEffect } from 'react';
import { ScoringEngine, FoodSample, ScoringResult } from '../src/ScoringEngine';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import PaceIndicator from './components/PaceIndicator';
import ScoreCard from './components/ScoreCard';
import SessionStats from './components/SessionStats';
import ConfigPanel from './components/ConfigPanel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [engine] = useState(new ScoringEngine());
  const [samples, setSamples] = useState<FoodSample[]>([]);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [config, setConfig] = useState(engine.getConfig());

  // Generate sample data
  const generateSampleData = (): FoodSample[] => {
    const now = Date.now();
    const samples: FoodSample[] = [];
    let remaining = 100;
    
    // Simulate realistic eating patterns with some variation
    for (let i = 0; i < 20; i++) {
      const timeOffset = i * 3000; // 3 seconds between samples
      
      // Add some realistic variation in consumption rate
      const baseConsumption = 2.5; // 2.5% per interval
      const variation = (Math.random() - 0.5) * 1.5; // ±0.75% variation
      const consumption = Math.max(0, baseConsumption + variation);
      
      remaining = Math.max(0, remaining - consumption);
      
      samples.push({
        timestamp: now + timeOffset,
        foodRemaining: remaining,
        confidence: 0.9 + Math.random() * 0.1
      });
    }
    
    return samples;
  };

  // Simulate real-time eating
  const simulateEating = () => {
    setIsSimulating(true);
    const newSamples: FoodSample[] = [];
    let remaining = 100;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      // Simulate realistic eating pattern
      let consumptionRate = 0.5; // Base rate
      
      if (elapsed < 10) {
        consumptionRate = 0.3; // Slow start
      } else if (elapsed < 30) {
        consumptionRate = 0.6; // Steady eating
      } else if (elapsed < 50) {
        consumptionRate = 0.4; // Slowing down
      } else {
        consumptionRate = 0.2; // Almost done
      }
      
      // Add some randomness
      consumptionRate += (Math.random() - 0.5) * 0.2;
      consumptionRate = Math.max(0, consumptionRate);
      
      remaining = Math.max(0, remaining - consumptionRate);
      
      newSamples.push({
        timestamp: Date.now(),
        foodRemaining: remaining,
        confidence: 0.95
      });
      
      setSamples([...newSamples]);
      
      if (remaining <= 0 || elapsed > 60) {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1000);
  };

  // Calculate score when samples change
  useEffect(() => {
    if (samples.length >= 2) {
      try {
        const scoreResult = engine.calculateScore(samples);
        setResult(scoreResult);
      } catch (error) {
        console.error('Scoring error:', error);
      }
    }
  }, [samples, engine]);

  // Update engine config when config changes
  useEffect(() => {
    engine.updateConfig(config);
  }, [config, engine]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Eating Pace Analysis'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const consumptionData = {
    labels: samples.map((_, i) => `Sample ${i + 1}`),
    datasets: [
      {
        label: 'Food Remaining (%)',
        data: samples.map(s => s.foodRemaining),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const rateData = result ? {
    labels: result.intervals.map((_, i) => `Interval ${i + 1}`),
    datasets: [
      {
        label: 'Consumption Rate (%/s)',
        data: result.intervals.map(i => i.consumptionRate),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Ideal Rate',
        data: result.intervals.map(() => config.idealRate),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderDash: [5, 5],
      },
    ],
  } : null;

  const scoreData = result ? {
    labels: result.intervals.map((_, i) => `Interval ${i + 1}`),
    datasets: [
      {
        label: 'Score',
        data: result.intervals.map(i => i.score),
        backgroundColor: result.intervals.map(i => 
          i.score >= 80 ? 'rgba(76, 175, 80, 0.8)' :
          i.score >= 60 ? 'rgba(255, 193, 7, 0.8)' :
          'rgba(244, 67, 54, 0.8)'
        ),
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🍽️ Eating Pace Scoring System
          </h1>
          <p className="text-lg text-gray-600">
            Evaluate eating pace based on food remaining samples over time
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <ConfigPanel 
              config={config} 
              onConfigChange={setConfig}
              onGenerateData={() => setSamples(generateSampleData())}
              onSimulateEating={simulateEating}
              isSimulating={isSimulating}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Score Card */}
            {result && (
              <ScoreCard result={result} />
            )}

            {/* Session Stats */}
            {result && (
              <SessionStats stats={result.sessionStats} />
            )}

            {/* Pace Indicators */}
            {result && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Pace Indicators</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {engine.generatePaceIndicators(result.intervals).map((indicator, index) => (
                    <PaceIndicator 
                      key={index} 
                      indicator={indicator} 
                      intervalNumber={index + 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="space-y-8">
              {/* Food Remaining Chart */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Food Remaining Over Time</h3>
                <Line data={consumptionData} options={chartOptions} />
              </div>

              {/* Consumption Rate Chart */}
              {rateData && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Consumption Rate vs Ideal Rate</h3>
                  <Line data={rateData} options={chartOptions} />
                </div>
              )}

              {/* Score Chart */}
              {scoreData && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-4">Interval Scores</h3>
                  <Bar data={scoreData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
