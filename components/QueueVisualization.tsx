import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { StockAndFlowState } from '../models/stockAndFlowModel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface QueueVisualizationProps {
  weeklyStates: StockAndFlowState[];
  title?: string;
}

const QueueVisualization: React.FC<QueueVisualizationProps> = ({ weeklyStates, title = 'Queue Sizes Over Time' }) => {
  const chartData = useMemo(() => {
    const weeks = weeklyStates.map((_, index) => `Week ${index + 1}`);
    
    return {
      labels: weeks,
      datasets: [
        {
          label: 'CHW (L0) Queue',
          data: weeklyStates.map(state => state.queues?.L0 || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Primary Care (L1) Queue',
          data: weeklyStates.map(state => state.queues?.L1 || 0),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.1,
        },
        {
          label: 'District Hospital (L2) Queue',
          data: weeklyStates.map(state => state.queues?.L2 || 0),
          borderColor: 'rgb(251, 146, 60)',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Tertiary Hospital (L3) Queue',
          data: weeklyStates.map(state => state.queues?.L3 || 0),
          borderColor: 'rgb(217, 70, 239)',
          backgroundColor: 'rgba(217, 70, 239, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Total Queue',
          data: weeklyStates.map(state => 
            (state.queues?.L0 || 0) + (state.queues?.L1 || 0) + 
            (state.queues?.L2 || 0) + (state.queues?.L3 || 0)
          ),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 3,
          tension: 0.1,
        },
      ],
    };
  }, [weeklyStates]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `${context.dataset.label}: ${Math.round(context.parsed.y)} patients`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Patients in Queue',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Week',
        },
      },
    },
  };

  // Calculate summary statistics
  const totalQueued = weeklyStates.reduce((sum, state) => 
    sum + (state.queues?.L0 || 0) + (state.queues?.L1 || 0) + 
    (state.queues?.L2 || 0) + (state.queues?.L3 || 0), 0
  );
  
  const maxQueueSize = Math.max(...weeklyStates.map(state => 
    (state.queues?.L0 || 0) + (state.queues?.L1 || 0) + 
    (state.queues?.L2 || 0) + (state.queues?.L3 || 0)
  ));

  const averageQueueSize = totalQueued / weeklyStates.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-600 dark:text-gray-400">Average Queue Size:</span>
            <span className="ml-2 font-semibold text-gray-800 dark:text-white">
              {averageQueueSize.toFixed(1)} patients
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-600 dark:text-gray-400">Peak Queue Size:</span>
            <span className="ml-2 font-semibold text-gray-800 dark:text-white">
              {Math.round(maxQueueSize)} patients
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
            <span className="text-gray-600 dark:text-gray-400">Total Patient-Weeks Queued:</span>
            <span className="ml-2 font-semibold text-gray-800 dark:text-white">
              {Math.round(totalQueued)}
            </span>
          </div>
        </div>
      </div>
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default QueueVisualization;