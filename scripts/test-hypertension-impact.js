const { diseaseProfiles, applyAIInterventions, defaultAIUptakeParameters } = require('./models/stockAndFlowModel.js');

console.log('\n=== HYPERTENSION SELF-CARE AI IMPACT ANALYSIS ===\n');

// Get base hypertension parameters
const baseParams = diseaseProfiles.hypertension;

// Define uptake parameters with 20% self-care AI uptake
const uptakeParams = {
  ...defaultAIUptakeParameters,
  selfCareAI: 0.2,  // 20% uptake
  urbanMultiplier: 1.0
};

// Apply self-care AI intervention
const aiParams = applyAIInterventions(
  baseParams,
  { selfCareAI: true },
  {},  // cost params
  uptakeParams,
  true, // isUrban
  'hypertension'
);

console.log('=== CONTROL RATE IMPROVEMENTS ===');
console.log(`Baseline informal care control: ${(baseParams.muI * 100).toFixed(2)}% per week`);
console.log(`With self-care AI: ${(aiParams.muI * 100).toFixed(2)}% per week`);
console.log(`Improvement: ${((aiParams.muI - baseParams.muI) / baseParams.muI * 100).toFixed(0)}%`);

console.log('\n=== MORTALITY REDUCTIONS ===');
console.log(`Baseline informal care mortality: ${(baseParams.deltaI * 100).toFixed(3)}% per week`);
console.log(`With self-care AI: ${(aiParams.deltaI * 100).toFixed(3)}% per week`);
console.log(`Reduction: ${((baseParams.deltaI - aiParams.deltaI) / baseParams.deltaI * 100).toFixed(0)}%`);

// Calculate annual impact
const weeksPerYear = 52;
const annualBaselineControl = 1 - Math.pow(1 - baseParams.muI, weeksPerYear);
const annualAIControl = 1 - Math.pow(1 - aiParams.muI, weeksPerYear);

console.log('\n=== ANNUAL CONTROL RATES ===');
console.log(`Baseline: ${(annualBaselineControl * 100).toFixed(1)}% achieve control per year`);
console.log(`With AI: ${(annualAIControl * 100).toFixed(1)}% achieve control per year`);

// Estimate population impact
const hypertensionPrevalence = 0.25; // 25% of adults
const adultPopulation = 6000000; // 60% of 10M population
const hypertensionPatients = adultPopulation * hypertensionPrevalence;
const informalCareUsage = 0.3; // 30% use informal care
const informalCarePatients = hypertensionPatients * informalCareUsage;

const additionalControlled = informalCarePatients * (annualAIControl - annualBaselineControl);

console.log('\n=== POPULATION IMPACT (10M total population) ===');
console.log(`Adult population: ${adultPopulation.toLocaleString()}`);
console.log(`Hypertension patients (25%): ${hypertensionPatients.toLocaleString()}`);
console.log(`Using informal care (30%): ${informalCarePatients.toLocaleString()}`);
console.log(`Additional patients achieving control: ${Math.round(additionalControlled).toLocaleString()}`);

// Mortality impact
const annualMortalityBase = baseParams.deltaI * 52;
const annualMortalityAI = aiParams.deltaI * 52;
const mortalityReductionRate = (annualMortalityBase - annualMortalityAI) / annualMortalityBase;
const livesAvertedInformal = informalCarePatients * (annualMortalityBase - annualMortalityAI);

console.log('\n=== MORTALITY IMPACT ===');
console.log(`Annual mortality - baseline: ${(annualMortalityBase * 100).toFixed(1)}%`);
console.log(`Annual mortality - with AI: ${(annualMortalityAI * 100).toFixed(1)}%`);
console.log(`Lives saved (informal care): ${Math.round(livesAvertedInformal).toLocaleString()}`);

// Health system impact
const visitReduction = aiParams.visitReduction || 0;
const visitsAvoided = informalCarePatients * visitReduction;

console.log('\n=== HEALTH SYSTEM IMPACT ===');
console.log(`Visit reduction: ${(visitReduction * 100).toFixed(0)}%`);
console.log(`Annual visits avoided: ${Math.round(visitsAvoided).toLocaleString()}`);

console.log('\n=== KEY INSIGHT ===');
console.log('Self-care AI with BP monitors and medications enables patients to achieve');
console.log('BP control rates similar to primary care (80% effectiveness) while staying');
console.log('at home. This transforms hypertension management from facility-based to');
console.log('home-based care, reducing health system burden and improving outcomes.');