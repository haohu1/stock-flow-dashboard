# Health System Parameters Guide

This guide explains the parameters in `health_system_parameters.csv` to help vertical disease teams understand how health system contexts affect disease outcomes.

## Understanding Health System Parameters

The health system parameters determine how the local healthcare infrastructure, resources, and practices affect disease outcomes. These parameters are **multipliers** that modify the base disease parameters.

### Health System Categories

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `category` | Type of entry | "HealthSystem" or "VerticalTeam" | Distinguishes between health system scenarios and vertical program descriptions |
| `name` | Name of health system or vertical team | "Weak Rural System" | Identifies specific scenarios |
| `description` | Brief overview | "Limited healthcare capacity..." | Provides context for users |

### Care-Seeking Behavior Parameters
These represent how patients engage with the healthcare system:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `phi0` | Probability of seeking formal care initially | 0.30 | 30% of patients seek formal care when they first become ill |
| `sigmaI` | Weekly probability of transitioning from informal to formal care | 0.10 | 10% of patients in informal care transition to formal care each week |
| `informalCareRatio` | Proportion remaining untreated vs. informal care | 0.40 | 40% of patients not in formal care receive no care at all (vs. informal care) |

### Multiplier Parameters
These are applied to the base disease parameters to reflect the health system impact:

#### Resolution Rate Multipliers
How the health system affects cure/resolution rates at each care level:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `resolution_informal_multiplier` | Effect on informal care resolution | 0.6 | Informal care resolution rates are 40% lower than baseline |
| `resolution_chw_multiplier` | Effect on CHW (L0) resolution | 0.5 | CHW resolution rates are 50% lower than baseline |
| `resolution_primary_multiplier` | Effect on primary care (L1) resolution | 0.5 | Primary care resolution rates are 50% lower than baseline |
| `resolution_district_multiplier` | Effect on district hospital (L2) resolution | 0.6 | District hospital resolution rates are 40% lower than baseline |
| `resolution_tertiary_multiplier` | Effect on tertiary hospital (L3) resolution | 0.7 | Tertiary hospital resolution rates are 30% lower than baseline |

#### Mortality Rate Multipliers
How the health system affects death rates at each care level:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `mortality_untreated_multiplier` | Effect on untreated death rates | 1.5 | Untreated patients have 50% higher death rates than baseline |
| `mortality_informal_multiplier` | Effect on informal care death rates | 1.8 | Patients in informal care have 80% higher death rates than baseline |

#### Referral Rate Multipliers
How the health system affects referral patterns:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `referral_chw_primary_multiplier` | Effect on CHW to primary referral rates | 0.7 | 30% fewer CHW patients are referred to primary care |
| `referral_primary_district_multiplier` | Effect on primary to district referral rates | 0.6 | 40% fewer primary care patients are referred to district hospitals |
| `referral_district_tertiary_multiplier` | Effect on district to tertiary referral rates | 0.5 | 50% fewer district hospital patients are referred to tertiary care |

### Narrative Parameters

| Parameter | Description | Purpose |
|-----------|-------------|---------|
| `system_description` | Detailed overview of the health system | Provides comprehensive context about system features |
| `ai_interventions_impact` | How AI interventions work in this system | Explains system-specific AI effects and limitations |

## How These Parameters Affect Disease Outcomes

Let's use an example to understand how health system parameters modify disease outcomes:

For **malaria** in a **weak rural system**:
- Base resolution rate at CHW level: 0.80 (80% weekly)
- Health system CHW resolution multiplier: 0.5
- **Actual** resolution rate: 0.80 × 0.5 = 0.40 (40% weekly)

This means CHWs in weak rural systems are only half as effective at resolving malaria cases compared to the baseline scenario.

## Vertical Team Considerations

The vertical team entries provide program-specific context rather than parameter values. They help you understand:

1. **Program Focus**: Which diseases and conditions each vertical program addresses
2. **Implementation Challenges**: Specific considerations for your program type
3. **AI Impacts**: How AI interventions specifically benefit your program area

## Tips for Validation

When reviewing health system parameters, consider:

1. **System alignment**: Do the parameters match your understanding of the health system?
2. **Relative effects**: Are the differences between systems reasonable?
3. **Stakeholder input**: Incorporate feedback from those with local system knowledge
4. **Data validation**: Compare with any available health system performance data

---

Please provide feedback on any parameters that don't align with your experiences in different health system contexts! 