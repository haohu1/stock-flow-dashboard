import React from 'react';
import { useAtom } from 'jotai';
import { derivedParametersAtom } from '../lib/store';
import { formatDecimal } from '../lib/utils';
// No direct import - will use a standard image tag with public path

const EquationExplainer: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);

  const equations = [
    {
      title: 'Weekly Incidence',
      equation: 'New = (λ × Pop) / 52',
      explanation: 'New cases entering the system each week based on annual incidence rate.',
      variables: [
        { symbol: 'λ', name: 'Annual Incidence Rate', value: params.lambda },
        { symbol: 'Pop', name: 'Population', value: 'User defined' },
      ],
      example: `For a population of 300,000 with λ = ${formatDecimal(params.lambda, 2)}, approximately ${formatDecimal((params.lambda * 300000) / 52, 0)} new cases per week.`
    },
    {
      title: 'Initial Care Seeking',
      equation: 'U_new = (1 - φ₀) × New\nI_new = (1 - r) × (1 - φ₀) × New\nFormal_new = φ₀ × New',
      explanation: 'Distribution of new cases between untreated, informal care, and formal care pathways.',
      variables: [
        { symbol: 'φ₀', name: 'Initial Formal Care Seeking', value: params.phi0 },
        { symbol: 'r', name: 'Untreated Ratio', value: params.informalCareRatio },
        { symbol: 'New', name: 'New Weekly Cases', value: 'Dynamic' },
      ],
      example: `With φ₀ = ${formatDecimal(params.phi0, 2)}, ${formatDecimal(params.phi0 * 100, 0)}% of new cases directly enter formal care. Of the remaining ${formatDecimal((1-params.phi0) * 100, 0)}%, ${formatDecimal(params.informalCareRatio * 100, 0)}% remain untreated and ${formatDecimal((1-params.informalCareRatio) * 100, 0)}% seek informal care.`
    },
    {
      title: 'Untreated Patients',
      equation: 'U_deaths = δU × U\nU_remaining = U - U_deaths',
      explanation: 'Weekly transitions for patients who remain completely untreated.',
      variables: [
        { symbol: 'U', name: 'Untreated Cases', value: 'Dynamic' },
        { symbol: 'δU', name: 'Untreated Death Rate', value: params.deltaU },
      ],
      example: `With an untreated death rate δU = ${formatDecimal(params.deltaU, 4)}, approximately ${formatDecimal(params.deltaU * 100, 2)}% of untreated patients die each week.`
    },
    {
      title: 'Informal Care Transitions',
      equation: 'I_formal = σI × I\nI_resolved = μI × I\nI_deaths = δI × I\nI_remaining = I - I_formal - I_resolved - I_deaths',
      explanation: 'Weekly transitions for patients in informal care (self-care or traditional healers).',
      variables: [
        { symbol: 'I', name: 'Cases in Informal Care', value: 'Dynamic' },
        { symbol: 'σI', name: 'Informal to Formal Transfer Rate', value: params.sigmaI },
        { symbol: 'μI', name: 'Informal Care Resolution Rate', value: params.muI },
        { symbol: 'δI', name: 'Informal Care Death Rate', value: params.deltaI },
      ],
      example: `Each week: ${formatDecimal(params.sigmaI * 100, 0)}% of informal care patients transition to formal care, ${formatDecimal(params.muI * 100, 0)}% resolve, and ${formatDecimal(params.deltaI * 100, 2)}% die.`
    },
    {
      title: 'Formal Care Entry',
      equation: 'Formal = φ₀ × U + σI × I',
      explanation: 'Total number of people entering formal care pathways each week.',
      variables: [
        { symbol: 'φ₀', name: 'Initial Formal Care Seeking', value: params.phi0 },
        { symbol: 'U', name: 'Untreated Cases', value: 'Dynamic' },
        { symbol: 'σI', name: 'Informal to Formal Transfer Rate', value: params.sigmaI },
        { symbol: 'I', name: 'Cases in Informal Care', value: 'Dynamic' },
      ],
      example: `With φ₀ = ${formatDecimal(params.phi0, 2)} and σI = ${formatDecimal(params.sigmaI, 2)}, about ${formatDecimal(params.phi0 * 100, 0)}% of untreated patients and ${formatDecimal(params.sigmaI * 100, 0)}% of informal care patients enter formal care weekly.`
    },
    {
      title: 'CHW Level (L0) Transitions',
      equation: 'L0_resolved = μ₀ × L0\nL0_deaths = δ₀ × L0\nL0_referrals = ρ₀ × L0\nL0_remaining = L0 - L0_resolved - L0_deaths - L0_referrals',
      explanation: 'Weekly transitions for patients at the community health worker level.',
      variables: [
        { symbol: 'L0', name: 'Cases at CHW Level', value: 'Dynamic' },
        { symbol: 'μ₀', name: 'CHW Resolution Rate', value: params.mu0 },
        { symbol: 'δ₀', name: 'CHW Death Rate', value: params.delta0 },
        { symbol: 'ρ₀', name: 'CHW to Primary Care Referral Rate', value: params.rho0 },
      ],
      example: `At the CHW level each week: ${formatDecimal(params.mu0 * 100, 0)}% of patients resolve, ${formatDecimal(params.delta0 * 100, 2)}% die, and ${formatDecimal(params.rho0 * 100, 0)}% are referred to primary care.`
    },
    {
      title: 'Primary Care (L1) Transitions',
      equation: 'L1_resolved = μ₁ × L1\nL1_deaths = δ₁ × L1\nL1_referrals = ρ₁ × L1\nL1_remaining = L1 - L1_resolved - L1_deaths - L1_referrals',
      explanation: 'Weekly transitions for patients at the primary care level.',
      variables: [
        { symbol: 'L1', name: 'Cases at Primary Care', value: 'Dynamic' },
        { symbol: 'μ₁', name: 'Primary Care Resolution Rate', value: params.mu1 },
        { symbol: 'δ₁', name: 'Primary Care Death Rate', value: params.delta1 },
        { symbol: 'ρ₁', name: 'Primary to District Hospital Referral Rate', value: params.rho1 },
      ],
      example: `At primary care each week: ${formatDecimal(params.mu1 * 100, 0)}% of patients resolve, ${formatDecimal(params.delta1 * 100, 2)}% die, and ${formatDecimal(params.rho1 * 100, 0)}% are referred to district hospitals.`
    },
    {
      title: 'District Hospital (L2) Transitions',
      equation: 'L2_resolved = μ₂ × L2\nL2_deaths = δ₂ × L2\nL2_referrals = ρ₂ × L2\nL2_remaining = L2 - L2_resolved - L2_deaths - L2_referrals',
      explanation: 'Weekly transitions for patients at the district hospital level.',
      variables: [
        { symbol: 'L2', name: 'Cases at District Hospitals', value: 'Dynamic' },
        { symbol: 'μ₂', name: 'District Hospital Resolution Rate', value: params.mu2 },
        { symbol: 'δ₂', name: 'District Hospital Death Rate', value: params.delta2 },
        { symbol: 'ρ₂', name: 'District to Tertiary Hospital Referral Rate', value: params.rho2 },
      ],
      example: `At district hospitals each week: ${formatDecimal(params.mu2 * 100, 0)}% of patients resolve, ${formatDecimal(params.delta2 * 100, 2)}% die, and ${formatDecimal(params.rho2 * 100, 0)}% are referred to tertiary hospitals.`
    },
    {
      title: 'Tertiary Hospital (L3) Transitions',
      equation: 'L3_resolved = μ₃ × L3\nL3_deaths = δ₃ × L3\nL3_remaining = L3 - L3_resolved - L3_deaths',
      explanation: 'Weekly transitions for patients at the tertiary hospital level.',
      variables: [
        { symbol: 'L3', name: 'Cases at Tertiary Hospitals', value: 'Dynamic' },
        { symbol: 'μ₃', name: 'Tertiary Hospital Resolution Rate', value: params.mu3 },
        { symbol: 'δ₃', name: 'Tertiary Hospital Death Rate', value: params.delta3 },
      ],
      example: `At tertiary hospitals each week: ${formatDecimal(params.mu3 * 100, 0)}% of patients resolve and ${formatDecimal(params.delta3 * 100, 2)}% die.`
    },
    {
      title: 'Cumulative Health Outcomes',
      equation: 'R_total = R + (μI × I) + (μ₀ × L0) + (μ₁ × L1) + (μ₂ × L2) + (μ₃ × L3)\nD_total = D + (δU × U) + (δI × I) + (δ₀ × L0) + (δ₁ × L1) + (δ₂ × L2) + (δ₃ × L3)',
      explanation: 'Cumulative resolved cases and deaths across all pathways.',
      variables: [
        { symbol: 'R', name: 'Cumulative Resolved Cases', value: 'Dynamic' },
        { symbol: 'D', name: 'Cumulative Deaths', value: 'Dynamic' },
      ],
      example: 'The model tracks cumulative health outcomes by adding weekly resolutions and deaths from all care levels.'
    },
    {
      title: 'Total Cost Calculation',
      equation: 'TotalCost = Σ(patientDays_k × perDiem_k) + AI_Fixed + (AI_Variable × Episodes_touched)',
      explanation: 'Sum of care costs plus AI implementation costs.',
      variables: [
        { symbol: 'perDiem_I', name: 'Informal Care Cost per Day', value: params.perDiemCosts.I > 0 ? `$${params.perDiemCosts.I}` : 'Not set' },
        { symbol: 'perDiem_L0', name: 'CHW Cost per Day', value: params.perDiemCosts.L0 > 0 ? `$${params.perDiemCosts.L0}` : 'Not set' },
        { symbol: 'perDiem_L1', name: 'Primary Care Cost per Day', value: params.perDiemCosts.L1 > 0 ? `$${params.perDiemCosts.L1}` : 'Not set' },
        { symbol: 'perDiem_L2', name: 'District Hospital Cost per Day', value: params.perDiemCosts.L2 > 0 ? `$${params.perDiemCosts.L2}` : 'Not set' },
        { symbol: 'perDiem_L3', name: 'Tertiary Hospital Cost per Day', value: params.perDiemCosts.L3 > 0 ? `$${params.perDiemCosts.L3}` : 'Not set' },
        { symbol: 'AI_Fixed', name: 'AI Fixed Implementation Cost', value: params.aiFixedCost > 0 ? `$${params.aiFixedCost}` : '$0' },
        { symbol: 'AI_Variable', name: 'AI Cost per Episode', value: params.aiVariableCost > 0 ? `$${params.aiVariableCost}` : '$0' },
      ],
      example: 'Costs accumulate as patients spend time in each level of care, with higher levels typically having higher per-diem costs.'
    },
    {
      title: 'DALY Calculation',
      equation: 'DALY = Deaths × (LE - Age) + patientDays × DisabilityWeight',
      explanation: 'Disability-Adjusted Life Years combining mortality and morbidity impact, adjusted for age.',
      variables: [
        { symbol: 'LE', name: 'Regional Life Expectancy', value: params.regionalLifeExpectancy },
        { symbol: 'Age', name: 'Mean Age of Infection', value: params.meanAgeOfInfection },
        { symbol: 'DisabilityWeight', name: 'Disease Disability Weight', value: params.disabilityWeight },
      ],
      example: `For ${params.meanAgeOfInfection === 0 ? 'newborns' : (params.meanAgeOfInfection < 1 ? `infants (${params.meanAgeOfInfection * 12} months)` : `age ${params.meanAgeOfInfection}`)}, each death results in ${formatDecimal(Math.max(0, params.regionalLifeExpectancy - params.meanAgeOfInfection), 1)} years of life lost, while morbidity is weighted by a disability factor of ${formatDecimal(params.disabilityWeight, 2)}.`
    },
    {
      title: 'ICER Calculation',
      equation: 'ICER = (Cost_i – Cost_0) / (DALY_0 – DALY_i)',
      explanation: 'Incremental Cost-Effectiveness Ratio comparing intervention to baseline.',
      variables: [
        { symbol: 'Cost_i', name: 'Intervention Cost', value: 'From simulation' },
        { symbol: 'Cost_0', name: 'Baseline Cost', value: 'From baseline' },
        { symbol: 'DALY_i', name: 'Intervention DALYs', value: 'From simulation' },
        { symbol: 'DALY_0', name: 'Baseline DALYs', value: 'From baseline' },
      ],
      example: 'A lower ICER value indicates a more cost-effective intervention. Values under 1× GDP per capita are considered highly cost-effective.'
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Model Structure and Equations</h3>
      
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Stock-and-Flow Model Diagram</h4>
        <div className="flex justify-center mb-4">
          <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden p-4">
            <img 
              src="/image/stockflow_diagram.png"
              alt="Stock and Flow Model Diagram" 
              className="max-w-full h-auto mx-auto"
              style={{ maxHeight: "400px" }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
          This diagram illustrates the flow of patients through different levels of the healthcare system.
        </p>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        These are the core equations used in the stock-and-flow model, showing how patients move through the healthcare system.
        Values shown reflect current parameter settings.
      </p>
      
      <div className="space-y-8">
        {equations.map((eq, index) => (
          <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">{eq.title}</h4>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mb-3">
              <div className="font-mono text-center text-lg text-gray-800 dark:text-gray-200 p-2">
                {eq.equation.split('\n').map((line, i) => (
                  <div key={i} className="mb-2">{line}</div>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {eq.explanation}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {eq.variables.map((variable, i) => (
                <div key={i} className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900 rounded-md">
                  <div>
                    <span className="font-mono text-blue-800 dark:text-blue-200">{variable.symbol}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                      {variable.name}
                    </span>
                  </div>
                  <div className="font-mono text-gray-800 dark:text-gray-200">
                    {variable.value !== undefined && variable.value !== null ? 
                      (typeof variable.value === 'string' ? variable.value : formatDecimal(variable.value, 4)) 
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 italic">
              {eq.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquationExplainer; 