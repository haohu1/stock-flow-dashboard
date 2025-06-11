// Test to demonstrate the difference between generic AI chatbot vs comprehensive self-care platform
const { runSimulation, getDefaultParameters, applyAIInterventions, diseaseProfiles } = require('./models/stockAndFlowModel');

// Get hypertension parameters
const baseParams = getDefaultParameters();
const hypertensionParams = {
  ...baseParams,
  ...diseaseProfiles.hypertension,
  perDiemCosts: baseParams.perDiemCosts
};

console.log('=== HYPERTENSION AI COMPARISON ===\n');
console.log('Demonstrating the difference between:');
console.log('1. Generic AI Chatbot (Triage AI) - just advice, no tools');
console.log('2. Comprehensive Self-Care Platform - BP monitors, meds, adherence tracking\n');

// 1. Baseline (No AI)
const baselineResults = runSimulation(hypertensionParams, {
  numWeeks: 52,
  population: 1000000
});

console.log('BASELINE (No AI):');
console.log(`Deaths: ${baselineResults.cumulativeDeaths}`);
console.log(`DALYs: ${baselineResults.dalys.toFixed(0)}`);
console.log(`Cost: $${baselineResults.totalCost.toFixed(0)}\n`);

// 2. Generic AI Chatbot Only (Triage AI)
const chatbotParams = applyAIInterventions(
  hypertensionParams,
  { triageAI: true },  // Just the chatbot
  {},
  undefined,
  undefined,
  'hypertension'
);

const chatbotResults = runSimulation(chatbotParams, {
  numWeeks: 52,
  population: 1000000
});

const chatbotDeathReduction = ((baselineResults.cumulativeDeaths - chatbotResults.cumulativeDeaths) / baselineResults.cumulativeDeaths * 100).toFixed(1);

console.log('GENERIC AI CHATBOT (Triage AI Only):');
console.log(`Deaths: ${chatbotResults.cumulativeDeaths}`);
console.log(`Death reduction: ${chatbotDeathReduction}%`);
console.log(`Lives saved: ${baselineResults.cumulativeDeaths - chatbotResults.cumulativeDeaths}`);
console.log(`Comment: Minimal impact - just giving advice without BP monitoring or meds\n`);

// 3. Comprehensive Self-Care Platform
const selfCareParams = applyAIInterventions(
  hypertensionParams,
  { selfCareAI: true },  // Comprehensive platform
  {},
  undefined,
  undefined,
  'hypertension'
);

const selfCareResults = runSimulation(selfCareParams, {
  numWeeks: 52,
  population: 1000000
});

const selfCareDeathReduction = ((baselineResults.cumulativeDeaths - selfCareResults.cumulativeDeaths) / baselineResults.cumulativeDeaths * 100).toFixed(1);

console.log('COMPREHENSIVE SELF-CARE PLATFORM:');
console.log(`Deaths: ${selfCareResults.cumulativeDeaths}`);
console.log(`Death reduction: ${selfCareDeathReduction}%`);
console.log(`Lives saved: ${baselineResults.cumulativeDeaths - selfCareResults.cumulativeDeaths}`);
console.log(`Comment: Transformative impact with BP monitors, medication delivery, adherence tools\n`);

// 4. Compare the two
console.log('=== KEY FINDING ===');
console.log(`Generic chatbot saves ${baselineResults.cumulativeDeaths - chatbotResults.cumulativeDeaths} lives (${chatbotDeathReduction}% reduction)`);
console.log(`Self-care platform saves ${baselineResults.cumulativeDeaths - selfCareResults.cumulativeDeaths} lives (${selfCareDeathReduction}% reduction)`);
console.log(`\nThe ${(selfCareResults.cumulativeDeaths - chatbotResults.cumulativeDeaths)} additional lives saved demonstrate that`);
console.log('the impact comes from actual tools (BP monitors, meds) not just digital advice.');