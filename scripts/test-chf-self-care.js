const { runSimulation } = require('./models/stockAndFlowModel.js');
const { adjustParametersForCountry } = require('./models/countrySpecificModel.js');

// Base CHF parameters from health_system_disease_parameters.csv
const chfBaseParams = {
  lambda: 0.012,
  phi0: 0.65,  // From moderate urban system
  sigmaI: 0.25, // Transition from informal to formal
  muU: 0.0,
  muI: 0.01,
  mu0: 0.03,
  mu1: 0.35,
  mu2: 0.55,
  mu3: 0.75,
  deltaU: 0.09,
  deltaI: 0.06,
  delta0: 0.06,
  delta1: 0.035,
  delta2: 0.015,
  delta3: 0.008,
  rho0: 0.70,
  rho1: 0.55,
  rho2: 0.35,
  psiI: 0,
  alpha0: 0,
  alpha1: 0,
  alpha2: 0,
  alpha3: 0,
  diseaseName: 'congestive_heart_failure'
};

// Test CHF with self-care AI
const testCountry = 'nigeria';
const testUrban = true;

console.log('\n=== Testing CHF Self-Care Scenario ===\n');

// Adjust for Nigeria urban
const adjustedParams = adjustParametersForCountry(chfBaseParams, testCountry, testUrban, 'congestive_heart_failure');

console.log('Country-adjusted parameters for CHF in', testCountry, testUrban ? 'urban' : 'rural');
console.log('Base phi0:', chfBaseParams.phi0);
console.log('Adjusted phi0:', adjustedParams.phi0);

// Simulation config
const simulationConfig = {
  population: 10000,
  simulationWeeks: 208,  // 4 years
  initialState: null
};

// Run baseline scenario
const baselineResults = runSimulation(adjustedParams, simulationConfig);

// Run self-care AI scenario with proper base values
const selfCareParams = {
  ...adjustedParams,
  selfCareAIEnabled: true,
  selfCareAIEffectMuI: adjustedParams.selfCareAIEffectMuI || 1.3,
  selfCareAIEffectDeltaI: adjustedParams.selfCareAIEffectDeltaI || 0.8,
  visitReduction: adjustedParams.visitReduction || 0.20
};

console.log('\nSelf-care parameters being used:');
console.log('selfCareAIEffectMuI:', selfCareParams.selfCareAIEffectMuI);
console.log('selfCareAIEffectDeltaI:', selfCareParams.selfCareAIEffectDeltaI);
console.log('visitReduction:', selfCareParams.visitReduction);

const selfCareResults = runSimulation(selfCareParams, simulationConfig);

// Compare results
const baselineFinal = baselineResults[baselineResults.length - 1];
const selfCareFinal = selfCareResults[selfCareResults.length - 1];

console.log('\n=== Results Comparison ===');
console.log('Baseline mortality rate:', baselineFinal.mortalityRate.toFixed(4));
console.log('Self-care AI mortality rate:', selfCareFinal.mortalityRate.toFixed(4));
console.log('Mortality reduction:', ((1 - selfCareFinal.mortalityRate / baselineFinal.mortalityRate) * 100).toFixed(1) + '%');

console.log('\nBaseline DALYs per 1000:', baselineFinal.dalysPerThousand.toFixed(2));
console.log('Self-care AI DALYs per 1000:', selfCareFinal.dalysPerThousand.toFixed(2));
console.log('DALY reduction:', ((1 - selfCareFinal.dalysPerThousand / baselineFinal.dalysPerThousand) * 100).toFixed(1) + '%');

console.log('\nBaseline cost per capita:', baselineFinal.totalCostPerCapita.toFixed(2));
console.log('Self-care AI cost per capita:', selfCareFinal.totalCostPerCapita.toFixed(2));
console.log('Cost reduction:', ((1 - selfCareFinal.totalCostPerCapita / baselineFinal.totalCostPerCapita) * 100).toFixed(1) + '%');

console.log('\n=== Breakdown by Compartment ===');
console.log('Baseline - Informal care:', (baselineFinal.I * 100).toFixed(1) + '%');
console.log('Self-care - Informal care:', (selfCareFinal.I * 100).toFixed(1) + '%');