import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  aiInterventionsAtom,
  effectMagnitudesAtom,
  runSimulationAtom,
  selectedAIScenarioAtom,
  aiCostParametersAtom,
  AICostParameters
} from '../lib/store';
import { AIInterventions } from '../models/stockAndFlowModel';
import InfoTooltip from './InfoTooltip';
import { getParameterRationale } from '../data/parameter_rationales';

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

// Streamlined AI scenario presets organized by implementation stages and disease focus
const AIScenarioPresets: AIInterventionConfig[] = [
  // === BREAKTHROUGH STAGE SCENARIOS ===
  {
    id: 'breakthrough-full-integration',
    name: 'Full AI Integration (Best Case)',
    description: 'Breakthrough scenario with strong AI adoption across all care levels. Assumes excellent infrastructure, training, and user acceptance.',
    interventions: {
      triageAI: true,
      chwAI: true,
      diagnosticAI: true,
      bedManagementAI: true,
      hospitalDecisionAI: true,
      selfCareAI: true
    },
    effectMagnitudes: {
      'triageAI_φ₀': 2.0,        // +16% formal care seeking
      'triageAI_σI': 1.8,        // +27% informal→formal transition
      'chwAI_μ₀': 2.0,           // +10% resolution at CHW
      'chwAI_δ₀': 2.0,           // -16% mortality at CHW
      'chwAI_ρ₀': 1.5,           // -12% unnecessary referrals
      'diagnosticAI_μ₁': 2.2,     // +13% resolution at primary care
      'diagnosticAI_δ₁': 2.0,     // -16% mortality
      'diagnosticAI_ρ₁': 1.5,     // -12% referrals
      'bedManagementAI_μ₂': 1.5,  // +4.5% resolution at hospitals
      'bedManagementAI_μ₃': 1.5,
      'hospitalDecisionAI_δ₂': 2.0, // -20% mortality at hospitals
      'hospitalDecisionAI_δ₃': 2.0,
      'selfCareAI_μI': 2.0,       // +16% resolution in informal care
      'selfCareAI_δI': 1.8        // -27% mortality reduction
    }
  },
  {
    id: 'early-stage-deployment',
    name: 'Early Stage Deployment',
    description: 'Conservative rollout focusing on proven AI tools at community and primary care levels. Limited hospital AI due to infrastructure constraints.',
    interventions: {
      triageAI: false,           // Not yet ready for widespread deployment
      chwAI: true,               // Proven in pilots
      diagnosticAI: true,        // TB/malaria AI showing success
      bedManagementAI: false,    // Requires hospital IT systems
      hospitalDecisionAI: false, // Complex implementation
      selfCareAI: true           // Mobile penetration enables this
    },
    effectMagnitudes: {
      'chwAI_μ₀': 1.2,           // +6% resolution (conservative based on pilots)
      'chwAI_δ₀': 1.2,           // -9.6% mortality
      'chwAI_ρ₀': 1.2,           // -9.6% unnecessary referrals
      'diagnosticAI_μ₁': 1.5,     // +9% resolution (TB/malaria focus)
      'diagnosticAI_δ₁': 1.3,     // -10.4% mortality
      'diagnosticAI_ρ₁': 1.2,     // -9.6% referrals
      'selfCareAI_μI': 1.0,       // Standard effects
      'selfCareAI_δI': 1.0
    }
  },
  {
    id: 'implementation-challenges',
    name: 'Implementation Challenges (Worst Case)',
    description: 'AI faces significant barriers: poor connectivity, user resistance, limited training, and integration difficulties. Minimal effectiveness achieved.',
    interventions: {
      triageAI: true,            // Attempted but limited success
      chwAI: true,               // Basic deployment only
      diagnosticAI: true,        // Equipment and training issues
      bedManagementAI: false,    // Too complex for current infrastructure
      hospitalDecisionAI: false, // Requires EHR integration not available
      selfCareAI: true           // Low smartphone penetration limits impact
    },
    effectMagnitudes: {
      'triageAI_φ₀': 0.3,        // Only +2.4% formal care seeking
      'triageAI_σI': 0.3,        // Minimal impact due to trust issues
      'chwAI_μ₀': 0.4,           // +2% resolution (connectivity problems)
      'chwAI_δ₀': 0.4,           // -3.2% mortality
      'chwAI_ρ₀': 0.5,           // -4% referrals
      'diagnosticAI_μ₁': 0.5,     // +3% resolution (equipment issues)
      'diagnosticAI_δ₁': 0.5,     // -4% mortality
      'diagnosticAI_ρ₁': 0.5,     // -4% referrals
      'selfCareAI_μI': 0.3,       // +2.4% resolution (low penetration)
      'selfCareAI_δI': 0.5        // -7.5% mortality
    }
  },

  // === DISEASE-SPECIFIC SCENARIOS ===
  {
    id: 'infectious-diseases-tb-malaria',
    name: 'Infectious Diseases (TB/Malaria)',
    description: 'AI excels at TB chest X-ray reading and malaria microscopy. Optimized for high-burden infectious disease settings with strong diagnostic focus.',
    interventions: {
      triageAI: false,
      chwAI: true,              // CHWs screen for TB/malaria
      diagnosticAI: true,        // Core intervention for infectious diseases
      bedManagementAI: false,
      hospitalDecisionAI: true,  // Drug resistance detection
      selfCareAI: false
    },
    effectMagnitudes: {
      'chwAI_μ₀': 1.5,           // +7.5% resolution (better screening)
      'chwAI_δ₀': 1.8,           // -14.4% mortality (early detection)
      'chwAI_ρ₀': 2.0,           // -16% referrals (better triage of suspects)
      'diagnosticAI_μ₁': 3.0,     // +18% resolution (huge impact for early TB detection)
      'diagnosticAI_δ₁': 2.5,     // -20% mortality (early treatment saves lives)
      'diagnosticAI_ρ₁': 2.0,     // -16% referrals (accurate diagnosis at primary)
      'hospitalDecisionAI_δ₂': 1.8, // -16% mortality (MDR-TB detection)
      'hospitalDecisionAI_δ₃': 1.8
    }
  },
  {
    id: 'child-health-pneumonia-diarrhea',
    name: 'Child Health (Pneumonia/Diarrhea)',
    description: 'AI supports integrated management of childhood illness (IMCI). CHWs get AI assistance for danger signs, respiratory rate counting, and dehydration assessment.',
    interventions: {
      triageAI: false,
      chwAI: true,               // Core intervention for IMCI
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: true           // Parents receive guidance on care and danger signs
    },
    effectMagnitudes: {
      'chwAI_μ₀': 2.5,           // +12.5% resolution (better assessment of pneumonia/diarrhea)
      'chwAI_δ₀': 2.5,           // -20% mortality (critical for preventing child deaths)
      'chwAI_ρ₀': 2.0,           // -16% unnecessary referrals (better danger sign recognition)
      'selfCareAI_μI': 2.0,       // +16% resolution (ORS compliance, early care seeking)
      'selfCareAI_δI': 2.0        // -30% mortality (parents recognize danger signs)
    }
  },
  {
    id: 'maternal-health-comprehensive',
    name: 'Maternal Health Comprehensive',
    description: 'Full AI suite for maternal health: antenatal care, ultrasound interpretation, labor ward management, and complication prediction.',
    interventions: {
      triageAI: true,            // Birth preparedness and facility delivery promotion
      chwAI: true,               // Antenatal care and danger sign recognition
      diagnosticAI: true,        // Ultrasound AI and pregnancy complication detection
      bedManagementAI: true,     // Labor ward and maternity bed management
      hospitalDecisionAI: true,  // Obstetric emergency protocols
      selfCareAI: true           // Pregnancy monitoring and education apps
    },
    effectMagnitudes: {
      'triageAI_φ₀': 2.5,        // +20% facility delivery (critical for maternal outcomes)
      'triageAI_σI': 2.0,        // +30% transition to facility care
      'chwAI_μ₀': 1.5,           // +7.5% resolution of complications
      'chwAI_δ₀': 3.0,           // -24% mortality (danger sign recognition saves lives)
      'chwAI_ρ₀': 2.5,           // -20% unnecessary referrals
      'diagnosticAI_μ₁': 2.0,     // +12% resolution (ectopic, pre-eclampsia detection)
      'diagnosticAI_δ₁': 2.5,     // -20% mortality
      'diagnosticAI_ρ₁': 1.5,     // -12% referrals
      'bedManagementAI_μ₂': 2.0,  // +6% resolution (optimal cesarean timing)
      'bedManagementAI_μ₃': 2.0,
      'hospitalDecisionAI_δ₂': 3.0, // -30% mortality (hemorrhage protocols)
      'hospitalDecisionAI_δ₃': 3.0,
      'selfCareAI_μI': 1.5,       // +12% better pregnancy self-care
      'selfCareAI_δI': 2.0        // -30% mortality (early warning recognition)
    }
  },
  {
    id: 'chronic-diseases-hiv-diabetes',
    name: 'Chronic Diseases (HIV/Diabetes)',
    description: 'AI optimizes long-term chronic disease management through medication adherence support, complication prediction, and treatment optimization.',
    interventions: {
      triageAI: false,
      chwAI: true,               // Adherence support and complication monitoring
      diagnosticAI: true,        // Viral load prediction, diabetic complication detection
      bedManagementAI: false,
      hospitalDecisionAI: true,  // Treatment adjustment and complication management
      selfCareAI: true           // Medication adherence and lifestyle management apps
    },
    effectMagnitudes: {
      'chwAI_μ₀': 3.0,           // +15% treatment success (adherence is critical)
      'chwAI_δ₀': 1.5,           // -12% mortality
      'chwAI_ρ₀': 0.8,           // +4% referrals (appropriate escalation for complications)
      'diagnosticAI_μ₁': 2.0,     // +12% resolution (early complication detection)
      'diagnosticAI_δ₁': 2.0,     // -16% mortality
      'diagnosticAI_ρ₁': 1.5,     // -12% referrals
      'hospitalDecisionAI_δ₂': 2.5, // -25% mortality (optimized treatment protocols)
      'hospitalDecisionAI_δ₃': 2.5,
      'selfCareAI_μI': 3.0,       // +24% resolution (medication adherence critical)
      'selfCareAI_δI': 2.0        // -30% mortality (lifestyle management)
    }
  }
];

const AIInterventionManager: React.FC = () => {
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  
  // Use global atom for effect magnitudes instead of local state
  const [effectMagnitudes, setEffectMagnitudes] = useAtom(effectMagnitudesAtom);
  const [selectedPreset, setSelectedPreset] = useAtom(selectedAIScenarioAtom);
  
  // Add AI cost parameters state
  const [aiCostParams, setAICostParams] = useAtom(aiCostParametersAtom);
  const [showCostSettings, setShowCostSettings] = useState(false);
  
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
    setLocalSelectedScenario(selectedPreset);
  }, [selectedPreset]);
  
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
    setSelectedPreset(null);
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
    setSelectedPreset(config.id);
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
      setSelectedPreset(null);
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
        { param: 'φ₀', effect: '+0.08', description: 'Increases formal care seeking (8% increase based on symptom checker studies from Kenya and Nigeria)' },
        { param: 'σI', effect: '×1.15', description: 'Faster transition from informal to formal care (15% increase based on mobile health intervention studies)' }
      ]
    },
    { 
      key: 'chwAI', 
      name: 'CHW Decision Support', 
      description: 'AI tools that help community health workers diagnose and treat patients more effectively',
      effects: [
        { param: 'μ₀', effect: '+0.05', description: 'Better resolution at community level (5% increase based on iCCM studies in Uganda and Ethiopia)' },
        { param: 'δ₀', effect: '×0.92', description: 'Lower death rate at community level (8% reduction based on WHO iCCM effectiveness reviews)' },
        { param: 'ρ₀', effect: '×0.92', description: 'Fewer unnecessary referrals (8% reduction based on clinical decision support studies in Malawi)' }
      ]
    },
    { 
      key: 'diagnosticAI', 
      name: 'Diagnostic AI', 
      description: 'AI-powered diagnostic tools at primary care facilities to improve diagnosis accuracy and treatment decisions',
      effects: [
        { param: 'μ₁', effect: '+0.06', description: 'Better resolution at primary care (6% increase based on X-ray AI studies in India and Ghana)' },
        { param: 'δ₁', effect: '×0.92', description: 'Lower death rate at primary care (8% reduction based on tuberculosis AI diagnostic studies)' },
        { param: 'ρ₁', effect: '×0.92', description: 'Fewer unnecessary referrals (8% reduction based on clinical AI decision support trials)' }
      ] 
    },
    { 
      key: 'bedManagementAI', 
      name: 'Bed Management AI', 
      description: 'AI tools that optimize patient flow and bed allocation in hospitals to reduce length of stay',
      effects: [
        { param: 'μ₂', effect: '+0.03', description: 'Faster discharge from district hospital (3% increase based on bed management studies in Kenya and South Africa)' },
        { param: 'μ₃', effect: '+0.03', description: 'Faster discharge from tertiary hospital (3% increase based on patient flow optimization studies)' }
      ]
    },
    { 
      key: 'hospitalDecisionAI', 
      name: 'Hospital Decision Support', 
      description: 'AI tools that help hospital staff make better treatment and clinical management decisions',
      effects: [
        { param: 'δ₂', effect: '×0.90', description: 'Lower death rate at district hospital (10% reduction based on clinical decision support studies in Tanzania)' },
        { param: 'δ₃', effect: '×0.90', description: 'Lower death rate at tertiary hospital (10% reduction based on sepsis prediction AI studies)' }
      ]
    },
    { 
      key: 'selfCareAI', 
      name: 'Self-Care Apps', 
      description: 'AI-enhanced apps that help patients self-manage their conditions and know when to seek care',
      effects: [
        { param: 'μI', effect: '+0.08', description: 'Better informal care resolution (8% increase based on mHealth app studies in Bangladesh and India)' },
        { param: 'δI', effect: '×0.85', description: 'Lower death rate in informal care (15% reduction based on medication adherence app studies)' }
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
  
  // Add handler for AI cost parameter changes
  const handleCostChange = (
    intervention: keyof AIInterventions,
    costType: 'fixed' | 'variable',
    value: number
  ) => {
    setAICostParams(prev => ({
      ...prev,
      [intervention]: {
        ...prev[intervention],
        [costType]: value
      }
    }));
  };
  
  // Add this section where appropriate in the render function
  const renderCostSettings = () => {
    if (!showCostSettings) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Cost Settings</h3>
          <button 
            onClick={() => setShowCostSettings(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close cost settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Total Cost Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Total AI Implementation Costs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-blue-700 dark:text-blue-300">Total Fixed Cost:</span>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  ${Object.entries(aiInterventions)
                    .filter(([_, isEnabled]) => isEnabled)
                    .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].fixed, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-blue-700 dark:text-blue-300">Total Variable Cost:</span>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  ${Object.entries(aiInterventions)
                    .filter(([_, isEnabled]) => isEnabled)
                    .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].variable, 0)
                    .toFixed(2)} per patient
                </p>
              </div>
            </div>
          </div>
          
          {/* Individual Cost Settings */}
          {Object.entries(aiInterventions).map(([key, isEnabled]) => {
            const intervention = key as keyof AIInterventions;
            if (!isEnabled) return null;
            
            return (
              <div key={`cost-${key}`} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  {getInterventionName(intervention)}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Fixed Cost (USD)
                      </label>
                      <InfoTooltip 
                        content={getParameterRationale(`${intervention}_fixed`)}
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={aiCostParams[intervention].fixed}
                      onChange={(e) => handleCostChange(intervention, 'fixed', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Variable Cost (USD per patient)
                      </label>
                      <InfoTooltip 
                        content={getParameterRationale(`${intervention}_variable`)}
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={aiCostParams[intervention].variable}
                      onChange={(e) => handleCostChange(intervention, 'variable', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Add a helper function to get the intervention name
  const getInterventionName = (key: keyof AIInterventions): string => {
    // Map intervention keys to their display names
    const nameMap: Record<keyof AIInterventions, string> = {
      triageAI: 'Patient Triage AI',
      chwAI: 'CHW Support AI', 
      diagnosticAI: 'Diagnostic AI',
      bedManagementAI: 'Bed Management AI',
      hospitalDecisionAI: 'Hospital Decision Support AI',
      selfCareAI: 'Self-Care AI'
    };
    return nameMap[key] || key;
  };
  
  // Add a button to toggle cost settings visibility in the appropriate section of your render function
  const renderCostSettingsButton = () => {
    const anyInterventionActive = Object.values(aiInterventions).some(Boolean);
    if (!anyInterventionActive) return null;
    
    return (
      <button
        onClick={() => setShowCostSettings(!showCostSettings)}
        className="mt-4 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md text-sm font-medium"
      >
        {showCostSettings ? 'Hide Cost Settings' : 'Configure AI Costs'}
      </button>
    );
  };


  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Interventions</h3>
            <InfoTooltip 
              content="Select AI tools to deploy in your healthcare system. Each intervention modifies specific parameters (like resolution rates and mortality) based on evidence from AI pilot studies. Use magnitude sliders to adjust the strength of effects. Default baseline parameters are set in the Parameters tab."
            />
          </div>
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
                  setSelectedPreset(null);
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
            <h4 className="text-md font-medium text-blue-800 dark:text-blue-300">AI Implementation Scenarios</h4>
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
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showPresetScenarios ? 'max-h-[40rem]' : 'max-h-0'}`}>
            <div className="p-4 pt-0">
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                <strong>Stage-based scenarios</strong> show different levels of AI maturity and implementation success. 
                <strong>Disease-specific scenarios</strong> demonstrate AI impact optimized for particular health conditions.
              </p>
              
              <div className="space-y-4">
                {/* Stage-based scenarios */}
                <div>
                  <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Implementation Stages</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {AIScenarioPresets.slice(0, 3).map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => applyConfig(preset)}
                        className={`border ${
                          preset.id.includes('full-integration') 
                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950' 
                            : preset.id.includes('challenges')
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
                              : 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-950'
                        } ${localSelectedScenario === preset.id ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''} 
                        rounded-md p-3 hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors cursor-pointer`}
                      >
                        <h5 className={`font-medium text-sm mb-1 ${
                          preset.id.includes('full-integration') 
                            ? 'text-green-800 dark:text-green-300' 
                            : preset.id.includes('challenges')
                              ? 'text-red-800 dark:text-red-300'
                              : 'text-orange-800 dark:text-orange-300'
                        }`}>{preset.name}</h5>
                        <p className={`text-xs mb-2 ${
                          preset.id.includes('full-integration') 
                            ? 'text-green-600 dark:text-green-400' 
                            : preset.id.includes('challenges')
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-orange-600 dark:text-orange-400'
                        }`}>{preset.description}</p>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Active tools: </span>
                          {Object.entries(preset.interventions)
                            .filter(([_, isActive]) => isActive)
                            .map(([name]) => name.replace('AI', ' AI'))
                            .join(', ')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disease-specific scenarios */}
                <div>
                  <h5 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Disease-Specific Focus</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AIScenarioPresets.slice(3).map((preset) => (
                      <div 
                        key={preset.id}
                        onClick={() => applyConfig(preset)}
                        className={`border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-950 ${
                          localSelectedScenario === preset.id ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400' : ''
                        } rounded-md p-3 hover:bg-opacity-80 dark:hover:bg-opacity-80 transition-colors cursor-pointer`}
                      >
                        <h5 className="font-medium text-sm mb-1 text-purple-800 dark:text-purple-300">{preset.name}</h5>
                        <p className="text-xs mb-2 text-purple-600 dark:text-purple-400">{preset.description}</p>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Active tools: </span>
                          {Object.entries(preset.interventions)
                            .filter(([_, isActive]) => isActive)
                            .map(([name]) => name.replace('AI', ' AI'))
                            .join(', ')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Individual AI Tools</h3>
          <InfoTooltip 
            content="Check the boxes to enable AI interventions. Each tool shows its default parameter effects and magnitude sliders to customize strength. Effects are calculated as: baseline parameter (from Parameters tab) + or × AI effect × magnitude. Values are based on WHO guidelines and recent AI pilot studies in Kenya, Nigeria, India, and Bangladesh."
          />
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
                  <div className="flex items-center gap-1 mb-1">
                    <p className={`font-medium ${
                      isActive ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-400'
                    }`}>
                      Parameter Effects:
                    </p>
                    <InfoTooltip 
                      content="These show the baseline effects this AI intervention has on model parameters. The magnitude sliders below multiply these base effects (0 = no effect, 1 = default effect, 2 = double effect). Default values are based on literature review of AI pilot studies in LMICs and WHO guidelines."
                    />
                  </div>
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
                              <div className="flex items-center gap-1">
                                <span>Default</span>
                                <InfoTooltip 
                                  content={`Effect magnitude: 0 = disabled, 1 = default effect (${effect.effect}), 2 = double strength. The effect is ${effect.effect.startsWith('+') ? 'added to' : 'multiplied with'} the baseline parameter from the Parameters tab.`}
                                />
                              </div>
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
      
      {/* Always show cost summary when interventions are active */}
      {Object.values(aiInterventions).some(Boolean) && !showCostSettings && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total Fixed Cost: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${Object.entries(aiInterventions)
                  .filter(([_, isEnabled]) => isEnabled)
                  .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].fixed, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Variable Cost: </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${Object.entries(aiInterventions)
                  .filter(([_, isEnabled]) => isEnabled)
                  .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].variable, 0)
                  .toFixed(2)}/patient
              </span>
            </div>
          </div>
        </div>
      )}
      
      {renderCostSettingsButton()}
      {renderCostSettings()}
    </div>
  );
};

export default AIInterventionManager; 