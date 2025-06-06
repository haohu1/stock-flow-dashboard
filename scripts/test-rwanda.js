// Quick test to verify Rwanda parameter calculations

// Rwanda parameters
const phi0 = 0.92; // 92% seek formal care
const informalCareRatio = 0.98; // CORRECTED: 98% stay untreated

// Calculate flows
const stayUntreated = 1 - phi0;
const toInformalCare = (1 - informalCareRatio) * stayUntreated;
const trulyUntreated = informalCareRatio * stayUntreated;

console.log('\n=== Rwanda Patient Flow Analysis ===');
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

console.log(`\nIn Rwanda, self-care AI only prevents ${(scaledVisitReduction * 100).toFixed(1)}% of cases from entering the system.`);
console.log('This is much more realistic than the previous 35% reduction!');