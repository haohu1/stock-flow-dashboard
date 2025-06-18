# Disease Parameter Comparison Report

This report compares the disease parameters between the Clinical Parameter Guide (ClinicalParameterGuide.tsx) and the actual model implementation (stockAndFlowModel.ts).

## Summary of Findings

### ❌ CRITICAL MISMATCHES FOUND

Multiple significant discrepancies were identified between the clinical guide and the model parameters. These mismatches could lead to incorrect understanding of model behavior and flawed clinical interpretations.

## Detailed Comparison by Disease

### 1. Congestive Heart Failure (CHF)

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.09 | 0.09 | ✅ | - |
| deltaI (informal) | 0.08 | 0.06 | ❌ | Model has lower informal mortality |
| delta0 (CHW) | 0.04 | 0.05 | ❌ | Model has higher CHW mortality |
| delta1 (primary) | 0.025 | 0.03 | ❌ | Model has higher primary mortality |
| delta2 (district) | 0.015 | 0.02 | ❌ | Model has higher district mortality |
| delta3 (tertiary) | 0.01 | 0.01 | ✅ | - |
| **Resolution Rates** |
| muU (untreated) | 0.004 | 0.004 | ✅ | - |
| muI (informal) | 0.01 | 0.01 | ✅ | - |
| mu0 (CHW) | 0.03 | 0.03 | ✅ | - |
| mu1 (primary) | 0.35 | 0.35 | ✅ | - |
| mu2 (district) | 0.55 | 0.55 | ✅ | - |
| mu3 (tertiary) | 0.75 | 0.75 | ✅ | - |

### 2. Tuberculosis

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.003 | 0.004 | ❌ | Model has higher untreated mortality |
| deltaI (informal) | 0.0028 | 0.0035 | ❌ | Model has higher informal mortality |
| delta0 (CHW) | 0.0025 | 0.0025 | ✅ | - |
| delta1 (primary) | 0.002 | 0.0015 | ❌ | Model has lower primary mortality |
| delta2 (district) | 0.0015 | 0.001 | ❌ | Model has lower district mortality |
| delta3 (tertiary) | 0.001 | 0.0008 | ❌ | Model has lower tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.005 | 0.005 | ✅ | - |
| muI (informal) | 0.02 | 0.02 | ✅ | - |
| mu0 (CHW) | 0.03 | 0.03 | ✅ | - |
| mu1 (primary) | 0.04 | 0.04 | ✅ | - |
| mu2 (district) | 0.05 | 0.05 | ✅ | - |
| mu3 (tertiary) | 0.06 | 0.06 | ✅ | - |

### 3. Childhood Pneumonia

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.05 | 0.05 | ✅ | - |
| deltaI (informal) | 0.045 | 0.035 | ❌ | Model has lower informal mortality |
| delta0 (CHW) | 0.02 | 0.01 | ❌ | Model has much lower CHW mortality |
| delta1 (primary) | 0.015 | 0.005 | ❌ | Model has much lower primary mortality |
| delta2 (district) | 0.01 | 0.008 | ❌ | Model has lower district mortality |
| delta3 (tertiary) | 0.008 | 0.005 | ❌ | Model has lower tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.06 | 0.06 | ✅ | - |
| muI (informal) | 0.10 | 0.10 | ✅ | - |
| mu0 (CHW) | 0.70 | 0.70 | ✅ | - |
| mu1 (primary) | 0.80 | 0.80 | ✅ | - |
| mu2 (district) | 0.85 | 0.85 | ✅ | - |
| mu3 (tertiary) | 0.90 | 0.90 | ✅ | - |

### 4. Malaria

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.03 | 0.075 | ❌ | Model has 2.5x higher untreated mortality |
| deltaI (informal) | 0.025 | 0.075 | ❌ | Model has 3x higher informal mortality |
| delta0 (CHW) | 0.005 | 0.001 | ❌ | Model has much lower CHW mortality |
| delta1 (primary) | 0.003 | 0.001 | ❌ | Model has lower primary mortality |
| delta2 (district) | 0.002 | 0.01 | ❌ | Model has 5x higher district mortality |
| delta3 (tertiary) | 0.0015 | 0.005 | ❌ | Model has 3.3x higher tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.08 | 0.08 | ✅ | - |
| muI (informal) | 0.15 | 0.15 | ✅ | - |
| mu0 (CHW) | 0.75 | 0.75 | ✅ | - |
| mu1 (primary) | 0.80 | 0.80 | ✅ | - |
| mu2 (district) | 0.90 | 0.90 | ✅ | - |
| mu3 (tertiary) | 0.95 | 0.95 | ✅ | - |

### 5. Diarrhea

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.025 | 0.025 | ✅ | - |
| deltaI (informal) | 0.02 | 0.015 | ❌ | Model has lower informal mortality |
| delta0 (CHW) | 0.003 | 0.002 | ❌ | Model has lower CHW mortality |
| delta1 (primary) | 0.002 | 0.001 | ❌ | Model has lower primary mortality |
| delta2 (district) | 0.0015 | 0.01 | ❌ | Model has 6.7x higher district mortality |
| delta3 (tertiary) | 0.001 | 0.005 | ❌ | Model has 5x higher tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.35 | 0.20 | ❌ | Model has lower untreated resolution |
| muI (informal) | 0.35 | 0.35 | ✅ | - |
| mu0 (CHW) | 0.85 | 0.85 | ✅ | - |
| mu1 (primary) | 0.90 | 0.90 | ✅ | - |
| mu2 (district) | 0.80 | 0.80 | ✅ | - |
| mu3 (tertiary) | 0.85 | 0.85 | ✅ | - |

### 6. HIV Management (Chronic)

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.002 | 0.002 | ✅ | - |
| deltaI (informal) | 0.002 | 0.002 | ✅ | - |
| delta0 (CHW) | 0.0015 | 0.0015 | ✅ | - |
| delta1 (primary) | 0.0001 | 0.0001 | ✅ | - |
| delta2 (district) | 0.0005 | 0.0005 | ✅ | - |
| delta3 (tertiary) | 0.02 | 0.02 | ✅ | - |
| **Resolution Rates** |
| muU (untreated) | 0 | 0 | ✅ | - |
| muI (informal) | 0 | 0 | ✅ | - |
| mu0 (CHW) | 0.05 | 0.05 | ✅ | - |
| mu1 (primary) | 0.10 | 0.10 | ✅ | - |
| mu2 (district) | 0.12 | 0.12 | ✅ | - |
| mu3 (tertiary) | 0.15 | 0.15 | ✅ | - |

### 7. Upper Respiratory Tract Infection (URTI)

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.00001 | 0.00002 | ❌ | Model has 2x higher untreated mortality |
| deltaI (informal) | 0.00001 | 0.00001 | ✅ | - |
| delta0 (CHW) | 0.00001 | 0.00001 | ✅ | - |
| delta1 (primary) | 0.00001 | 0.000005 | ❌ | Model has lower primary mortality |
| delta2 (district) | 0.00001 | 0.000001 | ❌ | Model has much lower district mortality |
| delta3 (tertiary) | 0.00001 | 0.000001 | ❌ | Model has much lower tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.70 | 0.65 | ❌ | Model has lower untreated resolution |
| muI (informal) | 0.70 | 0.70 | ✅ | - |
| mu0 (CHW) | 0.75 | 0.75 | ✅ | - |
| mu1 (primary) | 0.80 | 0.80 | ✅ | - |
| mu2 (district) | 0.85 | 0.85 | ✅ | - |
| mu3 (tertiary) | 0.90 | 0.90 | ✅ | - |

### 8. Fever

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.015 | 0.015 | ✅ | - |
| deltaI (informal) | 0.012 | 0.008 | ❌ | Model has lower informal mortality |
| delta0 (CHW) | 0.008 | 0.005 | ❌ | Model has lower CHW mortality |
| delta1 (primary) | 0.005 | 0.003 | ❌ | Model has lower primary mortality |
| delta2 (district) | 0.003 | 0.002 | ❌ | Model has lower district mortality |
| delta3 (tertiary) | 0.002 | 0.001 | ❌ | Model has lower tertiary mortality |
| **Resolution Rates** |
| muU (untreated) | 0.30 | 0.25 | ❌ | Model has lower untreated resolution |
| muI (informal) | 0.30 | 0.30 | ✅ | - |
| mu0 (CHW) | 0.50 | 0.55 | ❌ | Model has higher CHW resolution |
| mu1 (primary) | 0.70 | 0.70 | ✅ | - |
| mu2 (district) | 0.80 | 0.80 | ✅ | - |
| mu3 (tertiary) | 0.90 | 0.90 | ✅ | - |

### 9. Hypertension

| Parameter | Clinical Guide | Model | Match? | Impact |
|-----------|---------------|--------|---------|---------|
| **Mortality Rates** |
| deltaU (untreated) | 0.0015 | 0.0015 | ✅ | - |
| deltaI (informal) | 0.0008 | 0.0008 | ✅ | - |
| delta0 (CHW) | 0.0004 | 0.0004 | ✅ | - |
| delta1 (primary) | 0.0002 | 0.0002 | ✅ | - |
| delta2 (district) | 0.0003 | 0.0003 | ✅ | - |
| delta3 (tertiary) | 0.0005 | 0.0005 | ✅ | - |
| **Resolution Rates** |
| muU (untreated) | 0.05 | 0.05 | ✅ | - |
| muI (informal) | 0.15 | 0.15 | ✅ | - |
| mu0 (CHW) | 0.40 | 0.40 | ✅ | - |
| mu1 (primary) | 0.65 | 0.65 | ✅ | - |
| mu2 (district) | 0.75 | 0.75 | ✅ | - |
| mu3 (tertiary) | 0.85 | 0.85 | ✅ | - |

## Key Findings Summary

### Diseases with Perfect Match
- **HIV Management**: All parameters match perfectly
- **Hypertension**: All parameters match perfectly

### Diseases with Major Discrepancies
1. **Malaria**: 
   - Untreated/informal mortality 2.5-3x higher in model
   - District/tertiary mortality 3-5x higher in model
   
2. **Diarrhea**:
   - District/tertiary mortality 5-6.7x higher in model
   - Untreated resolution lower in model

3. **Childhood Pneumonia**:
   - All mortality rates lower in model (by 20-67%)

4. **CHF**:
   - Mixed pattern - some mortality rates higher, some lower

### Common Patterns
1. **Resolution rates** generally match better than mortality rates
2. **Hospital mortality** (district/tertiary) often shows the largest discrepancies
3. **Informal care mortality** frequently mismatched

## Recommendations

1. **Immediate Action Required**: Align model parameters with clinical guide values, especially for:
   - Malaria mortality rates
   - Diarrhea hospital mortality
   - Childhood pneumonia mortality rates

2. **Documentation Update**: Either update the clinical guide to reflect model reality OR update the model to match clinical evidence

3. **Validation**: Re-run model validation after parameter alignment to ensure clinical plausibility

4. **Version Control**: Consider adding parameter version tracking to prevent future divergence