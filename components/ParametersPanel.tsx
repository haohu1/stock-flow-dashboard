import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  baseParametersAtom,
  derivedParametersAtom,
  selectedGeographyAtom,
  selectedDiseaseAtom,
  populationSizeAtom,
  runSimulationAtom
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import { 
  geographyDefaults, 
  diseaseProfiles, 
  getDefaultParameters,
  ModelParameters
} from '../models/stockAndFlowModel';

// Parameter groupings for better organization
const parameterGroups = [
  {
    title: 'Disease Characteristics',
    params: [
      { key: 'lambda', label: 'Annual Incidence Rate (λ)', description: 'Episodes per person per year' },
      { key: 'disabilityWeight', label: 'Disability Weight', description: 'Severity factor for DALY calculations (0-1)' },
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
    isLocationSpecific: true,
  },
  {
    title: 'Informal Care',
    params: [
      { key: 'muI', label: 'Informal Resolution (μI)', description: 'Weekly probability of resolution in informal care' },
      { key: 'deltaI', label: 'Informal Death (δI)', description: 'Weekly probability of death in informal care' },
      { key: 'deltaU', label: 'Untreated Death (δU)', description: 'Weekly probability of death if untreated' },
    ],
  },
  {
    title: 'Community Health Workers (L0)',
    params: [
      { key: 'mu0', label: 'L0 Resolution (μ₀)', description: 'Weekly probability of resolution with CHWs' },
      { key: 'delta0', label: 'L0 Death (δ₀)', description: 'Weekly probability of death with CHWs' },
      { key: 'rho0', label: 'L0 Referral (ρ₀)', description: 'Weekly probability of referral from CHW to primary care' },
    ],
  },
  {
    title: 'Primary Care (L1)',
    params: [
      { key: 'mu1', label: 'L1 Resolution (μ₁)', description: 'Weekly probability of resolution at primary care' },
      { key: 'delta1', label: 'L1 Death (δ₁)', description: 'Weekly probability of death at primary care' },
      { key: 'rho1', label: 'L1 Referral (ρ₁)', description: 'Weekly probability of referral from primary to district hospital' },
    ],
  },
  {
    title: 'District Hospital (L2)',
    params: [
      { key: 'mu2', label: 'L2 Resolution (μ₂)', description: 'Weekly probability of resolution at district hospital' },
      { key: 'delta2', label: 'L2 Death (δ₂)', description: 'Weekly probability of death at district hospital' },
      { key: 'rho2', label: 'L2 Referral (ρ₂)', description: 'Weekly probability of referral from district to tertiary hospital' },
    ],
  },
  {
    title: 'Tertiary Hospital (L3)',
    params: [
      { key: 'mu3', label: 'L3 Resolution (μ₃)', description: 'Weekly probability of resolution at tertiary hospital' },
      { key: 'delta3', label: 'L3 Death (δ₃)', description: 'Weekly probability of death at tertiary hospital' },
    ],
  },
  {
    title: 'AI Effectiveness Parameters',
    params: [
      { key: 'selfCareAIEffectMuI', label: 'Self-Care Resolution Effect', description: 'Improvement in resolution rate from self-care AI' },
      { key: 'selfCareAIEffectDeltaI', label: 'Self-Care Death Effect', description: 'Multiplier for death rate with self-care AI (lower is better)' },
    ],
  },
  {
    title: 'Economic Parameters',
    params: [
      { key: 'perDiemCosts.I', label: 'Informal Care Cost', description: 'Cost per day in informal care (USD)' },
      { key: 'perDiemCosts.L0', label: 'CHW Cost', description: 'Cost per day with community health workers (USD)' },
      { key: 'perDiemCosts.L1', label: 'Primary Care Cost', description: 'Cost per day at primary care (USD)' },
      { key: 'perDiemCosts.L2', label: 'District Hospital Cost', description: 'Cost per day at district hospital (USD)' },
      { key: 'perDiemCosts.L3', label: 'Tertiary Hospital Cost', description: 'Cost per day at tertiary hospital (USD)' },
      { key: 'aiFixedCost', label: 'AI Fixed Cost', description: 'Fixed cost for AI implementation (USD)' },
      { key: 'aiVariableCost', label: 'AI Variable Cost', description: 'Variable cost per episode touched by AI (USD)' },
      { key: 'yearsOfLifeLost', label: 'Years of Life Lost', description: 'Average years of life lost per death' },
      { key: 'discountRate', label: 'Discount Rate', description: 'Annual discount rate for economic calculations' },
    ],
    isLocationSpecific: true,
  },
];

const ParametersPanel: React.FC = () => {
  const [baseParams, setBaseParams] = useAtom(baseParametersAtom);
  const [derivedParams] = useAtom(derivedParametersAtom);
  const [selectedGeography, setSelectedGeography] = useAtom(selectedGeographyAtom);
  const [selectedDisease, setSelectedDisease] = useAtom(selectedDiseaseAtom);
  const [populationSize, setPopulationSize] = useAtom(populationSizeAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  
  const [editMode, setEditMode] = useState(false);
  const [editableParams, setEditableParams] = useState(baseParams);
  const [editablePopulation, setEditablePopulation] = useState(populationSize);
  const [customGeography, setCustomGeography] = useState<boolean>(false);
  const [customDisease, setCustomDisease] = useState<boolean>(false);
  
  // Get default parameters for reference
  const defaultParams = getDefaultParameters();
  
  // Update editable params when base params change
  useEffect(() => {
    setEditableParams(baseParams);
  }, [baseParams]);
  
  // Available geographies and diseases from the model
  const geographies = Object.keys(geographyDefaults);
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
  
  const handleGeographyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'custom') {
      setCustomGeography(true);
    } else {
      setCustomGeography(false);
      setSelectedGeography(value);
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
  
  const saveChanges = () => {
    setBaseParams(editableParams);
    setPopulationSize(editablePopulation);
    setEditMode(false);
    // Run simulation with new parameters
    setTimeout(() => runSimulation(), 100);
  };
  
  const cancelChanges = () => {
    setEditableParams(baseParams);
    setEditablePopulation(populationSize);
    setEditMode(false);
  };
  
  // Get parameter value, handling nested properties
  const getParamValue = (params: ModelParameters, path: string): number => {
    if (path.includes('.')) {
      const [parent, child] = path.split('.');
      return params[parent as keyof ModelParameters][child as keyof ModelParameters[keyof ModelParameters]];
    }
    return params[path as keyof ModelParameters] as number;
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
    setCustomGeography(false);
    setCustomDisease(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Model Parameters</h3>
        <div>
          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)}
              className="btn btn-primary text-sm"
            >
              Edit Parameters
            </button>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={cancelChanges}
                className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={resetToDefaults}
                className="btn bg-red-50 hover:bg-red-100 text-red-600 text-sm"
              >
                Reset to Defaults
              </button>
              <button 
                onClick={saveChanges}
                className="btn btn-primary text-sm"
              >
                Save Changes
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
        
        {/* Geographic and Disease Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Geography Selection */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Geography
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Predefined settings for different regions
              </p>
              {editMode ? (
                <select 
                  value={customGeography ? 'custom' : selectedGeography}
                  onChange={handleGeographyChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                >
                  {geographies.map(geo => (
                    <option key={geo} value={geo}>{geo.charAt(0).toUpperCase() + geo.slice(1)}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              ) : (
                <div className="text-sm py-2">{selectedGeography.charAt(0).toUpperCase() + selectedGeography.slice(1)}</div>
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
                  {diseases.map(disease => (
                    <option key={disease} value={disease}>{disease.charAt(0).toUpperCase() + disease.slice(1)}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              ) : (
                <div className="text-sm py-2">{selectedDisease.charAt(0).toUpperCase() + selectedDisease.slice(1)}</div>
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
        
        {/* Show Disease Characteristics group immediately after settings */}
        {parameterGroups.filter(group => group.isDiseaseSpecific).map((group) => (
          <div key={group.title} className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              {group.title} <span className="text-xs text-blue-500">(Disease-Specific)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.params.map((param) => {
                const derivedValue = getParamValue(derivedParams, param.key);
                
                return (
                  <div key={param.key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
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
                          step={param.key.startsWith('delta') ? '0.001' : '0.01'}
                          min="0"
                          max={param.key.startsWith('phi') || param.key.startsWith('rho') ? '1' : undefined}
                          className="w-24 text-right px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      ) : (
                        <div className="text-right">
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                            {formatParamValue(param.key, derivedValue)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Location-specific parameters */}
        {parameterGroups.filter(group => group.isLocationSpecific && !group.isDiseaseSpecific).map((group) => (
          <div key={group.title} className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              {group.title} <span className="text-xs text-green-500">(Location-Specific)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.params.map((param) => {
                const baseValue = getParamValue(baseParams, param.key);
                const derivedValue = getParamValue(derivedParams, param.key);
                const isModified = baseValue !== derivedValue;
                
                return (
                  <div key={param.key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
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
                          step={param.key.startsWith('delta') ? '0.001' : '0.01'}
                          min="0"
                          max={param.key.startsWith('phi') || param.key.startsWith('rho') ? '1' : undefined}
                          className="w-24 text-right px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      ) : (
                        <div className="text-right">
                          <span className={`font-mono text-sm ${isModified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatParamValue(param.key, derivedValue)}
                          </span>
                          {isModified && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Base: {formatParamValue(param.key, baseValue)}
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
        ))}
        
        {/* Display the effect of AI interventions separately */}
        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Current Values (Including AI Effects)
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
            The values below reflect both base parameters and the effects of any selected AI interventions.
          </p>
        </div>
        
        {/* Other general parameters */}
        {parameterGroups.filter(group => !group.isDiseaseSpecific && !group.isLocationSpecific).map((group) => (
          <div key={group.title} className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">{group.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.params.map((param) => {
                const baseValue = getParamValue(baseParams, param.key);
                const derivedValue = getParamValue(derivedParams, param.key);
                const defaultValue = getParamValue(defaultParams, param.key);
                const isModified = baseValue !== derivedValue;
                
                return (
                  <div key={param.key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
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
                          step={param.key.startsWith('delta') ? '0.001' : '0.01'}
                          min="0"
                          max={param.key.startsWith('phi') || param.key.startsWith('rho') ? '1' : undefined}
                          className="w-24 text-right px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      ) : (
                        <div className="text-right">
                          <span className={`font-mono text-sm ${isModified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {formatParamValue(param.key, derivedValue)}
                          </span>
                          {isModified && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Base: {formatParamValue(param.key, baseValue)}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Default: {formatParamValue(param.key, defaultValue)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParametersPanel; 