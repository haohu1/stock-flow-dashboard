import React, { useState, useRef } from 'react';
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
import { formatNumber, calculateSuggestedFeasibility } from '../lib/utils';

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
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleSaveFeasibility = (scenarioId: string, feasibility: number) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      const updatedScenario = { ...scenario, feasibility };
      updateScenario(updatedScenario);
    }
  };
  
  // Export scenarios to JSON file
  const exportScenarios = () => {
    // Allow user to choose between exporting all scenarios or just the selected one
    const exportType = window.confirm(
      "Do you want to export all scenarios? Click OK to export all, or Cancel to export only the selected scenario."
    ) ? "all" : "selected";
    
    let scenariosToExport: Scenario[] = [];
    let filename = "";
    
    if (exportType === "all") {
      scenariosToExport = scenarios;
      filename = `all-scenarios-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      const selectedScenario = getSelectedScenario();
      if (!selectedScenario) {
        alert("Please select a scenario to export.");
        return;
      }
      scenariosToExport = [selectedScenario];
      filename = `scenario-${selectedScenario.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    }
    
    const blob = new Blob([JSON.stringify(scenariosToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import scenarios from JSON file
  const importScenarios = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        const importedScenariosInput: Scenario[] = Array.isArray(importedData) 
          ? importedData 
          : [importedData];
        
        const validScenarios = importedScenariosInput.filter(s =>
          s && typeof s === 'object' && s.parameters && s.aiInterventions && typeof s.name === 'string'
        );
        
        if (validScenarios.length === 0) {
          alert('No valid scenarios found in the imported file.');
          return;
        }
        
        const timestampBase = Date.now();
        const updatedScenarios = validScenarios.map((s, index) => {
          const activeInterventions = Object.values(s.aiInterventions).filter(Boolean).length;
          // Use imported feasibility if present, otherwise calculate it.
          const feasibility = s.feasibility !== undefined 
            ? s.feasibility 
            : calculateSuggestedFeasibility(activeInterventions); // Using the imported utility
            
          return {
            ...s,
            id: `imported-${timestampBase + index}`,
            feasibility: feasibility
          };
        });
        
        const replaceExisting = scenarios.length > 0 && 
          window.confirm('Do you want to replace existing scenarios? Click OK to replace, or Cancel to append imported scenarios.');
        
        if (replaceExisting) {
          setScenarios(updatedScenarios);
        } else {
          setScenarios([...scenarios, ...updatedScenarios]);
        }
        
        if (updatedScenarios.length > 0) {
          setSelectedScenarioId(updatedScenarios[0].id);
          loadScenario(updatedScenarios[0].id);
        }
        
        alert(`Successfully imported ${updatedScenarios.length} scenario(s).`);
      } catch (error) {
        console.error('Error importing scenarios:', error);
        alert('Failed to import scenarios. Please check the file format.');
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Scenario Management</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => addScenario()}
            className="btn btn-primary text-sm"
          >
            Save Current as Scenario
          </button>
          <button
            onClick={exportScenarios}
            className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm"
            disabled={scenarios.length === 0}
          >
            Export JSON
          </button>
          <label className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={importScenarios}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>
      
      {/* Bubble Chart Availability Notice */}
      {scenarios.length < 2 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-xl">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Unlock Bubble Chart Analysis
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  Save {2 - scenarios.length} more scenario{2 - scenarios.length > 1 ? 's' : ''} to access the 
                  <strong> IPM Bubble Chart</strong> and <strong>Impact vs Feasibility</strong> analysis tabs.
                  These charts help you compare and prioritize AI interventions across scenarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No scenarios saved yet. Run a simulation and click "Save Current as Scenario" to create your first scenario.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarios.length > 1 && (
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> You can compare your scenarios using the "IPM Bubble Chart" and "Impact vs Feasibility" tabs above.
              </p>
            </div>
          )}
          
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
                                {scenario.parameters.healthSystemStrength || 'Custom'} · 
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
                            <p><strong>Health System:</strong> {scenario.parameters.healthSystemStrength || 'Custom'}</p>
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