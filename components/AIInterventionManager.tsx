import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  aiInterventionsAtom,
  effectMagnitudesAtom,
  runSimulationAtom,
  selectedAIScenarioAtom
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

// Predefined AI scenario presets for different effectiveness levels
const AIScenarioPresets: AIInterventionConfig[] = [
  {
    id: 'best-case-2025',
    name: 'Best Case',
    description: 'Breakthrough scenario where AI exceeds expectations across all healthcare domains with strong implementation and adoption.',
    interventions: {
      triageAI: true,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: true,
      hospitalDecisionAI: true,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 1.8,
      'triageAI_σI': 1.7,
      'chwAI_μ₀': 1.8,
      'chwAI_δ₀': 1.7,
      'chwAI_ρ₀': 1.6,
      'diagnosticAI_μ₁': 1.8,
      'diagnosticAI_δ₁': 1.7,
      'diagnosticAI_ρ₁': 1.6,
      'bedManagementAI_μ₂': 1.7,
      'bedManagementAI_μ₃': 1.7,
      'hospitalDecisionAI_δ₂': 1.7,
      'hospitalDecisionAI_δ₃': 1.7,
      'selfCareAI_μI': 1.8,
      'selfCareAI_δI': 1.6
    }
  },
  {
    id: 'worst-case-2025',
    name: 'Worst Case',
    description: 'Limited impact scenario where AI adoption faces significant implementation challenges, regulatory barriers, and trust issues.',
    interventions: {
      triageAI: true,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 0.4,
      'triageAI_σI': 0.4,
      'chwAI_μ₀': 0.4,
      'chwAI_δ₀': 0.5,
      'chwAI_ρ₀': 0.4,
      'diagnosticAI_μ₁': 0.5,
      'diagnosticAI_δ₁': 0.5,
      'diagnosticAI_ρ₁': 0.4,
      'selfCareAI_μI': 0.4,
      'selfCareAI_δI': 0.6
    }
  },
  {
    id: 'clinical-decision-support-2025',
    name: 'Clinical Decision Support Excellence',
    description: 'AI excels at supporting clinical decisions for diagnosis and treatment, but has moderate impact on workflow efficiency.',
    interventions: {
      triageAI: false,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: false,
      hospitalDecisionAI: true,
      selfCareAI: false
    },
    effectMagnitudes: {
      'chwAI_μ₀': 1.5,
      'chwAI_δ₀': 1.4,
      'chwAI_ρ₀': 1.3,
      'diagnosticAI_μ₁': 1.6,
      'diagnosticAI_δ₁': 1.5,
      'diagnosticAI_ρ₁': 1.4,
      'hospitalDecisionAI_δ₂': 1.5,
      'hospitalDecisionAI_δ₃': 1.5
    }
  },
  {
    id: 'workflow-efficiency-2025',
    name: 'Workflow Efficiency Focus',
    description: 'AI systems excel at optimizing healthcare workflows and resource allocation, but have less impact on clinical outcomes.',
    interventions: {
      triageAI: true,
      chwAI: false,
      diagnosticAI: false,
      bedManagementAI: true,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 1.4,
      'triageAI_σI': 1.5,
      'bedManagementAI_μ₂': 1.6,
      'bedManagementAI_μ₃': 1.6,
      'selfCareAI_μI': 1.3,
      'selfCareAI_δI': 1.1
    }
  },
  {
    id: 'direct-to-consumer-2025',
    name: 'Patient-Facing AI Success',
    description: 'Consumer-facing AI tools show strong adoption and effectiveness, empowering patients but with less impact on clinical settings.',
    interventions: {
      triageAI: true,
      chwAI: false,
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 1.7,
      'triageAI_σI': 1.6,
      'selfCareAI_μI': 1.7,
      'selfCareAI_δI': 1.4
    }
  },
  {
    id: 'diagnostic-imaging-2025',
    name: 'Diagnostic & Imaging Excellence',
    description: 'AI shows remarkable performance in diagnostic accuracy and medical imaging, but moderate impact on other healthcare areas.',
    interventions: {
      triageAI: false,
      chwAI: false,
      diagnosticAI: true,
      bedManagementAI: false,
      hospitalDecisionAI: true,
      selfCareAI: false
    },
    effectMagnitudes: {
      'diagnosticAI_μ₁': 1.8,
      'diagnosticAI_δ₁': 1.6,
      'diagnosticAI_ρ₁': 1.5,
      'hospitalDecisionAI_δ₂': 1.5,
      'hospitalDecisionAI_δ₃': 1.5
    }
  },
  {
    id: 'resource-constrained-2025',
    name: 'Resource-Constrained Settings',
    description: 'AI tools designed for low-resource settings show significant impact by optimizing limited healthcare resources.',
    interventions: {
      triageAI: true,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: true,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 1.5,
      'triageAI_σI': 1.4,
      'chwAI_μ₀': 1.7,
      'chwAI_δ₀': 1.5,
      'chwAI_ρ₀': 1.4,
      'diagnosticAI_μ₁': 1.5,
      'diagnosticAI_δ₁': 1.3,
      'diagnosticAI_ρ₁': 1.4,
      'bedManagementAI_μ₂': 1.6,
      'bedManagementAI_μ₃': 1.6,
      'selfCareAI_μI': 1.4,
      'selfCareAI_δI': 1.2
    }
  },
  {
    id: 'community-health-2025',
    name: 'Community Health Worker Support',
    description: 'AI significantly amplifies CHW effectiveness in rural and underserved areas, enabling better care with limited formal infrastructure.',
    interventions: {
      triageAI: false,
      chwAI: true,
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'chwAI_μ₀': 1.8,
      'chwAI_δ₀': 1.6,
      'chwAI_ρ₀': 1.5,
      'selfCareAI_μI': 1.5,
      'selfCareAI_δI': 1.3
    }
  },
  {
    id: 'referral-triage-2025',
    name: 'Referral & Triage Optimization',
    description: 'AI excels at directing patients to appropriate levels of care, reducing system burden and improving resource allocation.',
    interventions: {
      triageAI: true,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: false
    },
    effectMagnitudes: {
      'triageAI_φ₀': 1.6,
      'triageAI_σI': 1.7,
      'chwAI_μ₀': 1.2,
      'chwAI_δ₀': 1.0,
      'chwAI_ρ₀': 1.7,
      'diagnosticAI_μ₁': 1.2,
      'diagnosticAI_δ₁': 1.0,
      'diagnosticAI_ρ₁': 1.7
    }
  }
];

const AIInterventionManager: React.FC = () => {
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  
  // Use global atom for effect magnitudes instead of local state
  const [effectMagnitudes, setEffectMagnitudes] = useAtom(effectMagnitudesAtom);
  
  // Use global atom for selected AI scenario
  const [selectedAIScenario, setSelectedAIScenario] = useAtom(selectedAIScenarioAtom);
  
  // State for saved configurations
  const [savedConfigs, setSavedConfigs] = useState<AIInterventionConfig[]>([]);
  
  // State for expandable sections
  const [showParameterEffects, setShowParameterEffects] = useState(false);
  const [showInterventionStrength, setShowInterventionStrength] = useState(false);
  const [showPresetScenarios, setShowPresetScenarios] = useState(false);
  
  // State for locally tracking selected scenario (UI state)
  const [localSelectedScenario, setLocalSelectedScenario] = useState<string | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize local selected scenario from global atom
  useEffect(() => {
    setLocalSelectedScenario(selectedAIScenario);
  }, [selectedAIScenario]);
  
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
    // When manually toggling, unset the selected scenario
    setLocalSelectedScenario(null);
    setSelectedAIScenario(null);
  };
  
  const loadConfig = (config: AIInterventionConfig) => {
    setAIInterventions({ ...config.interventions });
    setEffectMagnitudes({ ...config.effectMagnitudes });
    setLocalSelectedScenario(config.id);
  };
  
  const deleteConfig = (id: string) => {
    setSavedConfigs(savedConfigs.filter(config => config.id !== id));
    // If the deleted config was selected, unset selection
    if (localSelectedScenario === id) {
      setLocalSelectedScenario(null);
    }
  };
  
  const applyConfig = (config: AIInterventionConfig) => {
    setAIInterventions(config.interventions);
    setEffectMagnitudes(config.effectMagnitudes);
    setLocalSelectedScenario(config.id);
    // Also update the global atom
    setSelectedAIScenario(config.id);
  };
  
  // Handle parameter effect adjustment
  const handleEffectMagnitudeChange = (interventionKey: string, paramName: string, value: number) => {
    const effectKey = `${interventionKey}_${paramName}`;
    setEffectMagnitudes({
      ...effectMagnitudes,
      [effectKey]: value
    });
    // When manually adjusting, unset the selected scenario if it's a preset
    if (localSelectedScenario && AIScenarioPresets.some(preset => preset.id === localSelectedScenario)) {
      setLocalSelectedScenario(null);
      setSelectedAIScenario(null);
    }
  };
  
  // Export current configuration to JSON file
  const exportConfig = () => {
    const configName = prompt("Enter a name for this configuration:", "My Custom Configuration");
    if (!configName) return;
    
    const configDescription = prompt("Enter a description (optional):", "");
    
    const config: AIInterventionConfig = {
      id: `config-${Date.now()}`,
      name: configName,
      description: configDescription || "",
      interventions: { ...aiInterventions },
      effectMagnitudes: { ...effectMagnitudes }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-config-${configName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import configuration from JSON file
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as AIInterventionConfig;
        
        // Validate the imported configuration
        if (typeof config !== 'object' || !config.interventions || !config.effectMagnitudes) {
          alert('Invalid configuration file format');
          return;
        }
        
        // Generate a new ID to avoid collisions
        config.id = `imported-${Date.now()}`;
        
        // Apply the imported configuration
        applyConfig(config);
        
        // Ask if the user wants to save it to their saved configurations
        if (confirm('Do you want to save this imported configuration to your saved configurations?')) {
          setSavedConfigs([...savedConfigs, config]);
        }
      } catch (error) {
        console.error('Error importing configuration:', error);
        alert('Failed to import configuration. Please check the file format.');
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
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
  
  // Function to determine if a preset scenario is selected
  const isPresetScenarioSelected = () => {
    return !!localSelectedScenario && AIScenarioPresets.some(preset => preset.id === localSelectedScenario);
  };

  // Function to display the selected scenario name
  const getSelectedPresetName = () => {
    if (!localSelectedScenario) return null;
    const selectedPreset = AIScenarioPresets.find(preset => preset.id === localSelectedScenario);
    return selectedPreset ? selectedPreset.name : null;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Interventions</h3>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={exportConfig}
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
              onChange={importConfig}
              ref={fileInputRef}
            />
          </label>
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
              onClick={() => {
                setAIInterventions({
                  triageAI: false,
                  chwAI: false,
                  diagnosticAI: false,
                  bedManagementAI: false,
                  hospitalDecisionAI: false,
                  selfCareAI: false
                });
                setLocalSelectedScenario(null);
                setSelectedAIScenario(null);
              }}
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
          onClick={() => setShowPresetScenarios(!showPresetScenarios)}
        >
          <h4 className="text-md font-medium text-blue-800 dark:text-blue-300">AI Effectiveness Scenarios (2025)</h4>
          <button className="text-blue-700 dark:text-blue-400">
            {showPresetScenarios ? (
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
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showPresetScenarios ? 'max-h-[32rem]' : 'max-h-0'}`}>
          <div className="p-4 pt-0">
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
              Select from predefined scenarios representing different potential AI effectiveness outcomes in healthcare over the next 1-3 years:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {AIScenarioPresets.map((preset) => (
                <div 
                  key={preset.id}
                  onClick={() => applyConfig(preset)}
                  className={`border ${
                    preset.id.includes('best') 
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950' 
                      : preset.id.includes('worst')
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
                        : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900'
                  } ${localSelectedScenario === preset.id ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''} 
                  rounded-md p-3 hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors cursor-pointer`}
                >
                  <h5 className={`font-medium text-sm mb-1 ${
                    preset.id.includes('best') 
                      ? 'text-green-800 dark:text-green-300' 
                      : preset.id.includes('worst')
                        ? 'text-red-800 dark:text-red-300'
                        : 'text-blue-800 dark:text-blue-300'
                  }`}>{preset.name}</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{preset.description}</p>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 italic">
              Click on any scenario to apply it to your simulation.
            </p>
          </div>
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