#!/usr/bin/env node

/**
 * Test script to verify that the baseline fix for individual disease scenarios works correctly
 * This script simulates the data flow when creating scenarios with "Test Each AI"
 */

// Simulate the baseline results map structure
const baselineResultsMap = {
  "nigeria_urban_childhood_pneumonia-malaria_cong50_individual": {
    "childhood_pneumonia": {
      dalys: 50000,
      cumulativeDeaths: 1000,
      totalCost: 2000000
    },
    "malaria": {
      dalys: 40000,
      cumulativeDeaths: 800,
      totalCost: 1500000
    }
  },
  "generic_childhood_pneumonia-malaria_cong50_individual": {
    "childhood_pneumonia": {
      dalys: 45000,
      cumulativeDeaths: 900,
      totalCost: 1800000
    },
    "malaria": {
      dalys: 35000,
      cumulativeDeaths: 700,
      totalCost: 1400000
    }
  }
};

// Test the baseline lookup logic
function getEnhancedBaselineKey(countryCode, isUrban, selectedDiseases, congestion, scenarioMode) {
  const diseaseKey = selectedDiseases.sort().join('-');
  const congestionKey = `cong${Math.round(congestion * 100)}`;
  return `${countryCode}_${isUrban ? 'urban' : 'rural'}_${diseaseKey}_${congestionKey}_${scenarioMode}`;
}

// Test case 1: Individual disease scenario for childhood_pneumonia
console.log("Test Case 1: Individual disease scenario for childhood_pneumonia");
const disease1 = "childhood_pneumonia";
const countryCode = "nigeria";
const isUrban = true;
const congestion = 0.5;
const scenarioMode = "individual";

const baselineKey1 = getEnhancedBaselineKey(countryCode, isUrban, [disease1], congestion, scenarioMode);
console.log("Baseline key:", baselineKey1);

const diseaseBaseline1 = baselineResultsMap[baselineKey1]?.[disease1];
console.log("Disease-specific baseline found:", diseaseBaseline1 ? "Yes" : "No");
if (diseaseBaseline1) {
  console.log("Baseline DALYs:", diseaseBaseline1.dalys);
  console.log("Baseline Deaths:", diseaseBaseline1.cumulativeDeaths);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test case 2: Individual disease scenario for malaria
console.log("Test Case 2: Individual disease scenario for malaria");
const disease2 = "malaria";

const baselineKey2 = getEnhancedBaselineKey(countryCode, isUrban, [disease2], congestion, scenarioMode);
console.log("Baseline key:", baselineKey2);

const diseaseBaseline2 = baselineResultsMap[baselineKey2]?.[disease2];
console.log("Disease-specific baseline found:", diseaseBaseline2 ? "Yes" : "No");
if (diseaseBaseline2) {
  console.log("Baseline DALYs:", diseaseBaseline2.dalys);
  console.log("Baseline Deaths:", diseaseBaseline2.cumulativeDeaths);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test case 3: Generic country fallback
console.log("Test Case 3: Generic country fallback");
const useCountrySpecific = false;

const baselineKey3 = useCountrySpecific 
  ? getEnhancedBaselineKey(countryCode, isUrban, [disease1], congestion, scenarioMode)
  : `generic_${[disease1].sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
console.log("Baseline key:", baselineKey3);

const diseaseBaseline3 = baselineResultsMap[baselineKey3]?.[disease1];
console.log("Disease-specific baseline found:", diseaseBaseline3 ? "Yes" : "No");
if (diseaseBaseline3) {
  console.log("Baseline DALYs:", diseaseBaseline3.dalys);
  console.log("Baseline Deaths:", diseaseBaseline3.cumulativeDeaths);
}

console.log("\n" + "=".repeat(50) + "\n");

// Test the impact calculation
console.log("Test Case 4: Impact calculation");
const currentResults = {
  dalys: 30000,
  cumulativeDeaths: 600
};

if (diseaseBaseline1) {
  const dalysAverted = diseaseBaseline1.dalys - currentResults.dalys;
  const deathsAverted = diseaseBaseline1.cumulativeDeaths - currentResults.cumulativeDeaths;
  const percentDeathsAverted = (deathsAverted / diseaseBaseline1.cumulativeDeaths) * 100;
  
  console.log("DALYs averted:", dalysAverted);
  console.log("Deaths averted:", deathsAverted);
  console.log("Percent deaths averted:", percentDeathsAverted.toFixed(1) + "%");
}