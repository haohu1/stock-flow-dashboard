# AI Uptake Parameters Implementation

This document summarizes the implementation of AI uptake parameters in the stock-flow dashboard model.

## Overview

The uptake rate represents the percentage of eligible patients/providers who actually use the AI tools. This makes the model more realistic by accounting for the fact that not all potential users will adopt new technology.

## Implementation Details

### 1. Model Changes (models/stockAndFlowModel.ts)

Added new interfaces and parameters:
- `AIUptakeParameters` interface with:
  - `globalUptake`: Global multiplier (0-1)
  - Individual intervention uptake rates (0-1) for each AI intervention
  - `urbanMultiplier`: Typically > 1.0 for urban areas
  - `ruralMultiplier`: Typically < 1.0 for rural areas

Default uptake rates:
- AI Health Advisor (triageAI): 35%
- CHW Decision Support: 40%
- Diagnostic AI: 30%
- Bed Management AI: 25%
- Hospital Decision Support: 20%
- Self-Care AI: 40%

### 2. Store Changes (lib/store.ts)

- Added `aiUptakeParametersAtom` to manage uptake state
- Updated `getDerivedParamsForDisease` to accept uptake parameters
- Updated all calls to `applyAIInterventions` to include uptake parameters

### 3. UI Changes (components/Sidebar.tsx)

Added an expandable "AI Uptake Rates" section that appears when any AI intervention is enabled:
- Global uptake multiplier slider (0-100%)
- Individual uptake rate sliders for each active AI intervention
- Urban/Rural multiplier sliders (50-150%)
- Real-time display of effective uptake rates

### 4. Calculation Logic

The effective uptake for each intervention is calculated as:
```
effectiveUptake = baseUptake × globalUptake × settingMultiplier
```

Where:
- `baseUptake` is the intervention-specific uptake rate
- `globalUptake` is the global multiplier
- `settingMultiplier` is either `urbanMultiplier` or `ruralMultiplier` based on the setting

### 5. Effect Application

In `applyAIInterventions`, the uptake affects:
- The magnitude of all AI effects (scaled by uptake percentage)
- Variable costs (scaled by uptake percentage)
- Fixed costs remain unchanged (infrastructure costs are the same regardless of uptake)

## Key Features

1. **Realistic defaults**: Default uptake rates reflect real-world adoption patterns
2. **Setting-specific**: Urban areas have higher default uptake than rural areas
3. **Intervention-specific**: Different interventions have different uptake rates
4. **User control**: All uptake parameters can be adjusted in the UI
5. **Zero uptake = zero effect**: The model correctly handles 0% uptake scenarios

## Usage

1. Enable one or more AI interventions in the sidebar
2. Click on "AI Uptake Rates" to expand the uptake controls
3. Adjust the global multiplier or individual uptake rates
4. Observe how the effective uptake changes based on urban/rural setting
5. Run simulation to see the impact of uptake on outcomes

The uptake parameters make the model more realistic by acknowledging that technology adoption is never 100% and varies by setting and intervention type.