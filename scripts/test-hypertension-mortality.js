const { runSimulation } = require('./models/stockAndFlowModel.js');

console.log('\n=== HYPERTENSION SELF-CARE AI MORTALITY IMPACT ===\n');

// Base configuration
const baseConfig = {
  population: 10000000,
  timeSteps: 52, // 1 year
  disease: 'hypertension',
  healthSystemStrength: 'moderate_urban_system',
  country: 'nigeria',
  isUrban: true,
  aiInterventions: {
    triageAI: false,
    chwAI: false,
    diagnosticAI: false,
    bedManagementAI: false,
    hospitalDecisionAI: false,
    selfCareAI: false
  },
  aiUptake: {
    globalUptake: 1.0,
    triageAI: 0.2,
    chwAI: 0.2,
    diagnosticAI: 0.2,
    bedManagementAI: 0.2,
    hospitalDecisionAI: 0.2,
    selfCareAI: 0.2,
    urbanMultiplier: 1.0,
    ruralMultiplier: 1.0
  }
};

// Run baseline scenario
console.log('Running baseline scenario (no AI)...');
const baselineResults = runSimulation(baseConfig);
const baselineDeaths = baselineResults.deaths[51]; // Week 52

// Run self-care AI scenario
console.log('Running self-care AI scenario...');
const aiConfig = {
  ...baseConfig,
  aiInterventions: {
    ...baseConfig.aiInterventions,
    selfCareAI: true
  }
};
const aiResults = runSimulation(aiConfig);
const aiDeaths = aiResults.deaths[51]; // Week 52

// Calculate impact
const deathsAverted = baselineDeaths - aiDeaths;
const percentReduction = (deathsAverted / baselineDeaths * 100).toFixed(1);

console.log('\n=== RESULTS ===');
console.log(`Population: ${baseConfig.population.toLocaleString()}`);
console.log(`Hypertension incidence: 3% annually (300,000 new cases)`);
console.log(`\nBaseline deaths (1 year): ${Math.round(baselineDeaths).toLocaleString()}`);
console.log(`Deaths with self-care AI: ${Math.round(aiDeaths).toLocaleString()}`);
console.log(`Lives saved: ${Math.round(deathsAverted).toLocaleString()}`);
console.log(`Mortality reduction: ${percentReduction}%`);

// Check informal care population
const baselineInformal = baselineResults.I[51];
const aiInformal = aiResults.I[51];
console.log(`\nInformal care population:`);
console.log(`  Baseline: ${Math.round(baselineInformal).toLocaleString()}`);
console.log(`  With AI: ${Math.round(aiInformal).toLocaleString()}`);
console.log(`  Reduction: ${Math.round(baselineInformal - aiInformal).toLocaleString()}`);

// Check resolved population
const baselineResolved = baselineResults.R[51];
const aiResolved = aiResults.R[51];
console.log(`\nResolved (controlled BP) population:`);
console.log(`  Baseline: ${Math.round(baselineResolved).toLocaleString()}`);
console.log(`  With AI: ${Math.round(aiResolved).toLocaleString()}`);
console.log(`  Increase: ${Math.round(aiResolved - baselineResolved).toLocaleString()}`);

// Per 1000 hypertension patients
const htPatients = baselineResults.I[51] + baselineResults.U[51] + 
                  baselineResults.F[51] + baselineResults.L0[51] + 
                  baselineResults.L1[51] + baselineResults.L2[51] + 
                  baselineResults.L3[51];
const deathsPer1000 = (deathsAverted / htPatients * 1000).toFixed(1);
console.log(`\nFor every 1,000 hypertension patients: ${deathsPer1000} lives saved per year`);