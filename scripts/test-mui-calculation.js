// Test to understand muI calculation

const baseParams = {
  muI: 0.0015  // 0.15% per week
};

const muIEffect = 1.6;
const uptake = 0.396;

// The code does: muI += muIEffect * magnitude * uptake
// With magnitude = 1 (default), this becomes:
const addedValue = muIEffect * uptake;
const finalMuI = baseParams.muI + addedValue;

console.log('=== muI CALCULATION TEST ===');
console.log(`Base muI: ${baseParams.muI} (${(baseParams.muI * 100).toFixed(2)}% per week)`);
console.log(`muIEffect: ${muIEffect}`);
console.log(`Uptake: ${uptake}`);
console.log(`Added value: ${muIEffect} × ${uptake} = ${addedValue}`);
console.log(`Final muI: ${baseParams.muI} + ${addedValue} = ${finalMuI}`);
console.log(`Final muI percentage: ${(finalMuI * 100).toFixed(2)}% per week`);

console.log('\n=== WHAT WE WANT ===');
const targetMuI = 0.008; // 0.8% per week (80% of primary care)
const neededAddition = targetMuI - baseParams.muI;
const neededMuIEffect = neededAddition / uptake;

console.log(`Target muI: ${targetMuI} (${(targetMuI * 100).toFixed(2)}% per week)`);
console.log(`Needed addition: ${targetMuI} - ${baseParams.muI} = ${neededAddition}`);
console.log(`Required muIEffect: ${neededAddition} / ${uptake} = ${neededMuIEffect.toFixed(4)}`);

console.log('\n=== RECOMMENDATION ===');
console.log(`Change muIEffect from ${muIEffect} to ${neededMuIEffect.toFixed(4)}`);
console.log('This will achieve 0.8% control per week (80% of primary care effectiveness)');