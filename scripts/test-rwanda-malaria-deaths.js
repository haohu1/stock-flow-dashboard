// Test script to compare Rwanda malaria deaths with and without AI self-care

const { runSimulation, getDefaultParameters } = require('./models/stockAndFlowModel.js');
const { adjustParametersForCountry } = require('./models/countrySpecificModel.js');

console.log('=== Rwanda Malaria Death Reduction Analysis ===\n');

// Base malaria parameters - manually define from the malaria disease profile
const baseParams = {
  ...getDefaultParameters(),
  // Malaria-specific parameters from diseaseParametersCatalog.malaria
  lambda: 0.20,             // 20% annual incidence in endemic regions
  disabilityWeight: 0.186,  // From IHME GBD, weighted average
  meanAgeOfInfection: 7,    // Lower mean age, reflecting higher burden in children
  muI: 0.15,                // Spontaneous resolution with traditional/home remedies (~15% weekly)
  muU: 0.08,                // Limited spontaneous resolution if completely untreated (8% weekly)
  mu0: 0.75,                // CHW with RDTs and ACTs for uncomplicated cases (75% weekly resolution)
  mu1: 0.80,                // Primary care with ACTs and better monitoring (80% weekly resolution)
  mu2: 0.90,                // District hospital with IV artesunate for severe malaria (90% weekly resolution)
  mu3: 0.95,                // Tertiary care with ICU support for complicated malaria (95% weekly resolution)
  deltaI: 0.075,            // Mortality with informal care (7.5% weekly)
  deltaU: 0.075,            // Mortality if completely untreated (7.5% weekly)
  delta0: 0.001,            // Mortality under CHW care (0.1% weekly)
  delta1: 0.001,            // Mortality under primary care (0.1% weekly)
  delta2: 0.01,             // Mortality with proper severe malaria treatment (1% weekly)
  delta3: 0.005,            // Low mortality at tertiary with full ICU support (0.5% weekly)
  rho0: 0.25,               // CHW referral to primary (danger signs/severe cases)
  rho1: 0.20,               // Primary care referral to district (severe malaria)
  rho2: 0.10,               // District to tertiary referral (very complicated cases)
  capacityShare: 0.10,      // Malaria uses ~10% of health system capacity
  competitionSensitivity: 1.2, // Malaria patients moderately affected by congestion
  clinicalPriority: 0.8,    // High priority (rapid progression possible)
  queueAbandonmentRate: 0.06, // 6% - Patients know it's serious but may seek traditional care
  queueBypassRate: 0.15,    // 15% - Traditional antimalarials sometimes used
  queueClearanceRate: 0.40, // 40% - RDT + ACT protocol is fast
  // AI effectiveness parameters
  selfCareAIEffectMuI: 0.25,      // 25% improvement in resolution from self-care AI  
  selfCareAIEffectDeltaI: 0.75,   // 25% reduction in death rate from self-care AI (multiply by 0.75)
  selfCareAIActive: false,        // will be set per scenario
};

// Manually apply Rwanda-specific adjustments based on the country profile
// Rwanda: High utilization LMIC with 92% formal care seeking
const rwandaParamsNoAI = {
  ...baseParams,
  phi0: 0.92,               // 92% seek formal care (from existing test scripts)
  informalCareRatio: 0.98,  // 98% stay untreated (CORRECTED from test scripts)
  selfCareAIActive: false,
  // Rwanda-specific costs (lower income country)
  perDiemCosts: {
    I: 5,     // Low-cost informal providers
    F: 10,    // Basic facility entry costs
    L0: 8,    // CHWs with minimal supplies
    L1: 20,   // Primary facilities
    L2: 60,   // District hospitals
    L3: 150   // Tertiary care
  },
  regionalLifeExpectancy: 69, // Rwanda life expectancy
  // AI parameters for visit reduction (from test scripts)
  visitReduction: 0.0, // No visit reduction in baseline
};

// Get Rwanda parameters WITH AI self-care
const rwandaParamsWithAI = {
  ...rwandaParamsNoAI,
  selfCareAIActive: true,
  // Calculate visit reduction based on informal care usage
  visitReduction: 0.20 * ((1 - rwandaParamsNoAI.phi0) * (1 - rwandaParamsNoAI.informalCareRatio)), // 20% base effect scaled by informal care usage
};

// Also create a test scenario with higher informal care to see if AI works
const testParamsNoAI = {
  ...baseParams,
  phi0: 0.50,               // 50% seek formal care (more realistic for testing AI effects)
  informalCareRatio: 0.30,  // 30% stay untreated (more go to informal care)
  selfCareAIActive: false,
  perDiemCosts: {
    I: 5, F: 10, L0: 8, L1: 20, L2: 60, L3: 150
  },
  regionalLifeExpectancy: 69,
  visitReduction: 0.0,
};

const testParamsWithAI = {
  ...testParamsNoAI,
  selfCareAIActive: true,
  visitReduction: 0.20 * ((1 - testParamsNoAI.phi0) * (1 - testParamsNoAI.informalCareRatio)), // 20% base effect scaled
};

// Simulation configuration - 1 million population, 2 years
const config = {
  numWeeks: 104, // 2 years = 104 weeks
  population: 1000000 // 1 million people
};

console.log('Running simulations...\n');

// Test both Rwanda (realistic) and Test scenario (higher informal care)
console.log('=== TESTING RWANDA SCENARIO ===');
console.log('Rwanda parameters:');
console.log('  phi0 (formal care):', rwandaParamsNoAI.phi0);
console.log('  To informal care:', ((1 - rwandaParamsNoAI.phi0) * (1 - rwandaParamsNoAI.informalCareRatio) * 100).toFixed(2) + '%');
console.log('  Visit reduction with AI:', rwandaParamsWithAI.visitReduction);

// Run Rwanda simulation
const rwandaResultsNoAI = runSimulation(rwandaParamsNoAI, config);
const rwandaResultsWithAI = runSimulation(rwandaParamsWithAI, config);

console.log('\n=== TESTING HIGH INFORMAL CARE SCENARIO ===');
console.log('Test parameters:');
console.log('  phi0 (formal care):', testParamsNoAI.phi0);
console.log('  To informal care:', ((1 - testParamsNoAI.phi0) * (1 - testParamsNoAI.informalCareRatio) * 100).toFixed(2) + '%');
console.log('  Visit reduction with AI:', testParamsWithAI.visitReduction);

// Run test simulation
const testResultsNoAI = runSimulation(testParamsNoAI, config);
const testResultsWithAI = runSimulation(testParamsWithAI, config);

// Calculate death reduction
const deathReduction = resultsNoAI.cumulativeDeaths - resultsWithAI.cumulativeDeaths;
const deathReductionPct = (deathReduction / resultsNoAI.cumulativeDeaths) * 100;

// Display results
console.log('\n=== DEATH COMPARISON RESULTS ===');
console.log(`Population: ${config.population.toLocaleString()}`);
console.log(`Simulation period: ${config.numWeeks} weeks (2 years)`);
console.log('');
console.log('WITHOUT AI Self-Care:');
console.log(`  Total Deaths: ${resultsNoAI.cumulativeDeaths.toLocaleString()}`);
console.log(`  Total Resolved: ${resultsNoAI.cumulativeResolved.toLocaleString()}`);
console.log('');
console.log('WITH AI Self-Care:');
console.log(`  Total Deaths: ${resultsWithAI.cumulativeDeaths.toLocaleString()}`);
console.log(`  Total Resolved: ${resultsWithAI.cumulativeResolved.toLocaleString()}`);
console.log('');
console.log('IMPACT OF AI SELF-CARE:');
console.log(`  Deaths Prevented: ${deathReduction.toLocaleString()}`);
console.log(`  Death Reduction: ${deathReductionPct.toFixed(2)}%`);

// Additional insights
console.log('\n=== PARAMETER INSIGHTS ===');
console.log('Rwanda-specific parameters:');
console.log(`  phi0 (formal care seeking): ${rwandaParamsNoAI.phi0}`);
console.log(`  informalCareRatio: ${rwandaParamsNoAI.informalCareRatio}`);

// Calculate patient flow percentages
const stayUntreated = 1 - rwandaParamsNoAI.phi0;
const toInformalCare = (1 - rwandaParamsNoAI.informalCareRatio) * stayUntreated;
const trulyUntreated = rwandaParamsNoAI.informalCareRatio * stayUntreated;

console.log('\nPatient flows:');
console.log(`  Direct to formal care: ${(rwandaParamsNoAI.phi0 * 100).toFixed(1)}%`);
console.log(`  To informal care: ${(toInformalCare * 100).toFixed(1)}%`);
console.log(`  Stay untreated: ${(trulyUntreated * 100).toFixed(1)}%`);

console.log('\nAI Self-Care effects:');
console.log(`  selfCareAIEffectMuI: ${rwandaParamsWithAI.selfCareAIEffectMuI}`);
console.log(`  selfCareAIEffectDeltaI: ${rwandaParamsWithAI.selfCareAIEffectDeltaI}`);
console.log(`  visitReduction: ${rwandaParamsWithAI.visitReduction || 'N/A'}`);

console.log('\n=== SUMMARY ===');
console.log(`In a population of ${config.population.toLocaleString()} people over 2 years:`);
console.log(`AI self-care prevents ${deathReduction.toLocaleString()} malaria deaths`);
console.log(`This represents a ${deathReductionPct.toFixed(2)}% reduction in malaria mortality.`);