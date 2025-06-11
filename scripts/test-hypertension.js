// Test script for hypertension disease parameters
const { runSimulation, getDefaultParameters, applyAIInterventions, diseaseProfiles, diseaseSpecificAIEffects } = require('./models/stockAndFlowModel');

// Get hypertension disease profile
const hypertensionProfile = diseaseProfiles.hypertension;
console.log('Hypertension Disease Profile:');
console.log(JSON.stringify(hypertensionProfile, null, 2));

// Get base parameters and apply hypertension profile
const baseParams = getDefaultParameters();
const hypertensionParams = {
  ...baseParams,
  ...hypertensionProfile,
  perDiemCosts: baseParams.perDiemCosts // Keep the costs structure
};

// Run baseline simulation
console.log('\n=== BASELINE SIMULATION (No AI) ===');
const baselineResults = runSimulation(hypertensionParams, {
  numWeeks: 52,
  population: 1000000
});

console.log(`Total deaths: ${baselineResults.cumulativeDeaths.toFixed(0)}`);
console.log(`Total resolved: ${baselineResults.cumulativeResolved.toFixed(0)}`);
console.log(`Total DALYs: ${baselineResults.dalys.toFixed(0)}`);
console.log(`Total cost: $${baselineResults.totalCost.toFixed(0)}`);
console.log(`Average time to resolution: ${baselineResults.averageTimeToResolution.toFixed(1)} weeks`);

// Test Self-Care AI intervention
console.log('\n=== SELF-CARE AI SIMULATION ===');
const selfCareAIParams = applyAIInterventions(
  hypertensionParams,
  { selfCareAI: true },
  {},
  undefined,
  undefined,
  'hypertension'
);

const selfCareResults = runSimulation(selfCareAIParams, {
  numWeeks: 52,
  population: 1000000
});

console.log(`Total deaths: ${selfCareResults.cumulativeDeaths.toFixed(0)}`);
console.log(`Total resolved: ${selfCareResults.cumulativeResolved.toFixed(0)}`);
console.log(`Total DALYs: ${selfCareResults.dalys.toFixed(0)}`);
console.log(`Total cost: $${selfCareResults.totalCost.toFixed(0)}`);
console.log(`Average time to resolution: ${selfCareResults.averageTimeToResolution.toFixed(1)} weeks`);

// Calculate impact
const deathReduction = ((baselineResults.cumulativeDeaths - selfCareResults.cumulativeDeaths) / baselineResults.cumulativeDeaths * 100).toFixed(1);
const dalyReduction = ((baselineResults.dalys - selfCareResults.dalys) / baselineResults.dalys * 100).toFixed(1);
const costReduction = ((baselineResults.totalCost - selfCareResults.totalCost) / baselineResults.totalCost * 100).toFixed(1);

console.log('\n=== SELF-CARE AI IMPACT ===');
console.log(`Deaths reduced by: ${deathReduction}%`);
console.log(`DALYs reduced by: ${dalyReduction}%`);
console.log(`Costs reduced by: ${costReduction}%`);
console.log(`Lives saved: ${(baselineResults.cumulativeDeaths - selfCareResults.cumulativeDeaths).toFixed(0)}`);

// Test all AI interventions
console.log('\n=== ALL AI INTERVENTIONS SIMULATION ===');
const allAIParams = applyAIInterventions(
  hypertensionParams,
  {
    triageAI: true,
    chwAI: true,
    diagnosticAI: true,
    bedManagementAI: true,
    hospitalDecisionAI: true,
    selfCareAI: true
  },
  {},
  undefined,
  undefined,
  'hypertension'
);

const allAIResults = runSimulation(allAIParams, {
  numWeeks: 52,
  population: 1000000
});

console.log(`Total deaths: ${allAIResults.cumulativeDeaths.toFixed(0)}`);
console.log(`Total resolved: ${allAIResults.cumulativeResolved.toFixed(0)}`);
console.log(`Total DALYs: ${allAIResults.dalys.toFixed(0)}`);
console.log(`Total cost: $${allAIResults.totalCost.toFixed(0)}`);

const allAIDeathReduction = ((baselineResults.cumulativeDeaths - allAIResults.cumulativeDeaths) / baselineResults.cumulativeDeaths * 100).toFixed(1);
console.log(`\nAll AI interventions reduce deaths by: ${allAIDeathReduction}%`);

// Check disease-specific AI effects
console.log('\n=== HYPERTENSION AI EFFECTS ===');
const hypertensionAI = diseaseSpecificAIEffects.hypertension;
if (hypertensionAI) {
  console.log('Self-Care AI effects:');
  console.log(`- Resolution improvement: ${(hypertensionAI.selfCareAI.muIEffect * 100).toFixed(0)}%`);
  console.log(`- Mortality reduction: ${((1 - hypertensionAI.selfCareAI.deltaIEffect) * 100).toFixed(0)}%`);
  console.log(`- Care seeking increase: ${(hypertensionAI.selfCareAI.phi0Effect * 100).toFixed(0)}%`);
  console.log(`- Visit reduction: ${(hypertensionAI.selfCareAI.visitReductionEffect * 100).toFixed(0)}%`);
  
  console.log('\nCHW AI effects:');
  console.log(`- Resolution improvement: ${(hypertensionAI.chwAI.mu0Effect * 100).toFixed(0)}%`);
  console.log(`- Mortality reduction: ${((1 - hypertensionAI.chwAI.delta0Effect) * 100).toFixed(0)}%`);
  console.log(`- Referral reduction: ${((1 - hypertensionAI.chwAI.rho0Effect) * 100).toFixed(0)}%`);
} else {
  console.log('No disease-specific AI effects found for hypertension');
}