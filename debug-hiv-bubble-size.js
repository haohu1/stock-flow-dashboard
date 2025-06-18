#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the models
const stockAndFlowModel = require('./scripts/models/stockAndFlowModel.js');
const countrySpecificModel = require('./scripts/models/countrySpecificModel.js');

const {
  runSimulation,
  applyAIInterventions,
  diseaseProfiles,
  diseaseSpecificAIEffects,
  defaultAIBaseEffects,
  defaultAICostParameters,
  defaultAIUptakeParameters,
  getDefaultParameters,
  healthSystemStrengthDefaults
} = stockAndFlowModel;

const {
  adjustParametersForCountry
} = countrySpecificModel;

// Helper function to get derived parameters for a disease
function getDerivedParamsForDisease(
  baseParams,
  healthSystemStrength,
  disease,
  aiInterventions,
  effectMagnitudes = {},
  isUrban = true
) {
  let params = { ...baseParams };

  // Apply health system scenario
  const healthSystemScenario = healthSystemStrengthDefaults[healthSystemStrength];
  if (healthSystemScenario) {
    const { 
      mu_multiplier_I, mu_multiplier_L0, mu_multiplier_L1, mu_multiplier_L2, mu_multiplier_L3,
      delta_multiplier_U, delta_multiplier_I, delta_multiplier_L0, delta_multiplier_L1, delta_multiplier_L2, delta_multiplier_L3,
      rho_multiplier_L0, rho_multiplier_L1, rho_multiplier_L2,
      ...directScenarioParams 
    } = healthSystemScenario;
    params = { ...params, ...directScenarioParams };
  }

  // Apply disease profile
  const diseaseProfile = diseaseProfiles[disease];
  if (diseaseProfile) {
    params = { ...params, ...diseaseProfile };
  }

  // Apply health system multipliers
  if (healthSystemScenario) {
    params.muI *= healthSystemScenario.mu_multiplier_I;
    params.mu0 *= healthSystemScenario.mu_multiplier_L0;
    params.mu1 *= healthSystemScenario.mu_multiplier_L1;
    params.mu2 *= healthSystemScenario.mu_multiplier_L2;
    params.mu3 *= healthSystemScenario.mu_multiplier_L3;

    params.deltaU *= healthSystemScenario.delta_multiplier_U;
    params.deltaI *= healthSystemScenario.delta_multiplier_I;
    params.delta0 *= healthSystemScenario.delta_multiplier_L0;
    params.delta1 *= healthSystemScenario.delta_multiplier_L1;
    params.delta2 *= healthSystemScenario.delta_multiplier_L2;
    params.delta3 *= healthSystemScenario.delta_multiplier_L3;
    
    params.rho0 *= healthSystemScenario.rho_multiplier_L0;
    params.rho1 *= healthSystemScenario.rho_multiplier_L1;
    params.rho2 *= healthSystemScenario.rho_multiplier_L2;
  }

  // Apply AI interventions
  const finalParams = applyAIInterventions(
    params, 
    aiInterventions, 
    effectMagnitudes, 
    defaultAICostParameters, 
    defaultAIBaseEffects, 
    disease, 
    defaultAIUptakeParameters, 
    isUrban
  );

  return finalParams;
}

// Test configuration
const disease = 'hiv_management_chronic';
const healthSystemStrength = 'moderate_urban_system';
const population = 1000000;
const weeks = 52;
const isUrban = true;

console.log('=== DEBUGGING HIV BUBBLE SIZE CALCULATION ===\n');

// Test scenarios
const scenarios = [
  {
    name: 'Baseline (No AI)',
    aiInterventions: {
      triageAI: false,
      chwAI: false,
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: false
    },
    effectMagnitudes: {}
  },
  {
    name: 'Diagnostic AI (L1/L2)',
    aiInterventions: {
      triageAI: false,
      chwAI: false,
      diagnosticAI: true,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: false
    },
    effectMagnitudes: {
      'diagnosticAI_μ₁': 1.15,  // 15% improvement
      'diagnosticAI_δ₁': 1.15,
      'diagnosticAI_ρ₁': 1.15,
      'diagnosticAI_μ₂': 1.15,
      'diagnosticAI_δ₂': 1.15,
      'diagnosticAI_ρ₂': 1.15
    }
  },
  {
    name: 'AI Health Advisor',
    aiInterventions: {
      triageAI: false,
      chwAI: false,
      diagnosticAI: false,
      bedManagementAI: false,
      hospitalDecisionAI: false,
      selfCareAI: true
    },
    effectMagnitudes: {
      'selfCareAI_μI': 2.80,  // 180% improvement
      'selfCareAI_δI': 2.80,
      'selfCareAI_φ₀': 2.80,
      'selfCareAI_σI': 2.80,
      'selfCareAI_visitReduction': 2.80,
      'selfCareAI_smartRouting': 2.80,
      'selfCareAI_queuePrevention': 2.80,
      'selfCareAI_directRoutingImprovement': 2.80
    }
  }
];

let baselineResults = null;

for (const scenario of scenarios) {
  console.log(`\n--- ${scenario.name} ---`);
  
  // Get base parameters
  const baseParams = getDefaultParameters();
  
  // Get derived parameters with AI effects
  const params = getDerivedParamsForDisease(
    baseParams,
    healthSystemStrength,
    disease,
    scenario.aiInterventions,
    scenario.effectMagnitudes,
    isUrban
  );
  
  console.log('Key parameters:');
  console.log(`  muI: ${params.muI.toFixed(4)} (informal care resolution)`);
  console.log(`  deltaI: ${params.deltaI.toFixed(6)} (informal care mortality)`);
  console.log(`  phi0: ${params.phi0.toFixed(4)} (formal care seeking)`);
  console.log(`  sigmaI: ${params.sigmaI.toFixed(4)} (informal to formal transition)`);
  
  if (scenario.aiInterventions.selfCareAI) {
    console.log('SelfCare AI specific effects applied:');
    console.log(`  Disease: ${disease}`);
    console.log(`  Has disease-specific effects: ${!!diseaseSpecificAIEffects[disease]}`);
    console.log(`  Has selfCareAI effects: ${!!(diseaseSpecificAIEffects[disease] && diseaseSpecificAIEffects[disease].selfCareAI)}`);
    
    const selfCareEffects = diseaseSpecificAIEffects[disease]?.selfCareAI || defaultAIBaseEffects.selfCareAI;
    console.log(`  muIEffect base: ${selfCareEffects.muIEffect} (should be 1.80 for 180%)`);
    console.log(`  deltaIEffect base: ${selfCareEffects.deltaIEffect} (should be 0.30 for 70% reduction)`);
    console.log(`  Magnitude for selfCareAI_μI: ${scenario.effectMagnitudes['selfCareAI_μI'] || 1}`);
    console.log(`  Magnitude for selfCareAI_δI: ${scenario.effectMagnitudes['selfCareAI_δI'] || 1}`);
    
    // Show the actual calculation
    const magnitude_muI = scenario.effectMagnitudes['selfCareAI_μI'] || 1;
    const uptake = 0.33 * 1 * 1.2; // 33% base * 100% global * 120% urban
    const final_muI_effect = selfCareEffects.muIEffect * magnitude_muI * uptake;
    console.log(`  Final muI effect: ${selfCareEffects.muIEffect} * ${magnitude_muI} * ${uptake} = ${final_muI_effect}`);
    
    // Check baseline muI value from disease profile
    const diseaseProfile = diseaseProfiles[disease];
    const baselineMuI = diseaseProfile ? diseaseProfile.muI : 0;
    console.log(`  Baseline muI from disease profile: ${baselineMuI}`);
    console.log(`  Expected muI value: ${baselineMuI} + ${final_muI_effect} = ${baselineMuI + final_muI_effect}`);
  }
  
  if (scenario.aiInterventions.diagnosticAI) {
    console.log('Diagnostic AI specific effects applied:');
    const diagnosticEffects = diseaseSpecificAIEffects[disease]?.diagnosticAI || defaultAIBaseEffects.diagnosticAI;
    console.log(`  mu1Effect base: ${diagnosticEffects.mu1Effect} (should be 0.15 for 15%)`);
    console.log(`  Magnitude for diagnosticAI_μ₁: ${scenario.effectMagnitudes['diagnosticAI_μ₁'] || 1}`);
  }
  
  // Run simulation
  const results = runSimulation(params, {
    numWeeks: weeks,
    population: population
  });
  
  console.log(`Results:`);
  console.log(`  Deaths: ${results.cumulativeDeaths.toLocaleString()}`);
  console.log(`  DALYs: ${results.dalys.toLocaleString()}`);
  console.log(`  Total Cost: $${results.totalCost.toLocaleString()}`);
  
  if (scenario.name.includes('Baseline')) {
    baselineResults = results;
    console.log(`  --> This is the baseline`);
  } else if (baselineResults) {
    const deathsAverted = baselineResults.cumulativeDeaths - results.cumulativeDeaths;
    const dalysAverted = baselineResults.dalys - results.dalys;
    
    console.log(`  Deaths Averted: ${deathsAverted.toLocaleString()}`);
    console.log(`  DALYs Averted: ${dalysAverted.toLocaleString()}`);
    console.log(`  --> BUBBLE SIZE (deaths): ${Math.max(0, deathsAverted)}`);
    console.log(`  --> BUBBLE SIZE (dalys): ${Math.max(0, dalysAverted)}`);
    
    // Calculate cost-effectiveness
    const costDiff = results.totalCost - baselineResults.totalCost;
    const icer = deathsAverted > 0 ? costDiff / dalysAverted : Infinity;
    console.log(`  Cost difference: $${costDiff.toLocaleString()}`);
    console.log(`  ICER: $${icer.toFixed(2)} per DALY averted`);
  }
}

console.log('\n=== ANALYSIS ===');
console.log('If Self-Care AI has 180% improvement but shows smaller bubble than Diagnostic AI (15%),');
console.log('possible issues:');
console.log('1. Effect magnitudes not being applied correctly');
console.log('2. Disease-specific effects overriding the magnitude multipliers');
console.log('3. Baseline calculation using wrong baseline');
console.log('4. Parameter capping limiting the effects');
console.log('5. Uptake parameters reducing effectiveness');

console.log('\nCheck the above output to see:');
console.log('- Are the effect magnitudes (2.80 for 180%) being applied?');
console.log('- Are the final muI and deltaI values reflecting the improvements?');
console.log('- Are both scenarios using the same baseline for comparison?');