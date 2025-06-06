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
  effectiveCongestionAtom,
  aiUptakeParametersAtom,
  useCountrySpecificModelAtom,
  selectedCountryAtom,
  isUrbanSettingAtom,
  customDiseaseParametersAtom
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import { 
  healthSystemStrengthDefaults,
  diseaseProfiles, 
  getDefaultParameters,
  ModelParameters,
  AIUptakeParameters
} from '../models/stockAndFlowModel';
import InfoTooltip from './InfoTooltip';
import { getParameterRationale } from '../data/parameter_rationales';

// Reorganized parameter groupings with cleaner structure
const parameterGroups = [
  {
    title: 'Disease Burden',
    icon: '🦠',
    collapsed: false,
    params: [
      { key: 'lambda', label: 'Incidence Rate (λ)', unit: 'per year', description: 'Annual disease episodes per person. Higher values mean more people get sick each year.' },
      { key: 'disabilityWeight', label: 'Disability Weight', unit: '0-1', description: 'Disease severity for DALY calculations. 0 = perfect health, 1 = death equivalent.' },
      { key: 'meanAgeOfInfection', label: 'Mean Age', unit: 'years', description: 'Average age when people contract this disease. Used for calculating years of life lost.' },
      { key: 'muU', label: 'Untreated Recovery (μU)', unit: 'per week', description: 'Weekly probability of spontaneous recovery without any treatment.' },
    ],
    isDiseaseSpecific: true,
  },
  {
    title: 'Care Seeking',
    icon: '🏥',
    collapsed: false,
    params: [
      { key: 'phi0', label: 'Formal Care (φ₀)', unit: '%', description: 'Percentage who seek formal healthcare immediately when sick.' },
      { key: 'sigmaI', label: 'Transition Rate (σI)', unit: 'per week', description: 'Rate at which people move from informal to formal care.' },
      { key: 'informalCareRatio', label: 'Stay Untreated', unit: '%', description: 'Percentage of non-formal seekers who remain completely untreated (vs using informal care).' }
    ],
    isHealthSystemSpecific: true,
    isDiseaseSpecific: true, // Care seeking can vary by disease within same system
  },
  {
    title: 'Resolution Rates (μ)',
    icon: '✓',
    collapsed: true,
    params: [
      { key: 'muI', label: 'Informal (μI)', unit: 'per week', description: 'Weekly probability of getting better with informal/traditional care.' },
      { key: 'mu0', label: 'CHW (μ₀)', unit: 'per week', description: 'Weekly probability of recovery with community health workers.' },
      { key: 'mu1', label: 'Primary (μ₁)', unit: 'per week', description: 'Weekly probability of recovery at primary care facilities.' },
      { key: 'mu2', label: 'District (μ₂)', unit: 'per week', description: 'Weekly probability of recovery at district hospitals.' },
      { key: 'mu3', label: 'Tertiary (μ₃)', unit: 'per week', description: 'Weekly probability of recovery at tertiary/referral hospitals.' },
    ],
    isDiseaseSpecific: true,
  },
  {
    title: 'Mortality Rates (δ)',
    icon: '💀',
    collapsed: true,
    params: [
      { key: 'deltaU', label: 'Untreated (δU)', unit: 'per week', description: 'Weekly probability of death with no care at all.' },
      { key: 'deltaI', label: 'Informal (δI)', unit: 'per week', description: 'Weekly probability of death with informal/traditional care.' },
      { key: 'delta0', label: 'CHW (δ₀)', unit: 'per week', description: 'Weekly probability of death despite CHW care.' },
      { key: 'delta1', label: 'Primary (δ₁)', unit: 'per week', description: 'Weekly probability of death at primary care level.' },
      { key: 'delta2', label: 'District (δ₂)', unit: 'per week', description: 'Weekly probability of death at district hospitals.' },
      { key: 'delta3', label: 'Tertiary (δ₃)', unit: 'per week', description: 'Weekly probability of death at tertiary hospitals.' },
    ],
    isDiseaseSpecific: true,
  },
  {
    title: 'Referral Rates (ρ)',
    icon: '↗️',
    collapsed: true,
    params: [
      { key: 'rho0', label: 'CHW→Primary (ρ₀)', unit: 'per week', description: 'Weekly probability of referral from CHW to primary care.' },
      { key: 'rho1', label: 'Primary→District (ρ₁)', unit: 'per week', description: 'Weekly probability of referral from primary to district hospital.' },
      { key: 'rho2', label: 'District→Tertiary (ρ₂)', unit: 'per week', description: 'Weekly probability of referral from district to tertiary hospital.' },
    ],
    isDiseaseSpecific: true,
  },
  {
    title: 'Economic Costs',
    icon: '💰',
    collapsed: true,
    params: [
      { key: 'perDiemCosts.I', label: 'Informal Care', unit: 'USD/day', description: 'Daily cost of informal/traditional care including lost productivity.' },
      { key: 'perDiemCosts.L0', label: 'CHW Care', unit: 'USD/day', description: 'Daily cost at community health worker level.' },
      { key: 'perDiemCosts.L1', label: 'Primary Care', unit: 'USD/day', description: 'Daily cost at primary care facilities.' },
      { key: 'perDiemCosts.L2', label: 'District Hospital', unit: 'USD/day', description: 'Daily cost at district hospitals.' },
      { key: 'perDiemCosts.L3', label: 'Tertiary Hospital', unit: 'USD/day', description: 'Daily cost at tertiary/referral hospitals.' },
    ],
    isHealthSystemSpecific: true,
  },
  {
    title: 'System Capacity',
    icon: '⚡',
    collapsed: false,
    params: [
      { key: 'systemCongestion', label: 'Congestion Level', unit: '0-1', description: 'System congestion (0=empty, 1=fully congested). Auto-calculated based on disease burden and health system capacity.' },
    ],
    isHealthSystemSpecific: true,
  },
  {
    title: 'Disease-Specific Capacity',
    icon: '📊',
    collapsed: true,
    params: [
      { key: 'capacityShare', label: 'Capacity Share', unit: '0-1', description: 'This disease\'s share of overall health system capacity. Higher values mean more resources allocated to this disease.' },
      { key: 'competitionSensitivity', label: 'Competition Sensitivity', unit: '0-1', description: 'How much this disease is affected by system congestion. 0 = not affected, 1 = highly affected.' },
      { key: 'clinicalPriority', label: 'Clinical Priority', unit: '0-1', description: 'Priority for resource allocation. Higher values mean patients get preferential access to resources.' },
    ],
    isDiseaseSpecific: true,
  },
];

// Component for individual parameter input
const ParameterInput: React.FC<{
  param: any;
  value: number;
  onChange: (value: string) => void;
  showPercentage?: boolean;
  disabled?: boolean;
}> = ({ param, value, onChange, showPercentage = false, disabled = false }) => {
  const displayValue = showPercentage ? (value * 100).toFixed(1) : formatDecimal(value, 4);
  
  return (
    <div className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded">
      <div className="flex items-center gap-2 flex-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {param.label}
        </label>
        <InfoTooltip content={param.description} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          step={showPercentage ? "0.1" : "0.0001"}
          disabled={disabled}
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 w-16">
          {param.unit}
        </span>
      </div>
    </div>
  );
};

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
  const [aiUptakeParams, setAiUptakeParams] = useAtom(aiUptakeParametersAtom);
  const [useCountrySpecific] = useAtom(useCountrySpecificModelAtom);
  const [selectedCountry] = useAtom(selectedCountryAtom);
  const [isUrban] = useAtom(isUrbanSettingAtom);
  const [customDiseaseParams, setCustomDiseaseParams] = useAtom(customDiseaseParametersAtom);
  
  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(parameterGroups.filter(g => g.collapsed).map(g => g.title))
  );
  
  // Toggle section collapse
  const toggleSection = (title: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(title)) {
      newCollapsed.delete(title);
    } else {
      newCollapsed.add(title);
    }
    setCollapsedSections(newCollapsed);
  };
  
  // Check if we're in multi-disease mode
  const isMultiDiseaseMode = selectedDiseases.length > 1;
  
  // Sync with derived parameters when sidebar changes are made
  useEffect(() => {
    // Update base parameters with derived parameters whenever they change
    // This ensures sidebar changes (disease/health system selection) are reflected
    // In single disease mode, we want to preserve any manual edits
    if (!isMultiDiseaseMode) {
      // Only update if the selected disease or health system has actually changed
      // by comparing key properties that would indicate a profile change
      const profileChanged = 
        baseParams.lambda !== derivedParams.lambda ||
        baseParams.phi0 !== derivedParams.phi0;
      
      if (profileChanged) {
        setBaseParams({ ...derivedParams });
      }
    } else {
      // In multi-disease mode, always sync
      setBaseParams({ ...derivedParams });
    }
  }, [derivedParams, baseParams.lambda, baseParams.phi0, isMultiDiseaseMode, setBaseParams]);
  
  const handleParamChange = (path: string, value: string) => {
    try {
      // Special handling for systemCongestion
      if (path === 'systemCongestion') {
        setUserOverriddenCongestion(Number(value));
        return;
      }
      
      // Deep clone current params
      const newParams = JSON.parse(JSON.stringify(baseParams));
      
      // Navigate to the property
      const keys = path.split('.');
      let current = newParams;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      // Set the value
      const lastKey = keys[keys.length - 1];
      const numValue = Number(value);
      
      // Handle percentage inputs
      if (['phi0', 'informalCareRatio'].includes(lastKey)) {
        current[lastKey] = numValue / 100;
      } else {
        current[lastKey] = numValue;
      }
      
      setBaseParams(newParams);
    } catch (error) {
      console.error('Error updating parameter:', error);
    }
  };
  
  const handleDiseaseParamChange = (disease: string, path: string, value: string) => {
    try {
      // Get current custom overrides for this disease
      const currentOverrides = customDiseaseParams[disease] || {};
      
      // Deep clone the overrides
      const newOverrides = JSON.parse(JSON.stringify(currentOverrides));
      
      // Navigate to the property
      const keys = path.split('.');
      let current = newOverrides;
      
      // Create nested structure if it doesn't exist
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      // Set the value
      const lastKey = keys[keys.length - 1];
      const numValue = Number(value);
      
      // Handle percentage inputs
      if (['phi0', 'informalCareRatio'].includes(lastKey)) {
        current[lastKey] = numValue / 100;
      } else {
        current[lastKey] = numValue;
      }
      
      // Update the custom disease parameters atom
      setCustomDiseaseParams({
        ...customDiseaseParams,
        [disease]: newOverrides
      });
    } catch (error) {
      console.error('Error updating disease parameter:', error);
    }
  };
  
  const getValue = (path: string): number => {
    const keys = path.split('.');
    
    // For health system specific parameters, use derived params to show actual values
    const healthSystemSpecificParams = ['phi0', 'sigmaI', 'informalCareRatio', 'perDiemCosts'];
    const isHealthSystemSpecific = healthSystemSpecificParams.some(param => 
      path === param || path.startsWith(param + '.')
    );
    
    let current: any = isHealthSystemSpecific ? derivedParams : baseParams;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return 0;
      }
    }
    
    return Number(current) || 0;
  };
  
  // Remove the early return for multi-disease mode to allow parameter editing
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Parameters</h3>
            {useCountrySpecific && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Using {selectedCountry} {isUrban ? 'urban' : 'rural'} settings
              </p>
            )}
            {isMultiDiseaseMode && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Multi-disease mode: {selectedDiseases.length} diseases
              </p>
            )}
          </div>
          <button
            onClick={() => runSimulation()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            Run Simulation
          </button>
        </div>
        
        {/* Population Setting */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Population Size
              </span>
              <InfoTooltip content="Total population at risk for this disease" />
            </div>
            <input
              type="number"
              value={populationSize}
              onChange={(e) => setPopulationSize(Number(e.target.value))}
              className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:text-white"
              step="10000"
            />
          </div>
        </div>
      </div>
      
      {/* Multi-disease mode info */}
      {isMultiDiseaseMode && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Multi-disease mode:</strong> You can edit disease-specific parameters for each selected disease.
            Parameters marked as "Per-disease" will show separate values for each disease.
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Changes to individual disease parameters will override the default disease profiles.
            Health system parameters apply to all diseases unless also marked as disease-specific.
          </p>
        </div>
      )}
      
      {/* Parameter Groups */}
      {parameterGroups.map((group) => {
        const isCollapsed = collapsedSections.has(group.title);
        
        // For disease-specific parameters in multi-disease mode, show each disease separately
        if (group.isDiseaseSpecific && isMultiDiseaseMode) {
          return (
            <div key={group.title} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <button
                onClick={() => toggleSection(group.title)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{group.icon}</span>
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white">
                    {group.title}
                  </h4>
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                    Per-disease
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-4">
                  {selectedDiseases.map(disease => (
                    <div key={disease} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h5>
                      <div className="space-y-1">
                        {group.params.map((param) => {
                          const isPercentage = ['phi0', 'informalCareRatio'].includes(param.key);
                          const diseaseParams = individualDiseaseParams[disease];
                          
                          // Get value from disease-specific parameters
                          let value = 0;
                          if (diseaseParams) {
                            const keys = param.key.split('.');
                            let current: any = diseaseParams;
                            
                            for (const key of keys) {
                              if (current && typeof current === 'object' && key in current) {
                                current = current[key];
                              } else {
                                current = 0;
                                break;
                              }
                            }
                            value = Number(current) || 0;
                          }
                          
                          return (
                            <ParameterInput
                              key={`${disease}-${param.key}`}
                              param={param}
                              value={value}
                              onChange={(value) => handleDiseaseParamChange(disease, param.key, value)}
                              showPercentage={isPercentage}
                              disabled={false} // Enable editing
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        
        // Regular parameter groups (non-disease-specific or single disease mode)
        return (
          <div key={group.title} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <button
              onClick={() => toggleSection(group.title)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{group.icon}</span>
                <h4 className="text-md font-semibold text-gray-800 dark:text-white">
                  {group.title}
                </h4>
                {group.isDiseaseSpecific && !isMultiDiseaseMode && (
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                    Disease-specific
                  </span>
                )}
                {group.isHealthSystemSpecific && (
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    Health system
                  </span>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {!isCollapsed && (
              <div className="px-4 pb-4 space-y-1">
                {group.params.map((param) => {
                  const isPercentage = ['phi0', 'informalCareRatio'].includes(param.key);
                  const isSystemCongestion = param.key === 'systemCongestion';
                  
                  return (
                    <ParameterInput
                      key={param.key}
                      param={param}
                      value={isSystemCongestion ? effectiveCongestion : getValue(param.key)}
                      onChange={(value) => handleParamChange(param.key, value)}
                      showPercentage={isPercentage}
                      disabled={isSystemCongestion && userOverriddenCongestion === null}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {/* AI Uptake Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <button
          onClick={() => toggleSection('AI Uptake')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🤖</span>
            <h4 className="text-md font-semibold text-gray-800 dark:text-white">
              AI Uptake Rates
            </h4>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              Optional
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${collapsedSections.has('AI Uptake') ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {!collapsedSections.has('AI Uptake') && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Adjust how many people actually use each AI intervention (0-100%)
            </p>
            <div className="space-y-2">
              {Object.entries(aiUptakeParams).filter(([key]) => 
                !['globalUptake', 'urbanMultiplier', 'ruralMultiplier'].includes(key)
              ).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {key.replace('AI', ' AI')}
                  </span>
                  <input
                    type="number"
                    value={(value * 100).toFixed(0)}
                    onChange={(e) => {
                      const newValue = Math.max(0, Math.min(100, Number(e.target.value))) / 100;
                      setAiUptakeParams({
                        ...aiUptakeParams,
                        [key]: newValue
                      });
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                    step="5"
                    min="0"
                    max="100"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametersPanel;