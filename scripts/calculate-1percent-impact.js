// Calculate deaths averted by moving 1% of population from informal/no care to CHW care

const diseases = {
  malaria: {
    name: 'Malaria',
    incidence: 0.07,      // 7% annual incidence
    deltaI: 0.075,        // 7.5% weekly mortality in informal care
    deltaU: 0.075,        // 7.5% weekly mortality if untreated
    delta0: 0.001,        // 0.1% weekly mortality at CHW level
    avgDuration: 3       // Average 3 weeks if untreated
  },
  diarrhea: {
    name: 'Diarrhea',
    incidence: 0.30,      // 30% annual incidence
    deltaI: 0.015,        // 1.5% weekly mortality in informal care
    deltaU: 0.025,        // 2.5% weekly mortality if untreated
    delta0: 0.002,        // 0.2% weekly mortality at CHW level
    avgDuration: 2       // Average 2 weeks if untreated
  },
  pneumonia: {
    name: 'Childhood Pneumonia',
    incidence: 0.05,      // 5% annual incidence
    deltaI: 0.035,        // 3.5% weekly mortality in informal care
    deltaU: 0.05,         // 5% weekly mortality if untreated
    delta0: 0.01,         // 1% weekly mortality at CHW level
    avgDuration: 3       // Average 3 weeks if untreated
  },
  tuberculosis: {
    name: 'Tuberculosis',
    incidence: 0.003,     // 0.3% annual incidence
    deltaI: 0.0035,       // 0.35% weekly mortality in informal care
    deltaU: 0.004,        // 0.4% weekly mortality if untreated
    delta0: 0.0025,       // 0.25% weekly mortality at CHW level
    avgDuration: 26      // Average 26 weeks if untreated (chronic)
  },
  fever: {
    name: 'Fever',
    incidence: 0.60,      // 60% annual incidence
    deltaI: 0.008,        // 0.8% weekly mortality in informal care
    deltaU: 0.015,        // 1.5% weekly mortality if untreated
    delta0: 0.005,        // 0.5% weekly mortality at CHW level
    avgDuration: 2       // Average 2 weeks if untreated
  }
};

function calculateDeathsAverted(disease, populationSize = 1000000) {
  // 1% of population moved from informal care to CHW care
  const movedPopulation = populationSize * 0.01;
  
  // Annual cases among the moved population
  const annualCases = movedPopulation * disease.incidence;
  
  // Deaths in informal care (over disease duration)
  const deathsInformalCare = annualCases * disease.deltaI * disease.avgDuration;
  
  // Deaths at CHW level (over disease duration)
  const deathsAtCHW = annualCases * disease.delta0 * disease.avgDuration;
  
  // Deaths averted
  const deathsAverted = deathsInformalCare - deathsAtCHW;
  
  // Mortality reduction percentage
  const mortalityReduction = ((disease.deltaI - disease.delta0) / disease.deltaI) * 100;
  
  return {
    annualCases,
    deathsInformalCare,
    deathsAtCHW,
    deathsAverted,
    mortalityReduction,
    deathsAvertedPer100k: (deathsAverted / populationSize) * 100000
  };
}

console.log('Deaths Averted by Moving 1% of Population from Informal Care to CHW Care');
console.log('(Assuming population of 1 million)\n');

let totalDeathsAverted = 0;

for (const [key, disease] of Object.entries(diseases)) {
  const results = calculateDeathsAverted(disease);
  
  console.log(`${disease.name}:`);
  console.log(`  Annual incidence: ${(disease.incidence * 100).toFixed(1)}%`);
  console.log(`  Weekly mortality - Informal: ${(disease.deltaI * 100).toFixed(2)}%, CHW: ${(disease.delta0 * 100).toFixed(2)}%`);
  console.log(`  Cases among 1% moved population: ${results.annualCases.toFixed(0)}`);
  console.log(`  Deaths if stay in informal care: ${results.deathsInformalCare.toFixed(1)}`);
  console.log(`  Deaths if moved to CHW care: ${results.deathsAtCHW.toFixed(1)}`);
  console.log(`  Deaths averted: ${results.deathsAverted.toFixed(1)}`);
  console.log(`  Mortality reduction: ${results.mortalityReduction.toFixed(1)}%`);
  console.log(`  Deaths averted per 100,000 population: ${results.deathsAvertedPer100k.toFixed(1)}`);
  console.log('');
  
  totalDeathsAverted += results.deathsAverted;
}

console.log(`TOTAL DEATHS AVERTED: ${totalDeathsAverted.toFixed(1)}`);
console.log(`TOTAL DEATHS AVERTED PER 100,000: ${(totalDeathsAverted / 10).toFixed(1)}`);

// Now calculate for Rwanda specifically (population ~13 million)
console.log('\n\n=== RWANDA SPECIFIC CALCULATIONS ===');
console.log('Rwanda population: ~13 million');
console.log('1% of population = 130,000 people\n');

const rwandaTotal = totalDeathsAverted * 13;
console.log(`Total annual deaths averted in Rwanda: ${rwandaTotal.toFixed(0)}`);

// Calculate impact over 2 years (typical simulation period)
console.log(`\nOver 2-year simulation period:`);
console.log(`Deaths averted: ${(rwandaTotal * 2).toFixed(0)}`);

// Show disease breakdown for Rwanda
console.log('\nBreakdown by disease (2-year period):');
for (const [key, disease] of Object.entries(diseases)) {
  const results = calculateDeathsAverted(disease, 13000000);
  console.log(`  ${disease.name}: ${(results.deathsAverted * 2).toFixed(0)} deaths averted`);
}