# Health System and Disease Parameters Data

This directory contains reference data files for the Health System AI Impact Dashboard.

## Files

### `disease_parameters.csv`

This file provides comprehensive data on disease characteristics:

- **Epidemiological Parameters**: Annual incidence rates, disability weights, mean age of infection
- **Resolution Rates**: Weekly probability of resolution at each care level (muI, mu0-mu3)
- **Mortality Rates**: Weekly probability of death at each care level (deltaU, deltaI, delta0-delta3)
- **Referral Patterns**: Probability of referral between levels (rho0-rho2)
- **AI Impact**: Specific effects of AI interventions on each disease

The disease parameters are specified in raw values rather than multipliers, making them directly applicable in the simulation model.

### `health_system_parameters.csv`

This file provides data on health system scenarios and vertical teams:

1. **Health System Scenarios**:
   - System characteristics (phi0, sigmaI, informalCareRatio)
   - Multipliers for resolution/mortality/referral rates specific to each system
   - Detailed system descriptions
   - AI implementation considerations

2. **Vertical Team Narratives**:
   - Focus areas (maternal & child health, infectious diseases, etc.)
   - Implementation considerations for different program types
   - Specific AI intervention impacts by vertical program

## How to Use This Data

- **Reference for Simulations**: Use the parameter values when configuring custom disease or health system scenarios
- **Program Planning**: Vertical team descriptions can guide implementation of AI interventions for specific health programs
- **Educational Purpose**: Help users understand the underlying assumptions in the stock-and-flow model
- **Data Export**: These CSVs can be shared with external stakeholders to document the model parameters

## Data Structure

### `disease_parameters.csv` Columns:
- `name`: Name of the disease
- `description`: Brief description of the disease
- `annual_incidence`: Annual incidence rate
- `disability_weight`: Disability weight for DALY calculations
- `mean_age`: Mean age of infection/onset
- `muI, mu0, mu1, mu2, mu3`: Resolution rates at different care levels
- `deltaU, deltaI, delta0, delta1, delta2, delta3`: Mortality rates at different care levels
- `rho0, rho1, rho2`: Referral rates between levels
- `best_level_of_care`: Most appropriate level for managing the condition
- `ai_interventions_impact`: Description of how AI interventions affect this disease

### `health_system_parameters.csv` Columns:
- `category`: Type of entry (HealthSystem or VerticalTeam)
- `name`: Name of the health system or vertical team
- `description`: Brief description
- Resolution, mortality, and referral multipliers (for health systems)
- `phi0, sigmaI, informalCareRatio`: Care-seeking behavior parameters
- `system_description`: Detailed description of health systems
- `ai_interventions_impact`: Description of how AI interventions work in this context

---

For questions or to suggest updates to these parameters, please contact the development team. 