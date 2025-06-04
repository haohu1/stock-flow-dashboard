# Stock and Flow Dashboard for AI in LMIC Health Systems

A simulation and visualization tool for modeling the impact of AI interventions on healthcare systems in low and middle-income countries (LMICs).

## About

This dashboard provides a mathematical model for simulating patient flow through healthcare system levels, from untreated states through informal care, community health workers, and formal healthcare facilities. It helps healthcare planners and policymakers evaluate the potential impact and cost-effectiveness of various AI interventions on health outcomes.

## Key Features

### 🏥 Healthcare System Modeling
- **Patient Flow Simulation**: Models weekly patient progression through 6 healthcare levels (Untreated → Informal Care → CHW → Primary Care → District Hospital → Tertiary Hospital)
- **Queue Management**: Simulates healthcare congestion with waiting times and queue mortality
- **Multiple Health Systems**: Pre-configured scenarios for different system strengths (Fragile, Weak Rural, Moderate Urban, Strong LMIC, High-Income)
- **11 Disease Models**: Including TB, malaria, childhood pneumonia, diarrhea, HIV, heart failure, and more

### 🤖 AI Interventions
- **6 AI Intervention Types**:
  - AI Health Advisor (Triage AI)
  - CHW Decision Support
  - Diagnostic AI (L1/L2)
  - Bed Management AI
  - Hospital Decision Support
  - AI Self-Care Platform
- **Preset AI Scenarios**: Best Case, Worst Case, Clinical Decision Support, Workflow Efficiency, and more
- **Custom Configuration**: Adjust effect magnitudes and time-to-scale for each intervention

### 📊 Analysis & Visualization
- **Multiple Dashboard Views**: 
  - Single disease deep-dive analysis
  - Multi-disease comparison mode
  - Weekly patient flow animations
  - Cumulative outcomes tracking
  - Queue congestion monitoring
- **Advanced Charts**:
  - Impact vs Feasibility bubble chart with business strategy quadrants
  - Intervention Package Mortality (IPM) analysis
  - Sensitivity analysis with tornado diagrams
  - Cost-effectiveness frontier visualization
- **Key Metrics**: Deaths, DALYs, costs, time to resolution, ICER calculations

### 💼 Scenario Management
- **Save & Compare**: Store multiple intervention scenarios with custom names
- **Baseline Analysis**: Set baseline scenarios for comparative analysis
- **Automatic Scenario Naming**: Based on selected AI interventions
- **Scenario History**: Track and reload previous configurations

### 📚 Documentation Tools
- **Model Equations Tab**: Mathematical documentation of the simulation
- **Parameter Guide**: Clinical significance and rationale for all parameters
- **Patient Flow Visualization**: Guide showing how patients navigate the system
- **Contextual Help**: Tooltips and explanations throughout the interface

### 🎯 Additional Features
- **System Congestion Settings**: Model healthcare system strain (0-90% congestion)
- **Population Scaling**: Adjustable population size for regional planning
- **Multi-Disease Selection**: Compare outcomes across multiple conditions
- **Responsive Design**: Mobile-friendly with sticky sidebar navigation
- **Dark Mode Support**: For comfortable viewing in different environments

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

### Basic Workflow
1. **Configure Health System**: Select a health system scenario from the dropdown (e.g., Moderate Urban, Weak Rural)
2. **Choose Disease**: Select a primary disease to model (e.g., Malaria, TB, Childhood Pneumonia)
3. **Set Population**: Adjust the population size for your target region
4. **Configure Congestion**: Set system congestion level (0-90%) to model healthcare strain
5. **Select AI Interventions**: Toggle one or more AI interventions to evaluate their impact
6. **Run Simulation**: Click "Run Simulation" to generate results
7. **Set Baseline**: Save current results as baseline for comparison
8. **Compare Scenarios**: Add different intervention combinations and compare outcomes

### Advanced Features
- **Multi-Disease Analysis**: Use "Compare Multiple Diseases" to select and analyze multiple conditions simultaneously
- **Sensitivity Analysis**: Switch to Sensitivity tab to test parameter uncertainty
- **Custom Parameters**: Navigate to Parameters tab to adjust disease-specific or system parameters
- **View Equations**: Explore the Model Equations tab to understand the mathematical framework
- **Parameter Guide**: Reference the Parameter Guide tab for clinical context and rationales

### Understanding Results
- **Dashboard Tab**: View key outcomes including deaths, DALYs, costs, and ICER
- **Simulation Chart**: See weekly patient flow through care levels
- **Queue Visualization**: Monitor system congestion and queue buildup
- **Bubble Charts**: Evaluate interventions by impact, feasibility, and cost-effectiveness
- **Results Table**: Compare detailed metrics across saved scenarios

## Technologies Used

- **Frontend Framework**: React with Next.js 14
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Jotai atoms for efficient state handling
- **Visualization**: Recharts for interactive charts
- **Build Tools**: Node.js 18.x, npm

## Deployment

The application is deployed on Heroku and can be accessed at: https://stock-flow-dashboard-bda7b7435581.herokuapp.com/

### Deployment Instructions
```bash
# Deploy to Heroku
git push heroku main

# The app uses a Procfile for Heroku deployment
# Automatic builds are triggered on push
```

## Data Sources

The model parameters are based on:
- Disease incidence and mortality data from WHO and country-specific health surveys
- Healthcare system capacity data from World Bank and national health statistics
- Cost data from healthcare economics literature and LMIC-specific studies
- AI intervention effects estimated from pilot studies and expert consultation

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License

## Acknowledgments

This dashboard was developed to support healthcare planners, policymakers, and researchers in evaluating AI investments in healthcare systems. Special thanks to the global health community for providing data and insights that informed the model parameters.

## Contact

For questions or feedback, please open an issue on GitHub: https://github.com/haohu1/stock-flow-dashboard/issues 