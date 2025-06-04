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
  HealthSystemMultipliers,
  customScenarioNameAtom,
  selectedAIScenarioAtom,
  baselineResultsAtom,
  baseParametersAtom,
  selectedCountryAtom,
  isUrbanSettingAtom,
  useCountrySpecificModelAtom,
  multiConditionModeAtom,
  multiConditionMortalityMultiplierAtom,
  multiConditionResolutionReductionAtom,
  multiConditionCareSeekingBoostAtom
} from '../lib/store';
import { healthSystemStrengthDefaults } from '../models/stockAndFlowModel';
import { countryProfiles } from '../models/countrySpecificModel';

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
  const [customScenarioName, setCustomScenarioName] = useAtom(customScenarioNameAtom);
  const [selectedAIScenario] = useAtom(selectedAIScenarioAtom);
  const [baseline] = useAtom(baselineResultsAtom);
  const [baseParams, setBaseParams] = useAtom(baseParametersAtom);
  
  // Country-specific atoms
  const [selectedCountry, setSelectedCountry] = useAtom(selectedCountryAtom);
  const [isUrban, setIsUrban] = useAtom(isUrbanSettingAtom);
  const [useCountrySpecific, setUseCountrySpecific] = useAtom(useCountrySpecificModelAtom);
  const [multiConditionMode, setMultiConditionMode] = useAtom(multiConditionModeAtom);
  const [mortalityMultiplier, setMortalityMultiplier] = useAtom(multiConditionMortalityMultiplierAtom);
  const [resolutionReduction, setResolutionReduction] = useAtom(multiConditionResolutionReductionAtom);
  const [careSeekingBoost, setCareSeekingBoost] = useAtom(multiConditionCareSeekingBoostAtom);
  
  // Local state for disease checkboxes
  const [diseaseOptions, setDiseaseOptions] = useState<{
    id: string;
    name: string;
    group: string;
    checked: boolean;
  }[]>([]);
  
  // State for expandable sections
  const [compareDiseaseExpanded, setCompareDiseaseExpanded] = useState(false);
  const [healthSystemExpanded, setHealthSystemExpanded] = useState(false);
  const [diseaseDescriptionExpanded, setDiseaseDescriptionExpanded] = useState(false);
  const [countryExpanded, setCountryExpanded] = useState(false);
  const [multiConditionExpanded, setMultiConditionExpanded] = useState(false);

  // Initialize disease options
  useEffect(() => {
    const options = [
      // Infectious Diseases
      { id: 'tuberculosis', name: 'Tuberculosis', group: 'Infectious Diseases', checked: selectedDiseases.includes('tuberculosis') },
      { id: 'childhood_pneumonia', name: 'Childhood Pneumonia', group: 'Infectious Diseases', checked: selectedDiseases.includes('childhood_pneumonia') },
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

  // Generate default scenario name based on AI interventions or scenario
  useEffect(() => {
    // Only generate scenario name if baseline exists
    if (!baseline) {
      setCustomScenarioName('');
      return;
    }
    
    const activeAIInterventions = Object.entries(aiInterventions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);
    
    let defaultName = '';
    
    // If we have a selected AI scenario, use its name
    if (selectedAIScenario) {
      const presetNames: {[key: string]: string} = {
        'best-case-2025': 'Best Case',
        'worst-case-2025': 'Worst Case',
        'clinical-decision-support-2025': 'Clinical Decision Support',
        'workflow-efficiency-2025': 'Workflow Efficiency',
        'patient-facing-ai-success-2025': 'Patient-Facing AI',
        'diagnostic-imaging-2025': 'Diagnostic & Imaging',
        'resource-constrained-2025': 'Resource-Constrained',
        'community-health-2025': 'Community Health',
        'referral-triage-2025': 'Referral & Triage'
      };
      
      defaultName = presetNames[selectedAIScenario] || selectedAIScenario;
    }
    // Otherwise, use AI interventions or sequence number
    else if (activeAIInterventions.length > 0) {
      if (activeAIInterventions.length === 1) {
        const aiName = (() => {
          switch(activeAIInterventions[0]) {
            case 'triageAI': return 'AI Health Advisor';
            case 'chwAI': return 'CHW Decision Support';
            case 'diagnosticAI': return 'Diagnostic AI (L1/L2)';
            case 'bedManagementAI': return 'Bed Management AI';
            case 'hospitalDecisionAI': return 'Hospital Decision Support';
            case 'selfCareAI': return 'AI Self-Care Platform';
            default: return activeAIInterventions[0];
          }
        })();
        defaultName = aiName;
      } else if (activeAIInterventions.length > 1) {
        defaultName = `Combined AI (${activeAIInterventions.length})`;
      }
    } else {
      // No AI interventions - use sequence number
      defaultName = `Scenario ${scenarios.length + 1}`;
    }
    
    setCustomScenarioName(defaultName);
  }, [aiInterventions, selectedAIScenario, scenarios.length, setCustomScenarioName, baseline]);

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

  // Add handler for selecting all diseases
  const handleSelectAllDiseases = () => {
    const allDiseaseIds = diseaseOptions.map(option => option.id);
    setSelectedDiseases(allDiseaseIds);
    setDiseaseOptions(
      diseaseOptions.map(option => ({ ...option, checked: true }))
    );
    
    // Keep the primary disease as is, or set it to the first one if none selected
    if (selectedDiseases.length === 0 && allDiseaseIds.length > 0) {
      setSelectedDisease(allDiseaseIds[0]);
    }
  };

  // Add handler for clearing all diseases
  const handleClearAllDiseases = () => {
    // Keep at least the primary disease selected
    const newSelection = selectedDisease ? [selectedDisease] : [];
    setSelectedDiseases(newSelection);
    
    setDiseaseOptions(
      diseaseOptions.map(option => 
        ({ ...option, checked: option.id === selectedDisease })
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
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Model Settings</h2>

      {/* Country Context Section - Replaces Health System Scenario */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Country Context
          </label>
          <button 
            onClick={() => setCountryExpanded(!countryExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {countryExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setUseCountrySpecific(true); // Automatically enable when country is selected
          }}
          className="input w-full mb-2"
        >
          {Object.entries(countryProfiles).map(([key, profile]) => (
            <option key={key} value={key}>
              {profile.country} - {profile.diseaseProfile}
            </option>
          ))}
        </select>
        
        <div className="flex space-x-2 mb-2">
          <label className="flex items-center flex-1">
            <input
              type="radio"
              name="setting"
              checked={isUrban}
              onChange={() => setIsUrban(true)}
              className="text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Urban</span>
          </label>
          <label className="flex items-center flex-1">
            <input
              type="radio"
              name="setting"
              checked={!isUrban}
              onChange={() => setIsUrban(false)}
              className="text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-1 text-xs text-gray-700 dark:text-gray-300">Rural</span>
          </label>
        </div>

        {countryExpanded && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
            {selectedCountry === 'nigeria' && (
              <p>Nigeria: High burden of childhood infectious diseases (pneumonia, diarrhea). Weak primary care infrastructure, especially in rural areas. AI self-care solutions may have high impact for low-acuity conditions.</p>
            )}
            {selectedCountry === 'kenya' && (
              <p>Kenya: High HIV/TB burden with co-infection challenges. Strong vertical disease programs but fragmented primary care. AI triage may help integrate care systems.</p>
            )}
            {selectedCountry === 'south_africa' && (
              <p>South Africa: World's largest HIV epidemic (20.4% prevalence) with extremely high TB burden and extensive drug resistance. Strong public health system with good infrastructure but overwhelmed by disease burden. AI interventions may improve efficiency in managing complex co-infections.</p>
            )}
          </div>
        )}
      </div>


      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Health System Diseases
          </label>
          <button 
            onClick={() => setCompareDiseaseExpanded(!compareDiseaseExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {compareDiseaseExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="mb-2 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
          <span>Select diseases to model the total health system load ({selectedDiseases.length} selected)</span>
          {compareDiseaseExpanded && (
            <div className="space-x-2">
              <button 
                onClick={handleSelectAllDiseases}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Add All
              </button>
              <button 
                onClick={handleClearAllDiseases}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        
        {compareDiseaseExpanded && (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(groupedDiseaseOptions).map(([groupName, options]) => (
              <div key={groupName} className="border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {groupName}
                </h4>
                <div className="space-y-1">
                  {options.map((option) => (
                    <label key={option.id} className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={option.checked}
                        onChange={(e) => handleDiseaseToggle(option.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!compareDiseaseExpanded && selectedDiseases.length > 0 && (
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
            Selected: {selectedDiseases.map(d => d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
          </div>
        )}
      </div>
      
      {/* Add Population Size field */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Population Size
        </label>
        <input
          type="number"
          value={population}
          onChange={handlePopulationChange}
          min="1000"
          step="1000"
          className="input w-full"
        />
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
          <p>Total population in the modeled region. Affects absolute numbers in outcomes but not proportions.</p>
        </div>
      </div>

      {/* System Congestion Settings */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          System Congestion Level
        </label>
        <select
          value={baseParams.systemCongestion || 0}
          onChange={(e) => {
            const congestion = parseFloat(e.target.value);
            setBaseParams({ ...baseParams, systemCongestion: congestion });
          }}
          className="input w-full"
        >
          <option value="0">No Congestion (0%)</option>
          <option value="0.2">Low Congestion (20%)</option>
          <option value="0.5">Moderate Congestion (50%)</option>
          <option value="0.7">High Congestion (70%)</option>
          <option value="0.9">Severe Congestion (90%)</option>
        </select>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
          {baseParams.systemCongestion === 0 && (
            <p>System operating normally with full capacity available. Optimal patient flow and outcomes.</p>
          )}
          {baseParams.systemCongestion === 0.2 && (
            <p>Mild system stress. Some delays in care but generally manageable. Mortality slightly elevated.</p>
          )}
          {baseParams.systemCongestion === 0.5 && (
            <p>Significant congestion. Half of patients face delays. Queue mortality increases substantially.</p>
          )}
          {baseParams.systemCongestion === 0.7 && (
            <p>System under severe strain. Most patients queued. High mortality from delays in care.</p>
          )}
          {baseParams.systemCongestion === 0.9 && (
            <p>Near-collapse conditions. System overwhelmed. Critical patients dying in queues.</p>
          )}
        </div>
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
              AI Health Advisor
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
              Diagnostic AI (L1/L2)
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
              AI Self-Care Platform
            </span>
          </label>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scenario Name
        </label>
        <input
          type="text"
          value={customScenarioName}
          onChange={(e) => setCustomScenarioName(e.target.value)}
          className={`input w-full mb-4 ${!baseline ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
          placeholder={baseline ? "Enter scenario name" : "Set as Baseline First"}
          disabled={!baseline}
        />
        
        <div className="space-y-2">
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
      </div>

      {scenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Saved Scenarios</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
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
              .map((scenario) => (
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