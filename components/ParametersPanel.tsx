import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  baseParametersAtom,
  derivedParametersAtom,
  selectedHealthSystemStrengthAtom,
  selectedDiseaseAtom,
  selectedDiseasesAtom,
  populationSizeAtom,
  runSimulationAtom,
  simulationResultsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers,
  individualDiseaseParametersAtom,
  userOverriddenCongestionAtom,
  calculatedCongestionAtom,
  effectiveCongestionAtom
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import { 
  healthSystemStrengthDefaults,
  diseaseProfiles, 
  getDefaultParameters,
  ModelParameters
} from '../models/stockAndFlowModel';
import InfoTooltip from './InfoTooltip';
import { getParameterRationale } from '../data/parameter_rationales';

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
    title: 'System Capacity Constraints',
    params: [
      { key: 'systemCongestion', label: 'System Congestion', description: 'Auto-calculated based on disease burden and health system strength (0=no congestion, 1=fully congested)' },
      { key: 'congestionMortalityMultiplier', label: 'Congestion Mortality Factor', description: 'How much mortality increases due to congestion (e.g., 1.5 = 50% increase)' },
    ],
    isHealthSystemSpecific: true,
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
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [populationSize, setPopulationSize] = useAtom(populationSizeAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [results] = useAtom(simulationResultsAtom);
  const [activeMultipliers, setActiveMultipliers] = useAtom(healthSystemMultipliersAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  const [userOverriddenCongestion, setUserOverriddenCongestion] = useAtom(userOverriddenCongestionAtom);
  const [calculatedCongestion] = useAtom(calculatedCongestionAtom);
  const [effectiveCongestion] = useAtom(effectiveCongestionAtom);
  
  // Check if we're in multi-disease mode
  const isMultiDiseaseMode = selectedDiseases.length > 1;
  
  // Directly use parameters without edit mode
  const [customHealthSystem, setCustomHealthSystem] = useState<boolean>(false);
  const [customDisease, setCustomDisease] = useState<boolean>(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get default parameters for reference
  const defaultParams = getDefaultParameters();
  
  // Keep track of initial load and selection changes
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastHealthSystemStrength, setLastHealthSystemStrength] = useState(selectedHealthSystemStrength);
  const [lastDisease, setLastDisease] = useState(selectedDisease);
  
  // Update params ONLY when health system strength or disease selection changes
  useEffect(() => {
    // Skip if we're in custom mode
    if (customHealthSystem || customDisease) {
      return;
    }
    
    // Check if health system or disease selection has actually changed
    const healthSystemChanged = lastHealthSystemStrength !== selectedHealthSystemStrength;
    const diseaseChanged = lastDisease !== selectedDisease;
    
    // Only update params if there's been a change in selection or on initial load
    if (healthSystemChanged || diseaseChanged || initialLoad) {
      // Update the base parameters with the derived parameters
      setBaseParams({ ...derivedParams });
      
      // Update our tracking variables
      setLastHealthSystemStrength(selectedHealthSystemStrength);
      setLastDisease(selectedDisease);
      setInitialLoad(false);
    }
  }, [selectedHealthSystemStrength, selectedDisease, customHealthSystem, customDisease, 
      lastHealthSystemStrength, lastDisease, initialLoad, derivedParams, setBaseParams]);
  
  // Available health system scenarios and diseases from the model
  const healthSystemScenarios = Object.keys(healthSystemStrengthDefaults);
  const diseases = Object.keys(diseaseProfiles);
  
  const handleParamChange = (path: string, value: string) => {
    try {
      // Special handling for systemCongestion - use the override atom
      if (path === 'systemCongestion') {
        setUserOverriddenCongestion(Number(value));
        return;
      }
      
      // Deep clone current params
      const newParams = JSON.parse(JSON.stringify(baseParams));
      
      // Handle nested properties (like perDiemCosts.L1)
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        newParams[parent][child] = Number(value);
      } else {
        newParams[path] = Number(value);
      }
      
      // When user edits a parameter manually, set appropriate custom mode
      // Check if this parameter is disease-specific or health-system-specific
      if (isDiseaseSpecific(path)) {
        setCustomDisease(true);
      } else if (isHealthSystemSpecific(path)) {
        setCustomHealthSystem(true);
      }
      
      // Automatically save changes
      setBaseParams(newParams);
      
      // For debugging
      console.log(`Parameter ${path} changed to ${value}`);
    } catch (error) {
      console.error("Error updating parameter:", error);
    }
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
    }
  };
  
  const handlePopulationChange = (value: number) => {
    setPopulationSize(value);
  };
  
  const handleMultiplierChange = (key: keyof HealthSystemMultipliers, value: string) => {
    // When user edits a multiplier, set custom health system
    setCustomHealthSystem(true);
    
    // Update the multipliers
    const newMultipliers = { ...activeMultipliers, [key]: Number(value) };
    setActiveMultipliers(newMultipliers);
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
      const parentObj = params[parent as keyof ModelParameters];
      if (parentObj && typeof parentObj === 'object') {
        return (parentObj as any)[child] || 0;
      }
      return 0;
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
  
  // Reset all parameters to defaults for the current selections
  const resetToDefaults = () => {
    // Reset custom flags first
    setCustomHealthSystem(false);
    setCustomDisease(false);
    
    // Clear congestion override to use calculated values
    setUserOverriddenCongestion(null);
    
    // Keep current selections but reset parameters
    // Get the current health system's multipliers
    const currentSystem = healthSystemStrengthDefaults[selectedHealthSystemStrength as keyof typeof healthSystemStrengthDefaults];
    if (currentSystem) {
      setActiveMultipliers({
        mu_multiplier_I: currentSystem.mu_multiplier_I,
        mu_multiplier_L0: currentSystem.mu_multiplier_L0,
        mu_multiplier_L1: currentSystem.mu_multiplier_L1,
        mu_multiplier_L2: currentSystem.mu_multiplier_L2,
        mu_multiplier_L3: currentSystem.mu_multiplier_L3,
        delta_multiplier_U: currentSystem.delta_multiplier_U,
        delta_multiplier_I: currentSystem.delta_multiplier_I,
        delta_multiplier_L0: currentSystem.delta_multiplier_L0,
        delta_multiplier_L1: currentSystem.delta_multiplier_L1,
        delta_multiplier_L2: currentSystem.delta_multiplier_L2,
        delta_multiplier_L3: currentSystem.delta_multiplier_L3,
        rho_multiplier_L0: currentSystem.rho_multiplier_L0,
        rho_multiplier_L1: currentSystem.rho_multiplier_L1,
        rho_multiplier_L2: currentSystem.rho_multiplier_L2,
      });
    }
    
    // Reset population to 1 million (the current default)
    setPopulationSize(1000000);
    
    // Force refresh by updating the tracking state
    // This will trigger the useEffect to reload parameters from the current disease/health system
    setInitialLoad(true);
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
      population: populationSize,
      parameters: { ...baseParams }
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
        setBaseParams(config.parameters);
        
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
          setPopulationSize(config.population);
        }
        
        alert(`Parameters "${config.name}" loaded successfully.`);
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
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {isMultiDiseaseMode ? 'Health System Parameters' : 'Model Parameters'}
        </h3>
        <div className="flex space-x-2">
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
        </div>
      </div>
      
      <div className="space-y-6">
        {isMultiDiseaseMode ? (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Health System Overview
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Total System Load:</strong> {selectedDiseases.length} diseases selected: {selectedDiseases.map(d => d.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                View aggregated totals and individual disease contributions below.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These parameters define the flow of patients through the healthcare system and the impact of AI interventions.
            All probabilities are weekly unless otherwise specified.
          </p>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> AI intervention costs are configured in the <strong>AI Interventions</strong> tab in the sidebar, 
            where you can set individual costs for each AI tool and see the total costs.
          </p>
        </div>
        
        {/* Show aggregated parameters for multi-disease mode */}
        {isMultiDiseaseMode && (
          <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              Total Health System Parameters (Aggregated)
            </h4>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md mb-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                These represent the combined health system burden from all selected diseases.
                <br /><strong>Total λ = {formatDecimal(derivedParams.lambda, 4)}</strong> (sum of individual disease incidence rates)
              </p>
            </div>
            
            {/* Show key aggregated parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-300">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Annual Incidence (λ)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sum of all disease incidence rates
                </p>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {formatDecimal(derivedParams.lambda, 4)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({(derivedParams.lambda * 100000).toFixed(0).toLocaleString()} per 100,000 people)
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-300">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avg. Formal Care Seeking (φ₀)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Weighted average across diseases
                </p>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {formatDecimal(derivedParams.phi0, 3)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-green-300">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Avg. CHW Resolution (μ₀)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Weighted average across diseases
                </p>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {formatDecimal(derivedParams.mu0, 3)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Individual Disease Parameters (for multi-disease mode) */}
        {isMultiDiseaseMode && (
          <div className="border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3">
              Individual Disease Parameters
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
              View and modify parameters for each disease. Changes will affect the aggregated health system totals.
            </p>
            
            {selectedDiseases.map((disease, index) => {
              // Get disease-specific parameters from the calculated individual disease parameters
              const diseaseParams = individualDiseaseParams[disease];
              const diseaseProfile = diseaseProfiles[disease as keyof typeof diseaseProfiles];
              const diseaseName = disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              // Calculate burden percentage using actual calculated disease parameters
              const diseaseIncidence = diseaseParams?.lambda || diseaseProfile?.lambda || 0;
              const totalIncidence = derivedParams.lambda;
              const burdenPercentage = totalIncidence > 0 ? ((diseaseIncidence / totalIncidence) * 100).toFixed(1) : '0';
              
              return (
                <details key={disease} className="mb-3" open={index === 0}>
                  <summary className="cursor-pointer bg-orange-50 dark:bg-orange-900/20 p-3 rounded-md border border-orange-200 dark:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                    <span className="font-medium text-orange-800 dark:text-orange-200">
                      {diseaseName}
                    </span>
                    <span className="text-sm text-orange-600 dark:text-orange-400 ml-2">
                      (λ = {formatDecimal(diseaseIncidence, 4)} • {burdenPercentage}% of total burden)
                    </span>
                  </summary>
                  <div className="mt-2 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
                    {diseaseProfile ? (
                      <div className="space-y-4">
                        {/* Disease Burden Summary */}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-orange-200 dark:border-orange-700">
                          <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Disease Burden</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <strong>Incidence Rate (λ):</strong> {formatDecimal(diseaseIncidence, 4)}
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                {(diseaseIncidence * 100000).toFixed(0)} per 100,000 annually
                              </div>
                            </div>
                            <div>
                              <strong>System Burden:</strong> {burdenPercentage}% of total
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Relative contribution to health system load
                              </div>
                            </div>
                            <div>
                              <strong>Disease Category:</strong> {disease.includes('pneumonia') ? 'Acute Infectious' : 
                                disease.includes('diarrhea') ? 'Acute GI' : 
                                disease.includes('malaria') ? 'Parasitic' : 
                                disease.includes('tb') ? 'Chronic Infectious' : 
                                disease.includes('hiv') ? 'Chronic Viral' : 
                                disease.includes('urti') ? 'Acute Viral' : 
                                disease.includes('fever') ? 'Symptom Complex' : 
                                disease.includes('anemia') ? 'Nutritional' : 
                                disease.includes('heart') ? 'Cardiovascular' : 
                                disease.includes('pregnancy') ? 'Maternal' : 'Other'}
                            </div>
                          </div>
                        </div>

                        {/* Configurable Disease Parameters */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-orange-800 dark:text-orange-200">Disease-Specific Parameters</h5>
                          
                          {/* Disease Characteristics */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-orange-200 dark:border-orange-700">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Disease Characteristics</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Annual Incidence Rate (λ)
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.lambda || diseaseProfile.lambda || 0}
                                  onChange={(e) => {
                                    // Note: This would need to be connected to state management
                                    console.log(`Update ${disease} lambda to ${e.target.value}`);
                                  }}
                                  step="0.001"
                                  min="0"
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">Episodes per person per year</div>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Disability Weight
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.disabilityWeight || diseaseProfile.disabilityWeight || 0}
                                  onChange={(e) => {
                                    console.log(`Update ${disease} disabilityWeight to ${e.target.value}`);
                                  }}
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">DALY severity factor (0-1)</div>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Mean Age of Infection
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.meanAgeOfInfection || diseaseProfile.meanAgeOfInfection || 0}
                                  onChange={(e) => {
                                    console.log(`Update ${disease} meanAgeOfInfection to ${e.target.value}`);
                                  }}
                                  step="1"
                                  min="0"
                                  max="100"
                                  className="w-full text-right px-2 py-1 border border-blue-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">Years</div>
                              </div>
                            </div>
                          </div>

                          {/* Care-Seeking Behavior */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-orange-200 dark:border-orange-700">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Care-Seeking Behavior</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Formal Care Entry (φ₀)
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.phi0 || diseaseProfile.phi0 || 0}
                                  onChange={(e) => {
                                    console.log(`Update ${disease} phi0 to ${e.target.value}`);
                                  }}
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  className="w-full text-right px-2 py-1 border border-green-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">Initial formal care probability</div>
                              </div>
                              
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Informal to Formal (σI)
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.sigmaI || diseaseProfile.sigmaI || 0}
                                  onChange={(e) => {
                                    console.log(`Update ${disease} sigmaI to ${e.target.value}`);
                                  }}
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  className="w-full text-right px-2 py-1 border border-green-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">Weekly transition probability</div>
                              </div>
                              
                              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Untreated Ratio
                                </label>
                                <input
                                  type="number"
                                  value={diseaseParams?.informalCareRatio || diseaseProfile.informalCareRatio || 0}
                                  onChange={(e) => {
                                    console.log(`Update ${disease} informalCareRatio to ${e.target.value}`);
                                  }}
                                  step="0.01"
                                  min="0"
                                  max="1"
                                  className="w-full text-right px-2 py-1 border border-green-300 rounded text-sm mt-1"
                                />
                                <div className="text-xs text-gray-500 mt-1">Untreated vs informal care ratio</div>
                              </div>
                            </div>
                          </div>

                          {/* Clinical Outcomes */}
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-orange-200 dark:border-orange-700">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clinical Outcomes (Weekly Probabilities)</h6>
                            
                            {/* Resolution Rates */}
                            <div className="mb-3">
                              <h7 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Resolution Rates (μ)</h7>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                {['muU', 'muI', 'mu0', 'mu1', 'mu2', 'mu3'].map(param => (
                                  <div key={param} className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-700">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {param === 'muU' ? 'Untreated (μU)' :
                                       param === 'muI' ? 'Informal (μI)' :
                                       param === 'mu0' ? 'CHW (μ₀)' :
                                       param === 'mu1' ? 'Primary (μ₁)' :
                                       param === 'mu2' ? 'District (μ₂)' :
                                       'Tertiary (μ₃)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={diseaseParams?.[param as keyof typeof diseaseParams] || diseaseProfile[param as keyof typeof diseaseProfile] || 0}
                                      onChange={(e) => {
                                        console.log(`Update ${disease} ${param} to ${e.target.value}`);
                                      }}
                                      step="0.001"
                                      min="0"
                                      max="1"
                                      className="w-full text-right px-1 py-1 border border-yellow-300 rounded text-xs mt-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Mortality Rates */}
                            <div className="mb-3">
                              <h7 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Mortality Rates (δ)</h7>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                {['deltaU', 'deltaI', 'delta0', 'delta1', 'delta2', 'delta3'].map(param => (
                                  <div key={param} className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-700">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {param === 'deltaU' ? 'Untreated (δU)' :
                                       param === 'deltaI' ? 'Informal (δI)' :
                                       param === 'delta0' ? 'CHW (δ₀)' :
                                       param === 'delta1' ? 'Primary (δ₁)' :
                                       param === 'delta2' ? 'District (δ₂)' :
                                       'Tertiary (δ₃)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={diseaseParams?.[param as keyof typeof diseaseParams] || diseaseProfile[param as keyof typeof diseaseProfile] || 0}
                                      onChange={(e) => {
                                        console.log(`Update ${disease} ${param} to ${e.target.value}`);
                                      }}
                                      step="0.0001"
                                      min="0"
                                      max="1"
                                      className="w-full text-right px-1 py-1 border border-red-300 rounded text-xs mt-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Referral Rates */}
                            <div>
                              <h7 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Referral Rates (ρ)</h7>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {['rho0', 'rho1', 'rho2'].map(param => (
                                  <div key={param} className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-200 dark:border-purple-700">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                      {param === 'rho0' ? 'CHW→Primary (ρ₀)' :
                                       param === 'rho1' ? 'Primary→District (ρ₁)' :
                                       'District→Tertiary (ρ₂)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={diseaseParams?.[param as keyof typeof diseaseParams] || diseaseProfile[param as keyof typeof diseaseProfile] || 0}
                                      onChange={(e) => {
                                        console.log(`Update ${disease} ${param} to ${e.target.value}`);
                                      }}
                                      step="0.01"
                                      min="0"
                                      max="1"
                                      className="w-full text-right px-1 py-1 border border-purple-300 rounded text-xs mt-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No specific disease profile found. Using default parameters.
                      </p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
        
        {/* Standard Parameter Groups */}
        {parameterGroups.map((group) => {
          // Determine if the group contains any parameter that is disease-specific
          const groupContainsDiseaseSpecificParam = !customDisease && group.params.some(p => isDiseaseSpecific(p.key));
          
          return (
            <div key={group.title} className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                {isMultiDiseaseMode && group.title === 'Disease Characteristics' ? 'Health System Characteristics' : group.title}
                {/* Show aggregated tag in multi-disease mode */}
                {isMultiDiseaseMode && group.isDiseaseSpecific && (
                  <span className="text-xs text-green-600 ml-2">(Aggregated)</span>
                )}
                {/* Original tag for purely disease-specific groups like "Disease Characteristics" */}
                {!isMultiDiseaseMode && group.isDiseaseSpecific && !customDisease && (
                  <span className="text-xs text-blue-500 ml-2">(Disease-Specific)</span>
                )}
                {/* New tag for other groups if they contain any disease-specific parameters */}
                {!isMultiDiseaseMode && !group.isDiseaseSpecific && groupContainsDiseaseSpecificParam && (
                  <span className="text-xs text-blue-500 ml-2">(Contains Disease-Specific Params)</span>
                )}
                {!isMultiDiseaseMode && group.isHealthSystemSpecific && !customHealthSystem && (
                  <span className="text-xs text-green-500 ml-2">(Health System Specific)</span>
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
                  }
                  else {
                    inputClasses += ' border-gray-300 dark:border-gray-600';
                    paramBoxClasses += ' border-gray-200 dark:border-gray-700';
                  }

                  return (
                    <div key={param.key} className={paramBoxClasses}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {param.label}
                            </label>
                            <InfoTooltip 
                              content={getParameterRationale(
                                param.key, 
                                selectedDisease || undefined, 
                                selectedHealthSystemStrength || undefined
                              )}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {param.description}
                          </p>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={param.key === 'systemCongestion' ? effectiveCongestion : getParamValue(baseParams, param.key)}
                            onChange={(e) => handleParamChange(param.key, e.target.value)}
                            step={param.key.startsWith('delta') || param.key.includes('Rate') || param.key === 'disabilityWeight' ? '0.001' : '0.01'}
                            min="0"
                            max={param.key.startsWith('phi') || param.key.startsWith('rho') || param.key === 'disabilityWeight' ? '1' : undefined}
                            className={inputClasses}
                          />
                          {/* Special handling for systemCongestion to show calculated vs overridden */}
                          {param.key === 'systemCongestion' && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                              {userOverriddenCongestion !== null ? (
                                <>
                                  <span className="text-blue-600">User Override</span>
                                  <br />
                                  Calculated: {formatDecimal(calculatedCongestion, 3)}
                                </>
                              ) : (
                                <>
                                  <span className="text-green-600">Auto-Calculated</span>
                                  <br />
                                  {selectedDiseases.length > 1 ? `${selectedDiseases.length} diseases` : '1 disease'}
                                </>
                              )}
                            </div>
                          )}
                          {/* Show default value only if it's different from derived and not custom */}
                          {param.key !== 'systemCongestion' && defaultValue !== derivedValue && !customDisease && !customHealthSystem && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                              Default: {formatParamValue(param.key, defaultValue)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Health System Outcome Multipliers Section */}
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
      </div>
    </div>
  );
};

export default ParametersPanel; 