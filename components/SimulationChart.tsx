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
  U: number;
  I: number;
  L0: number;
  L1: number;
  L2: number;
  L3: number;
  R: number;
  D: number;
}

interface SimulationChartProps {
  data: ChartDataPoint[];
  baseline?: StockAndFlowState[];
}

const SimulationChart: React.FC<SimulationChartProps> = ({ data, baseline }) => {
  const labels = data.map(d => `Week ${d.week}`);
  
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Untreated (U)',
        data: data.map(d => d.U),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Informal Care (I)',
        data: data.map(d => d.I),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Community Health Worker (L0)',
        data: data.map(d => d.L0),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Primary Care (L1)',
        data: data.map(d => d.L1),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3,
      },
      {
        label: 'District Hospital (L2)',
        data: data.map(d => d.L2),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Tertiary Hospital (L3)',
        data: data.map(d => d.L3),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Add baseline datasets if provided, with dashed lines
  if (baseline) {
    chartData.datasets.push(
      {
        label: 'Baseline Untreated (U)',
        data: baseline.map(d => d.U),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline Informal Care (I)',
        data: baseline.map(d => d.I),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline Community Health Worker (L0)',
        data: baseline.map(d => d.L0),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline Primary Care (L1)',
        data: baseline.map(d => d.L1),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline District Hospital (L2)',
        data: baseline.map(d => d.L2),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      },
      {
        label: 'Baseline Tertiary Hospital (L3)',
        data: baseline.map(d => d.L3),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
        display: false,
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
          text: 'Number of Patients',
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

export default SimulationChart; 