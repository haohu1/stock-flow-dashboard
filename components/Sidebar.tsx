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
  loadScenarioAtom
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

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Model Settings</h2>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Geography
        </label>
        <select
          value={selectedGeography}
          onChange={handleGeographyChange}
          className="input w-full"
        >
          <option value="ethiopia">Ethiopia</option>
          <option value="mozambique">Manhiça District, Mozambique</option>
          <option value="bihar">Rural Bihar, India</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Disease
        </label>
        <select
          value={selectedDisease}
          onChange={handleDiseaseChange}
          className="input w-full"
        >
          <option value="tuberculosis">Tuberculosis</option>
          <option value="pneumonia">Pneumonia</option>
          <option value="malaria">Malaria</option>
          <option value="fever">Fever of Unknown Origin</option>
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
          onClick={handleRunSimulation}
          className="btn btn-primary w-full"
        >
          Run Simulation
        </button>
        
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