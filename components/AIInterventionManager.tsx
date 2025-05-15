import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  aiInterventionsAtom,
  effectMagnitudesAtom,
  runSimulationAtom
} from '../lib/store';
import { AIInterventions } from '../models/stockAndFlowModel';

// Define types for AI intervention configurations
interface AIInterventionConfig {
  id: string;
  name: string;
  description: string;
  interventions: AIInterventions;
  effectMagnitudes: {[key: string]: number};
}

interface InterventionEffect {
  param: string;
  effect: string;
  description: string;
}

interface InterventionInfo {
  key: keyof AIInterventions;
  name: string;
  description: string;
  effects: InterventionEffect[];
}

const AIInterventionManager: React.FC = () => {
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  
  // Use global atom for effect magnitudes instead of local state
  const [effectMagnitudes, setEffectMagnitudes] = useAtom(effectMagnitudesAtom);
  
  // State for saved configurations
  const [savedConfigs, setSavedConfigs] = useState<AIInterventionConfig[]>([]);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  
  // State for expandable sections
  const [showParameterEffects, setShowParameterEffects] = useState(false);
  const [showInterventionStrength, setShowInterventionStrength] = useState(false);
  
  // Load saved configurations from localStorage on component mount
  useEffect(() => {
    const savedConfigsStr = localStorage.getItem('aiInterventionConfigs');
    if (savedConfigsStr) {
      try {
        const configs = JSON.parse(savedConfigsStr);
        setSavedConfigs(configs);
      } catch {
        console.error('Failed to parse saved AI intervention configs');
      }
    }
  }, []);
  
  // Save configurations to localStorage when they change
  useEffect(() => {
    if (savedConfigs.length > 0) {
      localStorage.setItem('aiInterventionConfigs', JSON.stringify(savedConfigs));
    }
  }, [savedConfigs]);
  
  const handleInterventionToggle = (intervention: keyof AIInterventions) => {
    const newInterventions = {
      ...aiInterventions,
      [intervention]: !aiInterventions[intervention as keyof AIInterventions]
    };
    setAIInterventions(newInterventions);
  };
  
  const saveCurrentConfig = () => {
    if (!configName.trim()) return;
    
    const newConfig: AIInterventionConfig = {
      id: `config-${Date.now()}`,
      name: configName.trim(),
      description: configDescription.trim(),
      interventions: { ...aiInterventions },
      effectMagnitudes: { ...effectMagnitudes }
    };
    
    setSavedConfigs([...savedConfigs, newConfig]);
    setConfigName('');
    setConfigDescription('');
    setShowSaveForm(false);
  };
  
  const loadConfig = (config: AIInterventionConfig) => {
    setAIInterventions({ ...config.interventions });
    setEffectMagnitudes({ ...config.effectMagnitudes });
  };
  
  const deleteConfig = (id: string) => {
    setSavedConfigs(savedConfigs.filter(config => config.id !== id));
  };
  
  const applyAndRun = (config: AIInterventionConfig) => {
    setAIInterventions({ ...config.interventions });
    setEffectMagnitudes({ ...config.effectMagnitudes });
    setTimeout(() => runSimulation(), 100); // Small delay to ensure state updates
  };
  
  // Handle parameter effect adjustment
  const handleEffectMagnitudeChange = (interventionKey: string, paramName: string, value: number) => {
    const effectKey = `${interventionKey}_${paramName}`;
    setEffectMagnitudes({
      ...effectMagnitudes,
      [effectKey]: value
    });
  };
  
  // Get the actual effect value with any adjustments
  const getEffectValue = (interventionKey: string, param: string, defaultEffect: string): string => {
    const effectKey = `${interventionKey}_${param}`;
    const magnitude = effectMagnitudes[effectKey];
    
    // If no custom magnitude is set, return the default effect
    if (magnitude === undefined) return defaultEffect;
    
    // If magnitude is 0, explicitly show no effect
    if (magnitude === 0) return "None";
    
    // Otherwise, adjust the effect based on the magnitude
    if (defaultEffect.startsWith('+')) {
      // For additive effects (+0.15 etc.)
      const baseValue = parseFloat(defaultEffect.substring(1));
      return `+${(baseValue * magnitude).toFixed(2)}`;
    } else if (defaultEffect.startsWith('×')) {
      // For multiplicative effects (×0.85 etc.)
      const baseValue = parseFloat(defaultEffect.substring(1));
      // For multiplicative effects less than 1, closer to 1 means less effect
      // For effects like ×0.85, a magnitude of 0 should give ×1.0 (no effect)
      // and a magnitude of 2 should give ×0.70 (double effect)
      if (baseValue < 1) {
        const effect = 1 - ((1 - baseValue) * magnitude);
        return `×${effect.toFixed(2)}`;
      } else {
        // For effects like ×1.25, a magnitude of 0 should give ×1.0 (no effect)
        // and a magnitude of 2 should give ×1.50 (double effect)
        const effect = 1 + ((baseValue - 1) * magnitude);
        return `×${effect.toFixed(2)}`;
      }
    }
    
    return defaultEffect;
  };
  
  const interventionInfo: InterventionInfo[] = [
    { 
      key: 'triageAI', 
      name: 'AI Triage', 
      description: 'Direct-to-consumer AI that helps patients decide whether to seek formal healthcare instead of self-care',
      effects: [
        { param: 'φ₀', effect: '+0.15', description: 'Increases formal care seeking (probability of initially seeking formal care)' },
        { param: 'σI', effect: '×1.25', description: 'Faster transition from informal to formal care (higher weekly probability)' }
      ]
    },
    { 
      key: 'chwAI', 
      name: 'CHW Decision Support', 
      description: 'AI tools that help community health workers diagnose and treat patients more effectively',
      effects: [
        { param: 'μ₀', effect: '+0.10', description: 'Better resolution at community level (higher recovery probability)' },
        { param: 'δ₀', effect: '×0.85', description: 'Lower death rate at community level (reduced mortality)' },
        { param: 'ρ₀', effect: '×0.85', description: 'Fewer unnecessary referrals (lower referral probability to higher levels)' }
      ]
    },
    { 
      key: 'diagnosticAI', 
      name: 'Diagnostic AI', 
      description: 'AI-powered diagnostic tools at primary care facilities to improve diagnosis accuracy and treatment decisions',
      effects: [
        { param: 'μ₁', effect: '+0.10', description: 'Better resolution at primary care (higher recovery probability)' },
        { param: 'δ₁', effect: '×0.85', description: 'Lower death rate at primary care (reduced mortality)' },
        { param: 'ρ₁', effect: '×0.85', description: 'Fewer unnecessary referrals (lower referral probability to higher levels)' }
      ] 
    },
    { 
      key: 'bedManagementAI', 
      name: 'Bed Management AI', 
      description: 'AI tools that optimize patient flow and bed allocation in hospitals to reduce length of stay',
      effects: [
        { param: 'μ₂', effect: '+0.05', description: 'Faster discharge from district hospital (higher weekly recovery probability)' },
        { param: 'μ₃', effect: '+0.05', description: 'Faster discharge from tertiary hospital (higher weekly recovery probability)' }
      ]
    },
    { 
      key: 'hospitalDecisionAI', 
      name: 'Hospital Decision Support', 
      description: 'AI tools that help hospital staff make better treatment and clinical management decisions',
      effects: [
        { param: 'δ₂', effect: '×0.80', description: 'Lower death rate at district hospital (20% reduction in mortality)' },
        { param: 'δ₃', effect: '×0.80', description: 'Lower death rate at tertiary hospital (20% reduction in mortality)' }
      ]
    },
    { 
      key: 'selfCareAI', 
      name: 'Self-Care Apps', 
      description: 'AI-enhanced apps that help patients self-manage their conditions and know when to seek care',
      effects: [
        { param: 'μI', effect: '+0.15', description: 'Better informal care resolution (higher recovery rate at home)' },
        { param: 'δI', effect: '×0.90', description: 'Lower death rate in informal care (10% reduction in mortality)' }
      ]
    }
  ];
  
  // Reset all effect magnitudes to default values
  const resetAllEffectMagnitudes = () => {
    setEffectMagnitudes({});
  };
  
  // Reset effect magnitudes to default (1.0) for a specific intervention
  const resetEffectMagnitudes = (interventionKey: keyof AIInterventions) => {
    const updatedMagnitudes = { ...effectMagnitudes };
    
    // Find the specific intervention
    const intervention = interventionInfo.find(info => info.key === interventionKey);
    
    // Reset only the magnitudes for this intervention's effects
    if (intervention) {
      intervention.effects.forEach(effect => {
        const key = `${interventionKey}_${effect.param}`;
        delete updatedMagnitudes[key];
      });
      
      setEffectMagnitudes(updatedMagnitudes);
    }
  };
  
  // Determine if any intervention is currently active
  const hasActiveInterventions = Object.values(aiInterventions).some(v => v);
  
  // Determine if any effect magnitudes are customized
  const hasCustomMagnitudes = Object.keys(effectMagnitudes).length > 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Interventions</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
          >
            {showSaveForm ? 'Cancel' : 'Save Configuration'}
          </button>
          {hasCustomMagnitudes && (
            <button
              onClick={resetAllEffectMagnitudes}
              className="btn bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm"
            >
              Reset All Magnitudes
            </button>
          )}
          {hasActiveInterventions && (
            <button
              onClick={() => setAIInterventions({
                triageAI: false,
                chwAI: false,
                diagnosticAI: false,
                bedManagementAI: false,
                hospitalDecisionAI: false,
                selfCareAI: false
              })}
              className="btn bg-red-50 hover:bg-red-100 text-red-600 text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-6 bg-blue-50 dark:bg-blue-900 rounded-md">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer" 
          onClick={() => setShowParameterEffects(!showParameterEffects)}
        >
          <h4 className="text-md font-medium text-blue-800 dark:text-blue-300">Understanding Parameter Effects</h4>
          <button className="text-blue-700 dark:text-blue-400">
            {showParameterEffects ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showParameterEffects ? 'max-h-96' : 'max-h-0'}`}>
          <div className="p-4 pt-0">
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
              Each AI intervention modifies specific model parameters that affect how patients move through the healthcare system:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc pl-5 space-y-1">
              <li><strong>μ (mu)</strong>: Recovery/resolution rates at different levels of care (higher is better)</li>
              <li><strong>δ (delta)</strong>: Mortality rates at different levels of care (lower is better)</li>
              <li><strong>ρ (rho)</strong>: Referral rates between care levels (optimized based on need)</li>
              <li><strong>φ (phi)</strong>: Initial care-seeking behavior parameters (higher formal care entry is better)</li>
              <li><strong>σ (sigma)</strong>: Transition rates between care pathways (faster transitions to appropriate care is better)</li>
            </ul>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
              Subscripts indicate care level: I=informal, 0=CHW, 1=primary care, 2=district hospital, 3=tertiary hospital
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6 bg-blue-50 dark:bg-blue-900 rounded-md">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer" 
          onClick={() => setShowInterventionStrength(!showInterventionStrength)}
        >
          <h4 className="text-md font-medium text-blue-800 dark:text-blue-300">Adjusting Intervention Strength</h4>
          <button className="text-blue-700 dark:text-blue-400">
            {showInterventionStrength ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showInterventionStrength ? 'max-h-60' : 'max-h-0'}`}>
          <div className="p-4 pt-0">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Use the sliders to adjust the magnitude of each intervention effect:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc pl-5 mt-1">
              <li><strong>No effect (0)</strong>: The parameter remains at baseline value</li>
              <li><strong>Default (1)</strong>: The standard effect is applied</li>
              <li><strong>Stronger (2)</strong>: The effect is doubled in magnitude</li>
            </ul>
          </div>
        </div>
      </div>
      
      {showSaveForm && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900 dark:border-blue-800">
          <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-2">Save Current Configuration</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-blue-700 dark:text-blue-400 mb-1">Configuration Name</label>
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                className="input w-full"
                placeholder="e.g., Primary Care AI Bundle"
              />
            </div>
            <div>
              <label className="block text-sm text-blue-700 dark:text-blue-400 mb-1">Description (optional)</label>
              <textarea
                value={configDescription}
                onChange={(e) => setConfigDescription(e.target.value)}
                className="input w-full"
                rows={2}
                placeholder="Brief description of this AI configuration"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveCurrentConfig}
                disabled={!configName.trim()}
                className={`btn ${
                  configName.trim() ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
      
      {savedConfigs.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Saved Configurations</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedConfigs.map((config) => (
              <div key={config.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-white text-sm">{config.name}</h5>
                  {config.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => loadConfig(config)}
                    className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => applyAndRun(config)}
                    className="px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 rounded"
                  >
                    Apply & Run
                  </button>
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interventionInfo.map((intervention) => {
          const isActive = aiInterventions[intervention.key];
          
          return (
            <div 
              key={intervention.key.toString()}
              className={`border rounded-md transition-colors ${
                isActive 
                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleInterventionToggle(intervention.key)}
                      className="mr-2"
                    />
                    <span className={`font-medium ${
                      isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {intervention.name}
                    </span>
                  </label>
                  {isActive && (
                    <button
                      onClick={() => resetEffectMagnitudes(intervention.key)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  {intervention.description}
                </p>
                
                <div className="text-xs border-t pt-2 border-gray-200 dark:border-gray-700">
                  <p className={`font-medium mb-1 ${
                    isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'
                  }`}>
                    Parameter Effects:
                  </p>
                  <ul className={`space-y-2 ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                    {intervention.effects.map((effect, i) => (
                      <li key={i} className="border-b border-gray-100 dark:border-gray-700 pb-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{effect.param}</span>
                          <span className={`font-mono px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' : 
                                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>{isActive ? getEffectValue(intervention.key, effect.param, effect.effect) : effect.effect}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{effect.description}</p>
                        
                        {isActive && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>No effect</span>
                              <span>Default</span>
                              <span>Stronger</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              step="0.1"
                              value={effectMagnitudes[`${intervention.key}_${effect.param}`] !== undefined ? 
                                effectMagnitudes[`${intervention.key}_${effect.param}`] : 1}
                              onChange={(e) => handleEffectMagnitudeChange(
                                intervention.key, 
                                effect.param, 
                                parseFloat(e.target.value)
                              )}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInterventionManager; 