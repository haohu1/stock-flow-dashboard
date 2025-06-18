#!/usr/bin/env node

// This script mimics the bubble chart getSizeValue calculation
// to debug why Self-Care AI shows smaller bubbles than Diagnostic AI

console.log('=== DEBUGGING BUBBLE CHART SIZE CALCULATION ===\n');

// Mock scenarios with results that would be typical
const mockScenarios = [
  {
    name: 'Baseline (No AI) - HIV management chronic',
    parameters: { disease: 'hiv_management_chronic' },
    results: {
      cumulativeDeaths: 808,
      dalys: 32347
    },
    baselineResults: {
      cumulativeDeaths: 808,
      dalys: 32347
    }
  },
  {
    name: 'Diagnostic AI (L1/L2) - HIV management chronic',
    parameters: { disease: 'hiv_management_chronic' },
    results: {
      cumulativeDeaths: 740,
      dalys: 29621
    },
    baselineResults: {
      cumulativeDeaths: 808,
      dalys: 32347
    }
  },
  {
    name: 'AI Health Advisor - HIV management chronic',
    parameters: { disease: 'hiv_management_chronic' },
    results: {
      cumulativeDeaths: 548,
      dalys: 21950
    },
    baselineResults: {
      cumulativeDeaths: 808,
      dalys: 32347
    }
  }
];

// Mock the getSizeValue function from BubbleChartView.tsx
function getSizeValue(scenario, sizeMetric = 'dalys') {
  const disease = scenario.parameters.disease || 'Unknown';
  const scenarioResults = scenario.results;
  
  if (!scenarioResults) return 0;
  
  // Use scenario's own baseline if available
  const diseaseBaseline = scenario.baselineResults;
  
  if (!diseaseBaseline) {
    console.warn(`WARNING: No baseline results found for scenario: ${scenario.name}`);
    return sizeMetric === 'dalys' 
      ? Math.max(1000, scenarioResults.dalys * 0.1)
      : Math.max(10, scenarioResults.cumulativeDeaths * 0.1);
  }
  
  // Calculate the averted values
  if (sizeMetric === 'dalys') {
    const dalysAverted = diseaseBaseline.dalys - scenarioResults.dalys;
    
    // Cap extremely large values
    if (Math.abs(dalysAverted) > 10000000) {
      return dalysAverted > 0 ? 10000000 : 0;
    }
    
    return Math.max(0, dalysAverted);
  } else {
    const deathsAverted = diseaseBaseline.cumulativeDeaths - scenarioResults.cumulativeDeaths;
    
    // Cap extremely large values
    if (Math.abs(deathsAverted) > 100000) {
      return deathsAverted > 0 ? 100000 : 0;
    }
    
    return Math.max(0, deathsAverted);
  }
}

// Test both size metrics
for (const sizeMetric of ['deaths', 'dalys']) {
  console.log(`\n--- BUBBLE SIZES (${sizeMetric.toUpperCase()}) ---`);
  
  for (const scenario of mockScenarios) {
    const bubbleSize = getSizeValue(scenario, sizeMetric);
    console.log(`${scenario.name}`);
    console.log(`  ${sizeMetric === 'deaths' ? 'Deaths' : 'DALYs'} averted: ${bubbleSize.toLocaleString()}`);
    
    if (scenario.name.includes('Baseline')) {
      console.log(`  --> This should be 0 (baseline)`);
    } else {
      console.log(`  --> Bubble size: ${bubbleSize}`);
    }
  }
}

console.log('\n=== COMPARISON ===');
const diagnosticSize = getSizeValue(mockScenarios[1], 'dalys');
const selfCareSize = getSizeValue(mockScenarios[2], 'dalys');

console.log(`Diagnostic AI bubble size: ${diagnosticSize.toLocaleString()}`);
console.log(`Self-Care AI bubble size: ${selfCareSize.toLocaleString()}`);
console.log(`Self-Care AI is ${(selfCareSize / diagnosticSize).toFixed(1)}x larger than Diagnostic AI`);

if (selfCareSize > diagnosticSize) {
  console.log('✅ Self-Care AI correctly shows as larger bubble');
} else {
  console.log('❌ Self-Care AI incorrectly shows as smaller bubble');
  console.log('This suggests the issue is NOT in the bubble size calculation but in the scenario results themselves');
}

console.log('\n=== INVESTIGATION SUMMARY ===');
console.log('If Self-Care AI shows as smaller in the actual app but larger in this test,');
console.log('the issue is likely:');
console.log('1. Different baseline being used for comparison');
console.log('2. Country-specific baseline calculations affecting the results'); 
console.log('3. Scenarios not using the same baseline reference');
console.log('4. Multi-disease mode affecting the calculation');
console.log('5. Scenario stored baseline vs. dynamically calculated baseline mismatch');