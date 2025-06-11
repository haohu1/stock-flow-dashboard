# Hypertension Self-Care AI Fix Recommendation

## Problem Summary

The hypertension self-care AI intervention is only preventing single-digit deaths because the control rate improvement is too small:
- Base muI (informal care control): 0.15% per week
- With AI: 0.31% per week (only 2x improvement)
- Primary care mu1: 1.0% per week

This is unrealistic given that self-care AI provides:
- Systematic BP monitoring devices
- Access to antihypertensive medications
- Direct medication adherence support

## Root Cause

The hypertension AI effects are configured differently from other diseases:
```typescript
hypertension: {
  selfCareAI: {
    muIEffect: 0.004,     // Absolute increase: 0.4% per week
    // ...
  }
}
```

However, the code applies this as: `muI += muIEffect * magnitude * uptake`

With urban uptake of 0.396 (33% × 1.2), the actual increase is only:
- 0.004 × 0.396 = 0.00158 (0.158% per week)

## Recommended Fix

### Option 1: Change muIEffect to Achieve 80% of Primary Care Effectiveness

**Rationale**: BP monitors + medications at home should achieve similar outcomes to primary care.

```typescript
hypertension: {
  selfCareAI: {
    muIEffect: 4.3,       // 430% relative improvement (brings 0.15% to 0.795%)
    deltaIEffect: 0.70,   // 30% mortality reduction - early detection of crises
    phi0Effect: 0.15,     // 15% increase in care seeking - alerts for high readings
    sigmaIEffect: 1.50,   // 50% faster transition - urgent BP alerts
    visitReductionEffect: 0.40,      // 40% visit reduction - home monitoring
    smartRoutingRate: 0.50,          // 50% better routing - BP crisis detection
    queuePreventionRate: 0.45,       // 45% queue prevention - routine monitoring at home
    routingImprovementEffect: 0.45   // 45% routing improvement - severity assessment
  },
  triageAI: {
    phi0Effect: 0.02,     // 2% increase - minimal impact from advice alone
    sigmaIEffect: 1.05,   // 5% faster transition - limited without BP monitoring
    queuePreventionRate: 0.05,       // 5% prevention - can't assess BP without device
    smartRoutingRate: 0.05           // 5% routing - limited without clinical data
  },
  chwAI: {
    mu0Effect: 0.20,      // 20% relative improvement (brings 0.5% to 0.6%)
    delta0Effect: 0.95,   // 5% mortality reduction
    rho0Effect: 0.90      // 10% referral reduction
  },
  diagnosticAI: {
    mu1Effect: 0.20,      // 20% relative improvement (brings 1.0% to 1.2%)
    delta1Effect: 0.92,   // 8% mortality reduction
    rho1Effect: 0.85,     // 15% referral reduction
    mu2Effect: 0.08,      // 8% relative improvement at L2
    delta2Effect: 0.95,   // 5% mortality reduction at L2
    rho2Effect: 0.90      // 10% reduction in L2 referrals
  }
}
```

### Expected Impact

With these changes:
- Base muI: 0.15% per week
- With self-care AI: ~0.8% per week (80% of primary care effectiveness)
- Deaths prevented would increase from ~100 to ~1,000+ in typical scenarios

### Alternative Approach: Absolute Effects

If absolute effects are preferred, adjust for uptake:
```typescript
muIEffect: 0.0065 / uptakeParams.selfCareAI  // This gives 0.65% absolute increase after uptake
```

However, this makes the effect vary by uptake setting, which is not ideal.

## Implementation Notes

1. The current approach of using relative multipliers for muIEffect is consistent with how other AI effects work
2. The 4.3x multiplier reflects that self-care AI with BP monitors and medications is transformative
3. Advisory-only AI (triageAI) should have minimal impact as specified
4. Other AI interventions (CHW, diagnostic) should have moderate impacts as they only optimize existing care

## Testing

After implementation, verify:
1. muI with self-care AI reaches ~0.8% per week
2. Deaths prevented increases to 1,000+ in low-utilization scenarios
3. Impact scales appropriately with informal care usage
4. High formal care settings (like Rwanda) still show minimal impact