# Critical Review of Mortality Rates by Disease and Care Level

## Executive Summary

This review examines the mortality rates across different care levels for 10 diseases in the health system model. Several critical issues were identified that undermine medical realism:

1. **Inverted mortality progressions** where higher care levels have worse outcomes
2. **Unrealistic informal care benefits** for conditions requiring prescription medications
3. **Extreme mortality rate changes** between care levels that lack medical justification
4. **Potential data entry errors** particularly for HIV-related conditions

## Mortality Rate Analysis by Disease

### Table 1: Mortality Rates by Disease and Care Level (Weekly Rates)

| Disease | Untreated | Informal | CHW | Primary | District | Tertiary |
|---------|-----------|----------|-----|---------|----------|----------|
| Congestive Heart Failure | 0.09 | 0.06 | - | - | - | - |
| Tuberculosis | 0.003 | 0.0025 | - | - | - | - |
| Childhood Pneumonia | 0.05 | 0.035 | 0.02 | 0.015 | 0.02 | 0.01 |
| Malaria | 0.03 | 0.02 | 0.0003 | 0.0002 | 0.001 | 0.0006 |
| Fever of Unknown Origin | 0.015 | 0.008 | - | - | - | - |
| Diarrheal Disease | 0.025 | 0.015 | 0.003 | 0.002 | 0.003 | 0.0015 |
| Infant Pneumonia | 0.06 | 0.04 | - | - | - | - |
| HIV Chronic Management | 0.007 | 0.005 | 0.004 | 0.002 | 0.015 | 2.0 |
| HIV Opportunistic Infections | 0.007 | 0.005 | 0.004 | 0.002 | 0.015 | 2.0 |
| Upper Respiratory Tract Infection | 0.00002 | 0.00001 | - | - | - | - |

*Note: "-" indicates care level not applicable for that disease*

## Critical Issues Identified

### 1. Inverted Mortality Progressions

**Problem**: Four diseases show INCREASING mortality at higher care levels:

- **Childhood Pneumonia**: District (0.02) > Primary (0.015)
- **Malaria**: District (0.001) > CHW (0.0003) and Tertiary (0.0006) > Primary (0.0002)
- **Diarrheal Disease**: District (0.003) = CHW (0.003) > Primary (0.002)
- **HIV Management**: Catastrophic increase from Primary (0.002) to District (0.015) to Tertiary (2.0)

**Medical Reality**: Higher levels of care have better equipment, specialists, and resources. Mortality should decrease or remain stable, never increase.

### 2. Unrealistic Informal Care Benefits

**Problem**: Substantial mortality reductions from informal care:

- **CHF**: 33% reduction (0.09 → 0.06)
- **Pneumonia**: 30% reduction (0.05 → 0.035)
- **Infant Pneumonia**: 33% reduction (0.06 → 0.04)
- **Fever**: 47% reduction (0.015 → 0.008)

**Medical Reality**: 
- CHF requires prescription medications (ACE inhibitors, beta-blockers, diuretics)
- Pneumonia requires antibiotics
- Informal care typically provides only symptom relief (paracetamol, traditional remedies)
- These mortality reductions are implausible without proper medications

### 3. Extreme Rate Changes

**Problem**: Some transitions show mathematically extreme changes:

- **Malaria**: 75-fold drop from informal (0.02) to CHW (0.0003)
- **HIV**: 200-fold increase from primary (0.002) to tertiary (2.0)
- **Diarrhea**: 5-fold drop from informal (0.015) to CHW (0.003)

**Medical Reality**: While proper treatment dramatically improves outcomes, these magnitudes strain credibility.

### 4. HIV Data Entry Errors

**Problem**: HIV chronic management and HIV opportunistic infections have identical parameters across all fields.

**Likely Issue**: Copy-paste error. The 2.0% weekly mortality at tertiary level is almost certainly meant to be 0.02% or 0.002%.

## Disease-Specific Analysis

### Congestive Heart Failure
- **Issue**: 33% mortality reduction with informal care is unrealistic
- **Reality**: CHF requires prescription medications and monitoring
- **Recommendation**: Reduce informal care benefit to 10-15%

### Tuberculosis
- **Rates appear reasonable**: Small reduction with informal care (17%)
- **Note**: TB requires 6+ months of antibiotics; informal care provides minimal benefit

### Childhood Pneumonia
- **Major Issue**: District mortality (0.02) > Primary mortality (0.015)
- **Reality**: District hospitals have oxygen, better antibiotics, pediatric specialists
- **Recommendation**: Set district ≤ 0.01, tertiary ≤ 0.008

### Malaria
- **Major Issues**: 
  1. 75-fold mortality drop from informal to CHW is extreme
  2. District and tertiary mortality > primary care
- **Recommendation**: Smooth progression: CHW (0.002), Primary (0.0015), District (0.001), Tertiary (0.0008)

### Diarrheal Disease
- **Issue**: District mortality equals CHW mortality
- **Reality**: District hospitals have IV fluids, better monitoring
- **Recommendation**: District should be ≤ 0.0015

### HIV Management
- **Critical Error**: 2.0% weekly mortality at tertiary level (100% annual mortality!)
- **Recommendation**: Change to 0.002% or remove tertiary care for chronic management

### Upper Respiratory Tract Infection
- **Rates appear appropriate**: Very low baseline mortality
- **Note**: Correctly shows minimal benefit from medical intervention

## Recommendations

1. **Fix Inverted Progressions**: Ensure mortality decreases monotonically with care level
2. **Adjust Informal Care Benefits**: 
   - Conditions requiring prescription drugs: ≤15% benefit
   - Self-limiting conditions: Current benefits acceptable
3. **Smooth Extreme Transitions**: Review malaria CHW effectiveness
4. **Correct Data Errors**: Fix HIV tertiary mortality rate
5. **Add Medical Logic**: Consider disease-specific patterns:
   - Acute conditions: Rapid improvement with proper care
   - Chronic conditions: Gradual improvement, focus on long-term management
   - Infectious diseases: Dramatic improvement with antibiotics/antivirals

## Conclusion

The current mortality rates contain several medically implausible patterns that could lead to incorrect policy conclusions. Most critically, the inverted mortality progressions suggest that seeking higher-level care increases death risk, which could discourage appropriate healthcare utilization in the model. These issues should be addressed before using the model for policy analysis.