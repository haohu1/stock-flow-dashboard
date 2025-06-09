import React, { useState, useRef } from 'react';
import { useAtom } from 'jotai';
import {
  aiInterventionsAtom,
  effectMagnitudesAtom,
  runSimulationAtom,
  selectedAIScenarioAtom,
  aiCostParametersAtom,
  aiTimeToScaleParametersAtom,
  selectedDiseaseAtom,
  selectedDiseasesAtom,
  aiUptakeParametersAtom
} from '../lib/store';
import { AIInterventions, AIUptakeParameters, diseaseSpecificAIEffects, diseaseAIRationales } from '../models/stockAndFlowModel';
import InfoTooltip from './InfoTooltip';

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
  category?: 'resolution' | 'mortality' | 'referral' | 'care-seeking' | 'queue';
}

interface InterventionInfo {
  key: keyof AIInterventions;
  name: string;
  description: string;
  careLevel: string;
  effects: InterventionEffect[];
  keyBenefits: string[];
  useCase: string;
}

// Enhanced intervention info with better organization
const interventionInfo: InterventionInfo[] = [
  { 
    key: 'selfCareAI', 
    name: 'AI Self-Care Platform', 
    description: 'Comprehensive self-management ecosystem combining AI health coaching, symptom assessment, wearable monitoring, and point-of-care diagnostics',
    careLevel: 'Home & Community',
    effects: [
      { param: 'φ₀', effect: '+0.05', description: 'Increases formal care seeking through health guidance', category: 'care-seeking' },
      { param: 'σI', effect: '×1.13', description: 'Accelerates transition from informal to formal care', category: 'care-seeking' },
      { param: 'μI', effect: '+0.08', description: 'Improves resolution through better self-management', category: 'resolution' },
      { param: 'δI', effect: '×0.85', description: 'Reduces mortality by detecting warning signs early', category: 'mortality' },
      { param: 'visitReduction', effect: '0.20', description: 'Prevents 20% of unnecessary healthcare visits', category: 'queue' },
      { param: 'directRoutingImprovement', effect: '0.15', description: 'Routes 15% directly to appropriate care level', category: 'queue' }
    ],
    keyBenefits: [
      '24/7 personalized health guidance in local languages',
      'Early warning system for serious conditions',
      'Medication adherence support with OTC guidance',
      'Home diagnostics and wearable integration',
      'Reduces burden on healthcare facilities'
    ],
    useCase: 'Comprehensive platform for home health management, chronic disease support, and preventive care'
  },
  { 
    key: 'triageAI', 
    name: 'AI Health Advisor', 
    description: 'Subset of Self-Care AI Platform focused only on conversational health advising and symptom assessment without diagnostics or treatment',
    careLevel: 'Entry Point',
    effects: [
      { param: 'φ₀', effect: '+0.05', description: 'Increases initial formal care seeking by 5%', category: 'care-seeking' },
      { param: 'queuePreventionRate', effect: '0.40', description: 'Prevents 40% of inappropriate visits', category: 'queue' },
      { param: 'smartRoutingRate', effect: '0.35', description: 'Routes 35% directly to correct care level', category: 'queue' }
    ],
    keyBenefits: [
      'Advice-only function without diagnostics or treatment',
      'Reduces unnecessary emergency visits through education',
      'Multilingual conversational support',
      'Available 24/7 via basic smartphones',
      'Lower cost subset of full Self-Care Platform'
    ],
    useCase: 'Entry-level AI for health education and care navigation when full Self-Care Platform is not feasible'
  },
  { 
    key: 'chwAI', 
    name: 'CHW Decision Support', 
    description: 'Mobile AI assistant providing CHWs with clinical protocols, drug dosing, and risk assessment',
    careLevel: 'Community (L0)',
    effects: [
      { param: 'μ₀', effect: '+0.15', description: 'Improves CHW resolution rate by 15 percentage points', category: 'resolution' },
      { param: 'δ₀', effect: '×0.92', description: 'Reduces mortality by 8% through better care', category: 'mortality' },
      { param: 'ρ₀', effect: '×0.80', description: 'Optimizes referrals (±20% based on need)', category: 'referral' },
      { param: 'resolutionBoost', effect: '0.10', description: 'Additional 10% cases resolved locally', category: 'queue' },
      { param: 'referralOptimization', effect: '0.08', description: 'Further 8% reduction in unnecessary referrals', category: 'queue' }
    ],
    keyBenefits: [
      'Enables CHWs to safely handle complex cases',
      'Automated danger sign detection',
      'Real-time drug dosing calculations',
      'Offline functionality for remote areas'
    ],
    useCase: 'Essential for expanding CHW capabilities in rural/underserved areas'
  },
  { 
    key: 'diagnosticAI', 
    name: 'Diagnostic AI Suite', 
    description: 'AI-powered diagnostic tools including medical imaging, lab interpretation, and differential diagnosis',
    careLevel: 'Primary & District (L1/L2)',
    effects: [
      { param: 'μ₁', effect: '+0.20', description: 'Improves primary care resolution by 20 percentage points', category: 'resolution' },
      { param: 'δ₁', effect: '×0.92', description: 'Reduces primary care mortality by 8%', category: 'mortality' },
      { param: 'ρ₁', effect: '×0.80', description: 'Optimizes primary→district referrals (±20%)', category: 'referral' },
      { param: 'μ₂', effect: '+0.15', description: 'Improves district hospital resolution by 15 percentage points', category: 'resolution' },
      { param: 'δ₂', effect: '×0.94', description: 'Reduces district hospital mortality by 6%', category: 'mortality' },
      { param: 'ρ₂', effect: '×0.85', description: 'Optimizes district→tertiary referrals (±15%)', category: 'referral' },
      { param: 'pointOfCareResolution', effect: '0.12', description: 'Resolves 12% more cases at point of care', category: 'queue' },
      { param: 'referralPrecision', effect: '0.10', description: 'Reduces referral queues by 10%', category: 'queue' }
    ],
    keyBenefits: [
      '90%+ accuracy for TB/pneumonia X-ray reading',
      'Rapid malaria microscopy interpretation',
      'Early cancer detection capabilities',
      'Reduces diagnostic errors significantly'
    ],
    useCase: 'Critical for facilities lacking specialist radiologists or lab technicians'
  },
  { 
    key: 'bedManagementAI', 
    name: 'Smart Hospital Operations', 
    description: 'AI system for patient flow optimization, bed allocation, and discharge planning',
    careLevel: 'Hospitals (L2/L3)',
    effects: [
      { param: 'μ₂', effect: '+0.03', description: 'Improves district hospital discharge efficiency by 3%', category: 'resolution' },
      { param: 'μ₃', effect: '+0.03', description: 'Improves tertiary hospital discharge efficiency by 3%', category: 'resolution' },
      { param: 'lengthOfStayReduction', effect: '0.15', description: 'Reduces length of stay by 15%', category: 'queue' },
      { param: 'dischargeOptimization', effect: '0.12', description: 'Accelerates discharge planning by 12%', category: 'queue' }
    ],
    keyBenefits: [
      'Predicts discharge readiness accurately',
      'Optimizes bed utilization',
      'Reduces waiting times for admission',
      'Coordinates complex discharge planning'
    ],
    useCase: 'Essential for congested hospitals with bed shortages'
  },
  { 
    key: 'hospitalDecisionAI', 
    name: 'Clinical Decision Support', 
    description: 'Real-time AI system providing treatment recommendations and early warning alerts',
    careLevel: 'Hospitals (L2/L3)',
    effects: [
      { param: 'δ₂', effect: '×0.90', description: 'Reduces district hospital mortality by 10%', category: 'mortality' },
      { param: 'δ₃', effect: '×0.90', description: 'Reduces tertiary hospital mortality by 10%', category: 'mortality' },
      { param: 'treatmentEfficiency', effect: '0.08', description: 'Improves treatment effectiveness by 8%', category: 'queue' },
      { param: 'resourceUtilization', effect: '0.10', description: 'Optimizes resource use by 10%', category: 'queue' }
    ],
    keyBenefits: [
      '24/7 specialist-equivalent decision support',
      'Early deterioration detection (hours before clinical signs)',
      'Evidence-based treatment protocols',
      'Reduces medical errors'
    ],
    useCase: 'Vital for hospitals with limited specialists or high patient volumes'
  }
];


const AIInterventionManager: React.FC = () => {
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [effectMagnitudes, setEffectMagnitudes] = useAtom(effectMagnitudesAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [selectedPreset, setSelectedPreset] = useAtom(selectedAIScenarioAtom);
  const [aiCostParams, setAiCostParams] = useAtom(aiCostParametersAtom);
  const [timeToScaleParams, setTimeToScaleParams] = useAtom(aiTimeToScaleParametersAtom);
  const [aiUptakeParams, setAiUptakeParams] = useAtom(aiUptakeParametersAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'uptake' | 'costs'>('overview');
  const [displayedDisease, setDisplayedDisease] = useState<string | null>(null);
  
  // Helper functions
  const hasActiveInterventions = Object.values(aiInterventions).some(v => v);
  const activeInterventionCount = Object.values(aiInterventions).filter(v => v).length;
  
  // Initialize displayed disease when selectedDiseases changes
  React.useEffect(() => {
    if (selectedDiseases.length > 0 && !selectedDiseases.includes(displayedDisease || '')) {
      setDisplayedDisease(selectedDiseases[0]);
    }
  }, [selectedDiseases, displayedDisease]);
  
  // Use displayedDisease for showing disease-specific effects, fallback to selectedDisease for single selection
  const effectiveDisease = displayedDisease || selectedDisease;
  
  const handleInterventionToggle = (intervention: keyof AIInterventions) => {
    setAIInterventions({
      ...aiInterventions,
      [intervention]: !aiInterventions[intervention]
    });
    setSelectedPreset(null);
  };

  // Helper function to get disease-specific effect multiplier
  const getDiseaseSpecificMultiplier = (interventionKey: string, effectParam: string): number | null => {
    if (!effectiveDisease || !diseaseSpecificAIEffects[effectiveDisease]) return null;
    
    const diseaseEffects = diseaseSpecificAIEffects[effectiveDisease];
    const interventionEffects = diseaseEffects[interventionKey as keyof typeof diseaseEffects];
    
    if (!interventionEffects) return null;
    
    // Map parameter names to disease-specific effect keys
    const paramMapping: {[key: string]: string} = {
      // Resolution parameters
      'μ₀': 'mu0Effect',
      'μ₁': 'mu1Effect',
      'μ₂': 'mu2Effect',
      'μ₃': 'mu3Effect',
      'μI': 'muIEffect',
      // Mortality parameters
      'δ₀': 'delta0Effect',
      'δ₁': 'delta1Effect',
      'δ₂': 'delta2Effect',
      'δ₃': 'delta3Effect',
      'δI': 'deltaIEffect',
      // Referral parameters
      'ρ₀': 'rho0Effect',
      'ρ₁': 'rho1Effect',
      'ρ₂': 'rho2Effect',
      // Care-seeking parameters
      'φ₀': 'phi0Effect',
      'σI': 'sigmaIEffect',
      // Queue management parameters
      'visitReduction': 'visitReductionEffect',
      'directRoutingImprovement': 'routingImprovementEffect',
      'queuePreventionRate': 'queuePreventionRate',
      'smartRoutingRate': 'smartRoutingRate',
      'resolutionBoost': 'resolutionBoostEffect',
      'referralOptimization': 'referralOptimizationEffect',
      'pointOfCareResolution': 'pointOfCareResolutionEffect',
      'referralPrecision': 'referralPrecisionEffect',
      'lengthOfStayReduction': 'lengthOfStayReductionEffect',
      'dischargeOptimization': 'dischargeOptimizationEffect',
      'treatmentEfficiency': 'treatmentEfficiencyEffect',
      'resourceUtilization': 'resourceUtilizationEffect'
    };
    
    const effectKey = paramMapping[effectParam];
    if (!effectKey) return null;
    
    return interventionEffects[effectKey as keyof typeof interventionEffects] as number || null;
  };


  const resetAll = () => {
    setAIInterventions({
      triageAI: false,
      chwAI: false,
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: false
    });
    setEffectMagnitudes({});
    setSelectedPreset(null);
  };

  // Get total costs
  const totalFixedCost = Object.entries(aiInterventions)
    .filter(([_, isEnabled]) => isEnabled)
    .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].fixed, 0);
  
  const totalVariableCost = Object.entries(aiInterventions)
    .filter(([_, isEnabled]) => isEnabled)
    .reduce((sum, [key]) => sum + aiCostParams[key as keyof AIInterventions].variable, 0);

  // Render different views based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'details':
        return renderDetailsTab();
      case 'uptake':
        return renderUptakeTab();
      case 'costs':
        return renderCostsTab();
      default:
        return null;
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeInterventionCount}/6</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Active Interventions</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">${totalFixedCost.toLocaleString()}</div>
          <div className="text-sm text-green-700 dark:text-green-300">Total Fixed Cost</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">${totalVariableCost.toFixed(2)}</div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Per Patient Cost</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
            {hasActiveInterventions ? '✓' : '—'}
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300">AI Active</div>
        </div>
      </div>

      {/* Instructions and Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">What are AI Interventions?</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          AI interventions are evidence-based digital health tools that improve patient outcomes and system efficiency.
          Each intervention uses artificial intelligence to enhance specific parts of the healthcare journey:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div>
            <strong>🏠 Home & Community:</strong> Self-care apps, symptom checkers, adherence support
          </div>
          <div>
            <strong>🏥 Primary Care:</strong> Diagnostic tools, clinical decision support, triage systems
          </div>
          <div>
            <strong>🏨 Hospitals:</strong> Bed management, treatment protocols, discharge planning
          </div>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          <strong>How to use:</strong> Click on any intervention card below to enable/disable it. Active interventions are highlighted in green.
          Configure detailed effects in the "Effect Details" tab.
        </p>
      </div>

      {/* Intervention Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interventionInfo.map((intervention) => {
          const isActive = aiInterventions[intervention.key];
          const interventionKey = intervention.key as keyof Omit<AIUptakeParameters, 'globalUptake' | 'urbanMultiplier' | 'ruralMultiplier'>;
          const uptakeRate = aiUptakeParams[interventionKey] || 1.0;
          
          return (
            <div 
              key={intervention.key}
              className={`rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                isActive 
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
              onClick={() => handleInterventionToggle(intervention.key)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isActive ? 'text-green-800 dark:text-green-200' : 'text-gray-800 dark:text-gray-200'}`}>
                      {intervention.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{intervention.careLevel}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    {isActive && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{intervention.description}</p>
                
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  <div className="mb-1">💡 {intervention.useCase}</div>
                  {isActive && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span>Uptake Rate:</span>
                        <span className="font-semibold">{(uptakeRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Cost:</span>
                        <span className="font-semibold">
                          ${aiCostParams[intervention.key].fixed.toLocaleString()} + ${aiCostParams[intervention.key].variable}/pt
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveTab('details')}
          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
        >
          Configure Effects
        </button>
        {hasActiveInterventions && (
          <button
            onClick={resetAll}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );

  const renderDetailsTab = () => {
    // Check if any interventions are selected
    const hasSelectedInterventions = Object.values(aiInterventions).some(v => v);
    
    if (!hasSelectedInterventions) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">No AI Interventions Selected</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            To configure effect details, you need to select at least one AI intervention first. 
            Go to the <strong>Overview</strong> tab and click on the intervention cards to enable them.
          </p>
          <button
            onClick={() => setActiveTab('overview')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Go to Overview
          </button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Parameter Guide - More concise */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">Quick Parameter Guide</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">Resolution (μ)</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recovery rate. Higher = faster recovery</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💀</span>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">Mortality (δ)</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Death rate. Lower = fewer deaths</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">↗️</span>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">Referral (ρ)</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Referral rate. AI optimizes up or down</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">Care-Seeking (φ, σ)</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Formal care usage. Higher = more seek care</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h5 className="font-medium text-gray-800 dark:text-gray-200">Queue Management</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduces congestion & wait times</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Tip:</strong> Adjust the <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">Magnitude</span> to scale effects. 
              1.0 = default effect • 0 = disabled • 2.0 = double strength
            </p>
          </div>
        </div>

        {/* Disease-specific effects section */}
        {(effectiveDisease && diseaseSpecificAIEffects[effectiveDisease]) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-lg flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                Disease-Specific AI Effects
              </h4>
              {selectedDiseases.length > 1 && (
                <select
                  value={effectiveDisease}
                  onChange={(e) => setDisplayedDisease(e.target.value)}
                  className="px-3 py-1 text-sm border border-amber-300 dark:border-amber-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-amber-800 dark:text-amber-100"
                >
                  {selectedDiseases.map(disease => (
                    <option key={disease} value={disease}>
                      {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
              {selectedDiseases.length === 1 && (
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {effectiveDisease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              {diseaseAIRationales[effectiveDisease]}
            </p>
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/30 rounded p-3">
              <strong>Note:</strong> For {effectiveDisease.replace(/_/g, ' ')}, AI interventions have disease-specific 
              effects that replace the base effects shown below. These disease-specific values reflect how well 
              the AI technology performs for this particular disease's characteristics and treatment protocols.
            </div>
          </div>
        )}

        {/* Group interventions by care level */}
        {['Home & Community', 'Entry Point', 'Community (L0)', 'Primary & District (L1/L2)', 'Hospitals (L2/L3)'].map(level => {
          const levelInterventions = interventionInfo.filter(i => i.careLevel === level && aiInterventions[i.key]);
          if (levelInterventions.length === 0) return null;
          
          return (
            <div key={level} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">{level}</h3>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
              
              {levelInterventions.map(intervention => (
                <div key={intervention.key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 px-6 py-4">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{intervention.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{intervention.description}</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Effect Categories - Better visual separation */}
                    {['resolution', 'mortality', 'referral', 'care-seeking', 'queue'].map(category => {
                      const categoryEffects = intervention.effects.filter(e => e.category === category);
                      if (categoryEffects.length === 0) return null;
                      
                      const categoryInfo: Record<string, { name: string; icon: string; classes: string; headerClasses: string }> = {
                        resolution: { 
                          name: 'Resolution Improvements', 
                          icon: '✓', 
                          classes: 'border-green-200 dark:border-green-800/30 bg-green-50/30 dark:bg-green-900/10',
                          headerClasses: 'text-green-900 dark:text-green-100'
                        },
                        mortality: { 
                          name: 'Mortality Reductions', 
                          icon: '💀', 
                          classes: 'border-red-200 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/10',
                          headerClasses: 'text-red-900 dark:text-red-100'
                        }, 
                        referral: { 
                          name: 'Referral Optimization', 
                          icon: '↗️', 
                          classes: 'border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10',
                          headerClasses: 'text-blue-900 dark:text-blue-100'
                        },
                        'care-seeking': { 
                          name: 'Care-Seeking Changes', 
                          icon: '🏥', 
                          classes: 'border-purple-200 dark:border-purple-800/30 bg-purple-50/30 dark:bg-purple-900/10',
                          headerClasses: 'text-purple-900 dark:text-purple-100'
                        },
                        queue: { 
                          name: 'Queue Management', 
                          icon: '⏳', 
                          classes: 'border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10',
                          headerClasses: 'text-amber-900 dark:text-amber-100'
                        }
                      };
                      
                      const catInfo = categoryInfo[category];
                      
                      return (
                        <div key={category} className={`rounded-lg border ${catInfo.classes} p-4`}>
                          <h5 className={`text-base font-semibold ${catInfo.headerClasses} mb-3 flex items-center gap-2`}>
                            <span className="text-xl">{catInfo.icon}</span>
                            {catInfo.name}
                          </h5>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {categoryEffects.map(effect => {
                              const effectKey = `${intervention.key}_${effect.param}`;
                              const magnitude = effectMagnitudes[effectKey] ?? 1;
                              const diseaseMultiplier = getDiseaseSpecificMultiplier(intervention.key, effect.param);
                              
                              return (
                                <div key={effect.param} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                                          {effect.param}
                                        </span>
                                        <InfoTooltip content={effect.description} />
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                                        {effect.description}
                                      </p>
                                      {diseaseMultiplier !== null && (
                                        <div className="mt-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded inline-block">
                                          <strong>Disease-specific effect:</strong> {
                                            // For multiplicative effects (×), show the disease-specific multiplier
                                            effect.effect.startsWith('×') 
                                              ? `×${diseaseMultiplier.toFixed(2)}` 
                                              // For additive effects (+), show as percentage if < 1, otherwise as-is
                                              : diseaseMultiplier < 1 
                                                ? `+${(diseaseMultiplier * 100).toFixed(0)}%`
                                                : `${diseaseMultiplier.toFixed(2)}`
                                          }
                                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                                            (for {effectiveDisease.replace(/_/g, ' ')})
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 dark:text-gray-500">×</span>
                                        <input
                                          type="number"
                                          min="0"
                                          max="5"
                                          step="0.1"
                                          value={magnitude.toFixed(1)}
                                          onChange={(e) => setEffectMagnitudes({
                                            ...effectMagnitudes,
                                            [effectKey]: parseFloat(e.target.value) || 1
                                          })}
                                          className="w-14 px-2 py-1 text-sm font-medium text-center border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        />
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500 dark:text-gray-500">Base Result:</div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                          {getAdjustedEffect(effect.effect, magnitude)}
                                        </div>
                                        {diseaseMultiplier !== null && (
                                          <>
                                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Disease Result:</div>
                                            <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                                              {
                                                // For multiplicative effects, apply magnitude to disease-specific value
                                                effect.effect.startsWith('×') 
                                                  ? `×${(diseaseMultiplier * magnitude).toFixed(2)}`
                                                  // For additive effects, apply magnitude to disease-specific value
                                                  : diseaseMultiplier < 1
                                                    ? `+${(diseaseMultiplier * magnitude * 100).toFixed(0)}%`
                                                    : `${(diseaseMultiplier * magnitude).toFixed(2)}`
                                              }
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Key Benefits - More compact */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Key Benefits
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {intervention.keyBenefits.map((benefit, i) => (
                          <div key={i} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                            <span className="mr-2 text-indigo-500">•</span>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        
      </div>
    );
  };

  const renderUptakeTab = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">AI Uptake Configuration</h4>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Not everyone will use AI tools immediately. Set realistic uptake rates based on infrastructure, 
          digital literacy, and trust levels in your target population.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Individual Tool Uptake</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(aiUptakeParams).filter(([key]) => 
            !['globalUptake', 'urbanMultiplier', 'ruralMultiplier'].includes(key)
          ).map(([key, value]) => {
            const intervention = interventionInfo.find(i => i.key === key);
            if (!intervention) return null;
            
            return (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">{intervention.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{intervention.careLevel}</p>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Factors:</span> 
                      {key === 'selfCareAI' && ' Smartphone penetration, digital literacy, data costs'}
                      {key === 'triageAI' && ' Trust in AI, language support, cultural acceptance'}
                      {key === 'chwAI' && ' CHW training, device availability, network coverage'}
                      {key === 'diagnosticAI' && ' Equipment availability, staff training, electricity'}
                      {key === 'bedManagementAI' && ' Hospital IT infrastructure, change management'}
                      {key === 'hospitalDecisionAI' && ' Clinical buy-in, EHR integration, governance'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={(value * 100).toFixed(0)}
                      onChange={(e) => setAiUptakeParams({
                        ...aiUptakeParams,
                        [key]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100
                      })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-center"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Location Modifiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Urban Areas</h4>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptake Multiplier</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Higher in cities due to better connectivity and digital literacy
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={aiUptakeParams.urbanMultiplier.toFixed(1)}
                    onChange={(e) => setAiUptakeParams({
                      ...aiUptakeParams,
                      urbanMultiplier: Math.max(0.5, Math.min(2.0, parseFloat(e.target.value) || 1.0))
                    })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-center"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">×</span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Rural Areas</h4>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptake Multiplier</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Lower in rural areas due to connectivity and infrastructure challenges
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={aiUptakeParams.ruralMultiplier.toFixed(1)}
                    onChange={(e) => setAiUptakeParams({
                      ...aiUptakeParams,
                      ruralMultiplier: Math.max(0.1, Math.min(1.0, parseFloat(e.target.value) || 0.7))
                    })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-center"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">×</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCostsTab = () => (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">AI Implementation Costs</h4>
        <p className="text-sm text-green-700 dark:text-green-300">
          Configure fixed (one-time) and variable (per-patient) costs for each AI intervention. 
          Costs vary significantly based on local context, vendor, and implementation approach.
        </p>
      </div>

      {/* Total Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fixed Cost</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalFixedCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">One-time implementation</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Variable Cost per Patient</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${totalVariableCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Ongoing operational cost</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Interventions</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeInterventionCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">Out of 6 available</p>
        </div>
      </div>

      {/* Cost Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Configure Costs by Intervention</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {interventionInfo.map(intervention => {
            const isActive = aiInterventions[intervention.key];
            const costs = aiCostParams[intervention.key];
            
            return (
              <div 
                key={intervention.key} 
                className={`border rounded-lg p-4 ${
                  isActive 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">{intervention.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{intervention.careLevel}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fixed Cost (USD)
                      <InfoTooltip content="One-time costs: software licenses, training, equipment, integration" />
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={costs.fixed}
                      onChange={(e) => setAiCostParams({
                        ...aiCostParams,
                        [intervention.key]: {
                          ...costs,
                          fixed: parseInt(e.target.value) || 0
                        }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Variable (USD/pt)
                      <InfoTooltip content="Per-use costs: API calls, compute, bandwidth, consumables" />
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={costs.variable}
                      onChange={(e) => setAiCostParams({
                        ...aiCostParams,
                        [intervention.key]: {
                          ...costs,
                          variable: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Cost guidance */}
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Typical:</span>
                  {intervention.key === 'selfCareAI' && ' $5k-50k fixed, $0.10-1.00/pt'}
                  {intervention.key === 'triageAI' && ' $10k-100k fixed, $0.50-2.00/pt'}
                  {intervention.key === 'chwAI' && ' $20k-200k fixed, $0.20-1.00/pt'}
                  {intervention.key === 'diagnosticAI' && ' $50k-500k fixed, $1.00-5.00/pt'}
                  {intervention.key === 'bedManagementAI' && ' $30k-300k fixed, $0.50-2.00/pt'}
                  {intervention.key === 'hospitalDecisionAI' && ' $100k-1M fixed, $2.00-10.00/pt'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time to Scale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Implementation Timeline</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How quickly can each intervention be deployed? (0 = 3+ years, 1 = immediate)
        </p>
        <div className="space-y-4">
          {Object.entries(timeToScaleParams).map(([key, value]) => {
            const intervention = interventionInfo.find(i => i.key === key);
            if (!intervention) return null;
            
            const timeLabel = value >= 0.85 ? "1-3 months" :
                            value >= 0.75 ? "3-6 months" :
                            value >= 0.65 ? "6-9 months" :
                            value >= 0.55 ? "9-12 months" :
                            value >= 0.5 ? "1 year" :
                            value >= 0.25 ? "2 years" : "3+ years";
            
            return (
              <div key={key} className="py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {intervention.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {timeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-500">Slow</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={value}
                      onChange={(e) => setTimeToScaleParams({
                        ...timeToScaleParams,
                        [key]: parseFloat(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                                 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-indigo-600 
                                 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
                    />
                    <div 
                      className="absolute top-0 left-0 h-2 bg-indigo-600 rounded-l-lg pointer-events-none"
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">Fast</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );


  // Helper function to adjust effects based on magnitude
  const getAdjustedEffect = (baseEffect: string, magnitude: number): string => {
    if (magnitude === 0) return "None";
    
    if (baseEffect.startsWith('+')) {
      const value = parseFloat(baseEffect.substring(1));
      const adjustedValue = value * magnitude;
      // Display as percentage if the value is less than 1
      if (value < 1) {
        return `+${(adjustedValue * 100).toFixed(0)}%`;
      } else {
        return `+${adjustedValue.toFixed(2)}`;
      }
    } else if (baseEffect.startsWith('×')) {
      const value = parseFloat(baseEffect.substring(1));
      if (value < 1) {
        const adjusted = 1 - ((1 - value) * magnitude);
        return `×${adjusted.toFixed(2)}`;
      } else {
        const adjusted = 1 + ((value - 1) * magnitude);
        return `×${adjusted.toFixed(2)}`;
      }
    } else {
      // For raw numbers (queue effects)
      const value = parseFloat(baseEffect);
      const adjustedValue = value * magnitude;
      // Display as percentage if appropriate
      if (value <= 1) {
        return `${(adjustedValue * 100).toFixed(0)}%`;
      } else {
        return adjustedValue.toFixed(2);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Interventions</h3>
            <InfoTooltip 
              content="Configure AI tools for your healthcare system. Each tool improves specific outcomes based on evidence from real-world pilots. Start with the Overview tab to select interventions, then fine-tune in other tabs."
            />
          </div>
          <button
            onClick={() => runSimulation()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-sm font-semibold"
            disabled={!hasActiveInterventions}
          >
            Run Simulation
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: '🏠' },
            { id: 'details', label: 'Effect Details', icon: '🔧' },
            { id: 'uptake', label: 'Uptake Rates', icon: '📊' },
            { id: 'costs', label: 'Costs & Timeline', icon: '💰' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AIInterventionManager;