import React from 'react';
import { useAtom } from 'jotai';
import {
  simulationResultsAtom,
  baselineResultsAtom,
  derivedParametersAtom,
  populationSizeAtom,
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  deleteScenarioAtom,
  updateScenarioAtom
} from '../lib/store';
import SimulationChart from './SimulationChart';
import ResultsTable from './ResultsTable';
import { formatNumber } from '../lib/utils';

const Dashboard: React.FC = () => {
  const [results] = useAtom(simulationResultsAtom);
  const [baseline] = useAtom(baselineResultsAtom);
  const [parameters] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [, deleteScenario] = useAtom(deleteScenarioAtom);
  const [, updateScenario] = useAtom(updateScenarioAtom);

  // Get the currently selected scenario if any
  const currentScenario = selectedScenarioId 
    ? scenarios.find(s => s.id === selectedScenarioId) 
    : null;

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 max-w-2xl">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-2">
            Health System AI Impact Dashboard
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Model the impact of AI on health outcomes in low and middle-income countries
          </p>
          
          <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">How to use this dashboard</h3>
          <ol className="list-decimal list-inside text-left text-gray-700 dark:text-gray-300 space-y-2">
            <li className="font-medium">Start with the model structure:
              <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                <li>View "Model Equations" tab to see how patients move through care levels</li>
                <li>Note how DALYs adjust for age of infection</li>
              </ul>
            </li>
            <li className="font-medium">Set up your parameters:
              <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                <li>Choose geography and disease in sidebar</li>
                <li>Click "Configure Parameters" for custom values</li>
              </ul>
            </li>
            <li className="font-medium">Run baseline scenario:
              <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                <li>Turn off all AI interventions</li>
                <li>Click "Run Simulation"</li>
                <li>Click "Set as Baseline"</li>
              </ul>
            </li>
            <li className="font-medium">Test AI interventions:
              <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                <li>Turn on one or more AI options</li>
                <li>Run a new simulation</li>
                <li>Review DALY and ICER results</li>
              </ul>
            </li>
            <li className="font-medium">Compare scenarios:
              <ul className="list-disc list-inside ml-4 mt-1 font-normal">
                <li>"Save as Scenario" to store results</li>
                <li>Create different intervention combinations</li>
              </ul>
            </li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Important:</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Always run a baseline first, then test AI interventions to calculate ICER values correctly.</p>
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

  return (
    <div className="space-y-8">
      {/* Scenarios information */}
      {scenarios.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
            Saved Scenarios
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {scenarios.map(scenario => (
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
                <p><strong>Geography:</strong> {currentScenario.parameters.geography || 'Custom'}</p>
                <p><strong>Disease:</strong> {currentScenario.parameters.disease || 'Custom'}</p>
                <p><strong>Population:</strong> {formatNumber(population)}</p>
                
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
            <li className="flex items-center"><span className="w-3 h-3 bg-green-700 rounded-full mr-2"></span> Resolved (R)</li>
            <li className="flex items-center"><span className="w-3 h-3 bg-gray-800 rounded-full mr-2"></span> Deaths (D)</li>
          </ul>
        </div>
      </div>

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
    </div>
  );
};

export default Dashboard; 