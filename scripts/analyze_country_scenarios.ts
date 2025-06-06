import { adjustParametersForCountry, countryProfiles, countryDiseaseBurdens } from '../models/countrySpecificModel';
import { runSimulation, ModelParameters, SimulationConfig } from '../models/stockAndFlowModel';

// Disease parameters from CSV - matching the actual disease names used in the system
const diseaseBaseParams: Record<string, ModelParameters> = {
  tuberculosis: {
    lambda: 0.002,
    disabilityWeight: 0.333,
    meanAgeOfInfection: 35,
    muI: 0.02, mu0: 0.03, mu1: 0.04, mu2: 0.05, mu3: 0.06,
    deltaU: 0.003, deltaI: 0.0025, delta0: 0.002, delta1: 0.001, delta2: 0.0008, delta3: 0.0005,
    rho0: 0.85, rho1: 0.4, rho2: 0.25,
    phi0: 0.65, sigmaI: 0.25, informalCareRatio: 0.15,
    muU: 0, // No spontaneous recovery for TB
    perDiemCosts: { I: 7, F: 25, L0: 15, L1: 35, L2: 75, L3: 350 },
    visitReduction: 0,
    smartRoutingRate: 0,
    queuePreventionRate: 0,
    muIMultiplier: 1,
    deltaIMultiplier: 1,
    selfCareAIEffectMuI: 1,
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 30,
    regionalLifeExpectancy: 65
  },
  malaria: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 30,
    regionalLifeExpectancy: 65
  },
  childhood_pneumonia: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 35,
    regionalLifeExpectancy: 65
  },
  diarrhea: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 35,
    regionalLifeExpectancy: 65
  },
  hiv_management_chronic: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 30,
    regionalLifeExpectancy: 65
  },
  hiv_opportunistic: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 30,
    regionalLifeExpectancy: 65
  },
  high_risk_pregnancy_low_anc: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 35,
    regionalLifeExpectancy: 65
  },
  congestive_heart_failure: {
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
    selfCareAIEffectDeltaI: 1,
    selfCareAIActive: false,
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0.03,
    yearsOfLifeLost: 10,
    regionalLifeExpectancy: 65
  }
};

// Test diseases for each country
const countryDiseases: Record<string, string[]> = {
  nigeria: ['tuberculosis', 'malaria', 'childhood_pneumonia', 'diarrhea', 'hiv_management_chronic', 'high_risk_pregnancy_low_anc'],
  kenya: ['tuberculosis', 'malaria', 'childhood_pneumonia', 'hiv_management_chronic', 'hiv_opportunistic', 'high_risk_pregnancy_low_anc'],
  south_africa: ['tuberculosis', 'hiv_management_chronic', 'hiv_opportunistic', 'childhood_pneumonia', 'congestive_heart_failure', 'high_risk_pregnancy_low_anc']
};

// Run analysis
const POPULATION_SIZE = 100000;
const NUM_WEEKS = 52; // 1 year simulation

console.log('# Country Scenario Analysis Report\n');
console.log('Generated:', new Date().toISOString(), '\n');

const countries = ['nigeria', 'kenya', 'south_africa'];

for (const country of countries) {
  console.log(`## ${country.toUpperCase()}\n`);
  
  const countryProfile = countryProfiles[country];
  console.log('Country Profile:');
  console.log(`- GDP per capita: $${countryProfile.gdpPerCapitaUSD}`);
  console.log(`- Health expenditure per capita: $${countryProfile.healthExpenditurePerCapitaUSD}`);
  console.log(`- Physician density: ${countryProfile.physicianDensityPer1000} per 1000`);
  console.log(`- Hospital beds: ${countryProfile.hospitalBedsPer1000} per 1000`);
  console.log(`- Urban population: ${(countryProfile.urbanPopulationPct * 100).toFixed(0)}%\n`);
  
  const diseases = countryDiseases[country];
  
  console.log('### Urban Scenarios\n');
  console.log('| Disease | Incidence | Care-Seeking | Mortality (Untreated) | Deaths/100k | Key Adjustments |');
  console.log('|---------|-----------|--------------|---------------------|-------------|-----------------|');
  
  for (const disease of diseases) {
    const baseParams = diseaseBaseParams[disease];
    if (!baseParams) continue;
    
    const adjustedParams = adjustParametersForCountry(baseParams, country, true, disease);
    const config: SimulationConfig = {
      numWeeks: NUM_WEEKS,
      population: POPULATION_SIZE
    };
    
    const results = runSimulation(adjustedParams, config);
    const deathsPer100k = (results.cumulativeDeaths / POPULATION_SIZE) * 100000;
    
    const keyAdjustments = [];
    if (adjustedParams.infrastructureMultiplier < 0.9) keyAdjustments.push(`Infra: ${adjustedParams.infrastructureMultiplier.toFixed(2)}`);
    if (adjustedParams.healthWorkforceDensityMultiplier < 0.9) keyAdjustments.push(`Workforce: ${adjustedParams.healthWorkforceDensityMultiplier.toFixed(2)}`);
    
    console.log(`| ${disease} | ${adjustedParams.lambda.toFixed(3)} | ${adjustedParams.phi0.toFixed(2)} | ${adjustedParams.deltaU.toFixed(3)} | ${deathsPer100k.toFixed(1)} | ${keyAdjustments.join(', ') || 'None'} |`);
  }
  
  console.log('\n### Rural Scenarios\n');
  console.log('| Disease | Incidence | Care-Seeking | Mortality (Untreated) | Deaths/100k | Key Issues |');
  console.log('|---------|-----------|--------------|---------------------|-------------|-----------|');
  
  for (const disease of diseases) {
    const baseParams = diseaseBaseParams[disease];
    if (!baseParams) continue;
    
    const adjustedParams = adjustParametersForCountry(baseParams, country, false, disease);
    const config: SimulationConfig = {
      numWeeks: NUM_WEEKS,
      population: POPULATION_SIZE
    };
    
    const results = runSimulation(adjustedParams, config);
    const deathsPer100k = (results.cumulativeDeaths / POPULATION_SIZE) * 100000;
    
    const issues = [];
    if (adjustedParams.phi0 < 0.2) issues.push('Low care-seeking');
    if (adjustedParams.deltaU > 0.1) issues.push('High mortality');
    if (adjustedParams.mu0 < 0.02) issues.push('Low CHW effect');
    if (adjustedParams.rho0 < 0.3) issues.push('Poor referral');
    
    console.log(`| ${disease} | ${adjustedParams.lambda.toFixed(3)} | ${adjustedParams.phi0.toFixed(2)} | ${adjustedParams.deltaU.toFixed(3)} | ${deathsPer100k.toFixed(1)} | ${issues.join(', ') || 'None'} |`);
  }
  
  console.log('\n### Rural vs Urban Comparison (Key Diseases)\n');
  
  const keyDiseases = ['tuberculosis', 'hiv_management_chronic', disease === 'nigeria' ? 'childhood_pneumonia' : 'hiv_opportunistic'];
  
  for (const disease of keyDiseases) {
    if (!diseases.includes(disease)) continue;
    
    const baseParams = diseaseBaseParams[disease];
    if (!baseParams) continue;
    
    const urbanParams = adjustParametersForCountry(baseParams, country, true, disease);
    const ruralParams = adjustParametersForCountry(baseParams, country, false, disease);
    
    console.log(`**${disease}:**`);
    console.log(`- Care-seeking: Urban ${urbanParams.phi0.toFixed(2)} → Rural ${ruralParams.phi0.toFixed(2)} (${((ruralParams.phi0/urbanParams.phi0 - 1) * 100).toFixed(0)}%)`);
    console.log(`- Untreated mortality: Urban ${urbanParams.deltaU.toFixed(3)} → Rural ${ruralParams.deltaU.toFixed(3)} (${((ruralParams.deltaU/urbanParams.deltaU - 1) * 100).toFixed(0)}%)`);
    console.log(`- CHW effectiveness: Urban ${urbanParams.mu0.toFixed(3)} → Rural ${ruralParams.mu0.toFixed(3)} (${((ruralParams.mu0/urbanParams.mu0 - 1) * 100).toFixed(0)}%)`);
    console.log('');
  }
  
  console.log('\n---\n');
}

console.log('## Key Findings and Issues\n');

console.log('### Nigeria');
console.log('- Very low physician density (0.4/1000) severely impacts all scenarios');
console.log('- Rural care-seeking particularly low for childhood diseases');
console.log('- Maternal health outcomes concerning in both urban and rural settings');
console.log('- Infrastructure multiplier: 0.70 (lowest among three countries)\n');

console.log('### Kenya');
console.log('- Strong TB program maintains relatively good outcomes despite low resources');
console.log('- HIV burden high but well-managed through vertical programs');
console.log('- Rural population (72%) faces significant access challenges');
console.log('- CHW programs help mitigate some rural disadvantages\n');

console.log('### South Africa');
console.log('- Extreme HIV/TB burden overwhelms even better-resourced system');
console.log('- Urban-rural disparities less severe due to better infrastructure');
console.log('- NCDs emerging as significant burden (CHF)');
console.log('- Vertical HIV programs achieve good coverage but system strain evident\n');

console.log('### Recommendations for Parameter Adjustments');
console.log('1. Consider capping rural mortality multipliers at 1.5x to avoid unrealistic values');
console.log('2. Ensure minimum CHW effectiveness (mu0) of 0.02 even in worst scenarios');
console.log('3. Account for vertical program effects more systematically');
console.log('4. Review informal care ratios - may be too low for rural settings');
console.log('5. Consider disease-specific capacity constraints for high-burden conditions');