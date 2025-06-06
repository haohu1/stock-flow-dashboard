# Infectious Disease Parameter Review Report

## Executive Summary

This report presents a comprehensive review of infectious disease parameters used in the stock-flow dashboard model, focusing on seven key diseases: Tuberculosis, Malaria, Childhood Pneumonia, Diarrheal Disease, HIV (chronic management and opportunistic infections), Fever of Unknown Origin, and Upper Respiratory Tract Infection (URTI). The review examines incidence rates, resolution rates, mortality rates, referral patterns, disability weights, and treatment pathways against WHO/literature standards.

## Key Findings

### 1. Tuberculosis

**Incidence Rate (λ = 0.002 or 200/100,000)**
- **Assessment**: Conservative for Sub-Saharan Africa
- **Issue**: The base rate of 200/100,000 is below the SSA average (>300/100,000). Countries like South Africa have rates >500/100,000
- **Recommendation**: Consider increasing base rate to 0.003-0.004 (300-400/100,000)
- **Note**: Country multipliers partially address this (Kenya: 1.5x = 300/100,000)

**Resolution Rates**
- μI = 0.02 (2% weekly) - Appropriate for spontaneous resolution
- μ0 = 0.03 (3% weekly) - Low but reflects CHW limitations in TB management
- μ1 = 0.04 (4% weekly) → ~25 weeks treatment - **Accurate** for 6-month DOTS therapy
- μ2 = 0.05, μ3 = 0.06 - Reasonable for MDR-TB management

**Mortality Rates**
- δU = 0.003 (0.3% weekly) - Reasonable for untreated TB
- δ1 = 0.001 (0.1% weekly) - Appropriate for treated TB
- **Issue**: δI = 0.0025 seems high for informal care if includes partial treatment

**Referral Pattern (ρ0 = 0.85)**
- **Appropriate**: CHWs cannot diagnose TB without laboratory confirmation

### 2. Malaria

**Incidence Rate (λ = 0.4 or 40%)**
- **Assessment**: Appropriate for endemic areas
- **Justification**: Reflects high-transmission zones (e.g., Nigerian wetlands)
- Country multipliers adjust well (Nigeria: 1.5x = 60%, Kenya: 1.1x = 44%)

**Resolution Rates**
- μI = 0.15 (15% weekly) - Reasonable spontaneous resolution
- μ0 = 0.8 (80% weekly) - **Excellent** and reflects RDT+ACT effectiveness
- μ1 = 0.85 (85% weekly) - Appropriate for uncomplicated malaria
- **Issue**: μ2 = 0.6, μ3 = 0.7 seem low for severe malaria in hospitals

**Mortality Rates**
- δU = 0.03 (3% weekly) - Appropriate for untreated
- δ2 = 0.03 (3% weekly) - **Too high** for treated severe malaria; should be ~1-2%
- δ1 = 0.001 (0.1% weekly) - Appropriate for treated uncomplicated

**Referral Pattern (ρ0 = 0.5)**
- **Appropriate**: Reflects CHW capability with RDTs

### 3. Childhood Pneumonia

**Incidence Rate (λ = 0.9 or 90% annual)**
- **Assessment**: Realistic for under-5 population
- **Justification**: Multiple episodes per child per year in LMIC settings
- Note: Separate "Infant Pneumonia" (λ = 1.2) captures higher severity in <1 year

**Resolution Rates**
- μI = 0.1 (10% weekly) - Low spontaneous resolution appropriate
- μ0 = 0.7 (70% weekly) - **Excellent** for CHW amoxicillin treatment
- μ1 = 0.8 (80% weekly) - Appropriate for primary care
- μ2 = 0.7 - **Issue**: Should be higher than μ1 for hospital care

**Mortality Rates**
- δU = 0.05 (5% weekly) - Appropriate for untreated severe pneumonia
- δ0 = 0.01 (1% weekly) - Reasonable for CHW-treated
- δ2 = 0.02 (2% weekly) - **Too high** for hospital-treated pneumonia

### 4. Diarrheal Disease

**Incidence Rate (λ = 1.5 episodes/child-year)**
- **Assessment**: Accurate for LMIC settings
- **Justification**: Aligns with GEMS study and WHO estimates

**Resolution Rates**
- μI = 0.35 (35% weekly) - Appropriate spontaneous resolution
- μ0 = 0.85 (85% weekly) - **Excellent** for ORS/Zinc effectiveness
- μ1 = 0.9 (90% weekly) - Appropriate for facility care
- μ2 = 0.8 - **Issue**: Lower than primary care seems illogical

**Mortality Rates**
- δU = 0.025 (2.5% weekly) - Appropriate for severe dehydration
- δ0 = 0.002 (0.2% weekly) - Reasonable with proper ORS
- All mortality rates appear well-calibrated

### 5. HIV Management

**HIV Chronic Management**
**Incidence Rate (λ = 0.001 or 0.1%)**
- **Assessment**: Too low for high-burden countries
- **Issue**: Should be 0.005-0.01 (0.5-1%) for countries like South Africa
- Country multipliers partially compensate (Kenya: 1.8x = 0.18%)

**Resolution Rates** (Note: "Resolution" means viral suppression)
- μI = 0.01 (1% weekly) - Appropriate for no treatment
- μ0 = 0.05 (5% weekly) - Low but reflects CHW limitations
- μ1 = 0.1 (10% weekly) → ~10 weeks to suppression - **Reasonable**
- μ2-μ3 = 0.12-0.15 - Appropriate progression

**Mortality Rates**
- δU = 0.007 (0.7% weekly) - Appropriate for untreated HIV
- δ1 = 0.0005 (0.05% weekly) - **Excellent** for ART mortality

**HIV Opportunistic Infections**
- Not found in main disease parameters file
- **Critical Gap**: OIs are major cause of HIV mortality

### 6. Fever of Unknown Origin

**Incidence Rate (λ = 0.6 or 60%)**
- **Assessment**: Reasonable as catch-all category
- Represents undifferentiated fever presentations

**Resolution Rates**
- μI = 0.3 (30% weekly) - Good spontaneous resolution
- Progressive improvement with care levels (0.55→0.9)
- Well-calibrated for mixed etiology condition

**Mortality Rates**
- Generally low (0.001-0.015) - Appropriate for mixed conditions
- Reflects that most fevers are self-limiting

### 7. Upper Respiratory Tract Infection (URTI)

**Incidence Rate (λ = 2.0 or 200%)**
- **Assessment**: Accurate - multiple episodes per person per year

**Resolution Rates**
- μI = 0.7 (70% weekly) - **Excellent** spontaneous resolution
- μ0-μ3 = 0.75-0.9 - Minimal benefit from treatment appropriate

**Mortality Rates**
- δU = 0.00002 (0.002% weekly) - **Appropriately minimal**
- All mortality rates essentially negligible - correct for URTI

## Critical Issues Identified

### 1. **Missing HIV Opportunistic Infections**
- OIs are not in the main disease file despite being referenced elsewhere
- This is a critical gap as OIs cause significant HIV-related mortality

### 2. **Inconsistent Hospital Resolution Rates**
- Several diseases show μ2 < μ1 (district worse than primary)
- Examples: Pneumonia (0.7 vs 0.8), Diarrhea (0.8 vs 0.9), Malaria (0.6 vs 0.85)
- This is clinically illogical and should be corrected

### 3. **Excessive Hospital Mortality for Some Conditions**
- Malaria δ2 = 0.03 (3% weekly) too high for treated severe malaria
- Pneumonia δ2 = 0.02 (2% weekly) excessive for hospital care
- These rates don't reflect improved outcomes with hospital resources

### 4. **Conservative TB Incidence**
- Base rate of 200/100,000 is below SSA average
- While country multipliers help, base should be higher

### 5. **Low HIV Incidence**
- 0.1% annual incidence too low for generalized epidemics
- Should be 0.5-1% for high-burden settings

## Recommendations

### Immediate Corrections Needed:
1. **Add HIV Opportunistic Infections** to disease parameters with appropriate values
2. **Fix hospital resolution rates** - ensure μ2 > μ1 for all diseases
3. **Reduce hospital mortality rates** for malaria and pneumonia to reflect better care
4. **Increase base TB incidence** to 0.003-0.004
5. **Increase base HIV incidence** to 0.005-0.01

### Parameter Adjustments:
```
Malaria: 
- μ2: 0.6 → 0.9 (severe malaria with artesunate)
- δ2: 0.03 → 0.01 (reflects AQUAMAT trial outcomes)

Pneumonia:
- μ2: 0.7 → 0.85 (hospital pneumonia management)
- δ2: 0.02 → 0.008 (with oxygen and antibiotics)

Diarrhea:
- μ2: 0.8 → 0.95 (IV fluids for severe dehydration)

TB:
- λ: 0.002 → 0.003 (300/100,000 base rate)

HIV:
- λ: 0.001 → 0.005 (0.5% base rate)
```

### Long-term Improvements:
1. **Add seasonal variation** for malaria and diarrhea
2. **Include age-specific parameters** more systematically
3. **Add drug resistance parameters** for TB and malaria
4. **Include HIV stage progression** (CD4-based)
5. **Add co-infection interactions** (TB-HIV, malaria-anemia)

## Conclusion

The model parameters are generally well-researched and justified, with strong alignment to WHO guidelines and literature for most diseases. The rationales provided show careful consideration of LMIC contexts. However, several critical issues need addressing, particularly around hospital-level care parameters and missing HIV opportunistic infections. With the recommended corrections, the model will better reflect the reality of infectious disease management in Sub-Saharan African health systems.

The use of country-specific multipliers is a strength, allowing adaptation to local epidemiology while maintaining a consistent framework. The distinction between CHW, primary, district, and tertiary care levels appropriately captures the complexity of LMIC health systems.