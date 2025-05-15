import React, { useState } from 'react';
import { useAtom } from 'jotai';
import {
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  deleteScenarioAtom,
  addScenarioAtom,
  updateScenarioAtom,
  Scenario
} from '../lib/store';
import { formatNumber } from '../lib/utils';

const ScenarioManager: React.FC = () => {
  const [scenarios, setScenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId, setSelectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [, deleteScenario] = useAtom(deleteScenarioAtom);
  const [, addScenario] = useAtom(addScenarioAtom);
  const [, updateScenario] = useAtom(updateScenarioAtom);
  
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  
  // Function to get currently selected scenario
  const getSelectedScenario = () => {
    return scenarios.find(s => s.id === selectedScenarioId);
  };

  // Determine if a scenario has customized effect magnitudes
  const hasCustomMagnitudes = (scenario: Scenario) => {
    return scenario.effectMagnitudes && Object.keys(scenario.effectMagnitudes).length > 0;
  };

  // Group scenarios for better organization
  const groupedScenarios = scenarios.reduce((groups, scenario) => {
    const disease = scenario.parameters.disease || 'Other';
    if (!groups[disease]) {
      groups[disease] = [];
    }
    groups[disease].push(scenario);
    return groups;
  }, {} as Record<string, Scenario[]>);
  
  // Get a list of active AI interventions for a scenario
  const getActiveInterventions = (scenario: Scenario) => {
    return Object.entries(scenario.aiInterventions)
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
  
  const handleSaveScenarioName = (id: string) => {
    if (newName.trim()) {
      const scenario = scenarios.find(s => s.id === id);
      if (scenario) {
        const updatedScenario = { ...scenario, name: newName.trim() };
        updateScenario(updatedScenario);
      }
    }
    setEditingName(null);
    setNewName('');
  };
  
  const handleDuplicate = (scenario: Scenario) => {
    // Create a unique ID and increment the name
    const baseNameMatch = scenario.name.match(/(.*?)(\s+\d+)?$/);
    const baseName = baseNameMatch ? baseNameMatch[1] : scenario.name;
    const newScenarioName = `${baseName} Copy`;
    
    const newScenario: Scenario = {
      ...JSON.parse(JSON.stringify(scenario)), // Deep clone
      id: `scenario-${Date.now()}`,
      name: newScenarioName,
    };
    
    // Add the new scenario to the list
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarioId(newScenario.id);
  };
  
  const handleCompareScenarios = () => {
    // This function would trigger a comparison view showing multiple scenarios side by side
    window.dispatchEvent(new CustomEvent('compare-scenarios'));
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Scenario Management</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => addScenario()}
            className="btn btn-primary text-sm"
          >
            Save Current as Scenario
          </button>
          {scenarios.length > 1 && (
            <button 
              onClick={handleCompareScenarios}
              className="btn bg-indigo-500 text-white hover:bg-indigo-600 text-sm"
            >
              Compare Scenarios
            </button>
          )}
        </div>
      </div>
      
      {scenarios.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No scenarios saved yet. Run a simulation and click "Save Current as Scenario" to create your first scenario.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedScenarios).map(([disease, diseaseScenarios]) => (
            <div key={disease} className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{disease}</h4>
              <div className="space-y-2">
                {diseaseScenarios.map((scenario) => (
                  <div key={scenario.id} className={`border rounded-lg overflow-hidden ${
                    selectedScenarioId === scenario.id 
                      ? 'border-blue-500 dark:border-blue-400' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className={`p-3 flex justify-between items-center ${
                      selectedScenarioId === scenario.id 
                        ? 'bg-blue-50 dark:bg-blue-900' 
                        : 'bg-white dark:bg-gray-800'
                    }`}>
                      <div className="flex-1">
                        {editingName === scenario.id ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="input text-sm w-full"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveScenarioName(scenario.id)}
                              className="ml-2 px-2 py-1 bg-green-500 text-white rounded text-xs"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <button
                              onClick={() => {
                                loadScenario(scenario.id);
                                setSelectedScenarioId(scenario.id);
                              }}
                              className="text-left block"
                            >
                              <h5 className={`font-medium ${
                                selectedScenarioId === scenario.id 
                                  ? 'text-blue-700 dark:text-blue-300' 
                                  : 'text-gray-800 dark:text-white'
                              }`}>
                                {scenario.name}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {scenario.parameters.geography || 'Custom'} · 
                                {getActiveInterventions(scenario).length 
                                  ? ` ${getActiveInterventions(scenario).length} interventions` 
                                  : ' No interventions'}
                                {hasCustomMagnitudes(scenario) && ' · Custom magnitudes'}
                              </p>
                            </button>
                            <button
                              onClick={() => {
                                setEditingName(scenario.id);
                                setNewName(scenario.name);
                              }}
                              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              title="Rename"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setShowDetails(showDetails === scenario.id ? null : scenario.id)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Toggle details"
                        >
                          {showDetails === scenario.id ? 'Hide Details' : 'Details'}
                        </button>
                        <button
                          onClick={() => handleDuplicate(scenario)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Duplicate scenario"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteScenario(scenario.id)}
                          className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          title="Delete scenario"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {showDetails === scenario.id && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 text-sm border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <p><strong>Geography:</strong> {scenario.parameters.geography || 'Custom'}</p>
                            <p><strong>Disease:</strong> {scenario.parameters.disease || 'Custom'}</p>
                            <p><strong>Population:</strong> {formatNumber(scenario.parameters.population || 0)}</p>
                            
                            {scenario.results && (
                              <>
                                <p><strong>Deaths:</strong> {formatNumber(scenario.results.cumulativeDeaths)}</p>
                                <p><strong>Total Cost:</strong> ${formatNumber(scenario.results.totalCost)}</p>
                                <p><strong>Avg. Time to Resolution:</strong> {scenario.results.averageTimeToResolution.toFixed(1)} weeks</p>
                              </>
                            )}
                          </div>
                          <div>
                            <p><strong>Active AI Interventions:</strong></p>
                            {getActiveInterventions(scenario).length > 0 ? (
                              <ul className="list-disc list-inside ml-2">
                                {getActiveInterventions(scenario).map(intervention => (
                                  <li key={intervention}>{intervention}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500 dark:text-gray-400">No AI interventions active</p>
                            )}
                            
                            {hasCustomMagnitudes(scenario) && (
                              <div className="mt-2">
                                <p><strong>Custom Effect Magnitudes:</strong> {Object.keys(scenario.effectMagnitudes || {}).length} parameters adjusted</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              loadScenario(scenario.id);
                              setSelectedScenarioId(scenario.id);
                              window.dispatchEvent(new CustomEvent('view-parameters'));
                            }}
                            className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                          >
                            View Full Parameters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScenarioManager; 