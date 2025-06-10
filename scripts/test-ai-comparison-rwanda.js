const fs = require('fs');
const path = require('path');
const { StockAndFlowModel } = require('./models/stockAndFlowModel.js');
const { CountrySpecificModel } = require('./models/countrySpecificModel.js');

// Load data
const healthSystemData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'health_system_parameters.csv.json'), 'utf8'));
const countryData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'country_profiles.csv.json'), 'utf8'));
const diseaseBurdenData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'country_disease_burdens.csv.json'), 'utf8'));
const diseaseParamsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'health_system_disease_parameters.csv.json'), 'utf8'));

const country = 'Rwanda';
const diseases = ['Malaria', 'Pneumonia', 'Diarrhea', 'Tuberculosis', 'Diabetes', 'Hypertension', 'Depression', 'HIV/AIDS', 'Asthma', 'CHF'];

function runComparison() {
    console.log(`\n=== Comparing Self-care AI vs CHW AI for ${country} ===\n`);
    
    const countryModel = new CountrySpecificModel(
        healthSystemData,
        countryData,
        diseaseBurdenData,
        diseaseParamsData
    );

    // Baseline (no AI)
    console.log("Running baseline (no AI)...");
    const baselineParams = countryModel.getParameters(country, diseases, {
        selfCareEffectiveness: 1.0,
        chw_effectiveness: 1.0,
        phc_effectiveness: 1.0,
        referral_system_effectiveness: 1.0
    });
    const baselineModel = new StockAndFlowModel(baselineParams, diseases);
    const baselineResults = baselineModel.simulate(20);
    const baselineDeaths = baselineResults[baselineResults.length - 1].cumulativeDeaths;
    
    // Self-care AI
    console.log("\nRunning Self-care AI...");
    const selfCareParams = countryModel.getParameters(country, diseases, {
        selfCareEffectiveness: 1.5,  // 50% improvement
        chw_effectiveness: 1.0,
        phc_effectiveness: 1.0,
        referral_system_effectiveness: 1.0
    });
    const selfCareModel = new StockAndFlowModel(selfCareParams, diseases);
    const selfCareResults = selfCareModel.simulate(20);
    const selfCareDeaths = selfCareResults[selfCareResults.length - 1].cumulativeDeaths;
    
    // CHW AI
    console.log("\nRunning CHW AI...");
    const chwParams = countryModel.getParameters(country, diseases, {
        selfCareEffectiveness: 1.0,
        chw_effectiveness: 1.5,  // 50% improvement
        phc_effectiveness: 1.0,
        referral_system_effectiveness: 1.0
    });
    const chwModel = new StockAndFlowModel(chwParams, diseases);
    const chwResults = chwModel.simulate(20);
    const chwDeaths = chwResults[chwResults.length - 1].cumulativeDeaths;
    
    // Results
    console.log("\n=== RESULTS ===");
    console.log(`Baseline deaths: ${baselineDeaths.toFixed(0)}`);
    console.log(`Self-care AI deaths: ${selfCareDeaths.toFixed(0)}`);
    console.log(`CHW AI deaths: ${chwDeaths.toFixed(0)}`);
    console.log(`\nDeaths averted by Self-care AI: ${(baselineDeaths - selfCareDeaths).toFixed(0)}`);
    console.log(`Deaths averted by CHW AI: ${(baselineDeaths - chwDeaths).toFixed(0)}`);
    
    // Analyze by disease
    console.log("\n=== DEATHS BY DISEASE ===");
    const baselineFinal = baselineResults[baselineResults.length - 1];
    const selfCareFinal = selfCareResults[selfCareResults.length - 1];
    const chwFinal = chwResults[chwResults.length - 1];
    
    diseases.forEach(disease => {
        console.log(`\n${disease}:`);
        console.log(`  Baseline: ${baselineFinal.byDisease[disease].cumulativeDeaths.toFixed(0)}`);
        console.log(`  Self-care AI: ${selfCareFinal.byDisease[disease].cumulativeDeaths.toFixed(0)} (averted: ${(baselineFinal.byDisease[disease].cumulativeDeaths - selfCareFinal.byDisease[disease].cumulativeDeaths).toFixed(0)})`);
        console.log(`  CHW AI: ${chwFinal.byDisease[disease].cumulativeDeaths.toFixed(0)} (averted: ${(baselineFinal.byDisease[disease].cumulativeDeaths - chwFinal.byDisease[disease].cumulativeDeaths).toFixed(0)})`);
    });
    
    // Analyze patient flows
    console.log("\n=== PATIENT FLOWS (Year 20) ===");
    console.log("\nBaseline:");
    console.log(`  Self-care: ${baselineFinal.L0.toFixed(0)}`);
    console.log(`  CHW queue: ${baselineFinal.L1.toFixed(0)}`);
    console.log(`  PHC queue: ${baselineFinal.L2.toFixed(0)}`);
    console.log(`  Hospital queue: ${baselineFinal.L3.toFixed(0)}`);
    
    console.log("\nSelf-care AI:");
    console.log(`  Self-care: ${selfCareFinal.L0.toFixed(0)}`);
    console.log(`  CHW queue: ${selfCareFinal.L1.toFixed(0)}`);
    console.log(`  PHC queue: ${selfCareFinal.L2.toFixed(0)}`);
    console.log(`  Hospital queue: ${selfCareFinal.L3.toFixed(0)}`);
    
    console.log("\nCHW AI:");
    console.log(`  Self-care: ${chwFinal.L0.toFixed(0)}`);
    console.log(`  CHW queue: ${chwFinal.L1.toFixed(0)}`);
    console.log(`  PHC queue: ${chwFinal.L2.toFixed(0)}`);
    console.log(`  Hospital queue: ${chwFinal.L3.toFixed(0)}`);
}

runComparison();