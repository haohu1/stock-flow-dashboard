// Test script to verify Rwanda self-care AI calculations
import { adjustParametersForCountry } from '../models/countrySpecificModel.js';
import { diseaseParametersCatalog } from '../models/stockAndFlowModel.js';

// Test Rwanda parameters
const baseParams = diseaseParametersCatalog.malaria;
const rwandaParams = adjustParametersForCountry(baseParams, 'rwanda', false, 'malaria');

console.log('\n=== Rwanda Parameter Analysis ===');
console.log(`phi0 (formal care seeking): ${rwandaParams.phi0}`);
console.log(`informalCareRatio: ${rwandaParams.informalCareRatio}`);

// Calculate actual informal care usage
const stayUntreated = 1 - rwandaParams.phi0;
const toInformalCare = (1 - rwandaParams.informalCareRatio) * stayUntreated;
const trulyUntreated = rwandaParams.informalCareRatio * stayUntreated;

console.log(`\nPatient flows:`);
console.log(`- Direct to formal care: ${(rwandaParams.phi0 * 100).toFixed(1)}%`);
console.log(`- To informal care: ${(toInformalCare * 100).toFixed(1)}%`);
console.log(`- Stay untreated: ${(trulyUntreated * 100).toFixed(1)}%`);

// Calculate self-care AI visit reduction scaling
const informalCareUsage = (1 - rwandaParams.phi0) * (1 - rwandaParams.informalCareRatio);
const baseVisitReduction = 0.20; // 20% base effect
const scaledVisitReduction = baseVisitReduction * informalCareUsage;

console.log(`\nSelf-care AI visit reduction:`);
console.log(`- Base effect: ${(baseVisitReduction * 100).toFixed(1)}%`);
console.log(`- Informal care usage: ${(informalCareUsage * 100).toFixed(1)}%`);
console.log(`- Scaled reduction: ${(scaledVisitReduction * 100).toFixed(1)}%`);

console.log(`\nThis means self-care AI prevents ${(scaledVisitReduction * 100).toFixed(1)}% of all cases from entering the system in Rwanda.`);
