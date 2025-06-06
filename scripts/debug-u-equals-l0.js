// Debug script to understand why U equals L0 in the simulation

const { runSimulation, getDefaultParameters, healthSystemStrengthDefaults, diseaseProfiles } = require('./models/stockAndFlowModel.js');

// Get default parameters for childhood pneumonia in moderate urban system
const baseParams = getDefaultParameters();
const healthSystemDefaults = healthSystemStrengthDefaults.moderate_urban_system;
const diseaseProfile = diseaseProfiles.childhood_pneumonia;

// Merge all parameters
const params = {
  ...baseParams,
  ...healthSystemDefaults,
  ...diseaseProfile,
  systemCongestion: 0.1, // 10% congestion
};

console.log('\n=== KEY PARAMETERS ===');
console.log(`phi0 (formal care seeking): ${params.phi0}`);
console.log(`informalCareRatio (untreated ratio): ${params.informalCareRatio}`);
console.log(`lambda (annual incidence): ${params.lambda}`);
console.log(`System congestion: ${params.systemCongestion}`);

// Run simulation for just 5 weeks to see the pattern
const config = {
  numWeeks: 5,
  population: 1000000,
};

const results = runSimulation(params, config);

console.log('\n=== WEEKLY STATES ===');
results.weeklyStates.forEach((state, week) => {
  console.log(`\nWeek ${week}:`);
  console.log(`  U (untreated): ${state.U.toFixed(2)}`);
  console.log(`  I (informal): ${state.I.toFixed(2)}`);
  console.log(`  F (formal entry): ${state.F.toFixed(2)}`);
  console.log(`  L0 (CHW): ${state.L0.toFixed(2)}`);
  console.log(`  L1 (primary): ${state.L1.toFixed(2)}`);
  console.log(`  L2 (district): ${state.L2.toFixed(2)}`);
  console.log(`  L3 (tertiary): ${state.L3.toFixed(2)}`);
  console.log(`  R (resolved): ${state.R.toFixed(2)}`);
  console.log(`  D (deaths): ${state.D.toFixed(2)}`);
  console.log(`  New cases: ${state.newCases.toFixed(2)}`);
});

console.log('\n=== FLOW ANALYSIS ===');
const weeklyIncidence = (params.lambda * config.population) / 52;
console.log(`Weekly incidence: ${weeklyIncidence.toFixed(2)}`);
console.log(`Direct to formal (phi0 * incidence): ${(params.phi0 * weeklyIncidence).toFixed(2)}`);
console.log(`Stay untreated ((1-phi0) * incidence): ${((1 - params.phi0) * weeklyIncidence).toFixed(2)}`);
console.log(`To informal care ((1-informalCareRatio) * stay_untreated): ${((1 - params.informalCareRatio) * (1 - params.phi0) * weeklyIncidence).toFixed(2)}`);
console.log(`Truly untreated (informalCareRatio * stay_untreated): ${(params.informalCareRatio * (1 - params.phi0) * weeklyIncidence).toFixed(2)}`);

// Check if U equals L0
const uEqualsL0 = results.weeklyStates.every(state => Math.abs(state.U - state.L0) < 0.01);
console.log(`\n=== ISSUE CHECK ===`);
console.log(`Does U equal L0 in all weeks? ${uEqualsL0}`);

if (uEqualsL0) {
  console.log('\nINVESTIGATING: U equals L0 in all weeks!');
  console.log('This suggests patients are flowing directly from U to L0, which should not happen.');
  console.log('U should only decrease through deaths, resolution, or moving to informal care.');
  console.log('L0 should only receive patients from F (formal care entry).');
}