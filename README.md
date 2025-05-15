# Stock-and-Flow Dashboard for AI in LMIC Health Systems

This dashboard allows health system planners, donors, and clinicians to model the impact of AI interventions on health outcomes in low and middle-income countries (LMICs). It provides a transparent, interactive way to explore questions like "If we introduce specific AI tools in malaria-heavy districts, how many lives do we save, how much money do we spend, and where does the patient load shift?"

## Features

- **Stock-and-Flow Modeling**: Simulate patient flow through different levels of the health system (from untreated to tertiary care)
- **AI Intervention Modeling**: Analyze the impact of various AI tools on health outcomes
- **Economic Analysis**: Calculate costs, DALYs, and cost-effectiveness ratios
- **Scenario Comparison**: Create and compare multiple scenarios with different parameters
- **Sensitivity Analysis**: Test how sensitive your results are to changes in key parameters
- **Geography Defaults**: Start with preset values for different regions (Ethiopia, Mozambique, Bihar)
- **Disease Profiles**: Choose from common diseases like malaria, tuberculosis, pneumonia, and fever

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/stock-flow.git
cd stock-flow
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. **Choose Geography and Disease**: Select a preset geography and disease from the sidebar
2. **Adjust Population**: Enter the population size for your analysis
3. **Toggle AI Interventions**: Turn on/off different AI interventions to model their impact
4. **Run Simulation**: Click "Run Simulation" to see results
5. **Set Baseline**: Save your current scenario as a baseline for comparison
6. **Create Scenarios**: Create multiple scenarios to compare different intervention combinations
7. **Run Sensitivity Analysis**: Test how changes to key parameters affect your results

## Model Details

The dashboard uses a week-by-week stock-and-flow model with seven exclusive states:

1. **U** - Symptomatic but not yet in any care pathway
2. **I** - Individuals self-treating or in informal care
3. **L0** - Cases managed by community health workers
4. **L1** - Cases at primary care facilities
5. **L2** - Inpatients in district hospitals
6. **L3** - Inpatients in tertiary or referral hospitals
7. **R and D** - Resolved alive or dead

Each state has associated probabilities for resolution, death, and referral to higher levels of care.

## AI Interventions

The dashboard models six types of AI interventions:

1. **AI Triage**: Direct-to-consumer AI that helps patients decide whether to seek care
2. **CHW Decision Support**: AI tools that help community health workers make better decisions
3. **Diagnostic AI**: AI-powered diagnostics at primary care facilities
4. **Bed Management AI**: AI tools that optimize hospital bed utilization
5. **Hospital Decision Support**: AI tools that help hospital staff make treatment decisions
6. **Self-Care Apps**: AI-enhanced apps that improve self-care outcomes

## Key Equations

1. Weekly incidence : New = (λ × Pop) / 52
2. Formal-care entry : Formal = φ₀ × U + σI × I
3. Within-level resolution : Resolve_k = μₖ × Lₖ
4. Within-level mortality : Die_k = δₖ × Lₖ
5. Referral cascade : Referral_k = ρₖ × Lₖ (k = 0,1,2)
6. Cost : TotalCost = Σ(patientDays_k × perDiem_k) + AI_Fixed + (AI_Variable × Episodes_touched)
7. DALYs : DALY = Deaths × YLL + patientDays × DisabilityWeight
8. ICER : (Cost_i – Cost_0)/(DALY_0 – DALY_i)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This dashboard was inspired by the need for transparent, interactive tools to support health system decision-making in LMICs
- The stock-and-flow model is based on established health systems modeling approaches 