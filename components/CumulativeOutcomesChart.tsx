import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
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

interface ChartDataPoint {
  week: number;
  R: number;
  D: number;
}

interface CumulativeOutcomesChartProps {
  data: ChartDataPoint[];
  baseline?: StockAndFlowState[];
}

const CumulativeOutcomesChart: React.FC<CumulativeOutcomesChartProps> = ({ data, baseline }) => {
  const labels = data.map(d => `Week ${d.week}`);
  
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Resolved (R)',
        data: data.map(d => d.R),
        borderColor: 'rgb(22, 163, 74)', // Green-700
        backgroundColor: 'rgba(22, 163, 74, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Deaths (D)',
        data: data.map(d => d.D),
        borderColor: 'rgb(31, 41, 55)', // Gray-800
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Add baseline datasets if provided, with dashed lines
  if (baseline) {
    chartData.datasets.push(
      {
        label: 'Baseline Resolved (R)',
        data: baseline.map(d => d.R),
        borderColor: 'rgb(22, 163, 74)', // Green-700
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline Deaths (D)',
        data: baseline.map(d => d.D),
        borderColor: 'rgb(31, 41, 55)', // Gray-800
        backgroundColor: 'rgba(31, 41, 55, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      }
    );
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toFixed(0)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cumulative Number of Patients',
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

  return <Line data={chartData} options={options} />;
};

export default CumulativeOutcomesChart; 