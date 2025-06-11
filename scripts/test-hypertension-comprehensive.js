// Comprehensive test of hypertension AI impact

const { runSimulation, getDefaultParameters, diseaseProfiles, applyAIInterventions } = require('./models/stockAndFlowModel.js');

console.log('=== COMPREHENSIVE HYPERTENSION AI IMPACT ANALYSIS ===\n');

// Get base hypertension parameters
const baseHypertensionParams = diseaseProfiles.hypertension;

// Test scenario with moderate informal care usage
const testScenario = {
  name: 'Moderate LMIC (40% formal care)',
  phi0: 0.40,
  informalCareRatio: 0.40,  // 40% of non-formal stay untreated
  population: 10000000      // 10 million population for clearer impact
};

// Calculate flows
const toFormal = testScenario.phi0;
const toInformal = (1 - testScenario.phi0) * (1 - testScenario.informalCareRatio);
const stayUntreated = (1 - testScenario.phi0) * testScenario.informalCareRatio;

console.log('Population flows:');
console.log(`  Direct to formal care: ${(toFormal * 100).toFixed(0)}%`);
console.log(`  To informal care: ${(toInformal * 100).toFixed(0)}%`);
console.log(`  Stay untreated: ${(stayUntreated * 100).toFixed(0)}%`);

// Simulation configuration
const config = {
  numWeeks: 104, // 2 years for more stable results
  population: testScenario.population
};

// Create base parameters
const baseParams = {
  ...getDefaultParameters(),
  ...baseHypertensionParams,
  phi0: testScenario.phi0,
  informalCareRatio: testScenario.informalCareRatio,
  perDiemCosts: {
    I: 5, F: 10, L0: 8, L1: 20, L2: 60, L3: 150
  },
  regionalLifeExpectancy: 70
};

// Test different AI interventions
const aiScenarios = [
  { name: 'No AI', interventions: {} },
  { name: 'Self-care AI only', interventions: { selfCareAI: true } },
  { name: 'Triage AI only', interventions: { triageAI: true } },
  { name: 'CHW AI only', interventions: { chwAI: true } },
  { name: 'Diagnostic AI only', interventions: { diagnosticAI: true } },
  { name: 'All AI', interventions: { 
    selfCareAI: true, 
    triageAI: true, 
    chwAI: true, 
    diagnosticAI: true,
    bedManagementAI: true,
    hospitalDecisionAI: true 
  }}
];

console.log('\n=== RESULTS BY AI INTERVENTION ===\n');

const results = [];
let baselineDeaths = 0;

aiScenarios.forEach(scenario => {
  // Apply AI interventions
  const params = scenario.interventions.selfCareAI || Object.keys(scenario.interventions).length > 0
    ? applyAIInterventions(
        baseParams,
        scenario.interventions,
        {},                   // Default effect magnitudes
        undefined,            // Default cost parameters
        undefined,            // Default base effects
        'hypertension',       // Disease type
        undefined,            // Default uptake parameters
        true                  // Urban setting
      )
    : baseParams;
  
  // Run simulation
  const simResults = runSimulation(params, config);
  const deaths = simResults.cumulativeDeaths;
  const resolved = simResults.cumulativeResolved;
  const dalys = simResults.totalDALYs;
  
  if (scenario.name === 'No AI') {
    baselineDeaths = deaths;
  }
  
  const deathsPrevented = baselineDeaths - deaths;
  const deathReduction = baselineDeaths > 0 ? (deathsPrevented / baselineDeaths * 100) : 0;
  
  results.push({
    scenario: scenario.name,
    deaths: Math.round(deaths),
    deathsPrevented: Math.round(deathsPrevented),
    deathReduction: deathReduction.toFixed(1),
    resolved: Math.round(resolved),
    dalys: Math.round(dalys),
    muI: params.muI,
    visitReduction: params.visitReduction || 0
  });
});

// Display results table
console.log('Scenario          | Deaths | Prevented | Reduction | Resolved | DALYs  | muI    | Visits');
console.log('------------------|--------|-----------|-----------|----------|--------|--------|-------');
results.forEach(r => {
  console.log(
    `${r.scenario.padEnd(17)} | ${r.deaths.toString().padStart(6)} | ${
      r.deathsPrevented.toString().padStart(9)} | ${
      r.deathReduction.padStart(8)}% | ${
      r.resolved.toString().padStart(8)} | ${
      r.dalys.toString().padStart(6)} | ${
      (r.muI * 100).toFixed(2).padStart(5)}% | ${
      (r.visitReduction * 100).toFixed(0).padStart(5)}%`
  );
});

// Calculate annual incidence and deaths
const annualIncidence = testScenario.population * baseHypertensionParams.lambda;
const baselineAnnualDeaths = baselineDeaths / 2; // 2-year simulation

console.log('\n=== KEY METRICS ===');
console.log(`Population: ${testScenario.population.toLocaleString()}`);
console.log(`Annual hypertension incidence: ${Math.round(annualIncidence).toLocaleString()} (${(baseHypertensionParams.lambda * 100).toFixed(0)}%)`);
console.log(`Baseline annual deaths: ${Math.round(baselineAnnualDeaths).toLocaleString()}`);
console.log(`Death rate: ${(baselineAnnualDeaths / annualIncidence * 100).toFixed(1)}% of incident cases`);

// Compare self-care AI impact
const selfCareResult = results.find(r => r.scenario === 'Self-care AI only');
const selfCareAnnualLivesSaved = selfCareResult.deathsPrevented / 2;

console.log('\n=== SELF-CARE AI IMPACT ===');
console.log(`Annual lives saved: ${Math.round(selfCareAnnualLivesSaved).toLocaleString()}`);
console.log(`Mortality reduction: ${selfCareResult.deathReduction}%`);
console.log(`Informal care control rate: ${(baseParams.muI * 100).toFixed(2)}% → ${(selfCareResult.muI * 100).toFixed(2)}% per week`);
console.log(`Visit reduction: ${(selfCareResult.visitReduction * 100).toFixed(0)}%`);
console.log(`\nFor every 1,000 people with hypertension in informal care:`);
console.log(`  - ${Math.round(selfCareAnnualLivesSaved / (annualIncidence * toInformal) * 1000)} lives saved per year`);
console.log(`  - ${Math.round(selfCareResult.visitReduction * 1000)} clinic visits prevented`);