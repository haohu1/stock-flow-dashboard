# Stock and Flow Dashboard for AI in LMIC Health Systems

A simulation and visualization tool for modeling the impact of AI interventions on healthcare systems in low and middle-income countries.

## About

This dashboard provides a mathematical model for simulating patient flow through different healthcare levels (untreated, informal care, community health workers, primary care, district hospitals, tertiary hospitals) and visualizes the impact of various AI interventions.

## Features

- **Stock and Flow Simulation**: Models patient progression through healthcare system levels
- **AI Intervention Analysis**: Evaluate impact of different AI technologies on health outcomes
- **Scenario Management**: Save, compare and analyze different intervention scenarios
- **Parameter Customization**: Fully configurable disease, geography and economic parameters
- **Visualization**: Interactive charts and tables showing simulation results
- **Cost-Effectiveness Analysis**: ICER calculations for comparing interventions

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/haohu1/stock-flow-dashboard.git

# Navigate to the project directory
cd stock-flow-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. Select a geography and disease from the sidebar
2. Adjust the population size if needed
3. Toggle AI interventions on/off to see their impact
4. Click "Run Simulation" to see results
5. Save and compare scenarios as needed
6. Explore parameter details in the Parameters tab

## Technologies Used

- React/Next.js
- TypeScript
- Tailwind CSS
- Jotai (for state management)

## License

MIT License

## Acknowledgments

This dashboard was developed to support healthcare planners and policymakers in evaluating AI investments in healthcare systems. 