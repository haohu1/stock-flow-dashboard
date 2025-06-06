// Test script to verify TEST country calculations

// TEST country parameters
const phi0 = 1.0; // 100% seek formal care
const informalCareRatio = 0.0; // 0% stay untreated - everyone gets care

// Calculate flows
const stayUntreated = 1 - phi0;
const toInformalCare = (1 - informalCareRatio) * stayUntreated;
const trulyUntreated = informalCareRatio * stayUntreated;

console.log('\n=== TEST Country Patient Flow Analysis ===');
console.log(`Direct to formal care: ${(phi0 * 100).toFixed(1)}%`);
console.log(`To informal care: ${(toInformalCare * 100).toFixed(1)}%`);
console.log(`Stay untreated: ${(trulyUntreated * 100).toFixed(1)}%`);

// Self-care AI impact
const informalCareUsage = toInformalCare;
const baseVisitReduction = 0.20;
const scaledVisitReduction = baseVisitReduction * informalCareUsage;

console.log('\n=== Self-care AI Impact ===');
console.log(`Base visit reduction: ${(baseVisitReduction * 100).toFixed(1)}%`);
console.log(`Informal care usage: ${(informalCareUsage * 100).toFixed(1)}%`);
console.log(`Scaled visit reduction: ${(scaledVisitReduction * 100).toFixed(1)}%`);

console.log(`\nIn TEST country, self-care AI prevents ${(scaledVisitReduction * 100).toFixed(1)}% of cases.`);
console.log('This should be EXACTLY 0.0% - if not, there is a bug!');