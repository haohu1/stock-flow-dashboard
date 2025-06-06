# Self-Care AI Minimal Effects Update

## Principle Applied
For diseases where self-care can only provide advice/monitoring (not actual treatment), the difference between a self-care platform and basic AI health advisor should be minimal. All effects should be proportionally low, not just the resolution rate.

## Additional Effects Added
Previously, the default self-care AI effects included high values that would apply unless explicitly overridden:
- queuePreventionRate: 40% (default)
- routingImprovementEffect: 25% (default)

These have now been explicitly set to minimal values (2-3%) for all advice-only diseases.

## Changes Made

### 1. Childhood Pneumonia (danger signs only, needs antibiotics)
**All effects now minimal:**
- muIEffect: 5% (resolution in informal care)
- deltaIEffect: 0.98 (2% mortality reduction)
- phi0Effect: 3% (care seeking increase)
- sigmaIEffect: 1.05 (5% faster transition)
- visitReductionEffect: 2%
- smartRoutingRate: 5%
- queuePreventionRate: 2%
- routingImprovementEffect: 3%

### 2. Tuberculosis (adherence support only, needs DOTS)
**Previous values:**
- muIEffect: 5%
- phi0Effect: 10%
- sigmaIEffect: 1.15 (15% faster)
- visitReductionEffect: 5%
- smartRoutingRate: 15%

**Updated to minimal values:**
- muIEffect: 5% (unchanged)
- phi0Effect: 3% (minimal - just adherence reminders)
- sigmaIEffect: 1.05 (5% faster)
- visitReductionEffect: 2% (minimal)
- smartRoutingRate: 5% (minimal)

### 3. HIV Management (adherence support only, needs ART)
**Previous values:**
- muIEffect: 8%
- phi0Effect: 8%
- sigmaIEffect: 1.10 (10% faster)
- visitReductionEffect: 12% (too high for just adherence)
- smartRoutingRate: 20%

**Updated to minimal values:**
- muIEffect: 8% (unchanged)
- phi0Effect: 4% (minimal - side effect recognition)
- sigmaIEffect: 1.05 (5% faster)
- visitReductionEffect: 3% (minimal - appointment reminders)
- smartRoutingRate: 5% (minimal)

### 4. HIV Opportunistic Infections (mixed, but mostly needs medical care)
**Previous values:**
- muIEffect: 5%
- phi0Effect: 15%
- sigmaIEffect: 1.25 (25% faster)
- visitReductionEffect: 8%
- smartRoutingRate: 25%

**Updated to minimal values:**
- muIEffect: 5% (unchanged)
- phi0Effect: 3% (minimal - symptom recognition)
- sigmaIEffect: 1.05 (5% faster)
- visitReductionEffect: 2% (minimal)
- smartRoutingRate: 5% (minimal)

### 5. CHF (monitoring only, needs medical management)
**Already correct:**
- muIEffect: 0% (no resolution without medical care)
- deltaIEffect: 1.0 (no mortality reduction)
- visitReductionEffect: 2% (minimal - weight monitoring alerts)
- routingImprovementEffect: 2.5% (minimal)

## Rationale
When self-care AI can only provide advice or monitoring (not treatment), the platform capabilities are not significantly different from basic advisory services. Therefore:

1. **Resolution rates (muIEffect)** remain low (0-8%) as previously set
2. **Care-seeking increases (phi0Effect)** are now minimal (3-4%) - just basic danger sign education
3. **Transition speed (sigmaIEffect)** is now minimal (5% faster) - slight improvement in recognition
4. **Visit reduction** is now minimal (2-3%) - very limited ability to prevent visits
5. **Smart routing** is now minimal (5%) - limited improvement in navigation

This ensures that for advice-only conditions, the self-care platform provides only marginal benefits over basic advisory, which accurately reflects real-world limitations.