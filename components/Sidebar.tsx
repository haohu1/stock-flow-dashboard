import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  selectedHealthSystemStrengthAtom,
  selectedDiseaseAtom,
  selectedDiseasesAtom,
  populationSizeAtom,
  aiInterventionsAtom,
  runSimulationAtom,
  setBaselineAtom,
  addScenarioAtom,
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  simulationResultsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers
} from '../lib/store';
import { healthSystemStrengthDefaults } from '../models/stockAndFlowModel';

const Sidebar: React.FC = () => {
  const [selectedHealthSystemStrength, setSelectedHealthSystemStrength] = useAtom(selectedHealthSystemStrengthAtom);
  const [, setHealthSystemMultipliers] = useAtom(healthSystemMultipliersAtom);
  const [selectedDisease, setSelectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases, setSelectedDiseases] = useAtom(selectedDiseasesAtom);
  const [population, setPopulation] = useAtom(populationSizeAtom);
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [, setBaseline] = useAtom(setBaselineAtom);
  const [, addScenario] = useAtom(addScenarioAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [results] = useAtom(simulationResultsAtom);
  
  // Local state for disease checkboxes
  const [diseaseOptions, setDiseaseOptions] = useState<{
    id: string;
    name: string;
    group: string;
    checked: boolean;
  }[]>([]);

  // Initialize disease options
  useEffect(() => {
    const options = [
      // Infectious Diseases
      { id: 'tuberculosis', name: 'Tuberculosis', group: 'Infectious Diseases', checked: selectedDiseases.includes('tuberculosis') },
      { id: 'pneumonia', name: 'Pneumonia', group: 'Infectious Diseases', checked: selectedDiseases.includes('pneumonia') },
      { id: 'infant_pneumonia', name: 'Infant Pneumonia', group: 'Infectious Diseases', checked: selectedDiseases.includes('infant_pneumonia') },
      { id: 'malaria', name: 'Malaria', group: 'Infectious Diseases', checked: selectedDiseases.includes('malaria') },
      { id: 'fever', name: 'Fever of Unknown Origin', group: 'Infectious Diseases', checked: selectedDiseases.includes('fever') },
      { id: 'diarrhea', name: 'Diarrheal Disease', group: 'Infectious Diseases', checked: selectedDiseases.includes('diarrhea') },
      { id: 'hiv_opportunistic', name: 'HIV Opportunistic Infections', group: 'Infectious Diseases', checked: selectedDiseases.includes('hiv_opportunistic') },
      { id: 'urti', name: 'Upper Respiratory Tract Infection (URTI)', group: 'Infectious Diseases', checked: selectedDiseases.includes('urti') },
      
      // General & Chronic Conditions (merged with Maternal & Neonatal)
      { id: 'high_risk_pregnancy_low_anc', name: 'High-Risk Pregnancy (Low ANC)', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('high_risk_pregnancy_low_anc') },
      { id: 'anemia', name: 'Anemia', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('anemia') },
      { id: 'hiv_management_chronic', name: 'HIV Management (Chronic)', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('hiv_management_chronic') },
      { id: 'congestive_heart_failure', name: 'Congestive Heart Failure', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('congestive_heart_failure') },
    ];
    
    setDiseaseOptions(options);
  }, [selectedDiseases]);

  const handleHealthSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScenarioKey = e.target.value as keyof typeof healthSystemStrengthDefaults | 'custom';
    setSelectedHealthSystemStrength(newScenarioKey);

    if (newScenarioKey !== 'custom' && healthSystemStrengthDefaults[newScenarioKey as keyof typeof healthSystemStrengthDefaults]) {
      const scenario = healthSystemStrengthDefaults[newScenarioKey as keyof typeof healthSystemStrengthDefaults];
      const newMultipliers: HealthSystemMultipliers = {
        mu_multiplier_I: scenario.mu_multiplier_I ?? 1.0,
        mu_multiplier_L0: scenario.mu_multiplier_L0 ?? 1.0,
        mu_multiplier_L1: scenario.mu_multiplier_L1 ?? 1.0,
        mu_multiplier_L2: scenario.mu_multiplier_L2 ?? 1.0,
        mu_multiplier_L3: scenario.mu_multiplier_L3 ?? 1.0,
        delta_multiplier_U: scenario.delta_multiplier_U ?? 1.0,
        delta_multiplier_I: scenario.delta_multiplier_I ?? 1.0,
        delta_multiplier_L0: scenario.delta_multiplier_L0 ?? 1.0,
        delta_multiplier_L1: scenario.delta_multiplier_L1 ?? 1.0,
        delta_multiplier_L2: scenario.delta_multiplier_L2 ?? 1.0,
        delta_multiplier_L3: scenario.delta_multiplier_L3 ?? 1.0,
        rho_multiplier_L0: scenario.rho_multiplier_L0 ?? 1.0,
        rho_multiplier_L1: scenario.rho_multiplier_L1 ?? 1.0,
        rho_multiplier_L2: scenario.rho_multiplier_L2 ?? 1.0,
      };
      setHealthSystemMultipliers(newMultipliers);
    }
    // If 'custom', multipliers are managed by ParametersPanel.tsx
  };

  const handleDiseaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrimaryDisease = e.target.value;
    
    // Set the primary disease
    setSelectedDisease(newPrimaryDisease);
    
    // Update the selectedDiseases array to ONLY include the new primary disease
    setSelectedDiseases([newPrimaryDisease]);
    
    // Update checkboxes state to reflect only the new disease is checked
    setDiseaseOptions(
      diseaseOptions.map(option => 
        option.id === newPrimaryDisease
          ? { ...option, checked: true }
          : { ...option, checked: false }
      )
    );
    
    // Force display to switch to this disease in the dashboard
    window.dispatchEvent(new CustomEvent('primary-disease-changed', { detail: { disease: newPrimaryDisease } }));
  };

  const handleDiseaseToggle = (diseaseId: string, isChecked: boolean) => {
    let newSelectedDiseases: string[];
    
    if (isChecked) {
      // Add disease to selection if not already included
      newSelectedDiseases = selectedDiseases.includes(diseaseId)
        ? selectedDiseases
        : [...selectedDiseases, diseaseId];
    } else {
      // Remove disease from selection
      newSelectedDiseases = selectedDiseases.filter(d => d !== diseaseId);
    }
    
    // Update selected diseases
    setSelectedDiseases(newSelectedDiseases);
    
    // Also update the main selected disease if needed
    if (newSelectedDiseases.length > 0 && selectedDisease !== newSelectedDiseases[0]) {
      setSelectedDisease(newSelectedDiseases[0]);
    }
    
    // Update checkboxes state
    setDiseaseOptions(
      diseaseOptions.map(option => 
        option.id === diseaseId
          ? { ...option, checked: isChecked }
          : option
      )
    );
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
    // Now we always use runSimulation which handles both single and multiple disease cases
    runSimulation();
    // Dispatch a custom event to switch to the dashboard tab
    window.dispatchEvent(new CustomEvent('view-dashboard'));
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

  // Group disease options by category
  const groupedDiseaseOptions = diseaseOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push(option);
    return acc;
  }, {} as Record<string, typeof diseaseOptions>);

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto h-screen">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Model Settings</h2>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Health System Scenario
        </label>
        <select
          value={selectedHealthSystemStrength}
          onChange={handleHealthSystemChange}
          className="input w-full"
        >
          {Object.keys(healthSystemStrengthDefaults).map(key => (
            <option key={key} value={key}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Add health system scenario descriptions */}
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          {selectedHealthSystemStrength === 'moderate_urban_system' && (
            <p>A typical urban health system with moderate resources. Balanced care-seeking behavior and healthcare quality.</p>
          )}
          {selectedHealthSystemStrength === 'weak_rural_system' && (
            <p>Limited healthcare capacity in rural settings. Lower initial care-seeking, harder transitions between levels, higher mortality rates.</p>
          )}
          {selectedHealthSystemStrength === 'strong_urban_system_lmic' && (
            <p>Well-functioning urban system in a lower/middle income country. Higher healthcare access, improved outcomes, and efficient referrals.</p>
          )}
          {selectedHealthSystemStrength === 'fragile_conflict_system' && (
            <p>Healthcare system in a humanitarian crisis or conflict zone. Severely limited access, compromised care quality, and disrupted referral pathways.</p>
          )}
          {selectedHealthSystemStrength === 'high_income_system' && (
            <p>Advanced healthcare system in a high-income country. Very high treatment quality and access, low mortality, with higher costs of care.</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Primary Disease
        </label>
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
            <option value="urti">Upper Respiratory Tract Infection (URTI)</option>
          </optgroup>
          <optgroup label="General & Chronic Conditions">
            <option value="high_risk_pregnancy_low_anc">High-Risk Pregnancy (Low ANC)</option>
            <option value="anemia">Anemia</option>
            <option value="hiv_management_chronic">HIV Management (Chronic)</option>
            <option value="congestive_heart_failure">Congestive Heart Failure</option>
          </optgroup>
        </select>
      </div>

      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Compare Multiple Diseases
        </label>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-48 overflow-y-auto">
          {Object.entries(groupedDiseaseOptions).map(([group, options]) => (
            <div key={group} className="mb-2">
              <h4 className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">{group}</h4>
              <div className="space-y-1">
                {options.map(option => (
                  <label key={option.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={option.checked}
                      onChange={(e) => handleDiseaseToggle(option.id, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {option.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Selected: {selectedDiseases.length} disease{selectedDiseases.length !== 1 ? 's' : ''}
        </div>
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
          className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Run Simulation
        </button>
        
        {results && (
          <>
            <button 
              onClick={handleSetBaseline}
              className="btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full mt-2"
            >
              Set as Baseline
            </button>
            <button 
              onClick={handleAddScenario}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full mt-2"
            >
              Save as Scenario
            </button>
          </>
        )}
      </div>

      {scenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Saved Scenarios</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleLoadScenario(scenario.id)}
                className={`text-left p-2 text-sm rounded w-full ${
                  selectedScenarioId === scenario.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300'
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