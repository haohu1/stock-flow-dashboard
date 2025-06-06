# Health System Parameters Validation Report

## Executive Summary

This report provides a comprehensive validation of health system parameters for Nigeria, Kenya, and South Africa across urban and rural settings. The analysis reveals several critical inconsistencies and opportunities for improvement in parameter calibration.

## 1. Parameter Consistency Check Across Countries

### 1.1 Care-Seeking Behavior (phi0, sigmaI)

**Current Implementation:**
- Base urban phi0: 0.65 (65% initial formal care seeking)
- Base rural phi0: 0.65 × 0.6 = 0.39 (60% reduction)
- Base urban sigmaI: 0.25 (25% transition from informal to formal)
- Base rural sigmaI: 0.25 × 0.5 = 0.125 (50% reduction)

**Country-Specific Adjustments:**
- Nigeria: Additional multiplier varies by disease (0.5-0.8)
- Kenya: Better care-seeking multipliers (0.7-0.9)
- South Africa: Highest multipliers (0.8-0.95)

**Issues Found:**
1. **Inconsistent rural penalty**: The 40% reduction in rural phi0 is applied uniformly across all countries, which doesn't reflect varying infrastructure quality
2. **Missing urban-rural gradient**: Binary urban/rural distinction oversimplifies reality
3. **Disease-specific variations not fully captured**: Some diseases (e.g., HIV) have vertical programs that maintain high care-seeking even in rural areas

### 1.2 Resolution Rates (mu parameters)

**Current Implementation:**
- Infrastructure multiplier: 0.5-1.0 based on hospital beds per 1,000
- Workforce multiplier: 0.6-1.0 based on physician density
- Rural penalty: Additional 20-40% reduction

**Calculated Multipliers:**
| Country | Infrastructure | Workforce | Combined Urban | Combined Rural |
|---------|---------------|-----------|----------------|----------------|
| Nigeria | 0.60 | 0.67 | 0.40 | 0.28-0.32 |
| Kenya | 0.78 | 0.63 | 0.49 | 0.34-0.39 |
| South Africa | 0.96 | 0.76 | 0.73 | 0.51-0.58 |

**Issues Found:**
1. **Double penalty for rural areas**: Infrastructure AND rural multipliers both reduce effectiveness
2. **Workforce calculation doesn't account for CHWs**: Kenya has extensive CHW programs not reflected
3. **No disease-specific adjustments**: TB programs in Kenya should have higher resolution rates

### 1.3 Mortality Rates (delta parameters)

**Current Implementation:**
- Base mortality varies by disease
- Country multipliers: 0.8-2.0 based on disease burden
- Rural areas: Additional 10-40% increase

**Issues Found:**
1. **Excessive rural mortality increases**: Combined with disease multipliers, rural mortality can be 2-3x urban
2. **No adjustment for vertical programs**: HIV mortality in South Africa should be lower due to strong ART program
3. **Age-specific mortality not captured**: Childhood diseases need different multipliers

### 1.4 Referral Patterns (rho parameters)

**Current Implementation:**
- Base referral rates: 0.7-1.1 for urban systems
- Rural reduction: 30-50% lower referral effectiveness

**Issues Found:**
1. **Unrealistic rural referral rates**: Combined multipliers can result in <20% effective referral
2. **No consideration of transport infrastructure**: South Africa's better roads should mean better referrals
3. **Disease-specific pathways ignored**: Emergency conditions should have different referral patterns

### 1.5 Cost Parameters

**Review Note:** Cost parameters were not found in the provided data files. This is a critical gap for economic evaluation.

### 1.6 Infrastructure and Workforce Multipliers

**Current Calculation Issues:**
1. **Bed ratio baseline too high**: WHO minimum of 2.5 beds/1,000 is aspirational for many LMICs
2. **Physician density ignores task-shifting**: Nurses and CHWs provide significant care
3. **No quality adjustment**: More beds doesn't always mean better care

## 2. Realism Check by Country

### 2.1 Nigeria

**Profile:** 52% urban, weak primary care, high childhood disease burden

**Parameter Realism Assessment:**
- ✅ High malaria/pneumonia/diarrhea incidence multipliers (1.5-1.8) reflect reality
- ❌ Rural care-seeking (phi0 ~0.23-0.31) seems too low given community programs
- ❌ Infrastructure multiplier (0.60) may be too generous for rural areas
- ✅ High maternal mortality parameters align with country data

### 2.2 Kenya

**Profile:** 28% urban, strong vertical programs, better infrastructure than regional average

**Parameter Realism Assessment:**
- ✅ High TB/HIV multipliers (1.5-1.8) reflect disease burden
- ❌ CHW resolution rates don't reflect Kenya's strong CHW program
- ❌ Rural penalties too severe given Kenya's health extension efforts
- ✅ Better care-seeking multipliers (0.8-0.9) reflect program success

### 2.3 South Africa

**Profile:** 67% urban, high HIV/TB burden, best regional infrastructure but high inequality

**Parameter Realism Assessment:**
- ✅ Very high HIV/TB multipliers (2.2-3.0) reflect world's highest burden
- ✅ Better infrastructure scores reflect stronger health system
- ❌ Urban-rural divide parameters don't capture extreme inequality
- ❌ NCD parameters (CHF multiplier 1.8) may be underestimated

## 3. Specific Issues and Inconsistencies

### 3.1 Critical Issues

1. **Parameter Stacking Problem**: Multiple multipliers compound to create unrealistic extremes
   - Example: Rural Nigeria pneumonia resolution = 0.5 × 0.7 × 0.6 × 0.67 = 0.14 (86% reduction!)

2. **Missing Disease-Program Interactions**: Vertical programs aren't modeled
   - Kenya's TB program should override general system weaknesses
   - South Africa's ART program should improve HIV outcomes despite system strain

3. **Uniform Rural Penalties**: Don't reflect country-specific rural health investments
   - Kenya's extensive CHW network
   - South Africa's clinic infrastructure

4. **No Congestion Modeling**: High-burden diseases should affect system performance

### 3.2 Data Gaps

1. **Cost parameters missing entirely**
2. **Quality of care indicators absent**
3. **Private sector care not modeled**
4. **Traditional medicine pathways ignored**

## 4. Recommendations for Parameter Adjustments

### 4.1 Immediate Fixes

1. **Revise Rural Multipliers by Country:**
   ```
   Nigeria Rural: phi0 × 0.5, resolution × 0.6
   Kenya Rural: phi0 × 0.7, resolution × 0.8  
   South Africa Rural: phi0 × 0.6, resolution × 0.7
   ```

2. **Add Disease-Vertical Program Overrides:**
   ```
   Kenya TB: Use urban parameters even in rural areas
   South Africa HIV: Resolution rates 20% higher than base
   All countries maternal: Boost referral rates by 30%
   ```

3. **Cap Combined Multipliers:**
   - Minimum effective resolution: 0.3
   - Maximum mortality multiplier: 2.5
   - Minimum referral effectiveness: 0.4

### 4.2 Structural Improvements

1. **Implement Graduated Urban-Rural Scale:**
   - Urban core (100% parameters)
   - Peri-urban (85% parameters)
   - Rural accessible (70% parameters)
   - Remote rural (50% parameters)

2. **Add Health Worker Density Tiers:**
   - Include nurses, CHWs in calculations
   - Weight by scope of practice
   - Account for task-shifting policies

3. **Model Vertical Program Effects:**
   - Create override parameters for strong programs
   - Allow program-specific care pathways
   - Capture donor-funded enhancements

4. **Implement Dynamic Congestion:**
   - Reduce resolution rates as caseload increases
   - Increase wait times and mortality
   - Model staff burnout effects

### 4.3 Country-Specific Adjustments

**Nigeria:**
- Reduce rural penalties for malaria (strong community programs)
- Increase urban congestion effects
- Add cost multiplier for out-of-pocket payments

**Kenya:**
- Boost CHW effectiveness across all diseases
- Reduce rural referral penalties
- Model free maternal care policy

**South Africa:**
- Add inequality gradient within urban/rural
- Increase NCD parameters
- Model private sector escape valve

## 5. Validation Checklist

- [ ] Verify combined multipliers stay within realistic bounds
- [ ] Check mortality rates against country DHS/vital statistics
- [ ] Validate care-seeking against household surveys
- [ ] Compare resolution times with program data
- [ ] Test parameter sensitivity on key outcomes
- [ ] Ensure AI intervention effects scale appropriately

## Conclusion

The current parameter set provides a reasonable starting framework but requires significant refinement to accurately represent health system realities in Nigeria, Kenya, and South Africa. Priority should be given to addressing parameter stacking issues, incorporating vertical program effects, and developing more nuanced urban-rural gradients.