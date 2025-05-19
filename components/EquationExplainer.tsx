import React from 'react';
import { useAtom } from 'jotai';
import { 
  derivedParametersAtom, 
  populationSizeAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import StockFlowDiagram from './StockFlowDiagram';
import 'katex/dist/katex.min.css'; // Ensure CSS is imported if not globally
import { BlockMath, InlineMath } from 'react-katex';
// No direct import - will use a standard image tag with public path

const EquationExplainer: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [activeMultipliers] = useAtom(healthSystemMultipliersAtom);

  // Helper to create LaTeX multiplier symbol (e.g., "α_{L0}", "β_I")
  const getLatexMultiplierSymbol = (type: 'mu' | 'delta' | 'rho', level: string): string => {
    let greekLetter = '';
    if (type === 'mu') greekLetter = '\\alpha';
    else if (type === 'delta') greekLetter = '\\beta';
    else if (type === 'rho') greekLetter = '\\gamma';
    
    const subscript = level ? `_{${level.toUpperCase()}}` : ''; // L0, L1, I, U
    return `${greekLetter}${subscript}`;
  };

  const equations = [
    {
      title: 'Weekly Incidence',
      equation: 'New = \\frac{\\lambda \\cdot Pop}{52}',
      explanation: 'New cases entering the system each week based on annual incidence rate.',
      variables: [
        { symbol: '\\lambda', name: 'Annual Incidence Rate', value: params.lambda },
        { symbol: 'Pop', name: 'Population', value: population.toLocaleString() },
      ],
      example: `For a population of ${population.toLocaleString()} with λ = ${formatDecimal(params.lambda, 2)}, approximately ${formatDecimal((params.lambda * population) / 52, 0)} new cases per week.`
    },
    {
      title: 'Initial Care Seeking',
      equation: 'U_{new} = (1 - \\phi_0) \\cdot New \\\\ I_{new} = (1 - r) \\cdot (1 - \\phi_0) \\cdot New \\\\ Formal_{new} = \\phi_0 \\cdot New',
      explanation: 'Distribution of new cases between untreated, informal care, and formal care pathways.',
      variables: [
        { symbol: '\\phi_0', name: 'Initial Formal Care Seeking', value: params.phi0 },
        { symbol: 'r', name: 'Untreated Ratio', value: params.informalCareRatio },
        { symbol: 'New', name: 'New Weekly Cases', value: 'Dynamic' },
      ],
      example: `With φ_0 = ${formatDecimal(params.phi0, 2)}, ${formatDecimal(params.phi0 * 100, 0)}% of new cases directly enter formal care. Of the remaining ${formatDecimal((1-params.phi0) * 100, 0)}%, ${formatDecimal(params.informalCareRatio * 100, 0)}% remain untreated and ${formatDecimal((1-params.informalCareRatio) * 100, 0)}% seek informal care.`
    },
    {
      title: 'Untreated Patients',
      equation: 'U_{deaths} = ' + getLatexMultiplierSymbol('delta', 'U') + ' \\cdot \\delta_U \\cdot U \\\\ U_{remaining} = U - U_{deaths}',
      explanation: 'Weekly transitions for patients who remain completely untreated.',
      variables: [
        { symbol: 'U', name: 'Untreated Cases', value: 'Dynamic' },
        { symbol: getLatexMultiplierSymbol('delta', 'U'), name: 'Untreated Death Multiplier', value: activeMultipliers.delta_multiplier_U },
        { symbol: '\\delta_U', name: 'Base Untreated Death Rate', value: params.deltaU },
      ],
      example: `With a base untreated death rate (conceptually, before multiplier) and multiplier ${getLatexMultiplierSymbol('delta', 'U')} = ${formatDecimal(activeMultipliers.delta_multiplier_U, 2)}, effectively ${formatDecimal(params.deltaU * 100, 2)}% of untreated patients die each week.`
    },
    {
      title: 'Informal Care Transitions',
      equation: 'I_{formal} = \\sigma_I \\cdot I \\\\ I_{resolved} = ' + getLatexMultiplierSymbol('mu', 'I') + ' \\cdot \\mu_I \\cdot I \\\\ I_{deaths} = ' + getLatexMultiplierSymbol('delta', 'I') + ' \\cdot \\delta_I \\cdot I \\\\ I_{remaining} = I - I_{formal} - I_{resolved} - I_{deaths}',
      explanation: 'Weekly transitions for patients in informal care (self-care or traditional healers), adjusted by health system multipliers.',
      variables: [
        { symbol: 'I', name: 'Cases in Informal Care', value: 'Dynamic' },
        { symbol: '\\sigma_I', name: 'Informal to Formal Transfer Rate', value: params.sigmaI },
        { symbol: getLatexMultiplierSymbol('mu', 'I'), name: 'Informal Resolution Multiplier', value: activeMultipliers.mu_multiplier_I },
        { symbol: '\\mu_I', name: 'Base Informal Care Resolution Rate', value: params.muI },
        { symbol: getLatexMultiplierSymbol('delta', 'I'), name: 'Informal Death Multiplier', value: activeMultipliers.delta_multiplier_I },
        { symbol: '\\delta_I', name: 'Base Informal Care Death Rate', value: params.deltaI },
      ],
      example: 'Each week: ' + formatDecimal(params.sigmaI * 100, 0) + '% of informal care patients transition to formal care. With multipliers ' + getLatexMultiplierSymbol('mu', 'I') + '=' + formatDecimal(activeMultipliers.mu_multiplier_I,2) + ' and ' + getLatexMultiplierSymbol('delta', 'I') + '=' + formatDecimal(activeMultipliers.delta_multiplier_I,2) + ', effectively ' + formatDecimal(params.muI * 100, 0) + '% resolve, and ' + formatDecimal(params.deltaI * 100, 2) + '% die.'
    },
    {
      title: 'Formal Care Entry',
      equation: 'Formal = \\phi_0 \\cdot New + \\sigma_I \\cdot I',
      explanation: 'Total number of people entering formal care pathways each week.',
      variables: [
        { symbol: '\\phi_0', name: 'Initial Formal Care Seeking', value: params.phi0 },
        { symbol: 'New', name: 'New Weekly Cases', value: 'Dynamic' },
        { symbol: '\\sigma_I', name: 'Informal to Formal Transfer Rate', value: params.sigmaI },
        { symbol: 'I', name: 'Cases in Informal Care', value: 'Dynamic' },
      ],
      example: 'With φ_0 = ' + formatDecimal(params.phi0, 2) + ' and σ_I = ' + formatDecimal(params.sigmaI, 2) + ', about ' + formatDecimal(params.phi0 * 100, 0) + '% of new patients and ' + formatDecimal(params.sigmaI * 100, 0) + '% of informal care patients enter formal care weekly.'
    },
    {
      title: 'Formal Care Distribution',
      equation: 'L0_{new} = 1.0 \\cdot Formal \\\\ L1_{new} = 0 \\\\ L2_{new} = 0 \\\\ L3_{new} = 0',
      explanation: 'All formal care entries are directed to CHW (L0) level first, with subsequent referrals to higher levels as needed.',
      variables: [
        { symbol: 'Formal', name: 'Formal Care Entries', value: 'Dynamic' },
        { symbol: 'L0_{new}', name: 'New CHW-Level Cases', value: '100% of Formal' },
        { symbol: 'L1_{new}', name: 'New Primary Care Cases', value: '0% direct from Formal' },
        { symbol: 'L2_{new}', name: 'New District Hospital Cases', value: '0% direct from Formal' },
        { symbol: 'L3_{new}', name: 'New Tertiary Hospital Cases', value: '0% direct from Formal' },
      ],
      example: 'All patients entering formal care are first directed to community health workers (L0). Higher levels of care are accessed through referrals from lower levels.'
    },
    {
      title: 'CHW Level (L0) Transitions',
      equation: 'L0_{resolved} = ' + getLatexMultiplierSymbol('mu', 'L0') + ' \\cdot \\mu_{L0} \\cdot L0 \\\\ L0_{deaths} = ' + getLatexMultiplierSymbol('delta', 'L0') + ' \\cdot \\delta_{L0} \\cdot L0 \\\\ L0_{referrals} = ' + getLatexMultiplierSymbol('rho', 'L0') + ' \\cdot \\rho_{L0} \\cdot L0 \\\\ L0_{remaining} = L0 - L0_{resolved} - L0_{deaths} - L0_{referrals}',
      explanation: 'Weekly transitions for patients at the community health worker level, adjusted by health system multipliers.',
      variables: [
        { symbol: 'L0', name: 'Cases at CHW Level', value: 'Dynamic' },
        { symbol: getLatexMultiplierSymbol('mu', 'L0'), name: 'CHW Resolution Multiplier', value: activeMultipliers.mu_multiplier_L0 },
        { symbol: '\\mu_{L0}', name: 'Base CHW Resolution Rate', value: params.mu0 },
        { symbol: getLatexMultiplierSymbol('delta', 'L0'), name: 'CHW Death Multiplier', value: activeMultipliers.delta_multiplier_L0 },
        { symbol: '\\delta_{L0}', name: 'Base CHW Death Rate', value: params.delta0 },
        { symbol: getLatexMultiplierSymbol('rho', 'L0'), name: 'CHW Referral Multiplier', value: activeMultipliers.rho_multiplier_L0 },
        { symbol: '\\rho_{L0}', name: 'Base CHW to Primary Care Referral Rate', value: params.rho0 },
      ],
      example: 'At CHW level (multipliers ' + getLatexMultiplierSymbol('mu', 'L0') + '=' + formatDecimal(activeMultipliers.mu_multiplier_L0,2) + ', ' + getLatexMultiplierSymbol('delta', 'L0') + '=' + formatDecimal(activeMultipliers.delta_multiplier_L0,2) + ', ' + getLatexMultiplierSymbol('rho', 'L0') + '=' + formatDecimal(activeMultipliers.rho_multiplier_L0,2) + '): effectively ' + formatDecimal(params.mu0 * 100, 0) + '% resolve, ' + formatDecimal(params.delta0 * 100, 2) + '% die, and ' + formatDecimal(params.rho0 * 100, 0) + '% are referred.'
    },
    {
      title: 'Primary Care (L1) Transitions',
      equation: 'L1_{resolved} = ' + getLatexMultiplierSymbol('mu', 'L1') + ' \\cdot \\mu_{L1} \\cdot L1 \\\\ L1_{deaths} = ' + getLatexMultiplierSymbol('delta', 'L1') + ' \\cdot \\delta_{L1} \\cdot L1 \\\\ L1_{referrals} = ' + getLatexMultiplierSymbol('rho', 'L1') + ' \\cdot \\rho_{L1} \\cdot L1 \\\\ L1_{remaining} = L1 - L1_{resolved} - L1_{deaths} - L1_{referrals}',
      explanation: 'Weekly transitions for patients at the primary care level, adjusted by health system multipliers.',
      variables: [
        { symbol: 'L1', name: 'Cases at Primary Care', value: 'Dynamic' },
        { symbol: getLatexMultiplierSymbol('mu', 'L1'), name: 'Primary Care Resolution Multiplier', value: activeMultipliers.mu_multiplier_L1 },
        { symbol: '\\mu_{L1}', name: 'Base Primary Care Resolution Rate', value: params.mu1 },
        { symbol: getLatexMultiplierSymbol('delta', 'L1'), name: 'Primary Care Death Multiplier', value: activeMultipliers.delta_multiplier_L1 },
        { symbol: '\\delta_{L1}', name: 'Base Primary Care Death Rate', value: params.delta1 },
        { symbol: getLatexMultiplierSymbol('rho', 'L1'), name: 'Primary Care Referral Multiplier', value: activeMultipliers.rho_multiplier_L1 },
        { symbol: '\\rho_{L1}', name: 'Base Primary to District Hospital Referral Rate', value: params.rho1 },
      ],
      example: 'At Primary Care (multipliers ' + getLatexMultiplierSymbol('mu', 'L1') + '=' + formatDecimal(activeMultipliers.mu_multiplier_L1,2) + ', ' + getLatexMultiplierSymbol('delta', 'L1') + '=' + formatDecimal(activeMultipliers.delta_multiplier_L1,2) + ', ' + getLatexMultiplierSymbol('rho', 'L1') + '=' + formatDecimal(activeMultipliers.rho_multiplier_L1,2) + '): effectively ' + formatDecimal(params.mu1 * 100, 0) + '% resolve, ' + formatDecimal(params.delta1 * 100, 2) + '% die, and ' + formatDecimal(params.rho1 * 100, 0) + '% are referred.'
    },
    {
      title: 'District Hospital (L2) Transitions',
      equation: 'L2_{resolved} = ' + getLatexMultiplierSymbol('mu', 'L2') + ' \\cdot \\mu_{L2} \\cdot L2 \\\\ L2_{deaths} = ' + getLatexMultiplierSymbol('delta', 'L2') + ' \\cdot \\delta_{L2} \\cdot L2 \\\\ L2_{referrals} = ' + getLatexMultiplierSymbol('rho', 'L2') + ' \\cdot \\rho_{L2} \\cdot L2 \\\\ L2_{remaining} = L2 - L2_{resolved} - L2_{deaths} - L2_{referrals}',
      explanation: 'Weekly transitions for patients at the district hospital level, adjusted by health system multipliers.',
      variables: [
        { symbol: 'L2', name: 'Cases at District Hospitals', value: 'Dynamic' },
        { symbol: getLatexMultiplierSymbol('mu', 'L2'), name: 'District Hospital Resolution Multiplier', value: activeMultipliers.mu_multiplier_L2 },
        { symbol: '\\mu_{L2}', name: 'Base District Hospital Resolution Rate', value: params.mu2 },
        { symbol: getLatexMultiplierSymbol('delta', 'L2'), name: 'District Hospital Death Multiplier', value: activeMultipliers.delta_multiplier_L2 },
        { symbol: '\\delta_{L2}', name: 'Base District Hospital Death Rate', value: params.delta2 },
        { symbol: getLatexMultiplierSymbol('rho', 'L2'), name: 'District Hospital Referral Multiplier', value: activeMultipliers.rho_multiplier_L2 },
        { symbol: '\\rho_{L2}', name: 'Base District to Tertiary Hospital Referral Rate', value: params.rho2 },
      ],
      example: 'At District Hospital (multipliers ' + getLatexMultiplierSymbol('mu', 'L2') + '=' + formatDecimal(activeMultipliers.mu_multiplier_L2,2) + ', ' + getLatexMultiplierSymbol('delta', 'L2') + '=' + formatDecimal(activeMultipliers.delta_multiplier_L2,2) + ', ' + getLatexMultiplierSymbol('rho', 'L2') + '=' + formatDecimal(activeMultipliers.rho_multiplier_L2,2) + '): effectively ' + formatDecimal(params.mu2 * 100, 0) + '% resolve, ' + formatDecimal(params.delta2 * 100, 2) + '% die, and ' + formatDecimal(params.rho2 * 100, 0) + '% are referred.'
    },
    {
      title: 'Tertiary Hospital (L3) Transitions',
      equation: 'L3_{resolved} = ' + getLatexMultiplierSymbol('mu', 'L3') + ' \\cdot \\mu_{L3} \\cdot L3 \\\\ L3_{deaths} = ' + getLatexMultiplierSymbol('delta', 'L3') + ' \\cdot \\delta_{L3} \\cdot L3 \\\\ L3_{remaining} = L3 - L3_{resolved} - L3_{deaths}',
      explanation: 'Weekly transitions for patients at the tertiary hospital level, adjusted by health system multipliers.',
      variables: [
        { symbol: 'L3', name: 'Cases at Tertiary Hospitals', value: 'Dynamic' },
        { symbol: getLatexMultiplierSymbol('mu', 'L3'), name: 'Tertiary Hospital Resolution Multiplier', value: activeMultipliers.mu_multiplier_L3 },
        { symbol: '\\mu_{L3}', name: 'Base Tertiary Hospital Resolution Rate', value: params.mu3 },
        { symbol: getLatexMultiplierSymbol('delta', 'L3'), name: 'Tertiary Hospital Death Multiplier', value: activeMultipliers.delta_multiplier_L3 },
        { symbol: '\\delta_{L3}', name: 'Base Tertiary Hospital Death Rate', value: params.delta3 },
      ],
      example: 'At Tertiary Hospital (multipliers ' + getLatexMultiplierSymbol('mu', 'L3') + '=' + formatDecimal(activeMultipliers.mu_multiplier_L3,2) + ', ' + getLatexMultiplierSymbol('delta', 'L3') + '=' + formatDecimal(activeMultipliers.delta_multiplier_L3,2) + '): effectively ' + formatDecimal(params.mu3 * 100, 0) + '% resolve and ' + formatDecimal(params.delta3 * 100, 2) + '% die.'
    },
    {
      title: 'Cumulative Health Outcomes',
      equation: 'R_{total} = R + (' + getLatexMultiplierSymbol('mu', 'I') + '\\mu_I \\cdot I) + (' + getLatexMultiplierSymbol('mu', 'L0') + '\\mu_{L0} \\cdot L0) + (' + getLatexMultiplierSymbol('mu', 'L1') + '\\mu_{L1} \\cdot L1) + (' + getLatexMultiplierSymbol('mu', 'L2') + '\\mu_{L2} \\cdot L2) + (' + getLatexMultiplierSymbol('mu', 'L3') + '\\mu_{L3} \\cdot L3) \\\\\\\ D_{total} = D + (' + getLatexMultiplierSymbol('delta', 'U') + '\\delta_U \\cdot U) + (' + getLatexMultiplierSymbol('delta', 'I') + '\\delta_I \\cdot I) + (' + getLatexMultiplierSymbol('delta', 'L0') + '\\delta_{L0} \\cdot L0) + (' + getLatexMultiplierSymbol('delta', 'L1') + '\\delta_{L1} \\cdot L1) + (' + getLatexMultiplierSymbol('delta', 'L2') + '\\delta_{L2} \\cdot L2) + (' + getLatexMultiplierSymbol('delta', 'L3') + '\\delta_{L3} \\cdot L3)',
      explanation: 'Cumulative resolved cases and deaths across all pathways, considering health system multipliers.',
      variables: [
        { symbol: 'R', name: 'Cumulative Resolved Cases', value: 'Dynamic' },
        { symbol: 'D', name: 'Cumulative Deaths', value: 'Dynamic' },
      ],
      example: 'The model tracks cumulative health outcomes by adding weekly resolutions and deaths from all care levels, adjusted by multipliers.'
    },
    {
      title: 'Total Cost Calculation',
      equation: 'TotalCost = \\Sigma(patientDays_k \\cdot perDiem_k) + AI_{Fixed} + (AI_{Variable} \\cdot Episodes_{touched})',
      explanation: 'Sum of care costs plus AI implementation costs.',
      variables: [
        { symbol: 'perDiem_I', name: 'Informal Care Cost per Day', value: params.perDiemCosts.I > 0 ? '$' + params.perDiemCosts.I : 'Not set' },
        { symbol: 'perDiem_{L0}', name: 'CHW Cost per Day', value: params.perDiemCosts.L0 > 0 ? '$' + params.perDiemCosts.L0 : 'Not set' },
        { symbol: 'perDiem_{L1}', name: 'Primary Care Cost per Day', value: params.perDiemCosts.L1 > 0 ? '$' + params.perDiemCosts.L1 : 'Not set' },
        { symbol: 'perDiem_{L2}', name: 'District Hospital Cost per Day', value: params.perDiemCosts.L2 > 0 ? '$' + params.perDiemCosts.L2 : 'Not set' },
        { symbol: 'perDiem_{L3}', name: 'Tertiary Hospital Cost per Day', value: params.perDiemCosts.L3 > 0 ? '$' + params.perDiemCosts.L3 : 'Not set' },
        { symbol: 'AI_{Fixed}', name: 'AI Fixed Implementation Cost', value: params.aiFixedCost > 0 ? '$' + params.aiFixedCost : '$0' },
        { symbol: 'AI_{Variable}', name: 'AI Cost per Episode', value: params.aiVariableCost > 0 ? '$' + params.aiVariableCost : '$0' },
      ],
      example: 'Costs accumulate as patients spend time in each level of care, with higher levels typically having higher per-diem costs.'
    },
    {
      title: 'DALY Calculation',
      equation: 'DALY = Deaths \\cdot (LE - Age) + patientDays \\cdot DisabilityWeight',
      explanation: 'Disability-Adjusted Life Years combining mortality and morbidity impact, adjusted for age.',
      variables: [
        { symbol: 'LE', name: 'Regional Life Expectancy', value: params.regionalLifeExpectancy },
        { symbol: 'Age', name: 'Mean Age of Infection', value: params.meanAgeOfInfection },
        { symbol: 'DisabilityWeight', name: 'Disease Disability Weight', value: params.disabilityWeight },
      ],
      example: 'For ' + (params.meanAgeOfInfection === 0 ? 'newborns' : (params.meanAgeOfInfection < 1 ? `infants (${params.meanAgeOfInfection * 12} months)` : `age ${params.meanAgeOfInfection}`)) + ', each death results in ' + formatDecimal(Math.max(0, params.regionalLifeExpectancy - params.meanAgeOfInfection), 1) + ' years of life lost, while morbidity is weighted by a disability factor of ' + formatDecimal(params.disabilityWeight, 2) + '.'
    },
    {
      title: 'ICER Calculation',
      equation: 'ICER = \\frac{Cost_i – Cost_0}{DALY_0 – DALY_i}',
      explanation: 'Incremental Cost-Effectiveness Ratio comparing intervention to baseline.',
      variables: [
        { symbol: 'Cost_i', name: 'Intervention Cost', value: 'From simulation' },
        { symbol: 'Cost_0', name: 'Baseline Cost', value: 'From baseline' },
        { symbol: 'DALY_i', name: 'Intervention DALYs', value: 'From simulation' },
        { symbol: 'DALY_0', name: 'Baseline DALYs', value: 'From baseline' },
      ],
      example: 'A lower ICER value indicates a more cost-effective intervention. When both costs are reduced and health is improved, the intervention is considered "dominant" and displayed as such.'
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Model Structure and Equations</h3>
      
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Stock-and-Flow Model Diagram</h4>
        <StockFlowDiagram />
        <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
          This diagram illustrates the flow of patients through different levels of the healthcare system.
          Green highlighted paths show active AI interventions.
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
              <div className="text-lg text-gray-800 dark:text-gray-200 p-2 text-center">
                <BlockMath math={eq.equation} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {eq.explanation}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {eq.variables.map((variable, i) => (
                <div key={i} className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900 rounded-md">
                  <div>
                    <span className="font-mono text-blue-800 dark:text-blue-200">
                      <InlineMath math={variable.symbol} />
                    </span>
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