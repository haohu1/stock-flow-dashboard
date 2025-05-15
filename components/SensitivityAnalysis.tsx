import React from 'react';
import { useAtom } from 'jotai';
import {
  sensitivityParametersAtom,
  selectedSensitivityParamAtom,
  sensitivityResultsAtom,
  runSensitivityAnalysisAtom,
  baselineResultsAtom
} from '../lib/store';
import { formatNumber, formatDecimal } from '../lib/utils';

const SensitivityAnalysis: React.FC = () => {
  const [sensitivityParams] = useAtom(sensitivityParametersAtom);
  const [selectedParam, setSelectedParam] = useAtom(selectedSensitivityParamAtom);
  const [sensitivityResults] = useAtom(sensitivityResultsAtom);
  const [, runSensitivity] = useAtom(runSensitivityAnalysisAtom);
  const [baseline] = useAtom(baselineResultsAtom);
  
  const handleParamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedParam(e.target.value);
  };
  
  const handleRunAnalysis = () => {
    if (selectedParam) {
      runSensitivity();
    }
  };
  
  // Find the selected parameter details
  const selectedParamDetails = sensitivityParams.find(p => p.name === selectedParam);
  
  // Calculate the maximum bar width for visualization
  const getMaxBarWidth = (results: any[], metric: string): number => {
    if (!results || results.length === 0) return 0;
    return Math.max(...results.map(r => Math.abs(r[metric])));
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sensitivity Analysis</h3>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sensitivity analysis helps you understand how changes in a parameter affect the outcomes.
          Select a parameter and run the analysis to see how it impacts deaths, costs, and DALYs.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Parameter
            </label>
            <select
              value={selectedParam || ''}
              onChange={handleParamChange}
              className="input w-full"
            >
              <option value="">Select a parameter...</option>
              {sensitivityParams.map(param => (
                <option key={param.name} value={param.name}>
                  {param.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedParam || !baseline}
              className={`btn ${
                !selectedParam || !baseline
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'btn-primary'
              } px-6`}
            >
              Run Analysis
            </button>
          </div>
        </div>
        
        {!baseline && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
            You need to set a baseline scenario first before running sensitivity analysis.
          </div>
        )}
      </div>
      
      {sensitivityResults.length > 0 && selectedParamDetails && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Results for {selectedParamDetails.label}
          </h4>
          
          <div className="overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Deaths
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Costs
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ICER
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sensitivityResults.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatDecimal(result.paramValue, 2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatNumber(result.deaths)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${formatNumber(result.costs)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {result.icer !== undefined ? `$${formatNumber(result.icer)}/DALY` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact on Deaths</h5>
              <div className="space-y-1">
                {sensitivityResults.map((result, index) => {
                  const maxWidth = getMaxBarWidth(sensitivityResults, 'deaths');
                  const percentWidth = maxWidth > 0 ? (result.deaths / maxWidth) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-16 text-right text-xs text-gray-500 dark:text-gray-400">
                        {formatDecimal(result.paramValue, 2)}
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-red-500 dark:bg-red-600"
                          style={{ width: `${percentWidth}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-xs text-gray-500 dark:text-gray-400">
                        {formatNumber(result.deaths)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact on Costs</h5>
              <div className="space-y-1">
                {sensitivityResults.map((result, index) => {
                  const maxWidth = getMaxBarWidth(sensitivityResults, 'costs');
                  const percentWidth = maxWidth > 0 ? (result.costs / maxWidth) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-16 text-right text-xs text-gray-500 dark:text-gray-400">
                        {formatDecimal(result.paramValue, 2)}
                      </div>
                      <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-600"
                          style={{ width: `${percentWidth}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-xs text-gray-500 dark:text-gray-400">
                        ${formatNumber(result.costs)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {sensitivityResults.some(r => r.icer !== undefined) && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Impact on ICER</h5>
                <div className="space-y-1">
                  {sensitivityResults
                    .filter(r => r.icer !== undefined)
                    .map((result, index) => {
                      const validResults = sensitivityResults.filter(r => r.icer !== undefined);
                      const maxWidth = getMaxBarWidth(validResults, 'icer');
                      const percentWidth = maxWidth > 0 ? (result.icer! / maxWidth) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-16 text-right text-xs text-gray-500 dark:text-gray-400">
                            {formatDecimal(result.paramValue, 2)}
                          </div>
                          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden">
                            <div
                              className="h-full bg-green-500 dark:bg-green-600"
                              style={{ width: `${percentWidth}%` }}
                            ></div>
                          </div>
                          <div className="w-20 text-xs text-gray-500 dark:text-gray-400">
                            ${formatNumber(result.icer!)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            This analysis shows how changing the {selectedParamDetails.label.toLowerCase()} parameter
            affects the model outcomes. The parameter was varied ±25% from its base value of {formatDecimal(selectedParamDetails.baseValue, 2)}.
          </p>
        </div>
      )}
    </div>
  );
};

export default SensitivityAnalysis; 