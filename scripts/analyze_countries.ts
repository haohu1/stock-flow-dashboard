import { adjustParametersForCountry, countryProfiles, countryDiseaseBurdens } from '../models/countrySpecificModel';
import { runModel, ModelParameters } from '../models/stockAndFlowModel';
import * as fs from 'fs';

// Disease parameters from CSV
const diseaseBaseParams: Record<string, ModelParameters> = {
  tuberculosis: {
    name: 'Tuberculosis',
    lambda: 0.002,
    disabilityWeight: 0.333,
    meanAgeOfInfection: 35,
    muI: 0.02, mu0: 0.03, mu1: 0.04, mu2: 0.05, mu3: 0.06,
    deltaU: 0.003, deltaI: 0.0025, delta0: 0.002, delta1: 0.001, delta2: 0.0008, delta3: 0.0005,
    rho0: 0.85, rho1: 0.4, rho2: 0.25,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0, // Add missing parameter
    // Costs
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    // AI parameters (baseline)
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  malaria: {
    name: 'Malaria',
    lambda: 0.4,
    disabilityWeight: 0.192,
    meanAgeOfInfection: 9,
    muI: 0.15, mu0: 0.8, mu1: 0.85, mu2: 0.6, mu3: 0.7,
    deltaU: 0.03, deltaI: 0.02, delta0: 0.002, delta1: 0.001, delta2: 0.03, delta3: 0.02,
    rho0: 0.5, rho1: 0.4, rho2: 0.2,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  childhood_pneumonia: {
    name: 'Childhood Pneumonia',
    lambda: 0.9,
    disabilityWeight: 0.28,
    meanAgeOfInfection: 3,
    muI: 0.1, mu0: 0.7, mu1: 0.8, mu2: 0.7, mu3: 0.8,
    deltaU: 0.05, deltaI: 0.035, delta0: 0.01, delta1: 0.005, delta2: 0.02, delta3: 0.015,
    rho0: 0.6, rho1: 0.3, rho2: 0.2,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  diarrhea: {
    name: 'Diarrheal Disease',
    lambda: 0.3,
    disabilityWeight: 0.15,
    meanAgeOfInfection: 2,
    muI: 0.35, mu0: 0.85, mu1: 0.9, mu2: 0.8, mu3: 0.85,
    deltaU: 0.025, deltaI: 0.015, delta0: 0.002, delta1: 0.001, delta2: 0.01, delta3: 0.005,
    rho0: 0.5, rho1: 0.3, rho2: 0.1,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  hiv_management_chronic: {
    name: 'HIV Management (Chronic)',
    lambda: 0.01,
    disabilityWeight: 0.078,
    meanAgeOfInfection: 30,
    muI: 0.01, mu0: 0.05, mu1: 0.1, mu2: 0.12, mu3: 0.15,
    deltaU: 0.007, deltaI: 0.005, delta0: 0.002, delta1: 0.0005, delta2: 0.0006, delta3: 0.0004,
    rho0: 0.9, rho1: 0.15, rho2: 0.1,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  hiv_opportunistic: {
    name: 'HIV Opportunistic Infections',
    lambda: 0.005,
    disabilityWeight: 0.274,
    meanAgeOfInfection: 32,
    muI: 0.05, mu0: 0.1, mu1: 0.3, mu2: 0.5, mu3: 0.7,
    deltaU: 0.08, deltaI: 0.06, delta0: 0.04, delta1: 0.02, delta2: 0.015, delta3: 0.01,
    rho0: 0.8, rho1: 0.6, rho2: 0.4,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  high_risk_pregnancy_low_anc: {
    name: 'High-Risk Pregnancy (Low ANC)',
    lambda: 0.02,
    disabilityWeight: 0.3,
    meanAgeOfInfection: 28,
    muI: 0.01, mu0: 0.02, mu1: 0.1, mu2: 0.5, mu3: 0.6,
    deltaU: 0.02, deltaI: 0.015, delta0: 0.01, delta1: 0.005, delta2: 0.002, delta3: 0.001,
    rho0: 0.9, rho1: 0.7, rho2: 0.4,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  },
  congestive_heart_failure: {
    name: 'Congestive Heart Failure',
    lambda: 0.002,
    disabilityWeight: 0.42,
    meanAgeOfInfection: 67,
    muI: 0.01, mu0: 0.03, mu1: 0.35, mu2: 0.55, mu3: 0.75,
    deltaU: 0.09, deltaI: 0.06, delta0: 0.05, delta1: 0.03, delta2: 0.02, delta3: 0.01,
    rho0: 0.7, rho1: 0.55, rho2: 0.35,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0,
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1
  }
};

// Test diseases for each country
const countryDiseases: Record<string, string[]> = {
  nigeria: ['tuberculosis', 'malaria', 'childhood_pneumonia', 'diarrhea', 'hiv_management_chronic', 'high_risk_pregnancy_low_anc'],
  kenya: ['tuberculosis', 'malaria', 'childhood_pneumonia', 'hiv_management_chronic', 'hiv_opportunistic', 'high_risk_pregnancy_low_anc'],
  south_africa: ['tuberculosis', 'hiv_management_chronic', 'hiv_opportunistic', 'childhood_pneumonia', 'congestive_heart_failure', 'high_risk_pregnancy_low_anc']
};

// Population size for testing
const POPULATION_SIZE = 100000;

interface ScenarioResult {
  country: string;
  isUrban: boolean;
  disease: string;
  incidenceRate: number;
  careSeeking: number;
  mortalityRateUntreated: number;
  totalDeaths: number;
  deathRate: number;
  adjustedParams: any;
  steadyStatePopulations: any;
}

function analyzeScenario(countryCode: string, isUrban: boolean, disease: string): ScenarioResult | null {
  const baseParams = diseaseBaseParams[disease];
  if (!baseParams) {
    return null;
  }

  // Adjust parameters for country and setting
  const adjustedParams = adjustParametersForCountry(baseParams, countryCode, isUrban, disease);
  
  // Run the model
  const results = runModel(adjustedParams, POPULATION_SIZE);
  
  // Extract key metrics
  const steadyState = results.results[results.results.length - 1];
  const totalDeaths = steadyState.cumulativeDeaths;
  const deathRate = totalDeaths / POPULATION_SIZE;
  const incidenceRate = adjustedParams.lambda;
  const mortalityRateUntreated = adjustedParams.deltaU;
  const careSeeking = adjustedParams.phi0;
  
  return {
    country: countryCode,
    isUrban,
    disease,
    incidenceRate,
    careSeeking,
    mortalityRateUntreated,
    totalDeaths,
    deathRate,
    adjustedParams: {
      phi0: adjustedParams.phi0,
      sigmaI: adjustedParams.sigmaI,
      informalCareRatio: adjustedParams.informalCareRatio,
      mu0: adjustedParams.mu0,
      mu1: adjustedParams.mu1,
      mu2: adjustedParams.mu2,
      mu3: adjustedParams.mu3,
      deltaU: adjustedParams.deltaU,
      deltaI: adjustedParams.deltaI,
      delta0: adjustedParams.delta0,
      delta1: adjustedParams.delta1,
      delta2: adjustedParams.delta2,
      delta3: adjustedParams.delta3,
      rho0: adjustedParams.rho0,
      rho1: adjustedParams.rho1,
      rho2: adjustedParams.rho2,
      infrastructureMultiplier: adjustedParams.infrastructureMultiplier,
      healthWorkforceDensityMultiplier: adjustedParams.healthWorkforceDensityMultiplier
    },
    steadyStatePopulations: {
      susceptible: steadyState.S,
      infected: steadyState.I,
      untreated: steadyState.U,
      informalCare: steadyState.F,
      level0: steadyState.L0,
      level1: steadyState.L1,
      level2: steadyState.L2,
      level3: steadyState.L3,
      recovered: steadyState.R,
      dead: steadyState.D
    }
  };
}

// Run analysis for all scenarios
const results: ScenarioResult[] = [];
const countries = ['nigeria', 'kenya', 'south_africa'];

for (const country of countries) {
  const diseases = countryDiseases[country];
  
  for (const disease of diseases) {
    // Urban scenario
    const urbanResult = analyzeScenario(country, true, disease);
    if (urbanResult) {
      results.push(urbanResult);
    }
    
    // Rural scenario
    const ruralResult = analyzeScenario(country, false, disease);
    if (ruralResult) {
      results.push(ruralResult);
    }
  }
}

// Generate analysis report
let report = '# Country Scenario Analysis Report\n\n';
report += 'Generated: ' + new Date().toISOString() + '\n\n';

// Summary by country
for (const country of countries) {
  report += `## ${country.toUpperCase()}\n\n`;
  
  const countryResults = results.filter(r => r.country === country);
  const urbanResults = countryResults.filter(r => r.isUrban);
  const ruralResults = countryResults.filter(r => !r.isUrban);
  
  report += '### Urban Scenarios\n\n';
  report += '| Disease | Incidence | Care-Seeking | Mortality (Untreated) | Death Rate | Issues |\n';
  report += '|---------|-----------|--------------|---------------------|------------|--------|\n';
  
  for (const result of urbanResults) {
    const issues: string[] = [];
    
    // Check for unrealistic parameters
    if (result.careSeeking < 0.2) issues.push('Very low care-seeking');
    if (result.careSeeking > 0.95) issues.push('Unrealistically high care-seeking');
    if (result.mortalityRateUntreated > 0.1) issues.push('Very high mortality');
    if (result.deathRate > 0.05) issues.push('Excessive death rate');
    if (result.adjustedParams.mu0 < 0.02) issues.push('Extremely low CHW effectiveness');
    if (result.adjustedParams.deltaU > 0.15) issues.push('Extreme untreated mortality');
    
    report += `| ${result.disease} | ${result.incidenceRate.toFixed(3)} | ${result.careSeeking.toFixed(2)} | ${result.mortalityRateUntreated.toFixed(3)} | ${result.deathRate.toFixed(4)} | ${issues.join(', ') || 'None'} |\n`;
  }
  
  report += '\n### Rural Scenarios\n\n';
  report += '| Disease | Incidence | Care-Seeking | Mortality (Untreated) | Death Rate | Issues |\n';
  report += '|---------|-----------|--------------|---------------------|------------|--------|\n';
  
  for (const result of ruralResults) {
    const issues: string[] = [];
    
    // Check for unrealistic parameters with rural-specific thresholds
    if (result.careSeeking < 0.1) issues.push('Extremely low care-seeking');
    if (result.careSeeking > 0.8) issues.push('Unrealistically high for rural');
    if (result.mortalityRateUntreated > 0.15) issues.push('Very high mortality');
    if (result.deathRate > 0.08) issues.push('Excessive death rate');
    if (result.adjustedParams.mu0 < 0.01) issues.push('CHW effectiveness too low');
    if (result.adjustedParams.deltaU > 0.2) issues.push('Extreme untreated mortality');
    if (result.adjustedParams.rho0 < 0.2) issues.push('Referral rates too low');
    
    report += `| ${result.disease} | ${result.incidenceRate.toFixed(3)} | ${result.careSeeking.toFixed(2)} | ${result.mortalityRateUntreated.toFixed(3)} | ${result.deathRate.toFixed(4)} | ${issues.join(', ') || 'None'} |\n`;
  }
  
  report += '\n### Key Parameter Adjustments\n\n';
  
  // Show rural vs urban comparison for key diseases
  const keyDiseases = ['tuberculosis', 'hiv_management_chronic', 'childhood_pneumonia'];
  for (const disease of keyDiseases) {
    const urban = urbanResults.find(r => r.disease === disease);
    const rural = ruralResults.find(r => r.disease === disease);
    
    if (urban && rural) {
      report += `#### ${disease}\n`;
      report += `- Care-seeking: Urban ${urban.careSeeking.toFixed(2)} → Rural ${rural.careSeeking.toFixed(2)} (${((rural.careSeeking/urban.careSeeking - 1) * 100).toFixed(0)}%)\n`;
      report += `- Untreated mortality: Urban ${urban.mortalityRateUntreated.toFixed(3)} → Rural ${rural.mortalityRateUntreated.toFixed(3)} (${((rural.mortalityRateUntreated/urban.mortalityRateUntreated - 1) * 100).toFixed(0)}%)\n`;
      report += `- CHW effectiveness (mu0): Urban ${urban.adjustedParams.mu0.toFixed(3)} → Rural ${rural.adjustedParams.mu0.toFixed(3)} (${((rural.adjustedParams.mu0/urban.adjustedParams.mu0 - 1) * 100).toFixed(0)}%)\n`;
      report += `- Primary care referral (rho0): Urban ${urban.adjustedParams.rho0.toFixed(2)} → Rural ${rural.adjustedParams.rho0.toFixed(2)} (${((rural.adjustedParams.rho0/urban.adjustedParams.rho0 - 1) * 100).toFixed(0)}%)\n`;
      report += '\n';
    }
  }
  
  report += '\n';
}

// Identify scenarios with potential issues
report += '## Scenarios Requiring Adjustment\n\n';

const problematicScenarios = results.filter(r => {
  // General checks
  if (r.careSeeking < (r.isUrban ? 0.2 : 0.1)) return true;
  if (r.careSeeking > (r.isUrban ? 0.95 : 0.8)) return true;
  if (r.mortalityRateUntreated > 0.15) return true;
  if (r.deathRate > 0.08) return true;
  if (r.adjustedParams.mu0 < 0.01) return true;
  if (r.adjustedParams.deltaU > 0.2) return true;
  
  // Rural-specific checks
  if (!r.isUrban && r.adjustedParams.rho0 < 0.2) return true;
  
  return false;
});

for (const scenario of problematicScenarios) {
  report += `### ${scenario.country} - ${scenario.isUrban ? 'Urban' : 'Rural'} - ${scenario.disease}\n`;
  report += `- Incidence: ${scenario.incidenceRate.toFixed(3)}\n`;
  report += `- Care-seeking: ${scenario.careSeeking.toFixed(2)}\n`;
  report += `- Untreated mortality: ${scenario.mortalityRateUntreated.toFixed(3)}\n`;
  report += `- Death rate: ${scenario.deathRate.toFixed(4)}\n`;
  report += `- Key parameters:\n`;
  report += `  - mu0: ${scenario.adjustedParams.mu0.toFixed(3)}\n`;
  report += `  - deltaU: ${scenario.adjustedParams.deltaU.toFixed(3)}\n`;
  report += `  - rho0: ${scenario.adjustedParams.rho0.toFixed(2)}\n`;
  report += '\n';
}

// Output to console
console.log(report);

// Also log summary statistics
console.log('\n\n=== SUMMARY STATISTICS ===\n');
for (const country of countries) {
  console.log(`\n${country.toUpperCase()}`);
  const countryData = countryProfiles[country];
  console.log(`- GDP per capita: $${countryData.gdpPerCapitaUSD}`);
  console.log(`- Health expenditure per capita: $${countryData.healthExpenditurePerCapitaUSD}`);
  console.log(`- Physician density: ${countryData.physicianDensityPer1000} per 1000`);
  console.log(`- Hospital beds: ${countryData.hospitalBedsPer1000} per 1000`);
  console.log(`- Urban population: ${(countryData.urbanPopulationPct * 100).toFixed(0)}%`);
}