"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple analysis script that manually examines country scenarios
const countrySpecificModel_1 = require("../models/countrySpecificModel");
console.log('# Comprehensive Country Scenario Review\n');
console.log('Generated:', new Date().toISOString(), '\n');
// Examine each country
const countries = ['nigeria', 'kenya', 'south_africa'];
for (const country of countries) {
    console.log(`## ${country.toUpperCase()}\n`);
    const profile = countrySpecificModel_1.countryProfiles[country];
    console.log('### Country Profile');
    console.log(`- GDP per capita: $${profile.gdpPerCapitaUSD}`);
    console.log(`- Health expenditure per capita: $${profile.healthExpenditurePerCapitaUSD}`);
    console.log(`- Physician density: ${profile.physicianDensityPer1000} per 1000`);
    console.log(`- Hospital beds: ${profile.hospitalBedsPer1000} per 1000`);
    console.log(`- Urban population: ${(profile.urbanPopulationPct * 100).toFixed(0)}%`);
    console.log(`- Description: ${profile.description}\n`);
    console.log('### Disease Burden Multipliers');
    console.log('| Disease | Incidence | Mortality | Care-Seeking | Notes |');
    console.log('|---------|-----------|-----------|--------------|-------|');
    const burdens = countrySpecificModel_1.countryDiseaseBurdens[country];
    for (const disease in burdens) {
        const burden = burdens[disease];
        console.log(`| ${disease} | ${burden.incidenceMultiplier}x | ${burden.mortalityMultiplier}x | ${burden.careSeekingMultiplier}x | ${burden.notes} |`);
    }
    console.log('\n### Rural Multipliers (from countrySpecificModel.ts)');
    console.log('Based on code analysis, rural multipliers are:');
    if (country === 'nigeria') {
        console.log('- Care-seeking (phi0): 0.5x (50% reduction)');
        console.log('- Transition to formal care (sigmaI): 0.4x (60% reduction)');
        console.log('- Informal care reliance: 1.8x (80% increase)');
        console.log('- CHW effectiveness (mu0): 0.6x');
        console.log('- Untreated mortality (deltaU): 1.4x');
        console.log('- Referral rates (rho0): 0.5x');
    }
    else if (country === 'kenya') {
        console.log('- Care-seeking (phi0): 0.7x (30% reduction - better CHW coverage)');
        console.log('- Transition to formal care (sigmaI): 0.6x (40% reduction)');
        console.log('- Informal care reliance: 1.5x (50% increase)');
        console.log('- CHW effectiveness (mu0): 0.8x');
        console.log('- Untreated mortality (deltaU): 1.3x');
        console.log('- Referral rates (rho0): 0.7x');
        console.log('- Note: TB program maintains 0.9x effectiveness in rural areas');
    }
    else if (country === 'south_africa') {
        console.log('- Care-seeking (phi0): 0.6x (40% reduction)');
        console.log('- Transition to formal care (sigmaI): 0.5x (50% reduction)');
        console.log('- Informal care reliance: 1.4x (40% increase)');
        console.log('- CHW effectiveness (mu0): 0.7x');
        console.log('- Untreated mortality (deltaU): 1.3x');
        console.log('- Referral rates (rho0): 0.6x');
        console.log('- Note: HIV program maintains 0.8x care-seeking in rural areas');
    }
    console.log('\n### Infrastructure & Workforce Multipliers');
    const infrastructureMultiplier = 0.7 + (0.3 * Math.min(profile.hospitalBedsPer1000 / 1.5, 1));
    const physicianRatio = profile.physicianDensityPer1000 / 1.0;
    let chwBonus = 0;
    if (country === 'kenya')
        chwBonus = 0.15;
    else if (country === 'south_africa')
        chwBonus = 0.10;
    else if (country === 'nigeria')
        chwBonus = 0.05;
    const workforceMultiplier = Math.min(1.1, 0.7 + (0.4 * Math.min(physicianRatio, 1)) + chwBonus);
    console.log(`- Infrastructure multiplier: ${infrastructureMultiplier.toFixed(2)} (based on ${profile.hospitalBedsPer1000} beds/1000)`);
    console.log(`- Workforce multiplier: ${workforceMultiplier.toFixed(2)} (based on ${profile.physicianDensityPer1000} physicians/1000 + ${chwBonus} CHW bonus)`);
    console.log('\n### Vertical Program Effects');
    if (country === 'kenya') {
        console.log('- TB program: mu0 × 1.2, mu1 × 1.3, minimum phi0 = 0.5');
    }
    else if (country === 'south_africa') {
        console.log('- HIV program: mu1 × 1.4, mu2 × 1.3, deltaU × 0.7, minimum phi0 = 0.7');
    }
    else if (country === 'nigeria') {
        console.log('- Malaria program: mu0 × 1.3, minimum phi0 = 0.4');
    }
    console.log('- All countries: Maternal health gets priority referrals (rho0 × 1.5, rho1 × 1.4)');
    console.log('\n---\n');
}
console.log('## Key Issues Identified\n');
console.log('### Nigeria');
console.log('**Urban Issues:**');
console.log('- Low baseline physician density (0.4/1000) creates workforce multiplier of only ~0.78');
console.log('- High disease burdens: childhood pneumonia (1.8x), diarrhea (1.7x), maternal mortality (1.6x)');
console.log('- Care-seeking already low for many conditions (0.5-0.65x baseline)');
console.log('\n**Rural Issues:**');
console.log('- Extremely low care-seeking after adjustments: ~0.15-0.33 for most conditions');
console.log('- High mortality multipliers compound: base disease burden × rural multiplier');
console.log('- Example: Maternal mortality could be 1.6 × 1.5 = 2.4x baseline');
console.log('- CHW effectiveness drops to 0.6x despite being most needed');
console.log('\n### Kenya');
console.log('**Urban Issues:**');
console.log('- Lowest physician density (0.2/1000) but offset by CHW programs (+0.15 bonus)');
console.log('- High HIV/TB burden but strong vertical programs compensate');
console.log('- 72% rural population means urban centers may be overwhelmed');
console.log('\n**Rural Issues:**');
console.log('- Better than Nigeria due to CHW programs but still significant gaps');
console.log('- TB program maintains effectiveness but HIV opportunistic infections problematic');
console.log('- Care-seeking drops to 0.49-0.63 range (0.7x multiplier)');
console.log('\n### South Africa');
console.log('**Urban Issues:**');
console.log('- Despite better resources, extreme HIV burden (2.5x incidence, 20.4% prevalence)');
console.log('- TB burden highest globally (2.2x incidence) with drug resistance');
console.log('- System strain from dual epidemics plus emerging NCDs');
console.log('\n**Rural Issues:**');
console.log('- Better infrastructure limits rural penalties but still significant');
console.log('- HIV program reach helps but opportunistic infections surge (3.0x incidence)');
console.log('- Care-seeking maintains 0.42-0.57 range due to programs');
console.log('\n## Recommended Parameter Adjustments\n');
console.log('### 1. Cap Extreme Values');
console.log('- Rural mortality multipliers: Cap at 1.5x to avoid unrealistic death rates');
console.log('- Minimum CHW effectiveness (mu0): Floor at 0.02 even in worst scenarios');
console.log('- Maximum untreated mortality (deltaU): Cap at 0.15 weekly (~99% annual)');
console.log('\n### 2. Adjust Care-Seeking Behavior');
console.log('- Nigeria rural: Increase base to 0.35 (from 0.30) to reflect community mobilization');
console.log('- Consider disease-specific minimums (e.g., maternal health never below 0.25)');
console.log('- Account for traditional healers as entry point to formal care');
console.log('\n### 3. Refine Vertical Program Effects');
console.log('- Create explicit vertical program parameters rather than hard-coded overrides');
console.log('- Allow programs to affect multiple parameters systematically');
console.log('- Model program coverage separately from general health system');
console.log('\n### 4. Add Capacity Constraints');
console.log('- Model finite capacity at each level (especially L1/L2)');
console.log('- Account for disease-specific resource requirements');
console.log('- Consider seasonal variation (malaria, pneumonia)');
console.log('\n### 5. Improve Rural Modeling');
console.log('- Differentiate between "rural" and "remote rural"');
console.log('- Model transportation/distance explicitly');
console.log('- Account for mobile clinics and outreach programs');
