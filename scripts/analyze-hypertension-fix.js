// Analyze hypertension self-care AI fix options

console.log('=== HYPERTENSION SELF-CARE AI FIX ANALYSIS ===\n');

// Current parameters
const baseHypertension = {
  muI: 0.0015,   // 0.15% per week base control rate
  mu1: 0.010,    // 1.0% per week at primary care
};

// Current AI effect
const currentAIEffect = {
  muIEffect: 0.004,  // Absolute increase intended
  uptake: 0.396      // Urban uptake (33% × 1.2)
};

// Calculate current implementation
const currentIncrease = currentAIEffect.muIEffect * currentAIEffect.uptake;
const currentMuIWithAI = baseHypertension.muI + currentIncrease;

console.log('CURRENT IMPLEMENTATION:');
console.log(`  Base muI: ${(baseHypertension.muI * 100).toFixed(3)}% per week`);
console.log(`  AI effect: ${currentAIEffect.muIEffect} (absolute)`);
console.log(`  Uptake: ${currentAIEffect.uptake}`);
console.log(`  Actual increase: ${currentAIEffect.muIEffect} × ${currentAIEffect.uptake} = ${currentIncrease.toFixed(4)}`);
console.log(`  muI with AI: ${(currentMuIWithAI * 100).toFixed(3)}% per week`);
console.log(`  Target muI: 0.55% per week (3.7x improvement)`);
console.log(`  Achievement: ${(currentMuIWithAI * 100 / 0.55).toFixed(1)}% of target\n`);

// Option 1: Adjust muIEffect to account for uptake
const option1 = {
  muIEffect: 0.004 / currentAIEffect.uptake,  // Scale up to compensate
  description: 'Scale muIEffect to compensate for uptake reduction'
};

console.log('OPTION 1: Compensate for uptake scaling');
console.log(`  New muIEffect: ${option1.muIEffect.toFixed(4)} (${(0.004 / currentAIEffect.uptake).toFixed(4)})`);
console.log(`  Result: ${option1.muIEffect} × ${currentAIEffect.uptake} = ${(option1.muIEffect * currentAIEffect.uptake).toFixed(4)}`);
console.log(`  Final muI: ${((baseHypertension.muI + option1.muIEffect * currentAIEffect.uptake) * 100).toFixed(3)}% per week`);
console.log(`  Issue: Effect would vary by uptake rate\n`);

// Option 2: Convert to relative multiplier like other diseases
const targetMuI = 0.0055;  // 0.55% per week target
const requiredMultiplier = (targetMuI - baseHypertension.muI) / baseHypertension.muI;
const option2 = {
  muIEffect: requiredMultiplier,
  description: 'Use relative multiplier like other diseases'
};

console.log('OPTION 2: Convert to relative multiplier');
console.log(`  Required increase: ${targetMuI} - ${baseHypertension.muI} = ${(targetMuI - baseHypertension.muI).toFixed(4)}`);
console.log(`  As multiplier: ${requiredMultiplier.toFixed(2)} (${(requiredMultiplier * 100).toFixed(0)}% improvement)`);
console.log(`  New muIEffect: ${option2.muIEffect.toFixed(2)}`);
console.log(`  Result: ${baseHypertension.muI} × (1 + ${option2.muIEffect}) = ${(baseHypertension.muI * (1 + option2.muIEffect)).toFixed(4)}`);
console.log(`  Final muI: ${((baseHypertension.muI * (1 + option2.muIEffect)) * 100).toFixed(3)}% per week`);
console.log(`  Issue: Doesn't match the absolute addition model\n`);

// Option 3: Realistic approach - BP monitoring + meds should achieve similar to primary care
const option3 = {
  targetControl: 0.008,  // 0.8% per week (80% of primary care effectiveness)
  rationale: 'BP monitors + medications at home = 80% of primary care effectiveness'
};

const option3Multiplier = (option3.targetControl - baseHypertension.muI) / baseHypertension.muI;

console.log('OPTION 3: Realistic effectiveness (80% of primary care)');
console.log(`  Primary care control: ${(baseHypertension.mu1 * 100).toFixed(1)}% per week`);
console.log(`  Target for self-care: ${(option3.targetControl * 100).toFixed(1)}% per week (80% of primary)`);
console.log(`  Required multiplier: ${option3Multiplier.toFixed(1)} (${(option3Multiplier * 100).toFixed(0)}% improvement)`);
console.log(`  Final muI: ${((baseHypertension.muI * (1 + option3Multiplier)) * 100).toFixed(3)}% per week\n`);

// Calculate mortality impact with different options
console.log('=== MORTALITY IMPACT COMPARISON ===');
console.log('Assuming 1 million population, 50% informal care usage, 1 year:');

// Simple calculation: deaths = population × incidence × mortality_rate × weeks × (1 - control_effectiveness)
const incidence = 0.03;  // 3% annual
const mortality = 0.0008; // 0.08% per week in informal care
const weeks = 52;
const informalPop = 1000000 * incidence * 0.25; // 25% go to informal care

const deathsBase = informalPop * mortality * weeks;
const deathsOption1 = informalPop * mortality * weeks * (1 - targetMuI / (targetMuI + mortality));
const deathsOption3 = informalPop * mortality * weeks * (1 - option3.targetControl / (option3.targetControl + mortality));

console.log(`\nEstimated deaths in informal care:`);
console.log(`  Without AI: ${Math.round(deathsBase)}`);
console.log(`  With Option 1 (0.55% control): ${Math.round(deathsOption1)} (${Math.round(deathsBase - deathsOption1)} prevented)`);
console.log(`  With Option 3 (0.8% control): ${Math.round(deathsOption3)} (${Math.round(deathsBase - deathsOption3)} prevented)`);

console.log('\n=== RECOMMENDATION ===');
console.log('Use Option 3: Set muIEffect to achieve 80% of primary care effectiveness');
console.log(`Recommended muIEffect: ${option3Multiplier.toFixed(1)} (as relative multiplier)`);
console.log('This reflects that BP monitors + medications at home provide similar outcomes to primary care.');