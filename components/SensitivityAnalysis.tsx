import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  sensitivityParametersAtom,
  selectedSensitivityParamAtom,
  selectedSecondaryParamAtom,
  sensitivityAnalysisModeAtom,
  sensitivityResultsAtom,
  sensitivityGridAtom,
  runSensitivityAnalysisAtom,
  baselineResultsAtom
} from '../lib/store';
import { formatNumber, formatDecimal, formatCompactNumber } from '../lib/utils';

const SensitivityAnalysis: React.FC = () => {
  const [sensitivityParams] = useAtom(sensitivityParametersAtom);
  const [selectedParam, setSelectedParam] = useAtom(selectedSensitivityParamAtom);
  const [secondaryParam, setSecondaryParam] = useAtom(selectedSecondaryParamAtom);
  const [analysisMode, setAnalysisMode] = useAtom(sensitivityAnalysisModeAtom);
  const [sensitivityResults] = useAtom(sensitivityResultsAtom);
  const [sensitivityGrid] = useAtom(sensitivityGridAtom);
  const [, runSensitivity] = useAtom(runSensitivityAnalysisAtom);
  const [baseline] = useAtom(baselineResultsAtom);
  
  // State for heat map display options
  const [selectedMetric, setSelectedMetric] = useState<'deaths' | 'costs' | 'dalys' | 'icer'>('deaths');
  
  const handlePrimaryParamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedParam(e.target.value);
  };
  
  const handleSecondaryParamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSecondaryParam(e.target.value);
  };
  
  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisMode(e.target.value as '1D' | '2D');
  };
  
  const handleMetricChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(e.target.value as 'deaths' | 'costs' | 'dalys' | 'icer');
  };
  
  const handleRunAnalysis = () => {
    if (selectedParam) {
      runSensitivity();
    }
  };
  
  // Clear secondary param when switching to 1D mode
  useEffect(() => {
    if (analysisMode === '1D') {
      setSecondaryParam(null);
    }
  }, [analysisMode, setSecondaryParam]);
  
  // Find the selected parameter details
  const selectedParamDetails = sensitivityParams.find(p => p.name === selectedParam);
  const secondaryParamDetails = sensitivityParams.find(p => p.name === secondaryParam);
  
  // Calculate the maximum bar width for visualization
  const getMaxBarWidth = (results: any[], metric: string): number => {
    if (!results || results.length === 0) return 0;
    return Math.max(...results.map(r => Math.abs(r[metric])));
  };
  
  // Function to get color for heatmap cell
  const getHeatMapColor = (value: number, min: number, max: number): string => {
    // For costs and deaths, red is bad (high), green is good (low)
    // For icer, if dominant (negative), use a special color
    if (selectedMetric === 'icer' && value < 0) {
      return 'bg-purple-500'; // Special color for dominant interventions
    }
    
    // Normalize value between 0 and 1
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    // For deaths and costs, higher is worse (more red)
    // For DALYs, higher is worse (more red)
    if (selectedMetric === 'deaths' || selectedMetric === 'costs' || selectedMetric === 'dalys') {
      if (normalizedValue < 0.2) return 'bg-green-300 text-gray-800';
      if (normalizedValue < 0.4) return 'bg-green-500 text-white';
      if (normalizedValue < 0.6) return 'bg-yellow-500 text-gray-800';
      if (normalizedValue < 0.8) return 'bg-orange-500 text-white';
      return 'bg-red-500 text-white';
    }
    
    // For ICER, lower is better (more green) for positive values
    if (normalizedValue < 0.2) return 'bg-green-500 text-white';
    if (normalizedValue < 0.4) return 'bg-green-300 text-gray-800';
    if (normalizedValue < 0.6) return 'bg-yellow-500 text-gray-800';
    if (normalizedValue < 0.8) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };
  
  // Get min and max values for color scaling in heatmap
  const getDataMinMax = (data: number[][]): {min: number, max: number} => {
    if (!data || data.length === 0) return {min: 0, max: 0};
    
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].length; j++) {
        const value = data[i][j];
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
    
    return {min, max};
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sensitivity Analysis</h3>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Sensitivity analysis helps you understand how changes in parameters affect the outcomes.
          You can analyze one parameter at a time (1D) or see how two parameters interact (2D).
        </p>
        
        {/* Analysis mode selector */}
        <div className="flex space-x-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="1D"
              checked={analysisMode === '1D'}
              onChange={handleModeChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">1D Analysis</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="2D"
              checked={analysisMode === '2D'}
              onChange={handleModeChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">2D Analysis</span>
          </label>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Parameter
            </label>
            <select
              value={selectedParam || ''}
              onChange={handlePrimaryParamChange}
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
          
          {analysisMode === '2D' && (
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Secondary Parameter
              </label>
              <select
                value={secondaryParam || ''}
                onChange={handleSecondaryParamChange}
                className="input w-full"
              >
                <option value="">Select a parameter...</option>
                {sensitivityParams
                  .filter(p => p.name !== selectedParam) // Don't allow selecting the same parameter
                  .map(param => (
                    <option key={param.name} value={param.name}>
                      {param.label}
                    </option>
                  ))
                }
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedParam || (analysisMode === '2D' && !secondaryParam) || !baseline}
              className={`btn ${
                !selectedParam || (analysisMode === '2D' && !secondaryParam) || !baseline
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
      
      {/* 1D Analysis Results */}
      {analysisMode === '1D' && sensitivityResults.length > 0 && selectedParamDetails && (
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
                        {result.icer !== undefined ? (
                          result.icer === 1 ? 
                            'DOMINANT' : 
                            `$${formatNumber(result.icer)}/DALY`
                        ) : 'N/A'}
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
                    .filter(r => r.icer !== undefined && r.icer !== 1)
                    .map((result, index) => {
                      const validResults = sensitivityResults.filter(r => r.icer !== undefined && r.icer !== 1);
                      const maxWidth = getMaxBarWidth(validResults, 'icer');
                      const percentWidth = maxWidth > 0 ? (result.icer! / maxWidth) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-16 text-right text-xs text-gray-500 dark:text-gray-400">
                            {formatDecimal(result.paramValue, 2)}
                          </div>
                          <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-sm overflow-hidden">
                            {result.icer === 1 ? (
                              <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
                            ) : (
                              <div
                                className="h-full bg-green-500 dark:bg-green-600"
                                style={{ width: `${percentWidth}%` }}
                              ></div>
                            )}
                          </div>
                          <div className="w-20 text-xs text-gray-500 dark:text-gray-400">
                            {result.icer === 1 ? 'Dominant' : `$${formatNumber(result.icer!)}`}
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
      
      {/* 2D Analysis Results */}
      {analysisMode === '2D' && sensitivityGrid && selectedParamDetails && secondaryParamDetails && (
        <div>
          <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-4">
            2D Analysis: {selectedParamDetails.label} vs {secondaryParamDetails.label}
          </h4>
          
          {/* Metric selector for heatmap */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Metric
            </label>
            <select
              value={selectedMetric}
              onChange={handleMetricChange}
              className="input w-52"
            >
              <option value="deaths">Deaths</option>
              <option value="costs">Costs</option>
              <option value="dalys">DALYs</option>
              {sensitivityGrid.results.icer && <option value="icer">ICER</option>}
            </select>
          </div>
          
          {/* Heat map visualization */}
          <div className="mb-8 overflow-x-auto">
            <div className="flex">
              <div className="w-20"></div>
              <div className="flex-1">
                <div className="flex justify-between px-2 mb-1 text-xs text-gray-500 dark:text-gray-400">
                  {sensitivityGrid.secondaryValues.map((value, i) => (
                    <div key={i} className="text-center" style={{width: `${100 / sensitivityGrid.secondaryValues.length}%`}}>
                      {formatDecimal(value, 2)}
                    </div>
                  ))}
                </div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {secondaryParamDetails.label}
                </div>
              </div>
            </div>
            
            {/* Heat map grid */}
            <div>
              {sensitivityGrid.results[selectedMetric] && (() => {
                const { min, max } = getDataMinMax(sensitivityGrid.results[selectedMetric] as number[][]);
                
                return sensitivityGrid.primaryValues.map((primaryValue, i) => (
                  <div key={i} className="flex mb-1 items-center">
                    <div className="w-20 text-right text-xs text-gray-500 dark:text-gray-400 pr-2">
                      {formatDecimal(primaryValue, 2)}
                    </div>
                    <div className="flex-1 flex">
                      {(sensitivityGrid.results[selectedMetric] as number[][])[i].map((value, j) => (
                        <div 
                          key={j} 
                          className={`${getHeatMapColor(value, min, max)} h-12 text-xs flex items-center justify-center overflow-hidden p-1`}
                          style={{width: `${100 / sensitivityGrid.secondaryValues.length}%`}}
                          title={`${selectedParamDetails.label}: ${formatDecimal(primaryValue, 2)}, ${secondaryParamDetails.label}: ${formatDecimal(sensitivityGrid.secondaryValues[j], 2)}, ${selectedMetric}: ${selectedMetric === 'costs' ? '$' : ''}${formatNumber(value)}${selectedMetric === 'icer' ? '/DALY' : ''}`}
                        >
                          {selectedMetric === 'icer' && value === 1 ? 
                            'DOM' : 
                            selectedMetric === 'costs' ?
                              `$${formatCompactNumber(value)}` :
                              selectedMetric === 'icer' ?
                                `$${formatCompactNumber(value)}` :
                                formatCompactNumber(value)
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            <div className="mt-1 ml-20">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {selectedParamDetails.label}
              </div>
            </div>
            
            {/* Color legend */}
            <div className="mt-6">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Scale for {selectedMetric === 'deaths' ? 'Deaths' :
                                selectedMetric === 'costs' ? 'Costs' :
                                selectedMetric === 'dalys' ? 'DALYs' : 'ICER'}:
              </div>
              <div className="flex h-6">
                {selectedMetric === 'icer' && (
                  <div className="w-20 bg-purple-500 text-white text-xs flex items-center justify-center">
                    Dominant
                  </div>
                )}
                <div className="flex-1 flex">
                  <div className="bg-green-500 flex-1 text-white text-xs flex items-center justify-center">
                    {selectedMetric === 'icer' ? 'Good' : 'Low'}
                  </div>
                  <div className="bg-green-300 flex-1 text-white text-xs flex items-center justify-center"></div>
                  <div className="bg-yellow-500 flex-1 text-white text-xs flex items-center justify-center">
                    {selectedMetric === 'icer' ? 'Medium' : 'Medium'}
                  </div>
                  <div className="bg-orange-500 flex-1 text-white text-xs flex items-center justify-center"></div>
                  <div className="bg-red-500 flex-1 text-white text-xs flex items-center justify-center">
                    {selectedMetric === 'icer' ? 'Poor' : 'High'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            This 2D analysis shows how interactions between {selectedParamDetails.label.toLowerCase()} and {secondaryParamDetails.label.toLowerCase()}
            affect {selectedMetric}. Hover over cells to see exact values.
          </p>
        </div>
      )}
    </div>
  );
};

export default SensitivityAnalysis; 