import React from 'react';
import { useAtom } from 'jotai';
import {
  selectedGeographyAtom,
  selectedDiseaseAtom,
  populationSizeAtom,
  aiInterventionsAtom,
  runSimulationAtom,
  setBaselineAtom,
  addScenarioAtom,
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  simulationResultsAtom
} from '../lib/store';

const Sidebar: React.FC = () => {
  const [selectedGeography, setSelectedGeography] = useAtom(selectedGeographyAtom);
  const [selectedDisease, setSelectedDisease] = useAtom(selectedDiseaseAtom);
  const [population, setPopulation] = useAtom(populationSizeAtom);
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [, setBaseline] = useAtom(setBaselineAtom);
  const [, addScenario] = useAtom(addScenarioAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [results] = useAtom(simulationResultsAtom);

  const handleGeographyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGeography(e.target.value);
  };

  const handleDiseaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDisease(e.target.value);
  };

  const handlePopulationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPopulation(Number(e.target.value));
  };

  const handleAIToggle = (intervention: keyof typeof aiInterventions) => {
    setAIInterventions({
      ...aiInterventions,
      [intervention]: !aiInterventions[intervention]
    });
  };

  const handleRunSimulation = () => {
    runSimulation();
  };

  const handleSetBaseline = () => {
    setBaseline();
  };

  const handleAddScenario = () => {
    addScenario();
  };

  const handleLoadScenario = (id: string) => {
    loadScenario(id);
  };

  const handleViewParameters = () => {
    // Dispatch an event to view parameters
    window.dispatchEvent(new Event('view-parameters'));
  };

  const handleViewEquations = () => {
    // Dispatch an event to view equations
    window.dispatchEvent(new Event('view-equations'));
  };

  // Format disease names for display
  const formatDiseaseName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Model Settings</h2>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Geography
        </label>
        <div className="text-sm font-medium mb-2 text-indigo-600 dark:text-indigo-400">
          {selectedGeography.charAt(0).toUpperCase() + selectedGeography.slice(1)}
        </div>
        <select
          value={selectedGeography}
          onChange={handleGeographyChange}
          className="input w-full"
        >
          <option value="ethiopia">Ethiopia</option>
          <option value="kenya">Kenya</option>
          <option value="malawi">Malawi</option>
          <option value="nigeria">Nigeria</option>
          <option value="tanzania">Tanzania</option>
          <option value="uganda">Uganda</option>
          <option value="bangladesh">Bangladesh</option>
          <option value="bihar">Rural Bihar, India</option>
          <option value="uttar_pradesh">Uttar Pradesh, India</option>
          <option value="pakistan">Pakistan</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Disease
        </label>
        <div className="text-sm font-medium mb-2 text-indigo-600 dark:text-indigo-400">
          {formatDiseaseName(selectedDisease)}
        </div>
        <select
          value={selectedDisease}
          onChange={handleDiseaseChange}
          className="input w-full"
        >
          <optgroup label="Infectious Diseases">
            <option value="tuberculosis">Tuberculosis</option>
            <option value="pneumonia">Pneumonia</option>
            <option value="infant_pneumonia">Infant Pneumonia</option>
            <option value="malaria">Malaria</option>
            <option value="fever">Fever of Unknown Origin</option>
            <option value="diarrhea">Diarrheal Disease</option>
            <option value="hiv_opportunistic">HIV Opportunistic Infections</option>
          </optgroup>
          <optgroup label="Maternal & Neonatal">
            <option value="maternal_hemorrhage">Maternal Hemorrhage</option>
            <option value="maternal_hypertension">Maternal Hypertension</option>
            <option value="neonatal_sepsis">Neonatal Sepsis</option>
            <option value="preterm_birth">Preterm Birth Complications</option>
          </optgroup>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Population Size
        </label>
        <input
          type="number"
          value={population}
          onChange={handlePopulationChange}
          className="input w-full"
          min="1000"
          step="1000"
        />
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">AI Interventions</h3>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.triageAI}
              onChange={() => handleAIToggle('triageAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              AI Triage
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.chwAI}
              onChange={() => handleAIToggle('chwAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              CHW Decision Support
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.diagnosticAI}
              onChange={() => handleAIToggle('diagnosticAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Diagnostic AI
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.bedManagementAI}
              onChange={() => handleAIToggle('bedManagementAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Bed Management AI
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.hospitalDecisionAI}
              onChange={() => handleAIToggle('hospitalDecisionAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Hospital Decision Support
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.selfCareAI}
              onChange={() => handleAIToggle('selfCareAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Self-Care Apps
            </span>
          </label>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <button 
          onClick={handleViewParameters}
          className="btn bg-blue-500 text-white hover:bg-blue-600 w-full"
        >
          Configure Parameters
        </button>
        
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('view-interventions'))}
          className="btn bg-green-500 text-white hover:bg-green-600 w-full"
        >
          Configure AI Interventions
        </button>
        
        <button 
          onClick={handleViewEquations}
          className="btn bg-purple-500 text-white hover:bg-purple-600 w-full"
        >
          View Model Structure
        </button>
        
        <button 
          onClick={handleRunSimulation}
          className="btn btn-primary w-full"
        >
          Run Simulation
        </button>
        
        {results && (
          <>
            <button 
              onClick={handleSetBaseline}
              className="btn btn-secondary w-full"
            >
              Set as Baseline
            </button>
            
            <button 
              onClick={handleAddScenario}
              className="btn bg-indigo-500 text-white hover:bg-indigo-600 w-full"
            >
              Save as Scenario
            </button>
          </>
        )}
      </div>

      {scenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Saved Scenarios</h3>
          
          <div className="space-y-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleLoadScenario(scenario.id)}
                className={`w-full px-3 py-2 text-left rounded-md text-sm ${
                  selectedScenarioId === scenario.id 
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 