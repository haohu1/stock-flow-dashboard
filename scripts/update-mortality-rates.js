const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'models', 'stockAndFlowModel.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define the revised mortality rates based on medical evidence
const revisedMortalityRates = {
    congestive_heart_failure: {
        deltaU: 0.09,   // unchanged - severe CHF has high mortality
        deltaI: 0.08,   // revised from 0.06 - minimal benefit without prescription drugs
        delta0: 0.04,   // revised from 0.05 - CHW with basic diuretics
        delta1: 0.025,  // revised from 0.03 - primary care adds ACE/beta-blockers
        delta2: 0.015,  // revised from 0.02 - specialist care
        delta3: 0.01    // unchanged - ICU care
    },
    tuberculosis: {
        deltaU: 0.004,   // revised from 0.003 - aligned with 70% 10-year mortality
        deltaI: 0.0035,  // revised from 0.0025 - minimal benefit without antibiotics
        delta0: 0.0025,  // unchanged - DOTS programs
        delta1: 0.002,   // revised from 0.0015 - standard treatment
        delta2: 0.0015,  // revised from 0.001 - MDR-TB management
        delta3: 0.001    // revised from 0.0008 - XDR-TB care
    },
    childhood_pneumonia: {
        deltaU: 0.05,    // unchanged
        deltaI: 0.045,   // revised from 0.035 - minimal benefit without antibiotics
        delta0: 0.02,    // revised from 0.01 - oral amoxicillin
        delta1: 0.015,   // revised from 0.005 - IV antibiotics
        delta2: 0.01,    // revised from 0.008 - pediatric unit with oxygen
        delta3: 0.008    // revised from 0.005 - PICU care
    },
    malaria: {
        deltaU: 0.03,    // unchanged - severe malaria mortality
        deltaI: 0.025,   // revised from 0.075 - traditional remedies minimal benefit
        delta0: 0.005,   // revised from 0.001 - RDTs + ACTs highly effective
        delta1: 0.003,   // revised from 0.001 - parenteral artesunate
        delta2: 0.002,   // revised from 0.01 - ICU support
        delta3: 0.0015   // revised from 0.005 - advanced ICU
    },
    diarrhea: {
        deltaU: 0.025,   // unchanged
        deltaI: 0.02,    // revised from 0.015 - home fluids provide some benefit
        delta0: 0.003,   // revised from 0.002 - ORS reduces mortality by 93%
        delta1: 0.002,   // revised from 0.001 - IV fluids
        delta2: 0.0015,  // revised from 0.01 - pediatric ward
        delta3: 0.001    // revised from 0.005 - ICU for complications
    },
    hiv_management_chronic: {
        deltaU: 0.007,   // unchanged - ~35% 5-year mortality
        deltaI: 0.0065,  // revised from 0.002 - no ART access
        delta0: 0.004,   // revised from 0.0015 - adherence support
        delta1: 0.002,   // revised from 0.0001 - first-line ART
        delta2: 0.0015,  // revised from 0.0005 - second-line ART
        delta3: 0.001    // revised from 2.0 (clear error) - third-line ART
    },
    upper_respiratory_tract_infection: {
        deltaU: 0.00002, // unchanged
        deltaI: 0.00001, // unchanged
        delta0: 0.00001, // unchanged
        delta1: 0.00001, // revised from 0.000005
        delta2: 0.00001, // revised from 0.000001
        delta3: 0.00001  // revised from 0.000001
    },
    fever: {
        deltaU: 0.015,   // unchanged
        deltaI: 0.012,   // revised from 0.008 - symptomatic relief only
        delta0: 0.008,   // revised from 0.005 - basic antibiotics
        delta1: 0.005,   // revised from 0.003 - better diagnostics
        delta2: 0.003,   // revised from 0.002 - imaging, broader antibiotics
        delta3: 0.002    // revised from 0.001 - specialized diagnostics
    }
};

// Function to update mortality rates in the content
function updateMortalityRates(content, rates) {
    let updatedContent = content;
    
    for (const [disease, mortalities] of Object.entries(rates)) {
        console.log(`Updating mortality rates for ${disease}...`);
        
        // Create regex patterns for each mortality type
        for (const [mortalityType, value] of Object.entries(mortalities)) {
            // Pattern to match the mortality rate in the disease profile
            const pattern = new RegExp(
                `(${disease}:[\\s\\S]*?${mortalityType}:\\s*)([0-9.]+)`,
                'g'
            );
            
            updatedContent = updatedContent.replace(pattern, `$1${value}`);
        }
    }
    
    return updatedContent;
}

// Update the content
const updatedContent = updateMortalityRates(content, revisedMortalityRates);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('Mortality rates have been updated successfully!');

// Also create a summary of changes
const summaryPath = path.join(__dirname, '..', 'data', 'mortality_rates_update_summary.txt');
let summary = 'Mortality Rates Update Summary\n';
summary += '==============================\n\n';

for (const [disease, mortalities] of Object.entries(revisedMortalityRates)) {
    summary += `${disease.replace(/_/g, ' ').toUpperCase()}:\n`;
    for (const [type, value] of Object.entries(mortalities)) {
        summary += `  ${type}: ${value}\n`;
    }
    summary += '\n';
}

fs.writeFileSync(summaryPath, summary, 'utf8');
console.log(`Summary written to ${summaryPath}`);