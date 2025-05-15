import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  aiInterventionsAtom,
  runSimulationAtom
} from '../lib/store';
import { AIInterventions } from '../models/stockAndFlowModel';

// Define types for AI intervention configurations
interface AIInterventionConfig {
  id: string;
  name: string;
  description: string;
  interventions: AIInterventions;
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
  
  // State for saved configurations
  const [savedConfigs, setSavedConfigs] = useState<AIInterventionConfig[]>([]);
  const [configName, setConfigName] = useState('');
  const [configDescription, setConfigDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  
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
      interventions: { ...aiInterventions }
    };
    
    setSavedConfigs([...savedConfigs, newConfig]);
    setConfigName('');
    setConfigDescription('');
    setShowSaveForm(false);
  };
  
  const loadConfig = (config: AIInterventionConfig) => {
    setAIInterventions({ ...config.interventions });
  };
  
  const deleteConfig = (id: string) => {
    setSavedConfigs(savedConfigs.filter(config => config.id !== id));
  };
  
  const applyAndRun = (config: AIInterventionConfig) => {
    setAIInterventions({ ...config.interventions });
    setTimeout(() => runSimulation(), 100); // Small delay to ensure state updates
  };
  
  const interventionInfo: InterventionInfo[] = [
    { 
      key: 'triageAI', 
      name: 'AI Triage', 
      description: 'Direct-to-consumer AI that helps patients decide whether to seek care',
      effects: [
        { param: 'φ₀', effect: '+0.15', description: 'Increases formal care seeking' },
        { param: 'σI', effect: '×1.25', description: 'Faster transition from informal to formal care' }
      ]
    },
    { 
      key: 'chwAI', 
      name: 'CHW Decision Support', 
      description: 'AI tools that help community health workers make better decisions',
      effects: [
        { param: 'μ₀', effect: '+0.10', description: 'Better resolution at community level' },
        { param: 'δ₀', effect: '×0.85', description: 'Lower death rate at community level' },
        { param: 'ρ₀', effect: '×0.85', description: 'Fewer unnecessary referrals' }
      ]
    },
    { 
      key: 'diagnosticAI', 
      name: 'Diagnostic AI', 
      description: 'AI-powered diagnostics at primary care facilities',
      effects: [
        { param: 'μ₁', effect: '+0.10', description: 'Better resolution at primary care' },
        { param: 'δ₁', effect: '×0.85', description: 'Lower death rate at primary care' },
        { param: 'ρ₁', effect: '×0.85', description: 'Fewer unnecessary referrals' }
      ] 
    },
    { 
      key: 'bedManagementAI', 
      name: 'Bed Management AI', 
      description: 'AI tools that optimize hospital bed utilization',
      effects: [
        { param: 'μ₂', effect: '+0.05', description: 'Faster discharge from district hospital' },
        { param: 'μ₃', effect: '+0.05', description: 'Faster discharge from tertiary hospital' }
      ]
    },
    { 
      key: 'hospitalDecisionAI', 
      name: 'Hospital Decision Support', 
      description: 'AI tools that help hospital staff make treatment decisions',
      effects: [
        { param: 'δ₂', effect: '×0.80', description: 'Lower death rate at district hospital' },
        { param: 'δ₃', effect: '×0.80', description: 'Lower death rate at tertiary hospital' }
      ]
    },
    { 
      key: 'selfCareAI', 
      name: 'Self-Care Apps', 
      description: 'AI-enhanced apps that improve self-care outcomes',
      effects: [
        { param: 'μI', effect: '+0.15', description: 'Better informal care resolution' },
        { param: 'δI', effect: '×0.90', description: 'Lower death rate in informal care' }
      ]
    }
  ];
  
  // Determine if any intervention is currently active
  const hasActiveInterventions = Object.values(aiInterventions).some(v => v);
  
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
                  <ul className={`space-y-1 ${isActive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                    {intervention.effects.map((effect, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{effect.param}</span>
                        <span className="font-mono">{effect.effect}</span>
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