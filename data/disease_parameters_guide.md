# Disease Parameters Guide

This guide explains the parameters in `disease_parameters.csv` to help vertical disease teams understand and validate the model inputs.

## Understanding the Parameters

### Basic Disease Characteristics

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `name` | Disease or condition name | "Malaria" | Self-explanatory |
| `description` | Brief overview of the condition | "A parasitic disease..." | Provides context for model users |
| `annual_incidence` | New cases per person per year | 0.40 | 40% of the population gets this disease annually (e.g., 400 cases per 1,000 people per year) |
| `disability_weight` | Severity factor for DALY calculations (0-1) | 0.192 | Higher values indicate more severe impact on quality of life (0=perfect health, 1=death) |
| `mean_age` | Average age of patients with this condition | 9 | Used for calculating years of life lost in DALYs |

### Resolution Probabilities (Weekly)
These represent the probability that a patient's condition will be resolved (cured/managed) at each level of care *per week*:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `muI` | Resolution probability in informal care | 0.15 | 15% of patients receiving informal care resolve each week |
| `mu0` | Resolution probability at CHW (L0) | 0.80 | 80% of patients treated by CHWs resolve each week |
| `mu1` | Resolution probability at primary care (L1) | 0.85 | 85% of patients treated at primary care facilities resolve each week |
| `mu2` | Resolution probability at district hospital (L2) | 0.60 | 60% of patients treated at district hospitals resolve each week |
| `mu3` | Resolution probability at tertiary hospital (L3) | 0.70 | 70% of patients treated at tertiary hospitals resolve each week |

### Mortality Probabilities (Weekly)
These represent the probability that a patient will die at each level of care *per week*:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `deltaU` | Death probability if completely untreated | 0.03 | 3% of completely untreated patients die each week |
| `deltaI` | Death probability in informal care | 0.02 | 2% of patients receiving informal care die each week |
| `delta0` | Death probability at CHW level (L0) | 0.002 | 0.2% of patients treated by CHWs die each week |
| `delta1` | Death probability at primary care (L1) | 0.001 | 0.1% of patients treated at primary care facilities die each week |
| `delta2` | Death probability at district hospital (L2) | 0.03 | 3% of patients treated at district hospitals die each week |
| `delta3` | Death probability at tertiary hospital (L3) | 0.02 | 2% of patients treated at tertiary hospitals die each week |

### Referral Probabilities
These represent the probability that a patient will be referred to a higher level of care *per week*:

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `rho0` | Referral probability from CHW to primary care | 0.50 | 50% of patients at CHW level are referred to primary care each week |
| `rho1` | Referral probability from primary to district | 0.40 | 40% of patients at primary care are referred to district hospitals each week |
| `rho2` | Referral probability from district to tertiary | 0.20 | 20% of patients at district hospitals are referred to tertiary care each week |

### Other Parameters

| Parameter | Description | Example | Interpretation |
|-----------|-------------|---------|---------------|
| `best_level_of_care` | Most appropriate level for managing the condition | "Primary (L1)" | Indicates which level of care is most effective for this condition |
| `ai_interventions_impact` | Description of how AI affects this disease | "CHW Decision Support AI enables more effective..." | Explains specific AI benefits for this condition |

## How to Interpret Different Disease Types

### Acute Conditions (e.g., Diarrhea, Malaria)
* Higher resolution rates (mu) at all levels
* Resolution typically occurs within days/weeks
* Lower referral rates for mild cases

### Chronic Conditions (e.g., HIV, Heart Failure)
* Lower resolution rates (mu) - representing stabilization rather than cure
* Lower weekly mortality but significant cumulative risk
* More complex referral patterns

### Severe Acute Conditions (e.g., Infant Pneumonia)
* Higher mortality rates across all levels
* Higher referral rates to specialized care
* Significant level-of-care dependencies

## Tips for Validating Parameters

When reviewing these parameters, consider:

1. **Internal consistency**: Do higher levels of care generally show better outcomes?
2. **Relative parameters**: How do values compare between similar conditions?
3. **Time interpretation**: Remember these are weekly rates - consider what they mean over a full illness episode
4. **Local context**: How might these parameters vary in your specific healthcare context?
5. **Real-world validation**: Do these align with observed outcomes in your programs?

---

Please provide feedback on any parameters that don't align with your experiences or evidence base! 