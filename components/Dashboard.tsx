import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  simulationResultsAtom,
  simulationResultsMapAtom,
  selectedDiseasesAtom,
  selectedDiseaseAtom,
  baselineResultsAtom,
  baselineResultsMapAtom,
  derivedParametersAtom,
  populationSizeAtom,
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  deleteScenarioAtom,
  updateScenarioAtom,
  selectedHealthSystemStrengthAtom,
  baseParametersAtom,
  aiInterventionsAtom,
  effectMagnitudesAtom,
  healthSystemMultipliersAtom
} from '../lib/store';
import SimulationChart from './SimulationChart';
import CumulativeOutcomesChart from './CumulativeOutcomesChart';
import ResultsTable from './ResultsTable';
import QueueVisualization from './QueueVisualization';
import { formatNumber } from '../lib/utils';
import { SimulationResults } from '../models/stockAndFlowModel';

const Dashboard: React.FC = () => {
  const [results] = useAtom(simulationResultsAtom);
  const [resultsMap] = useAtom(simulationResultsMapAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [baseline] = useAtom(baselineResultsAtom);
  const [baselineMap] = useAtom(baselineResultsMapAtom);
  const [parameters] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [, deleteScenario] = useAtom(deleteScenarioAtom);
  const [, updateScenario] = useAtom(updateScenarioAtom);
  const [scenariosExpanded, setScenariosExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');

  // Use effect to ensure the correct primary disease results are shown
  useEffect(() => {
    if (hasMultipleDiseaseResults && selectedDisease && resultsMap[selectedDisease]) {
      setActiveTab('overview');
    }
  }, [selectedDisease]);

  // Listen for primary disease change events from the sidebar
  useEffect(() => {
    const handlePrimaryDiseaseChanged = (event: CustomEvent) => {
      if (event.detail && event.detail.disease) {
        // Switch to overview tab when primary disease changes
        setActiveTab('overview');
      }
    };

    window.addEventListener('primary-disease-changed', handlePrimaryDiseaseChanged as EventListener);
    
    return () => {
      window.removeEventListener('primary-disease-changed', handlePrimaryDiseaseChanged as EventListener);
    };
  }, []);

  const currentScenario = selectedScenarioId 
    ? scenarios.find(s => s.id === selectedScenarioId) 
    : null;

  // Format disease name for display
  const formatDiseaseName = (disease: string): string => {
    return disease.charAt(0).toUpperCase() + disease.slice(1).replace(/_/g, ' ');
  };

  // Format health system name for display
  const formatHealthSystemName = (name: string | undefined): string => {
    if (!name) return 'N/A';
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Generate a consistent color for each disease
  const getDiseaseColor = (disease: string): string => {
    const colors = [
      '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653',
      '#023047', '#ffb703', '#fb8500', '#8ecae6', '#219ebc'
    ];
    
    // Simple hash function to get a consistent index
    const hash = disease.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Get a list of active AI interventions
  const getActiveInterventions = () => {
    if (!currentScenario) return [];
    
    return Object.entries(currentScenario.aiInterventions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => {
        switch(name) {
          case 'triageAI': return 'AI Triage';
          case 'chwAI': return 'CHW Decision Support';
          case 'diagnosticAI': return 'Diagnostic AI';
          case 'bedManagementAI': return 'Bed Management AI';
          case 'hospitalDecisionAI': return 'Hospital Decision Support';
          case 'selfCareAI': return 'Self-Care Apps';
          default: return name;
        }
      });
  };

  const activeInterventions = getActiveInterventions();

  // Get multi-disease results if available
  const hasMultipleDiseaseResults = (() => {
    const hasMultipleResults = Object.keys(resultsMap).length > 1;
    const hasMultipleSelections = selectedDiseases.length > 1;
    const isMultiDiseaseMode = hasMultipleResults || hasMultipleSelections;
    
    // Add enhanced debugging to help understand the state
    if (isMultiDiseaseMode) {
      console.log("Multi-disease mode active:", {
        resultsMapSize: Object.keys(resultsMap).length,
        resultsMapKeys: Object.keys(resultsMap),
        selectedDiseases,
        reasonForMultiMode: hasMultipleResults ? 'multiple results' : 'multiple selections',
        // Add detailed validation of resultsMap contents
        resultsValidation: Object.entries(resultsMap).map(([disease, result]) => ({
          disease,
          hasResult: !!result,
          deathsValue: result?.cumulativeDeaths || 0,
          costsValue: result?.totalCost || 0
        }))
      });
    }
    
    // Also check if we have meaningful data in the resultsMap
    const hasActualResults = Object.values(resultsMap).some(result => 
      result && result.cumulativeDeaths !== undefined && result.totalCost !== undefined
    );
    
    // Return true if either we have multiple diseases in the results map
    // OR we have multiple disease selections with at least some valid results
    return hasMultipleResults || (hasMultipleSelections && hasActualResults);
  })();

  if (!results) {
    return (
      <div className="flex flex-col items-start justify-start h-full p-8">
        {/* Scenarios information - show even without simulation results */}
        {scenarios.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 mb-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-2 cursor-pointer" 
                onClick={() => setScenariosExpanded(!scenariosExpanded)}>
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
                Saved Scenarios
              </h3>
              <button className="text-indigo-700 dark:text-indigo-300">
                {scenariosExpanded ? 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg> : 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                }
              </button>
            </div>
            
            {scenariosExpanded && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {scenarios
                    .slice()
                    .sort((a, b) => {
                      // Extract timestamp from scenario ID for sorting (newest first)
                      const getTimestamp = (id: string) => {
                        const match = id.match(/scenario-(\d+)/);
                        return match ? parseInt(match[1]) : 0;
                      };
                      return getTimestamp(b.id) - getTimestamp(a.id);
                    })
                    .map(scenario => (
                    <button
                      key={scenario.id}
                      onClick={() => loadScenario(scenario.id)}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        selectedScenarioId === scenario.id 
                          ? 'bg-indigo-500 text-white' 
                          : 'bg-white dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                      }`}
                    >
                      {scenario.name}
                    </button>
                  ))}
                </div>
                
                {currentScenario && (
                  <div className="bg-white dark:bg-gray-800 rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">
                        {currentScenario.name}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('view-parameters'))}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          View Parameters
                        </button>
                        <button
                          onClick={() => deleteScenario(currentScenario.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Health System:</strong> {formatHealthSystemName(currentScenario.parameters.healthSystemStrength) || 'Custom'}</p>
                      
                      {/* Display multiple diseases if available */}
                      {currentScenario.selectedDiseases && currentScenario.selectedDiseases.length > 1 ? (
                        <div>
                          <p><strong>Diseases:</strong></p>
                          <ul className="list-disc list-inside ml-2">
                            {currentScenario.selectedDiseases.map(disease => (
                              <li key={disease} className="text-sm">
                                {formatDiseaseName(disease)}
                                {currentScenario.diseaseResultsMap && currentScenario.diseaseResultsMap[disease] && (
                                  <span className="ml-1 text-xs text-gray-500">
                                    ({formatNumber(currentScenario.diseaseResultsMap[disease]?.cumulativeDeaths || 0)} deaths)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p><strong>Disease:</strong> {formatDiseaseName(currentScenario.parameters.disease || '')}</p>
                      )}
                      
                      <p><strong>Population:</strong> {formatNumber(currentScenario.parameters.population || population)}</p>
                      
                      {activeInterventions.length > 0 ? (
                        <div className="mt-2">
                          <p><strong>Active AI Interventions:</strong></p>
                          <ul className="list-disc list-inside ml-2">
                            {activeInterventions.map(intervention => (
                              <li key={intervention}>{intervention}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-2"><strong>No AI interventions active</strong></p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Welcome information */}
        <div className="text-left">
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 max-w-2xl">
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">How to use this dashboard</h3>
            <ol className="list-decimal list-inside text-left text-gray-700 dark:text-gray-300 space-y-2">
              <li className="font-medium">Configure your health system:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>Select health system strength (e.g., Moderate Urban, Weak Rural)</li>
                  <li>Choose primary disease (e.g., Malaria, TB, Pneumonia)</li>
                  <li>Set population size and congestion level</li>
                  <li>Optionally select multiple diseases for comparison</li>
                </ul>
              </li>
              <li className="font-medium">Run baseline scenario:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>Keep all AI interventions off</li>
                  <li>Click "Run Simulation"</li>
                  <li>Click "Set as Baseline" to save for comparison</li>
                </ul>
              </li>
              <li className="font-medium">Test AI interventions:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>Toggle one or more AI interventions</li>
                  <li>Run simulation to see impact</li>
                  <li>Compare deaths, DALYs, costs, and ICER vs baseline</li>
                </ul>
              </li>
              <li className="font-medium">Analyze results:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>View patient flow animation and queue buildup</li>
                  <li>Check bubble charts for impact vs feasibility</li>
                  <li>Save scenarios for comparison</li>
                  <li>Use Sensitivity tab to test parameter uncertainty</li>
                </ul>
              </li>
              <li className="font-medium">Explore documentation:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>Model Equations tab: Mathematical framework</li>
                  <li>Parameter Guide tab: Clinical context</li>
                  <li>Parameters tab: Adjust custom values</li>
                </ul>
              </li>
              <li className="font-medium">Compare multiple diseases:
                <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                  <li>Select multiple diseases in the sidebar</li>
                  <li>Run simulation to see comparative results</li>
                </ul>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Important:</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Always run a baseline first, then test AI interventions to calculate ICER values correctly.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const deathsAverted = baseline ? baseline.cumulativeDeaths - results.cumulativeDeaths : 0;
  const percentDeathsReduced = baseline ? (deathsAverted / baseline.cumulativeDeaths) * 100 : 0;
  const costDifference = baseline ? results.totalCost - baseline.totalCost : 0;
  const timeToResolutionChange = baseline
    ? results.averageTimeToResolution - baseline.averageTimeToResolution
    : 0;
  const dalysAverted = baseline ? baseline.dalys - results.dalys : 0;

  // Calculate disease-specific deaths averted and DALYs averted using per-disease baselines
  const calculateMetricsForDisease = (disease: string, diseaseResults: SimulationResults | null) => {
    if (!diseaseResults) return { deathsAverted: 0, dalysAverted: 0, icer: undefined };
    
    // Use disease-specific baseline if available, otherwise use the primary baseline
    const diseaseBaseline = baselineMap[disease] || baseline;
    
    if (!diseaseBaseline) return { deathsAverted: 0, dalysAverted: 0, icer: undefined };
    
    const deathsAverted = diseaseBaseline.cumulativeDeaths - diseaseResults.cumulativeDeaths;
    const dalysAverted = diseaseBaseline.dalys - diseaseResults.dalys;
    
    // Return the ICER from the results, which should now be calculated correctly
    // per disease in the runSimulationAtom function
    return {
      deathsAverted,
      dalysAverted,
      icer: diseaseResults.icer
    };
  };

  const weeklyData = results.weeklyStates.map((state, index) => ({
    week: index,
    U: state.U,
    I: state.I,
    L0: state.L0,
    L1: state.L1,
    L2: state.L2,
    L3: state.L3,
    R: state.R,
    D: state.D,
  }));

  return (
    <div className="space-y-8">
      {/* Scenarios information */}
      {scenarios.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2 cursor-pointer" 
               onClick={() => setScenariosExpanded(!scenariosExpanded)}>
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200">
              Saved Scenarios
            </h3>
            <button className="text-indigo-700 dark:text-indigo-300">
              {scenariosExpanded ? 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg> : 
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              }
            </button>
          </div>
          
          {scenariosExpanded && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {scenarios
                  .slice()
                  .sort((a, b) => {
                    // Extract timestamp from scenario ID for sorting (newest first)
                    const getTimestamp = (id: string) => {
                      const match = id.match(/scenario-(\d+)/);
                      return match ? parseInt(match[1]) : 0;
                    };
                    return getTimestamp(b.id) - getTimestamp(a.id);
                  })
                  .map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => loadScenario(scenario.id)}
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      selectedScenarioId === scenario.id 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                    }`}
                  >
                    {scenario.name}
                  </button>
                ))}
              </div>
              
              {currentScenario && (
                <div className="bg-white dark:bg-gray-800 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-md font-medium text-gray-800 dark:text-white">
                      {currentScenario.name}
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('view-parameters'))}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        View Parameters
                      </button>
                      <button
                        onClick={() => deleteScenario(currentScenario.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Health System:</strong> {formatHealthSystemName(currentScenario.parameters.healthSystemStrength) || 'Custom'}</p>
                    
                    {/* Display multiple diseases if available */}
                    {currentScenario.selectedDiseases && currentScenario.selectedDiseases.length > 1 ? (
                      <div>
                        <p><strong>Diseases:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          {currentScenario.selectedDiseases.map(disease => (
                            <li key={disease} className="text-sm">
                              {formatDiseaseName(disease)}
                              {currentScenario.diseaseResultsMap && currentScenario.diseaseResultsMap[disease] && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({formatNumber(currentScenario.diseaseResultsMap[disease]?.cumulativeDeaths || 0)} deaths)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p><strong>Disease:</strong> {formatDiseaseName(currentScenario.parameters.disease || '')}</p>
                    )}
                    
                    <p><strong>Population:</strong> {formatNumber(currentScenario.parameters.population || population)}</p>
                    
                    {activeInterventions.length > 0 ? (
                      <div className="mt-2">
                        <p><strong>Active AI Interventions:</strong></p>
                        <ul className="list-disc list-inside ml-2">
                          {activeInterventions.map(intervention => (
                            <li key={intervention}>{intervention}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-2"><strong>No AI interventions active</strong></p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tabs for single disease vs multi-disease view */}
      {hasMultipleDiseaseResults && (
        <div className="mb-4">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'overview' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Primary Disease
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'comparison' 
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Health System Total
              </button>
            </nav>
          </div>
        </div>
      )}

      {activeTab === 'overview' || !hasMultipleDiseaseResults ? (
        // Primary disease view (original dashboard)
        <>
          {/* Show which disease we're viewing in multi-disease mode */}
          {hasMultipleDiseaseResults && (
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg mb-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Viewing primary disease: {formatDiseaseName(selectedDisease)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Select "Disease Comparison" tab to compare all diseases, or change the primary disease in the sidebar.
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Deaths</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {formatNumber(results.cumulativeDeaths)}
              </p>
              {baseline && (
                <p className={`text-sm mt-1 ${deathsAverted > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {deathsAverted > 0 ? '↓' : '↑'} {formatNumber(Math.abs(deathsAverted))} deaths ({percentDeathsReduced.toFixed(1)}%)
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                ${formatNumber(results.totalCost)}
              </p>
              {baseline && (
                <p className={`text-sm mt-1 ${costDifference < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {costDifference < 0 ? '↓' : '↑'} ${formatNumber(Math.abs(costDifference))}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time to Resolution</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {results.averageTimeToResolution.toFixed(1)} weeks
              </p>
              {baseline && (
                <p className={`text-sm mt-1 ${timeToResolutionChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {timeToResolutionChange < 0 ? '↓' : '↑'} {Math.abs(timeToResolutionChange).toFixed(1)} weeks
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost-Effectiveness</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {results.icer === undefined ? 'N/A' : 
                  results.icer === 1 ? 'DOMINANT' :
                  `$${formatNumber(results.icer)}/DALY`}
              </p>
              {results.icer !== undefined && (
                <div>
                  <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                    {results.icer === 1 ? 
                      'Both saves money and improves health' : 
                      results.icer < 3 * (parameters.perDiemCosts.L1 * 365) ? 'Cost-effective' : 'Not cost-effective'}
                  </p>
                  {/* Show actual calculated value */}
                  {results.rawIcerValue !== undefined && (
                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                      Raw value: ${formatNumber(results.rawIcerValue)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Patient Flow</h3>
            <div className="h-80">
              <SimulationChart data={weeklyData} baseline={baseline ? baseline.weeklyStates : undefined} />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">This chart shows the number of patients in each stage of care over time.</p>
              <ul className="flex flex-wrap gap-4">
                <li className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span> Untreated (U)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span> Informal Care (I)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span> Community Health Worker (L0)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Primary Care (L1)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> District Hospital (L2)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span> Tertiary Hospital (L3)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Cumulative Outcomes</h3>
            <div className="h-80">
              <CumulativeOutcomesChart data={weeklyData} baseline={baseline ? baseline.weeklyStates : undefined} />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">This chart shows the cumulative number of resolved cases and deaths over time.</p>
              <ul className="flex flex-wrap gap-4">
                <li className="flex items-center"><span className="w-3 h-3 bg-green-700 rounded-full mr-2"></span> Resolved (R)</li>
                <li className="flex items-center"><span className="w-3 h-3 bg-gray-800 rounded-full mr-2"></span> Deaths (D)</li>
              </ul>
            </div>
          </div>

          {/* Queue Visualization - only show if there are queues */}
          {results && results.weeklyStates.some(state => 
            state.queues && (state.queues.L0 + state.queues.L1 + state.queues.L2 + state.queues.L3) > 0
          ) && (
            <QueueVisualization 
              weeklyStates={results.weeklyStates} 
              title="Healthcare System Queue Sizes"
            />
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Summary</h3>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                In a population of <strong>{formatNumber(population)}</strong>, 
                with an annual incidence rate of <strong>{parameters.lambda.toFixed(2)}</strong>,
                our model predicts <strong>{formatNumber(results.cumulativeDeaths)}</strong> deaths over 52 weeks.
              </p>
              
              {baseline && (
                <p>
                  Compared to the baseline scenario, this intervention {deathsAverted > 0 ? 'averts' : 'adds'} <strong>{formatNumber(Math.abs(deathsAverted))}</strong> deaths
                  ({Math.abs(percentDeathsReduced).toFixed(1)}%) and {costDifference < 0 ? 'saves' : 'costs'} <strong>${formatNumber(Math.abs(costDifference))}</strong>.
                  {results.icer !== undefined && (
                    results.icer === 1 ?
                    ` This intervention is dominant (both saves money and improves health outcomes). Raw ICER: $${formatNumber(results.rawIcerValue || 0)}/DALY.` :
                    ` This represents an incremental cost-effectiveness ratio of $${formatNumber(results.icer)} per DALY.`
                  )}
                </p>
              )}
              
              {Object.entries(parameters.perDiemCosts).some(([_, cost]) => cost > 0) && (
                <p>
                  Cost calculations are based on per-diem costs of:
                  {parameters.perDiemCosts.I > 0 && ` $${parameters.perDiemCosts.I}/day for informal care,`}
                  {parameters.perDiemCosts.L0 > 0 && ` $${parameters.perDiemCosts.L0}/day for community health workers,`}
                  {parameters.perDiemCosts.L1 > 0 && ` $${parameters.perDiemCosts.L1}/day for primary care,`}
                  {parameters.perDiemCosts.L2 > 0 && ` $${parameters.perDiemCosts.L2}/day for district hospitals,`}
                  {parameters.perDiemCosts.L3 > 0 && ` $${parameters.perDiemCosts.L3}/day for tertiary hospitals.`}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detailed Results</h3>
            <ResultsTable results={results} baseline={baseline} />
          </div>
        </>
      ) : (
        // Disease comparison view
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Total Health System Burden</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Aggregated results from {selectedDiseases.length} diseases representing the total health system burden.
            </p>
            
            {/* Enhanced warning for incomplete data situations */}
            {Object.keys(resultsMap).length === 0 && selectedDiseases.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg mb-4 text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">No disease results available yet</p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  Please run a simulation to see comparative results for {selectedDiseases.length} selected diseases.
                </p>
              </div>
            )}
            
            {/* Show aggregated health system results only when multiple diseases */}
            {results && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
                  Total Health System Burden
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                  Aggregated results from all {selectedDiseases.length} diseases: {selectedDiseases.map(d => d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-300 dark:border-green-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Deaths</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(results.cumulativeDeaths || 0)}
                    </div>
                    {baseline && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {(baseline.cumulativeDeaths - results.cumulativeDeaths) > 0 ? '+' : ''}{formatNumber(baseline.cumulativeDeaths - results.cumulativeDeaths)} averted
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-300 dark:border-green-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total DALYs</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(results.dalys || 0)}
                    </div>
                    {baseline && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {(baseline.dalys - results.dalys) > 0 ? '+' : ''}{formatNumber(baseline.dalys - results.dalys)} averted
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-300 dark:border-green-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Costs</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${formatNumber(results.totalCost || 0)}
                    </div>
                    {baseline && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        vs ${formatNumber(baseline.totalCost || 0)} baseline
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-300 dark:border-green-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ICER</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {!results.icer ? 'N/A' : 
                        results.icer === 1 ? 'DOMINANT' :
                        `$${formatNumber(results.icer)}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Per DALY averted
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-md">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Multi-Disease Methodology:</strong> Each disease ran its own separate 52-week simulation using disease-specific parameters. 
                    The values above represent the summed outcomes across all diseases, showing the true total health system burden.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 