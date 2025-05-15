import React from 'react';
import { SimulationResults } from '../models/stockAndFlowModel';
import { formatNumber } from '../lib/utils';

interface ResultsTableProps {
  results: SimulationResults;
  baseline?: SimulationResults | null;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, baseline }) => {
  // Get weekly state at specific intervals for showing in the table
  const getStateAtWeek = (results: SimulationResults, week: number) => {
    const index = Math.min(week, results.weeklyStates.length - 1);
    return results.weeklyStates[index];
  };

  // Display values for key weeks (4, 12, 26, 52)
  const weeks = [4, 12, 26, 52];
  const finalWeek = results.weeklyStates.length - 1;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Metric
            </th>
            {weeks.map(week => (
              <th key={week} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Week {week}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Untreated (U)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).U)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).U > getStateAtWeek(baseline, week).U ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).U - getStateAtWeek(baseline, week).U))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Informal Care (I)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).I)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).I > getStateAtWeek(baseline, week).I ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).I - getStateAtWeek(baseline, week).I))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Community Health Workers (L0)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).L0)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).L0 > getStateAtWeek(baseline, week).L0 ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).L0 - getStateAtWeek(baseline, week).L0))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Primary Care (L1)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).L1)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).L1 > getStateAtWeek(baseline, week).L1 ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).L1 - getStateAtWeek(baseline, week).L1))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              District Hospital (L2)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).L2)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).L2 > getStateAtWeek(baseline, week).L2 ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).L2 - getStateAtWeek(baseline, week).L2))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Tertiary Hospital (L3)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).L3)}
                {baseline && (
                  <span className="text-xs ml-2 text-gray-400">
                    {getStateAtWeek(results, week).L3 > getStateAtWeek(baseline, week).L3 ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).L3 - getStateAtWeek(baseline, week).L3))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr className="bg-gray-50 dark:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Cumulative Resolved (R)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).R)}
                {baseline && (
                  <span className={`text-xs ml-2 ${
                    getStateAtWeek(results, week).R > getStateAtWeek(baseline, week).R
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {getStateAtWeek(results, week).R > getStateAtWeek(baseline, week).R ? '↑' : '↓'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).R - getStateAtWeek(baseline, week).R))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr className="bg-gray-50 dark:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Cumulative Deaths (D)
            </td>
            {weeks.map(week => (
              <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {formatNumber(getStateAtWeek(results, week).D)}
                {baseline && (
                  <span className={`text-xs ml-2 ${
                    getStateAtWeek(results, week).D < getStateAtWeek(baseline, week).D
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    {getStateAtWeek(results, week).D < getStateAtWeek(baseline, week).D ? '↓' : '↑'}
                    {formatNumber(Math.abs(getStateAtWeek(results, week).D - getStateAtWeek(baseline, week).D))}
                  </span>
                )}
              </td>
            ))}
          </tr>
          
          <tr className="bg-gray-50 dark:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Disability-Adjusted Life Years (DALY)
            </td>
            {weeks.map(week => {
              // Approximate the DALYs proportionally by week
              const weekRatio = (week + 1) / results.weeklyStates.length;
              const dalys = results.dalys * weekRatio;
              const baselineDalys = baseline ? baseline.dalys * weekRatio : 0;
              
              return (
                <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatNumber(dalys)}
                  {baseline && (
                    <span className={`text-xs ml-2 ${
                      dalys < baselineDalys
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}>
                      {dalys < baselineDalys ? '↓' : '↑'}
                      {formatNumber(Math.abs(dalys - baselineDalys))}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
          
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
              Cumulative Cost
            </td>
            {weeks.map(week => {
              // Approximate the cost proportionally by week
              const weekRatio = (week + 1) / results.weeklyStates.length;
              const cost = results.totalCost * weekRatio;
              const baselineCost = baseline ? baseline.totalCost * weekRatio : 0;
              
              return (
                <td key={week} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  ${formatNumber(cost)}
                  {baseline && (
                    <span className={`text-xs ml-2 ${
                      cost < baselineCost
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}>
                      {cost < baselineCost ? '↓' : '↑'}
                      ${formatNumber(Math.abs(cost - baselineCost))}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable; 