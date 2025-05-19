# Stock-Flow Model Parameter Definitions

This document provides concise definitions of all parameters used in the stock-flow disease progression model.

## Disease Parameters

| Parameter | Definition | Units |
|-----------|------------|-------|
| **Epidemiological Parameters** | | |
| `annual_incidence` | New cases per person per year | Cases per person-year |
| `disability_weight` | Severity factor used for DALY calculations | Scale from 0-1 (0=perfect health, 1=death) |
| `mean_age` | Average age when patients contract the disease | Years |
| **Resolution Rates** | | |
| `muI` (μᵢ) | Probability of resolution in informal care | Weekly probability (0-1) |
| `mu0` (μ₀) | Probability of resolution at CHW level | Weekly probability (0-1) |
| `mu1` (μ₁) | Probability of resolution at primary care | Weekly probability (0-1) |
| `mu2` (μ₂) | Probability of resolution at district hospital | Weekly probability (0-1) |
| `mu3` (μ₃) | Probability of resolution at tertiary hospital | Weekly probability (0-1) |
| **Mortality Rates** | | |
| `deltaU` (δᵤ) | Probability of death if completely untreated | Weekly probability (0-1) |
| `deltaI` (δᵢ) | Probability of death in informal care | Weekly probability (0-1) |
| `delta0` (δ₀) | Probability of death at CHW level | Weekly probability (0-1) |
| `delta1` (δ₁) | Probability of death at primary care | Weekly probability (0-1) |
| `delta2` (δ₂) | Probability of death at district hospital | Weekly probability (0-1) |
| `delta3` (δ₃) | Probability of death at tertiary hospital | Weekly probability (0-1) |
| **Referral Rates** | | |
| `rho0` (ρ₀) | Probability of referral from CHW to primary care | Weekly probability (0-1) |
| `rho1` (ρ₁) | Probability of referral from primary to district | Weekly probability (0-1) |
| `rho2` (ρ₂) | Probability of referral from district to tertiary | Weekly probability (0-1) |

## Health System Parameters

| Parameter | Definition | Units |
|-----------|------------|-------|
| **Care-Seeking Behavior** | | |
| `phi0` (φ₀) | Probability of initially seeking formal care | Probability (0-1) |
| `sigmaI` (σᵢ) | Probability of transitioning from informal to formal care | Weekly probability (0-1) |
| `informalCareRatio` | Proportion of non-formal patients in informal care vs. untreated | Ratio (0-1) |
| **Resolution Rate Multipliers** | | |
| `resolution_informal_multiplier` | Multiplier affecting informal care resolution rates | Ratio (relative to baseline) |
| `resolution_chw_multiplier` | Multiplier affecting CHW level resolution rates | Ratio (relative to baseline) |
| `resolution_primary_multiplier` | Multiplier affecting primary care resolution rates | Ratio (relative to baseline) |
| `resolution_district_multiplier` | Multiplier affecting district hospital resolution rates | Ratio (relative to baseline) |
| `resolution_tertiary_multiplier` | Multiplier affecting tertiary hospital resolution rates | Ratio (relative to baseline) |
| **Mortality Rate Multipliers** | | |
| `mortality_untreated_multiplier` | Multiplier affecting untreated mortality rates | Ratio (relative to baseline) |
| `mortality_informal_multiplier` | Multiplier affecting informal care mortality rates | Ratio (relative to baseline) |
| `mortality_chw_multiplier` | Multiplier affecting CHW level mortality rates | Ratio (relative to baseline) |
| `mortality_primary_multiplier` | Multiplier affecting primary care mortality rates | Ratio (relative to baseline) |
| `mortality_district_multiplier` | Multiplier affecting district hospital mortality rates | Ratio (relative to baseline) |
| `mortality_tertiary_multiplier` | Multiplier affecting tertiary hospital mortality rates | Ratio (relative to baseline) |
| **Referral Rate Multipliers** | | |
| `referral_chw_primary_multiplier` | Multiplier affecting CHW to primary referral rates | Ratio (relative to baseline) |
| `referral_primary_district_multiplier` | Multiplier affecting primary to district referral rates | Ratio (relative to baseline) |
| `referral_district_tertiary_multiplier` | Multiplier affecting district to tertiary referral rates | Ratio (relative to baseline) |

## AI Intervention Parameters

| Parameter | Definition |
|-----------|------------|
| `triageAI` | Direct-to-consumer AI triage systems that guide patients to appropriate care |
| `chwAI` | AI decision support tools for community health workers |
| `diagnosticAI` | AI-powered diagnostic tools at primary care level |
| `bedManagementAI` | AI systems for hospital resource optimization |
| `hospitalDecisionAI` | Clinical decision support for hospital-based care |
| `selfCareAI` | AI-enhanced self-care applications |

## Understanding Parameter Values

### Interpreting Weekly Probabilities
All resolution, mortality, and referral rates are **weekly probabilities**. To understand what they mean in practice:

- A resolution rate (μ) of 0.20 means 20% of patients resolve each week
- A mortality rate (δ) of 0.01 means 1% of patients die each week
- A referral rate (ρ) of 0.30 means 30% of patients are referred each week

The remaining patients continue at their current level of care.

### Interpreting Multipliers
Multipliers modify the base disease parameters to reflect health system impacts:

- A multiplier of 1.0 means no change from the baseline
- A multiplier of 0.8 means the parameter is reduced by 20% (improvement for mortality)
- A multiplier of 1.5 means the parameter is increased by 50% (worsening for mortality)

### Example Calculation
For malaria (base mu0 = 0.80) in a weak rural system (resolution_chw_multiplier = 0.5):

Actual CHW resolution rate = 0.80 × 0.5 = 0.40 (40% weekly)

This indicates CHWs in weak rural systems are only half as effective at treating malaria as in the baseline scenario. 