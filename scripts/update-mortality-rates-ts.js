const fs = require('fs');
const path = require('path');

// Read the TypeScript file
const filePath = path.join(__dirname, '..', 'models', 'stockAndFlowModel.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Define the revised mortality rates based on medical evidence
const revisedMortalityRates = {
    'Congestive Heart Failure': {
        deltaU: 0.09,   // unchanged - severe CHF has high mortality
        deltaI: 0.08,   // revised from 0.06 - minimal benefit without prescription drugs
        delta0: 0.04,   // revised from 0.05 - CHW with basic diuretics
        delta1: 0.025,  // revised from 0.03 - primary care adds ACE/beta-blockers
        delta2: 0.015,  // revised from 0.02 - specialist care
        delta3: 0.01    // unchanged - ICU care
    },
    'Tuberculosis': {
        deltaU: 0.004,   // revised from 0.003 - aligned with 70% 10-year mortality
        deltaI: 0.0035,  // revised from 0.0025 - minimal benefit without antibiotics
        delta0: 0.0025,  // unchanged - DOTS programs
        delta1: 0.002,   // revised from 0.0015 - standard treatment
        delta2: 0.0015,  // revised from 0.001 - MDR-TB management
        delta3: 0.001    // revised from 0.0008 - XDR-TB care
    },
    'Pneumonia': {
        deltaU: 0.05,    // unchanged
        deltaI: 0.045,   // revised from 0.035 - minimal benefit without antibiotics
        delta0: 0.02,    // revised from 0.02 - oral amoxicillin
        delta1: 0.015,   // revised from 0.015 - IV antibiotics
        delta2: 0.01,    // revised from 0.02 - pediatric unit with oxygen
        delta3: 0.008    // revised from 0.01 - PICU care
    },
    'Malaria': {
        deltaU: 0.03,    // unchanged - severe malaria mortality
        deltaI: 0.025,   // revised from 0.02 - traditional remedies minimal benefit
        delta0: 0.005,   // revised from 0.001 - RDTs + ACTs highly effective
        delta1: 0.003,   // revised from 0.001 - parenteral artesunate
        delta2: 0.002,   // revised from 0.01 - ICU support
        delta3: 0.0015   // revised from 0.005 - advanced ICU
    },
    'Diarrheal Disease': {
        deltaU: 0.025,   // unchanged
        deltaI: 0.02,    // revised from 0.015 - home fluids provide some benefit
        delta0: 0.003,   // revised from 0.002 - ORS reduces mortality by 93%
        delta1: 0.002,   // revised from 0.001 - IV fluids
        delta2: 0.0015,  // revised from 0.01 - pediatric ward
        delta3: 0.001    // revised from 0.005 - ICU for complications
    },
    'HIV Management \\(Chronic\\)': {
        deltaU: 0.007,   // unchanged - ~35% 5-year mortality
        deltaI: 0.0065,  // revised from 0.005 - no ART access
        delta0: 0.004,   // revised from 0.004 - adherence support
        delta1: 0.002,   // revised from 0.001 - first-line ART
        delta2: 0.0015,  // revised from 0.05 - second-line ART
        delta3: 0.001    // revised from 2.0 (clear error) - third-line ART
    },
    'Upper Respiratory Tract Infection': {
        deltaU: 0.00002, // unchanged
        deltaI: 0.00001, // unchanged
        delta0: 0.00001, // unchanged
        delta1: 0.00001, // revised from 0.0005
        delta2: 0.00001, // revised from 0.0001
        delta3: 0.00001  // unchanged
    },
    'Fever of Unknown Origin': {
        deltaU: 0.015,   // unchanged
        deltaI: 0.012,   // revised from 0.008 - symptomatic relief only
        delta0: 0.008,   // revised from 0.005 - basic antibiotics
        delta1: 0.005,   // revised from 0.003 - better diagnostics
        delta2: 0.003,   // revised from 0.002 - imaging, broader antibiotics
        delta3: 0.002    // revised from 0.001 - specialized diagnostics
    },
    'HIV Opportunistic Infections': {
        deltaU: 0.007,   // unchanged - high mortality without treatment
        deltaI: 0.0065,  // revised from 0.005 - no effective treatment
        delta0: 0.004,   // revised from 0.004 - basic prophylaxis
        delta1: 0.002,   // revised from 0.001 - standard OI treatment
        delta2: 0.0015,  // revised from 0.05 - advanced OI management
        delta3: 0.001    // revised from 2.0 (clear error) - ICU care
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
            // TypeScript file uses quoted property names
            const pattern = new RegExp(
                `(['"]${disease}['"]:[\\s\\S]*?${mortalityType}:\\s*)([0-9.]+)`,
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

console.log('TypeScript mortality rates have been updated successfully!');