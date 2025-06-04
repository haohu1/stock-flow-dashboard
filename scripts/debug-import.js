/**
 * Debug script to analyze an exported JSON scenario file
 * Run with: node scripts/debug-import.js [path-to-json-file]
 */

const fs = require('fs');

// Check if file path is provided
if (process.argv.length < 3) {
  console.error('Please provide a JSON file path as an argument');
  console.error('Example: node scripts/debug-import.js exported-scenarios.json');
  process.exit(1);
}

const filePath = process.argv[2];

try {
  // Read and parse the JSON file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const scenarios = JSON.parse(fileContent);
  
  console.log(`Found ${Array.isArray(scenarios) ? scenarios.length : 1} scenario(s) in file`);
  
  // Process as array or single object
  const scenariosArray = Array.isArray(scenarios) ? scenarios : [scenarios];
  
  // Analyze each scenario
  scenariosArray.forEach((scenario, index) => {
    console.log(`\n--------- SCENARIO ${index + 1} ---------`);
    console.log(`Name: ${scenario.name}`);
    console.log(`ID: ${scenario.id}`);
    
    // Basic metadata
    console.log(`\nBASIC INFO:`);
    console.log(`  Disease: ${scenario.parameters?.disease || 'Not specified'}`);
    console.log(`  Health system: ${scenario.parameters?.healthSystemStrength || 'Not specified'}`);
    console.log(`  Active AI interventions: ${Object.entries(scenario.aiInterventions || {})
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name)
      .join(', ') || 'None'}`);
    console.log(`  Feasibility: ${scenario.feasibility ?? 'Not specified'}`);
    
    // Multi-disease support
    console.log(`\nMULTI-DISEASE SUPPORT:`);
    console.log(`  Has selectedDiseases array: ${scenario.selectedDiseases ? 'Yes' : 'No'}`);
    if (scenario.selectedDiseases && Array.isArray(scenario.selectedDiseases)) {
      console.log(`  Selected diseases (${scenario.selectedDiseases.length}): ${scenario.selectedDiseases.join(', ')}`);
    }
    
    console.log(`  Has diseaseResultsMap: ${scenario.diseaseResultsMap ? 'Yes' : 'No'}`);
    if (scenario.diseaseResultsMap) {
      const diseaseKeys = Object.keys(scenario.diseaseResultsMap);
      console.log(`  Disease result keys (${diseaseKeys.length}): ${diseaseKeys.join(', ')}`);
      
      // Analyze each disease result
      diseaseKeys.forEach(diseaseKey => {
        const diseaseResult = scenario.diseaseResultsMap[diseaseKey];
        if (!diseaseResult) {
          console.log(`    [${diseaseKey}]: null or undefined result`);
          return;
        }
        
        console.log(`\n    [${diseaseKey}] RESULT DETAILS:`);
        console.log(`      Deaths: ${diseaseResult.cumulativeDeaths}`);
        console.log(`      DALYs: ${diseaseResult.dalys}`);
        console.log(`      Cost: $${diseaseResult.totalCost}`);
        console.log(`      ICER: ${diseaseResult.icer}`);
        
        // Check for potential issues
        if (diseaseResult.icer === 1) {
          console.log(`      WARNING: ICER value is exactly 1, which is suspicious (likely a placeholder)`);
        }
        
        if (diseaseResult.weeklyStates) {
          console.log(`      Has weeklyStates data: Yes (${diseaseResult.weeklyStates.length} weeks)`);
        } else {
          console.log(`      WARNING: Missing weeklyStates data`);
        }
      });
    }
    
    // Baseline results
    console.log(`\nBASELINE INFO:`);
    console.log(`  Has baselineResults: ${scenario.baselineResults ? 'Yes' : 'No'}`);
    if (scenario.baselineResults) {
      console.log(`    Deaths: ${scenario.baselineResults.cumulativeDeaths}`);
      console.log(`    DALYs: ${scenario.baselineResults.dalys}`);
      console.log(`    Cost: $${scenario.baselineResults.totalCost}`);
      
      if (scenario.baselineResults.weeklyStates) {
        console.log(`    Has weeklyStates data: Yes (${scenario.baselineResults.weeklyStates.length} weeks)`);
      } else {
        console.log(`    WARNING: Missing weeklyStates data in baseline`);
      }
    }
    
    // Primary results
    console.log(`\nPRIMARY RESULTS:`);
    console.log(`  Has results: ${scenario.results ? 'Yes' : 'No'}`);
    if (scenario.results) {
      console.log(`    Deaths: ${scenario.results.cumulativeDeaths}`);
      console.log(`    DALYs: ${scenario.results.dalys}`);
      console.log(`    Cost: $${scenario.results.totalCost}`);
      console.log(`    ICER: ${scenario.results.icer}`);
      
      if (scenario.results.icer === 1) {
        console.log(`    WARNING: ICER value is exactly 1, which is suspicious (likely a placeholder)`);
      }
      
      if (scenario.results.weeklyStates) {
        console.log(`    Has weeklyStates data: Yes (${scenario.results.weeklyStates.length} weeks)`);
      } else {
        console.log(`    WARNING: Missing weeklyStates data in results`);
      }
    }
    
    // Check for disease consistency
    if (scenario.parameters?.disease && scenario.selectedDiseases) {
      if (!scenario.selectedDiseases.includes(scenario.parameters.disease)) {
        console.log(`\nWARNING: Primary disease "${scenario.parameters.disease}" is not included in selectedDiseases array`);
      }
    }
    
    // Check for diseaseResultsMap consistency
    if (scenario.diseaseResultsMap && scenario.selectedDiseases) {
      const mapKeys = Object.keys(scenario.diseaseResultsMap);
      const missingDiseases = scenario.selectedDiseases.filter(d => !mapKeys.includes(d));
      if (missingDiseases.length > 0) {
        console.log(`\nWARNING: The following diseases are in selectedDiseases but missing from diseaseResultsMap: ${missingDiseases.join(', ')}`);
      }
      
      const extraDiseases = mapKeys.filter(d => !scenario.selectedDiseases.includes(d));
      if (extraDiseases.length > 0) {
        console.log(`\nWARNING: The following diseases are in diseaseResultsMap but missing from selectedDiseases: ${extraDiseases.join(', ')}`);
      }
    }
  });
  
} catch (error) {
  console.error('Error processing the JSON file:', error.message);
  process.exit(1);
} 