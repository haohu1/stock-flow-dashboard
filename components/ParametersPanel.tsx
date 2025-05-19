import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  baseParametersAtom,
  derivedParametersAtom,
  selectedHealthSystemStrengthAtom,
  selectedDiseaseAtom,
  populationSizeAtom,
  runSimulationAtom,
  simulationResultsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import { 
  healthSystemStrengthDefaults,
  diseaseProfiles, 
  getDefaultParameters,
  ModelParameters
} from '../models/stockAndFlowModel';

// Parameter groupings for better organization - Disease Characteristics first
const parameterGroups = [
  {
    title: 'Disease Characteristics',
    params: [
      { key: 'lambda', label: 'Annual Incidence Rate (λ)', description: 'Episodes per person per year' },
      { key: 'disabilityWeight', label: 'Disability Weight', description: 'Severity factor for DALY calculations (0-1)' },
      { key: 'meanAgeOfInfection', label: 'Mean Age of Infection', description: 'Average age when patients contract the disease (years)' },
    ],
    isDiseaseSpecific: true,
  },
  {
    title: 'Care-Seeking Behavior',
    params: [
      { key: 'phi0', label: 'Formal Care Entry (φ₀)', description: 'Probability of seeking formal care initially' },
      { key: 'sigmaI', label: 'Informal to Formal (σI)', description: 'Weekly probability of transition from informal to formal care' },
      { key: 'informalCareRatio', label: 'Untreated Ratio', description: 'Proportion of patients remaining untreated (vs. informal care)' }
    ],
    isHealthSystemSpecific: true,
  },
  {
    title: 'Economic Parameters', // Moved up to group with other health system params
    params: [
      { key: 'perDiemCosts.I', label: 'Informal Care Cost', description: 'Cost per day in informal care (USD)' },
      { key: 'perDiemCosts.L0', label: 'CHW Cost', description: 'Cost per day with community health workers (USD)' },
      { key: 'perDiemCosts.L1', label: 'Primary Care Cost', description: 'Cost per day at primary care (USD)' },
      { key: 'perDiemCosts.L2', label: 'District Hospital Cost', description: 'Cost per day at district hospital (USD)' },
      { key: 'perDiemCosts.L3', label: 'Tertiary Hospital Cost', description: 'Cost per day at tertiary hospital (USD)' },
      // Note: aiFixedCost and aiVariableCost are handled by AI panel now, but kept for model integrity.
      // We will display them as general parameters for now.
      { key: 'regionalLifeExpectancy', label: 'Life Expectancy', description: 'Regional life expectancy (years)' },
      { key: 'discountRate', label: 'Discount Rate', description: 'Annual discount rate for economic calculations' },
    ],
    isHealthSystemSpecific: true,
  },
  {
    title: 'Informal Care',
    params: [
      { key: 'muI', label: 'Informal Resolution (μI)', description: 'Weekly probability of resolution in informal care' },
      { key: 'deltaI', label: 'Informal Death (δI)', description: 'Weekly probability of death in informal care' },
      { key: 'deltaU', label: 'Untreated Death (δU)', description: 'Weekly probability of death if untreated' },
    ],
    // These are affected by multipliers, so indirectly health system specific
  },
  {
    title: 'Community Health Workers (L0)',
    params: [
      { key: 'mu0', label: 'L0 Resolution (μ₀)', description: 'Weekly probability of resolution with CHWs' },
      { key: 'delta0', label: 'L0 Death (δ₀)', description: 'Weekly probability of death with CHWs' },
      { key: 'rho0', label: 'L0 Referral (ρ₀)', description: 'Weekly probability of referral from CHW to primary care' },
    ],
    // These are affected by multipliers, so indirectly health system specific
  },
  {
    title: 'Primary Care (L1)',
    params: [
      { key: 'mu1', label: 'L1 Resolution (μ₁)', description: 'Weekly probability of resolution at primary care' },
      { key: 'delta1', label: 'L1 Death (δ₁)', description: 'Weekly probability of death at primary care' },
      { key: 'rho1', label: 'L1 Referral (ρ₁)', description: 'Weekly probability of referral from primary to district hospital' },
    ],
    // These are affected by multipliers, so indirectly health system specific
  },
  {
    title: 'District Hospital (L2)',
    params: [
      { key: 'mu2', label: 'L2 Resolution (μ₂)', description: 'Weekly probability of resolution at district hospital' },
      { key: 'delta2', label: 'L2 Death (δ₂)', description: 'Weekly probability of death at district hospital' },
      { key: 'rho2', label: 'L2 Referral (ρ₂)', description: 'Weekly probability of referral from district to tertiary hospital' },
    ],
    // These are affected by multipliers, so indirectly health system specific
  },
  {
    title: 'Tertiary Hospital (L3)',
    params: [
      { key: 'mu3', label: 'L3 Resolution (μ₃)', description: 'Weekly probability of resolution at tertiary hospital' },
      { key: 'delta3', label: 'L3 Death (δ₃)', description: 'Weekly probability of death at tertiary hospital' },
    ],
    // These are affected by multipliers, so indirectly health system specific
  },
  {
    title: 'AI Related Parameters', // Grouping AI specific economic and effectiveness params
    params: [
      { key: 'selfCareAIEffectMuI', label: 'Self-Care Resolution Effect', description: 'Improvement in resolution rate from self-care AI' },
      { key: 'selfCareAIEffectDeltaI', label: 'Self-Care Death Effect', description: 'Multiplier for death rate with self-care AI (lower is better)' },
      { key: 'aiFixedCost', label: 'AI Fixed Cost', description: 'Fixed cost for AI implementation (USD)' },
      { key: 'aiVariableCost', label: 'AI Variable Cost', description: 'Variable cost per episode touched by AI (USD)' },
    ],
    isAISpecific: true, // New flag for AI specific parameters
  },
];

// Define the type for the exported/imported parameters
interface ParameterConfig {
  id: string;
  name: string;
  description: string;
  healthSystemStrength: string;
  disease: string;
  population: number;
  parameters: ModelParameters;
}

const ParametersPanel: React.FC = () => {
  const [baseParams, setBaseParams] = useAtom(baseParametersAtom);
  const [derivedParams] = useAtom(derivedParametersAtom);
  const [selectedHealthSystemStrength, setSelectedHealthSystemStrength] = useAtom(selectedHealthSystemStrengthAtom);
  const [selectedDisease, setSelectedDisease] = useAtom(selectedDiseaseAtom);
  const [populationSize, setPopulationSize] = useAtom(populationSizeAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [results] = useAtom(simulationResultsAtom);
  const [activeMultipliers, setActiveMultipliers] = useAtom(healthSystemMultipliersAtom);
  
  // editMode is now true by default if there are no simulation results yet
  const [editMode, setEditMode] = useState(!results);
  const [editableParams, setEditableParams] = useState(baseParams);
  const [editablePopulation, setEditablePopulation] = useState(populationSize);
  const [customHealthSystem, setCustomHealthSystem] = useState<boolean>(false);
  const [customDisease, setCustomDisease] = useState<boolean>(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get default parameters for reference
  const defaultParams = getDefaultParameters();
  
  // Update editable params when base params change
  useEffect(() => {
    setEditableParams(baseParams);
  }, [baseParams]);
  
  // Update edit mode when results change
  useEffect(() => {
    if (!results) {
      setEditMode(true);
    }
  }, [results]);
  
  // Update editable params when health system strength or disease changes
  useEffect(() => {
    // Get derived parameters that incorporate health system and disease specific values
    const updatedParams = { ...derivedParams };
    
    // Only update if not in custom mode
    if (!customHealthSystem && !customDisease) {
      setEditableParams(updatedParams);
    }
  }, [selectedHealthSystemStrength, selectedDisease, derivedParams, customHealthSystem, customDisease]);
  
  // Available health system scenarios and diseases from the model
  const healthSystemScenarios = Object.keys(healthSystemStrengthDefaults);
  const diseases = Object.keys(diseaseProfiles);
  
  const handleParamChange = (path: string, value: string) => {
    // Deep clone current editable params
    const newParams = JSON.parse(JSON.stringify(editableParams));
    
    // Handle nested properties (like perDiemCosts.L1)
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      newParams[parent][child] = Number(value);
    } else {
      newParams[path] = Number(value);
    }
    
    setEditableParams(newParams);
  };
  
  const handleHealthSystemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'custom') {
      setCustomHealthSystem(true);
      // When going custom, retain current multipliers for further tweaking
    } else {
      setCustomHealthSystem(false);
      setSelectedHealthSystemStrength(value);
      // When a predefined scenario is selected, reset multipliers to its defaults
      const scenario = healthSystemStrengthDefaults[value as keyof typeof healthSystemStrengthDefaults];
      if (scenario) {
        setActiveMultipliers({
          mu_multiplier_I: scenario.mu_multiplier_I,
          mu_multiplier_L0: scenario.mu_multiplier_L0,
          mu_multiplier_L1: scenario.mu_multiplier_L1,
          mu_multiplier_L2: scenario.mu_multiplier_L2,
          mu_multiplier_L3: scenario.mu_multiplier_L3,
          delta_multiplier_U: scenario.delta_multiplier_U,
          delta_multiplier_I: scenario.delta_multiplier_I,
          delta_multiplier_L0: scenario.delta_multiplier_L0,
          delta_multiplier_L1: scenario.delta_multiplier_L1,
          delta_multiplier_L2: scenario.delta_multiplier_L2,
          delta_multiplier_L3: scenario.delta_multiplier_L3,
          rho_multiplier_L0: scenario.rho_multiplier_L0,
          rho_multiplier_L1: scenario.rho_multiplier_L1,
          rho_multiplier_L2: scenario.rho_multiplier_L2,
        });
      }
    }
  };
  
  const handleDiseaseChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'custom') {
      setCustomDisease(true);
    } else {
      setCustomDisease(false);
      setSelectedDisease(value);
      
      // If we switched from custom to a predefined disease,
      // immediately get disease-specific parameters
      if (customDisease) {
        // We'll use the useEffect to update the parameters
      }
    }
  };
  
  const saveChanges = () => {
    // Apply current health system and disease settings
    let finalParams = { ...editableParams };
    
    // Save parameters to the atom
    setBaseParams(finalParams);
    setPopulationSize(editablePopulation);
    
    if (!results) {
      // Only close edit mode if there are simulation results
      setEditMode(false);
    } else {
      // Just close edit mode without running simulation
      setEditMode(false);
    }
  };
  
  const cancelChanges = () => {
    setEditableParams(baseParams);
    setEditablePopulation(populationSize);
    // Also reset multipliers if cancelling changes and a scenario is selected
    if (!customHealthSystem) {
      const scenario = healthSystemStrengthDefaults[selectedHealthSystemStrength as keyof typeof healthSystemStrengthDefaults];
      if (scenario) {
        setActiveMultipliers({
          mu_multiplier_I: scenario.mu_multiplier_I,
          mu_multiplier_L0: scenario.mu_multiplier_L0,
          mu_multiplier_L1: scenario.mu_multiplier_L1,
          mu_multiplier_L2: scenario.mu_multiplier_L2,
          mu_multiplier_L3: scenario.mu_multiplier_L3,
          delta_multiplier_U: scenario.delta_multiplier_U,
          delta_multiplier_I: scenario.delta_multiplier_I,
          delta_multiplier_L0: scenario.delta_multiplier_L0,
          delta_multiplier_L1: scenario.delta_multiplier_L1,
          delta_multiplier_L2: scenario.delta_multiplier_L2,
          delta_multiplier_L3: scenario.delta_multiplier_L3,
          rho_multiplier_L0: scenario.rho_multiplier_L0,
          rho_multiplier_L1: scenario.rho_multiplier_L1,
          rho_multiplier_L2: scenario.rho_multiplier_L2,
        });
      }
    }
    if (results) {
      // Only close edit mode if there are simulation results
      setEditMode(false);
    }
  };
  
  const handleMultiplierChange = (key: keyof HealthSystemMultipliers, value: string) => {
    setActiveMultipliers(prev => ({ ...prev, [key]: Number(value) }));
  };
  
  const resetMultipliersToScenarioDefaults = () => {
    if (!customHealthSystem) {
      const scenario = healthSystemStrengthDefaults[selectedHealthSystemStrength as keyof typeof healthSystemStrengthDefaults];
      if (scenario) {
        setActiveMultipliers({
          mu_multiplier_I: scenario.mu_multiplier_I,
          mu_multiplier_L0: scenario.mu_multiplier_L0,
          mu_multiplier_L1: scenario.mu_multiplier_L1,
          mu_multiplier_L2: scenario.mu_multiplier_L2,
          mu_multiplier_L3: scenario.mu_multiplier_L3,
          delta_multiplier_U: scenario.delta_multiplier_U,
          delta_multiplier_I: scenario.delta_multiplier_I,
          delta_multiplier_L0: scenario.delta_multiplier_L0,
          delta_multiplier_L1: scenario.delta_multiplier_L1,
          delta_multiplier_L2: scenario.delta_multiplier_L2,
          delta_multiplier_L3: scenario.delta_multiplier_L3,
          rho_multiplier_L0: scenario.rho_multiplier_L0,
          rho_multiplier_L1: scenario.rho_multiplier_L1,
          rho_multiplier_L2: scenario.rho_multiplier_L2,
        });
      }
    }
  };
  
  // Get parameter value, handling nested properties
  const getParamValue = (params: ModelParameters, path: string): number => {
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      return params[parent as keyof ModelParameters][child as keyof ModelParameters[keyof ModelParameters]];
    }
    return params[path as keyof ModelParameters] as number;
  };
  
  // Check if a parameter is affected by health system scenario selection
  const isHealthSystemSpecific = (paramKey: string): boolean => {
    if (customHealthSystem) return false;
    
    const scenarioParams = healthSystemStrengthDefaults[selectedHealthSystemStrength as keyof typeof healthSystemStrengthDefaults] || {};
    
    // Check if this parameter exists directly in the health system scenario defaults (e.g. phi0, perDiemCosts)
    // For multipliers, this logic might need adjustment if we want to highlight disease params that are *affected* by multipliers.
    // For now, this checks for direct params from the scenario object.
    if (paramKey.includes('.')) {
        const [parentKey] = paramKey.split('.');
        return parentKey in scenarioParams;
    }
    return paramKey in scenarioParams;
  };
  
  // Check if a parameter is affected by disease selection
  const isDiseaseSpecific = (paramKey: string): boolean => {
    if (customDisease) return false;
    
    const defaultValue = getParamValue(defaultParams, paramKey);
    const diseaseParams = diseaseProfiles[selectedDisease as keyof typeof diseaseProfiles] || {};
    
    // Check if this parameter exists in the disease profile
    return paramKey in diseaseParams;
  };
  
  // Format parameter value for display
  const formatParamValue = (path: string, value: number) => {
    // Use more decimal places for small probabilities
    if (path.startsWith('delta') || (value > 0 && value < 0.1)) {
      return formatDecimal(value, 4);
    }
    return formatDecimal(value, 3);
  };
  
  // Reset all parameters to defaults
  const resetToDefaults = () => {
    setEditableParams(getDefaultParameters());
    setEditablePopulation(300000);
    setCustomHealthSystem(false);
    setCustomDisease(false);
  };

  // Export current parameters to JSON file
  const exportParameters = () => {
    const configName = prompt("Enter a name for this parameter set:", "My Parameter Configuration");
    if (!configName) return;
    
    const configDescription = prompt("Enter a description (optional):", "");
    
    const config: ParameterConfig = {
      id: `params-${Date.now()}`,
      name: configName,
      description: configDescription || "",
      healthSystemStrength: customHealthSystem ? "custom" : selectedHealthSystemStrength,
      disease: customDisease ? "custom" : selectedDisease,
      population: editablePopulation,
      parameters: { ...editableParams }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parameters-${configName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import parameters from JSON file
  const importParameters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as ParameterConfig;
        
        // Validate the imported configuration
        if (typeof config !== 'object' || !config.parameters) {
          alert('Invalid parameter file format');
          return;
        }
        
        // Apply the imported parameters
        setEditableParams(config.parameters);
        
        // Handle health system, disease, and population settings
        if (config.healthSystemStrength === "custom") {
          setCustomHealthSystem(true);
        } else {
          setCustomHealthSystem(false);
          setSelectedHealthSystemStrength(config.healthSystemStrength);
        }
        
        if (config.disease === "custom") {
          setCustomDisease(true);
        } else {
          setCustomDisease(false);
          setSelectedDisease(config.disease);
        }
        
        if (config.population) {
          setEditablePopulation(config.population);
        }
        
        // Switch to edit mode to allow reviewing the imported parameters
        setEditMode(true);
        
        alert(`Parameters "${config.name}" loaded successfully. Review and click "Save Parameters" to apply.`);
      } catch (error) {
        console.error('Error importing parameters:', error);
        alert('Failed to import parameters. Please check the file format.');
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Model Parameters</h3>
        <div>
          {!editMode ? (
            <div className="flex space-x-2">
              <button 
                onClick={() => setEditMode(true)}
                className="btn btn-primary text-sm"
              >
                Edit Parameters
              </button>
              <button
                onClick={exportParameters}
                className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm"
              >
                Export JSON
              </button>
              <label className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importParameters}
                  ref={fileInputRef}
                />
              </label>
            </div>
          ) : (
            <div className="flex space-x-2">
              {results && (
                <button 
                  onClick={cancelChanges}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={resetToDefaults}
                className="btn bg-red-50 hover:bg-red-100 text-red-600 text-sm"
              >
                Reset to Defaults
              </button>
              <button
                onClick={exportParameters}
                className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm"
              >
                Export JSON
              </button>
              <label className="btn bg-purple-50 hover:bg-purple-100 text-purple-600 text-sm cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importParameters}
                  ref={fileInputRef}
                />
              </label>
              <button 
                onClick={saveChanges}
                className="btn bg-green-50 hover:bg-green-100 text-green-600 text-sm"
              >
                Save Parameters
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These parameters define the flow of patients through the healthcare system and the impact of AI interventions.
          All probabilities are weekly unless otherwise specified.
        </p>
        
        {/* Health System and Disease Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Health System Scenario Selection */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Health System Scenario
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Predefined settings for different health system strengths
              </p>
              {editMode ? (
                <select 
                  value={customHealthSystem ? 'custom' : selectedHealthSystemStrength}
                  onChange={handleHealthSystemChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                >
                  {healthSystemScenarios.map(scenarioKey => (
                    <option key={scenarioKey} value={scenarioKey}>
                      {scenarioKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              ) : (
                <div className="text-sm py-2">{selectedHealthSystemStrength.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              )}
              {!customHealthSystem && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                    Using {selectedHealthSystemStrength.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} parameters
                  </span>
                </div>
              )}
            </div>
            
            {/* Disease Selection */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Disease Profile
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Predefined parameters for different diseases
              </p>
              {editMode ? (
                <select 
                  value={customDisease ? 'custom' : selectedDisease}
                  onChange={handleDiseaseChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
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
                  <optgroup label="Maternal & Neonatal">
                    <option value="maternal_hemorrhage">Maternal Hemorrhage</option>
                    <option value="maternal_hypertension">Maternal Hypertension</option>
                    <option value="neonatal_sepsis">Neonatal Sepsis</option>
                    <option value="preterm_birth">Preterm Birth Complications</option>
                    <option value="high_risk_pregnancy_low_anc">High-Risk Pregnancy (Low ANC)</option>
                  </optgroup>
                  <optgroup label="General & Chronic Conditions">
                    <option value="anemia">Anemia</option>
                    <option value="hiv_management_chronic">HIV Management (Chronic)</option>
                    <option value="congestive_heart_failure">Congestive Heart Failure</option>
                  </optgroup>
                  <option value="custom">Custom</option>
                </select>
              ) : (
                <div className="text-sm py-2">{selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1).replace(/_/g, ' ')}</div>
              )}
              {!customDisease && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                    Using {selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1).replace(/_/g, ' ')} parameters
                  </span>
                </div>
              )}
            </div>
            
            {/* Population Size */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Population Size
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Total population in the modeled region
              </p>
              {editMode ? (
                <input
                  type="number"
                  value={editablePopulation}
                  onChange={(e) => setEditablePopulation(Number(e.target.value))}
                  min="1000"
                  step="1000"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              ) : (
                <div className="text-sm py-2">{populationSize.toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Simplified Loop for Parameter Groups based on the new order */}
        {parameterGroups.map((group) => {
          // Determine if the group contains any parameter that is disease-specific
          const groupContainsDiseaseSpecificParam = !customDisease && group.params.some(p => isDiseaseSpecific(p.key));
          
          return (
            <div key={group.title} className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                {group.title}
                {/* Original tag for purely disease-specific groups like "Disease Characteristics" */}
                {group.isDiseaseSpecific && !customDisease && (
                  <span className="text-xs text-blue-500 ml-2">(Disease-Specific)</span>
                )}
                {/* New tag for other groups if they contain any disease-specific parameters */}
                {!group.isDiseaseSpecific && groupContainsDiseaseSpecificParam && (
                  <span className="text-xs text-blue-500 ml-2">(Contains Disease-Specific Params)</span>
                )}
                {group.isHealthSystemSpecific && !customHealthSystem && (
                  <span className="text-xs text-green-500 ml-2">(Health System Specific)</span>
                )}
                {group.isAISpecific && ( // New condition for AI specific tag
                  <span className="text-xs text-purple-500 ml-2">(AI Related)</span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.params.map((param) => {
                  const derivedValue = getParamValue(derivedParams, param.key);
                  const defaultValue = getParamValue(defaultParams, param.key); // For showing default
                  // Determine if the parameter is highlighted as disease or health system specific
                  const highlightAsDisease = group.isDiseaseSpecific && isDiseaseSpecific(param.key) && !customDisease;
                  const highlightAsHealthSystem = group.isHealthSystemSpecific && isHealthSystemSpecific(param.key) && !customHealthSystem;
                                  
                  // Base styling for the input field
                  let inputClasses = 'w-24 text-right px-2 py-1 border rounded-md text-sm';
                  let paramBoxClasses = 'bg-gray-50 dark:bg-gray-700 p-3 rounded-md border';

                  if (highlightAsDisease) {
                    inputClasses += ' border-blue-300 bg-blue-50 dark:bg-gray-800 dark:border-blue-500';
                    paramBoxClasses += ' border-blue-300 bg-blue-50 dark:!bg-gray-700';
                  } else if (highlightAsHealthSystem) {
                    inputClasses += ' border-green-300 bg-green-50 dark:bg-gray-800 dark:border-green-500';
                    paramBoxClasses += ' border-green-300 bg-green-50 dark:!bg-gray-700';
                  } else if (group.isAISpecific) {
                    inputClasses += ' border-purple-300 bg-purple-50 dark:bg-gray-800 dark:border-purple-500';
                    paramBoxClasses += ' border-purple-300 bg-purple-50 dark:!bg-gray-700';
                  }
                  else {
                    inputClasses += ' border-gray-300 dark:border-gray-600';
                    paramBoxClasses += ' border-gray-200 dark:border-gray-700';
                  }

                  return (
                    <div key={param.key} className={paramBoxClasses}>
                      <div className="flex justify-between items-start">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {param.label}
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {param.description}
                          </p>
                        </div>
                        {editMode ? (
                          <input
                            type="number"
                            value={getParamValue(editableParams, param.key)}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            step={param.key.startsWith('delta') || param.key.includes('Rate') || param.key === 'disabilityWeight' ? '0.001' : '0.01'}
                            min="0"
                            max={param.key.startsWith('phi') || param.key.startsWith('rho') || param.key === 'disabilityWeight' ? '1' : undefined}
                            className={inputClasses}
                          />
                        ) : (
                          <div className="text-right">
                            <span className={`font-mono text-sm ${
                              highlightAsDisease 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : highlightAsHealthSystem
                                  ? 'text-green-600 dark:text-green-400'
                                  : group.isAISpecific
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {formatParamValue(param.key, derivedValue)}
                            </span>
                             {/* Show default value only if it's different from derived and not custom */}
                             {defaultValue !== derivedValue && !customDisease && !customHealthSystem && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Default: {formatParamValue(param.key, defaultValue)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Health System Outcome Multipliers Section - MOVED HERE, AFTER aLL OTHER PARAMETER GROUPS */}
        {editMode && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                Health System Outcome Multipliers
                {!customHealthSystem && (
                  <span className="text-xs text-green-500 ml-2">(Health System Specific)</span>
                )}
                </h4>
                {!customHealthSystem && (
                    <button 
                        onClick={resetMultipliersToScenarioDefaults}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Reset to Scenario Defaults
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              These multipliers adjust disease-specific base rates for resolution (μ), mortality (δ), and referral (ρ).
              A value of 1.0 means no change from the disease's baseline for the current health system scenario.
              Values &lt; 1.0 generally mean better outcomes (for mortality/referral) or lower effectiveness (for resolution), and &gt; 1.0 the opposite.
              Modify these to conduct sensitivity analysis on health system strength.
            </p>

            {(Object.keys(activeMultipliers) as Array<keyof HealthSystemMultipliers>).length > 0 && (
              <div className="space-y-4">
                {[ 
                  { groupTitle: 'Resolution Rate Multipliers (α) (Base: μ)', keys: ['mu_multiplier_I', 'mu_multiplier_L0', 'mu_multiplier_L1', 'mu_multiplier_L2', 'mu_multiplier_L3'], symbol: 'α' },
                  { groupTitle: 'Mortality Rate Multipliers (β) (Base: δ)', keys: ['delta_multiplier_U', 'delta_multiplier_I', 'delta_multiplier_L0', 'delta_multiplier_L1', 'delta_multiplier_L2', 'delta_multiplier_L3'], symbol: 'β' },
                  { groupTitle: 'Referral Rate Multipliers (γ) (Base: ρ)', keys: ['rho_multiplier_L0', 'rho_multiplier_L1', 'rho_multiplier_L2'], symbol: 'γ' },
                ].map(group => (
                  <div key={group.groupTitle}>
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{group.groupTitle}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                      {group.keys.map(key => {
                        // Derive a user-friendly label from the key using the new Greek symbols
                        const parts = key.split('_'); // e.g., ['mu', 'multiplier', 'L0'] or ['delta', 'multiplier', 'U']
                        const level = parts[2]; // L0, L1, I, U etc.
                        let type = '';
                        if (parts[0] === 'mu') type = 'Resolution';
                        else if (parts[0] === 'delta') type = 'Mortality';
                        else if (parts[0] === 'rho') type = 'Referral';

                        const label = `${group.symbol}${level === 'I' ? 'ᵢ' : level === 'U' ? 'ᵤ' : level ? `₍${level}₎` : ''} (${level}-Level ${type})`;
                        
                        return (
                          <div key={key} className={`bg-gray-50 dark:bg-gray-700 p-3 rounded-md ${!customHealthSystem ? 'border border-green-300 dark:border-green-600 bg-green-50 dark:!bg-gray-700' : 'border border-gray-300 dark:border-gray-600'}`}>
                            <label htmlFor={key} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {label}
                            </label>
                            <input
                              id={key}
                              type="number"
                              value={activeMultipliers[key as keyof HealthSystemMultipliers]}
                              onChange={(e) => handleMultiplierChange(key as keyof HealthSystemMultipliers, e.target.value)}
                              step="0.05"
                              min="0"
                              className={`w-full text-right px-2 py-1 border rounded-md text-sm ${
                                !customHealthSystem 
                                  ? 'border-green-400 bg-white dark:bg-gray-800 dark:border-green-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametersPanel; 