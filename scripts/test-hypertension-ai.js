const { diseaseProfiles, applyAIInterventions, defaultAIBaseEffects, diseaseSpecificAIEffects, defaultAICostParameters } = require('./models/stockAndFlowModel.js');

console.log('\n=== HYPERTENSION AI EFFECTS ANALYSIS ===\n');

// Get base hypertension parameters
const baseParams = diseaseProfiles.hypertension;
console.log('Base hypertension control rates:');
console.log(`  Untreated (muU): ${(baseParams.muU * 100).toFixed(1)}% per week`);
console.log(`  Informal care (muI): ${(baseParams.muI * 100).toFixed(1)}% per week`);
console.log(`  CHW (mu0): ${(baseParams.mu0 * 100).toFixed(1)}% per week`);
console.log(`  Primary care (mu1): ${(baseParams.mu1 * 100).toFixed(1)}% per week`);

// Test each AI intervention individually
const aiInterventions = [
  { name: 'Self-care AI', config: { selfCareAI: true } },
  { name: 'Triage AI', config: { triageAI: true } },
  { name: 'CHW AI', config: { chwAI: true } },
  { name: 'Diagnostic AI', config: { diagnosticAI: true } },
  { name: 'Bed Management AI', config: { bedManagementAI: true } },
  { name: 'Hospital Decision AI', config: { hospitalDecisionAI: true } }
];

console.log('\n=== AI INTERVENTION IMPACTS ===\n');

aiInterventions.forEach(intervention => {
  const modifiedParams = applyAIInterventions(
    baseParams,
    intervention.config,
    {},
    undefined,
    undefined,
    'hypertension'
  );
  
  console.log(`${intervention.name}:`);
  
  // For self-care AI, show informal care improvement
  if (intervention.config.selfCareAI) {
    const muIAbsolute = (modifiedParams.muI * 100).toFixed(2);
    const muIImprovement = ((modifiedParams.muI - baseParams.muI) / baseParams.muI * 100).toFixed(1);
    console.log(`  Informal care control: ${(baseParams.muI * 100).toFixed(2)}% → ${muIAbsolute}% per week`);
    console.log(`  Relative improvement: +${muIImprovement}%`);
    console.log(`  Visit reduction: ${(modifiedParams.visitReduction * 100).toFixed(0)}%`);
  }
  
  // For CHW AI
  if (intervention.config.chwAI) {
    const mu0Absolute = (modifiedParams.mu0 * 100).toFixed(2);
    const mu0Improvement = ((modifiedParams.mu0 - baseParams.mu0) / baseParams.mu0 * 100).toFixed(1);
    console.log(`  CHW control: ${(baseParams.mu0 * 100).toFixed(2)}% → ${mu0Absolute}% per week`);
    console.log(`  Relative improvement: +${mu0Improvement}%`);
  }
  
  // For diagnostic AI
  if (intervention.config.diagnosticAI) {
    const mu1Absolute = (modifiedParams.mu1 * 100).toFixed(2);
    const mu1Improvement = ((modifiedParams.mu1 - baseParams.mu1) / baseParams.mu1 * 100).toFixed(1);
    console.log(`  Primary care control: ${(baseParams.mu1 * 100).toFixed(2)}% → ${mu1Absolute}% per week`);
    console.log(`  Relative improvement: +${mu1Improvement}%`);
  }
  
  // Show care-seeking changes
  const phi0Change = ((modifiedParams.phi0 - baseParams.phi0) / baseParams.phi0 * 100).toFixed(1);
  if (Math.abs(phi0Change) > 0.1) {
    console.log(`  Formal care seeking change: +${phi0Change}%`);
  }
  
  console.log('');
});

// Show disease-specific effects
console.log('\n=== DISEASE-SPECIFIC AI EFFECTS FOR HYPERTENSION ===\n');
const htpEffects = diseaseSpecificAIEffects.hypertension;
if (htpEffects) {
  Object.entries(htpEffects).forEach(([aiType, effects]) => {
    console.log(`${aiType}:`);
    if (effects.muIEffect !== undefined) console.log(`  muIEffect: ${(effects.muIEffect * 100).toFixed(0)}%`);
    if (effects.mu0Effect !== undefined) console.log(`  mu0Effect: ${(effects.mu0Effect * 100).toFixed(0)}%`);
    if (effects.mu1Effect !== undefined) console.log(`  mu1Effect: ${(effects.mu1Effect * 100).toFixed(0)}%`);
    if (effects.visitReductionEffect !== undefined) console.log(`  visitReductionEffect: ${(effects.visitReductionEffect * 100).toFixed(0)}%`);
  });
}