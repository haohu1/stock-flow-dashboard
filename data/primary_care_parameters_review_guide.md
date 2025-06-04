# Primary Health Care Team Parameters Review Guide

## Overview
This document is designed to help primary health care experts review and validate the health system parameters used in our disease modeling dashboard. Your expertise is crucial in ensuring these parameters accurately reflect real-world primary care delivery across different health system contexts.

## Understanding the Model Structure

Our model simulates patient flow through different levels of care:
- **Untreated**: Patients receiving no medical care
- **Informal Care**: Traditional healers, family care, or self-medication
- **Community Health Workers (CHW/L0)**: First formal contact point
- **Primary Care (L1)**: Health centers, clinics, primary care facilities
- **District Hospital (L2)**: Secondary care facilities
- **Tertiary Hospital (L3)**: Specialized referral hospitals

## Key Parameters for Primary Care Teams

### 1. Care-Seeking Behavior Parameters

These parameters determine how patients initially engage with the healthcare system:

| Parameter | What It Represents | Why It Matters for Primary Care |
|-----------|-------------------|----------------------------------|
| **Initial Formal Care Seeking (phi0)** | Percentage of patients who seek formal care when first ill | Determines your patient volume and early intervention opportunities |
| **Transition to Formal Care (sigmaI)** | Weekly rate at which patients move from informal to formal care | Affects delayed presentations and disease severity at first contact |
| **Untreated Ratio (informalCareRatio)** | Proportion who receive no care at all | Indicates community health education needs and access barriers |

### 2. Primary Care Performance Parameters

These multipliers modify disease-specific outcomes based on health system capacity:

| Parameter | What It Measures | Questions for Validation |
|-----------|------------------|-------------------------|
| **Resolution Rate Multiplier** | How effectively primary care can cure/manage conditions | Does this match your cure rates compared to guidelines? |
| **Referral Rate Multiplier** | How well the referral system functions | Do these referral patterns match your experience? |
| **Mortality Multiplier** | Risk of death for untreated/informal care patients | Are these mortality differences realistic for your setting? |

## Health System Scenarios to Review

We've defined five health system contexts. Please review if these accurately represent primary care delivery:

### 1. **Moderate Urban System**
- **Characteristics**: Middle-income urban setting with reasonable infrastructure
- **Key Parameters**:
  - Initial formal care seeking (phi0): **65%**
  - Weekly transition to formal care (sigmaI): **25%**
  - Untreated ratio: **15%**
  - Primary care resolution multiplier: **1.0** (baseline performance)
  - CHW to primary referral multiplier: **1.0** (standard referral patterns)
  - Primary to district referral multiplier: **1.0** (standard referral patterns)
- **Key Question**: Does this represent typical urban primary care in your experience?

### 2. **Weak Rural System**
- **Characteristics**: Limited resources, poor access, significant barriers
- **Key Parameters**:
  - Initial formal care seeking (phi0): **30%**
  - Weekly transition to formal care (sigmaI): **10%**
  - Untreated ratio: **40%**
  - Primary care resolution multiplier: **0.5** (50% less effective than baseline)
  - CHW resolution multiplier: **0.5** (50% less effective)
  - CHW to primary referral multiplier: **0.7** (30% fewer referrals completed)
  - Primary to district referral multiplier: **0.6** (40% fewer referrals completed)
  - Mortality untreated multiplier: **1.5** (50% higher death rate)
  - Mortality informal care multiplier: **1.8** (80% higher death rate)
- **Key Question**: Do these constraints match rural primary care challenges you've seen?

### 3. **Strong Urban System (LMIC)**
- **Characteristics**: Best-in-class urban care in developing countries
- **Key Parameters**:
  - Initial formal care seeking (phi0): **80%**
  - Weekly transition to formal care (sigmaI): **35%**
  - Untreated ratio: **10%**
  - Primary care resolution multiplier: **1.3** (30% more effective than baseline)
  - CHW resolution multiplier: **1.3** (30% more effective)
  - CHW to primary referral multiplier: **1.1** (10% better referral completion)
  - Primary to district referral multiplier: **1.1** (10% better referral completion)
  - Mortality untreated multiplier: **0.8** (20% lower death rate)
  - Mortality informal care multiplier: **0.7** (30% lower death rate)
- **Key Question**: Is this aspirational but achievable for well-resourced LMIC settings?

### 4. **Fragile Conflict System**
- **Characteristics**: Humanitarian crisis or conflict-affected areas
- **Key Parameters**:
  - Initial formal care seeking (phi0): **20%**
  - Weekly transition to formal care (sigmaI): **8%**
  - Untreated ratio: **60%**
  - Primary care resolution multiplier: **0.4** (60% less effective than baseline)
  - CHW resolution multiplier: **0.3** (70% less effective)
  - CHW to primary referral multiplier: **0.4** (60% fewer referrals completed)
  - Primary to district referral multiplier: **0.3** (70% fewer referrals completed)
  - Mortality untreated multiplier: **2.5** (150% higher death rate)
  - Mortality informal care multiplier: **2.3** (130% higher death rate)
- **Key Question**: Does this capture the reality of primary care in crisis settings?

### 5. **High Income System**
- **Characteristics**: Well-resourced settings with universal health coverage
- **Key Parameters**:
  - Initial formal care seeking (phi0): **90%**
  - Weekly transition to formal care (sigmaI): **70%**
  - Untreated ratio: **5%**
  - Primary care resolution multiplier: **1.7** (70% more effective than baseline)
  - CHW resolution multiplier: **1.6** (60% more effective)
  - CHW to primary referral multiplier: **1.2** (20% better referral completion)
  - Primary to district referral multiplier: **1.2** (20% better referral completion)
  - Mortality untreated multiplier: **0.5** (50% lower death rate)
  - Mortality informal care multiplier: **0.4** (60% lower death rate)
- **Key Question**: Does this represent primary care in high-income countries?

## Specific Validation Questions for Primary Care Experts

### Patient Flow and Access
1. Do the care-seeking percentages (phi0) match patterns you observe?
2. Are the transition rates from informal to formal care realistic?
3. Do untreated patient proportions align with your community assessments?

### Clinical Effectiveness
1. Are the resolution rate multipliers appropriate for each health system?
2. Do they account for factors like:
   - Drug availability and quality
   - Diagnostic capacity
   - Healthcare worker training and retention
   - Patient adherence to treatment

### Referral Patterns
1. Do the referral multipliers reflect real-world referral completion rates?
2. Are barriers to referral (transport, cost, trust) adequately captured?
3. Is the assumption of upward-only referral (CHW→Primary→District→Tertiary) valid?

### System-Specific Considerations
1. **For weak systems**: Are the performance penalties too harsh or too lenient?
2. **For strong systems**: Are the improvements realistic or overly optimistic?
3. **For crisis settings**: Do parameters capture the full extent of system breakdown?

## AI Intervention Impact

The model includes AI-powered clinical decision support. Please consider:

1. **Feasibility**: Can AI tools realistically be deployed in each health system context?
2. **Impact**: Are the projected improvements from AI interventions achievable?
3. **Barriers**: What implementation challenges are we missing?

## How to Provide Feedback

Please review the parameters and provide feedback on:

1. **Accuracy**: Do parameters match your clinical experience?
2. **Completeness**: Are we missing important factors affecting primary care?
3. **Regional Variation**: How might these parameters differ in your specific context?
4. **Disease-Specific Considerations**: Are there diseases where these general parameters don't apply?

## Example Review Framework

When reviewing parameters for a specific disease in your setting:

1. **Current Reality Check**
   - What percentage of patients with this condition actually reach primary care?
   - What percentage are successfully treated at primary level?
   - What percentage require referral?

2. **System Constraints**
   - What limits your ability to diagnose this condition?
   - What limits your ability to treat it effectively?
   - What prevents successful referrals when needed?

3. **Improvement Potential**
   - What would most improve outcomes for this condition?
   - How might AI tools specifically help?
   - What system changes would have the biggest impact?

## Next Steps

Your feedback will help us:
1. Refine parameter values to better reflect reality
2. Add nuance for specific diseases or regions
3. Improve AI intervention modeling
4. Create more accurate projections for policy decisions

Thank you for your expertise in making these models more accurate and useful for improving primary health care delivery worldwide!