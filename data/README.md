# Health System and Disease Parameters Data

This directory contains reference data files for the Health System AI Impact Dashboard.

## Files

### `health_system_disease_parameters.csv`

This file provides comprehensive data on:

1. **Disease Parameters**: Clinical and epidemiological characteristics of different diseases modeled in the system, including:
   - Annual incidence rates
   - Disability weights
   - Mean age of infection
   - Resolution/mortality rates at different care levels
   - Referral patterns

2. **Health System Parameters**: Characteristics of different health system scenarios, including:
   - Resolution/mortality multipliers
   - System descriptions
   - AI intervention impacts

3. **Vertical Team Narratives**: Descriptions of how different health program teams might use these models, including:
   - Focus areas (maternal & child health, infectious diseases, etc.)
   - Implementation considerations
   - Specific AI intervention impacts

## How to Use This Data

- **Reference for Simulations**: Use the parameter values when configuring custom disease or health system scenarios
- **Program Planning**: Vertical team descriptions can guide implementation of AI interventions for specific health programs
- **Educational Purpose**: Help users understand the underlying assumptions in the stock-and-flow model
- **Data Export**: This CSV can be shared with external stakeholders to document the model parameters

## Data Structure

The CSV file has the following columns:

- `category`: Type of entry (Disease, HealthSystem, or VerticalTeam)
- `name`: Name of the disease, health system, or vertical team
- `description`: Brief description
- `annual_incidence`, `disability_weight`, etc.: Clinical and epidemiological parameters (mostly for Disease entries)
- `resolution_*`, `mortality_*`, `referral_*`: Care level specific parameters
- `system_description`: Detailed description of health systems
- `ai_interventions_impact`: Description of how AI interventions affect this entity

---

For questions or to suggest updates to these parameters, please contact the development team. 