import React from 'react';
import { useAtom } from 'jotai';
import { derivedParametersAtom } from '../lib/store';
import { formatDecimal } from '../lib/utils';

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
      title: 'Resolution at Each Level',
      equation: 'Resolve_k = μₖ × Lₖ',
      explanation: 'Cases resolving (recovered) at each level of care k per week.',
      variables: [
        { symbol: 'μI', name: 'Informal Care Resolution Rate', value: params.muI },
        { symbol: 'μ₀', name: 'CHW Resolution Rate', value: params.mu0 },
        { symbol: 'μ₁', name: 'Primary Care Resolution Rate', value: params.mu1 },
        { symbol: 'μ₂', name: 'District Hospital Resolution Rate', value: params.mu2 },
        { symbol: 'μ₃', name: 'Tertiary Hospital Resolution Rate', value: params.mu3 },
      ],
      example: `At primary care (L1), a resolution rate of μ₁ = ${formatDecimal(params.mu1, 2)} means ${formatDecimal(params.mu1 * 100, 0)}% of cases resolve each week.`
    },
    {
      title: 'Deaths at Each Level',
      equation: 'Die_k = δₖ × Lₖ',
      explanation: 'Deaths occurring at each level of care k per week.',
      variables: [
        { symbol: 'δU', name: 'Untreated Death Rate', value: params.deltaU },
        { symbol: 'δI', name: 'Informal Care Death Rate', value: params.deltaI },
        { symbol: 'δ₀', name: 'CHW Death Rate', value: params.delta0 },
        { symbol: 'δ₁', name: 'Primary Care Death Rate', value: params.delta1 },
        { symbol: 'δ₂', name: 'District Hospital Death Rate', value: params.delta2 },
        { symbol: 'δ₃', name: 'Tertiary Hospital Death Rate', value: params.delta3 },
      ],
      example: `At district hospitals (L2), a death rate of δ₂ = ${formatDecimal(params.delta2, 4)} means ${formatDecimal(params.delta2 * 100, 2)}% of patients at that level die each week.`
    },
    {
      title: 'Referral Cascade',
      equation: 'Referral_k = ρₖ × Lₖ  (k = 0,1,2)',
      explanation: 'Patients referred from level k to level k+1 per week.',
      variables: [
        { symbol: 'ρ₀', name: 'CHW to Primary Care Referral Rate', value: params.rho0 },
        { symbol: 'ρ₁', name: 'Primary Care to District Hospital Referral Rate', value: params.rho1 },
        { symbol: 'ρ₂', name: 'District to Tertiary Hospital Referral Rate', value: params.rho2 },
      ],
      example: `From community health workers (L0), a referral rate of ρ₀ = ${formatDecimal(params.rho0, 2)} means ${formatDecimal(params.rho0 * 100, 0)}% of patients are referred to primary care weekly.`
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
      equation: 'DALY = Deaths × YLL + patientDays × DisabilityWeight',
      explanation: 'Disability-Adjusted Life Years combining mortality and morbidity impact.',
      variables: [
        { symbol: 'YLL', name: 'Years of Life Lost per Death', value: params.yearsOfLifeLost },
        { symbol: 'DisabilityWeight', name: 'Disease Disability Weight', value: params.disabilityWeight },
      ],
      example: `Each death results in ${params.yearsOfLifeLost} years of life lost, while morbidity is weighted by a disability factor of ${formatDecimal(params.disabilityWeight, 2)}.`
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
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Model Equations</h3>
      
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
                {eq.equation}
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