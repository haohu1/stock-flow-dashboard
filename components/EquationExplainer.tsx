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
      equation: 'U_{new} = r \\cdot (1 - \\phi_0) \\cdot New \\\\ I_{new} = (1 - r) \\cdot (1 - \\phi_0) \\cdot New \\\\ Formal_{new} = \\phi_0 \\cdot New',
      explanation: 'Distribution of new cases between untreated, informal care, and formal care pathways. Note: r (informal care ratio) represents the proportion of untreated patients who remain untreated vs. moving to informal care.',
      variables: [
        { symbol: '\\phi_0', name: 'Initial Formal Care Seeking', value: params.phi0 },
        { symbol: 'r', name: 'Untreated Ratio (informalCareRatio)', value: params.informalCareRatio },
        { symbol: 'New', name: 'New Weekly Cases', value: 'Dynamic' },
      ],
      example: `With φ_0 = ${formatDecimal(params.phi0, 2)}, ${formatDecimal(params.phi0 * 100, 0)}% of new cases directly enter formal care. Of the remaining ${formatDecimal((1-params.phi0) * 100, 0)}%, ${formatDecimal(params.informalCareRatio * 100, 0)}% remain untreated (U_new) and ${formatDecimal((1-params.informalCareRatio) * 100, 0)}% seek informal care (I_new).`
    },
    {
      title: 'Untreated Patients',
      equation: 'U_{deaths} = \\delta_U \\cdot U_t \\\\ U_{resolved} = \\mu_U \\cdot U_t \\\\ U_{t+1} = U_t + U_{new} - U_{deaths} - U_{resolved}',
      explanation: 'Weekly transitions for patients who remain completely untreated. Note: The health system multipliers for δ_U have already been applied to the parameter. Each week, the untreated population changes based on inflows from new cases and outflows from deaths and resolution.',
      variables: [
        { symbol: 'U_t', name: 'Current Untreated Cases', value: 'Dynamic' },
        { symbol: 'U_{t+1}', name: 'Untreated Cases Next Week', value: 'Dynamic' },
        { symbol: '\\delta_U', name: 'Untreated Death Rate (weekly probability, including multiplier)', value: params.deltaU },
        { symbol: '\\mu_U', name: 'Untreated Spontaneous Resolution Rate (weekly probability)', value: params.muU },
        { symbol: getLatexMultiplierSymbol('delta', 'U'), name: 'Untreated Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_U },
        { symbol: 'r', name: 'Untreated Ratio (informalCareRatio)', value: params.informalCareRatio },
      ],
      example: `The base untreated death rate has been adjusted by the health system multiplier ${getLatexMultiplierSymbol('delta', 'U')} = ${formatDecimal(activeMultipliers.delta_multiplier_U, 2)}, resulting in an effective weekly death rate of ${formatDecimal(params.deltaU * 100, 2)}% for untreated patients. Each week, ${formatDecimal(params.muU * 100, 2)}% of untreated patients recover spontaneously, and new untreated patients (U_new = ${formatDecimal(params.informalCareRatio * (1-params.phi0) * 100, 1)}% of New) join the population.`
    },
    {
      title: 'Informal Care Transitions',
      equation: 'I_{formal} = \\sigma_I \\cdot I_t \\\\ I_{resolved} = \\mu_I \\cdot I_t \\\\ I_{deaths} = \\delta_I \\cdot I_t \\\\ I_{t+1} = I_t + I_{new} - I_{formal} - I_{resolved} - I_{deaths}',
      explanation: 'Weekly transitions for patients in informal care (self-care or traditional healers). Note: Health system multipliers for μ_I and δ_I have already been applied to these parameters. Each week, the informal care population changes based on inflows of new patients and outflows to formal care, resolution, or death.',
      variables: [
        { symbol: 'I_t', name: 'Current Cases in Informal Care', value: 'Dynamic' },
        { symbol: 'I_{t+1}', name: 'Informal Care Cases Next Week', value: 'Dynamic' },
        { symbol: '\\sigma_I', name: 'Informal to Formal Transfer Rate (weekly probability)', value: params.sigmaI },
        { symbol: '\\mu_I', name: 'Informal Care Resolution Rate (weekly probability, including multiplier)', value: params.muI },
        { symbol: '\\delta_I', name: 'Informal Care Death Rate (weekly probability, including multiplier)', value: params.deltaI },
        { symbol: getLatexMultiplierSymbol('mu', 'I'), name: 'Informal Resolution Multiplier (pre-applied)', value: activeMultipliers.mu_multiplier_I },
        { symbol: getLatexMultiplierSymbol('delta', 'I'), name: 'Informal Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_I },
        { symbol: 'r', name: 'Untreated Ratio (informalCareRatio)', value: params.informalCareRatio },
      ],
      example: 'Each week: ' + formatDecimal(params.sigmaI * 100, 0) + '% of informal care patients transition to formal care. With multipliers pre-applied to parameters, ' + formatDecimal(params.muI * 100, 0) + '% resolve, and ' + formatDecimal(params.deltaI * 100, 2) + '% die. New informal care patients (I_new = ' + formatDecimal((1-params.informalCareRatio) * (1-params.phi0) * 100, 1) + '% of New) join the population.'
    },
    {
      title: 'Formal Care Entry',
      equation: 'Formal_{new} = \\phi_0 \\cdot New + \\sigma_I \\cdot I_t',
      explanation: 'Total number of people entering formal care pathways each week, combining new cases directly seeking formal care and transfers from informal care.',
      variables: [
        { symbol: '\\phi_0', name: 'Initial Formal Care Seeking (probability)', value: params.phi0 },
        { symbol: 'New', name: 'New Weekly Cases', value: 'Dynamic' },
        { symbol: '\\sigma_I', name: 'Informal to Formal Transfer Rate (weekly probability)', value: params.sigmaI },
        { symbol: 'I_t', name: 'Current Cases in Informal Care', value: 'Dynamic' },
      ],
      example: 'With φ_0 = ' + formatDecimal(params.phi0, 2) + ' and σ_I = ' + formatDecimal(params.sigmaI, 2) + ', about ' + formatDecimal(params.phi0 * 100, 0) + '% of new patients and ' + formatDecimal(params.sigmaI * 100, 0) + '% of informal care patients enter formal care weekly.'
    },
    {
      title: 'Formal Care Distribution',
      equation: 'L0_{new} = 1.0 \\cdot Formal_{new} \\\\ L1_{new} = 0 \\\\ L2_{new} = 0 \\\\ L3_{new} = 0',
      explanation: 'All formal care entries are directed to CHW (L0) level first, with subsequent referrals to higher levels as needed.',
      variables: [
        { symbol: 'Formal_{new}', name: 'Formal Care Entries', value: 'Dynamic' },
        { symbol: 'L0_{new}', name: 'New CHW-Level Cases', value: '100% of Formal_new' },
        { symbol: 'L1_{new}', name: 'New Primary Care Cases', value: '0% direct from Formal_new' },
        { symbol: 'L2_{new}', name: 'New District Hospital Cases', value: '0% direct from Formal_new' },
        { symbol: 'L3_{new}', name: 'New Tertiary Hospital Cases', value: '0% direct from Formal_new' },
      ],
      example: 'All patients entering formal care are first directed to community health workers (L0). Higher levels of care are accessed through referrals from lower levels.'
    },
    {
      title: 'CHW Level (L0) Transitions',
      equation: 'L0_{resolved} = \\mu_{L0} \\cdot L0_t \\\\ L0_{deaths} = \\delta_{L0} \\cdot L0_t \\\\ L0_{referrals} = \\rho_{L0} \\cdot L0_t \\\\ L0_{t+1} = L0_t + L0_{new} - L0_{resolved} - L0_{deaths} - L0_{referrals}',
      explanation: 'Weekly transitions for patients at the community health worker level. Note: Health system multipliers for μ_L0, δ_L0, and ρ_L0 have already been applied to these parameters. Each week, the L0 population changes based on new entries and outflows through resolution, death, or referral.',
      variables: [
        { symbol: 'L0_t', name: 'Current Cases at CHW Level', value: 'Dynamic' },
        { symbol: 'L0_{t+1}', name: 'CHW Cases Next Week', value: 'Dynamic' },
        { symbol: '\\mu_{L0}', name: 'CHW Resolution Rate (weekly probability, including multiplier)', value: params.mu0 },
        { symbol: '\\delta_{L0}', name: 'CHW Death Rate (weekly probability, including multiplier)', value: params.delta0 },
        { symbol: '\\rho_{L0}', name: 'CHW to Primary Care Referral Rate (weekly probability, including multiplier)', value: params.rho0 },
        { symbol: getLatexMultiplierSymbol('mu', 'L0'), name: 'CHW Resolution Multiplier (pre-applied)', value: activeMultipliers.mu_multiplier_L0 },
        { symbol: getLatexMultiplierSymbol('delta', 'L0'), name: 'CHW Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_L0 },
        { symbol: getLatexMultiplierSymbol('rho', 'L0'), name: 'CHW Referral Multiplier (pre-applied)', value: activeMultipliers.rho_multiplier_L0 },
      ],
      example: 'At CHW level, with health system multipliers pre-applied to parameters: ' + formatDecimal(params.mu0 * 100, 0) + '% resolve, ' + formatDecimal(params.delta0 * 100, 2) + '% die, and ' + formatDecimal(params.rho0 * 100, 0) + '% are referred. New CHW patients (L0_new) from formal care entries join the system weekly.'
    },
    {
      title: 'Primary Care (L1) Transitions',
      equation: 'L1_{resolved} = \\mu_{L1} \\cdot L1_t \\\\ L1_{deaths} = \\delta_{L1} \\cdot L1_t \\\\ L1_{referrals} = \\rho_{L1} \\cdot L1_t \\\\ L1_{new} = L0_{referrals} \\\\ L1_{t+1} = L1_t + L1_{new} - L1_{resolved} - L1_{deaths} - L1_{referrals}',
      explanation: 'Weekly transitions for patients at the primary care level. Note: Health system multipliers for μ_L1, δ_L1, and ρ_L1 have already been applied to these parameters. New primary care patients (L1_new) come from CHW referrals.',
      variables: [
        { symbol: 'L1_t', name: 'Current Cases at Primary Care', value: 'Dynamic' },
        { symbol: 'L1_{t+1}', name: 'Primary Care Cases Next Week', value: 'Dynamic' },
        { symbol: '\\mu_{L1}', name: 'Primary Care Resolution Rate (weekly probability, including multiplier)', value: params.mu1 },
        { symbol: '\\delta_{L1}', name: 'Primary Care Death Rate (weekly probability, including multiplier)', value: params.delta1 },
        { symbol: '\\rho_{L1}', name: 'Primary to District Hospital Referral Rate (weekly probability, including multiplier)', value: params.rho1 },
        { symbol: getLatexMultiplierSymbol('mu', 'L1'), name: 'Primary Care Resolution Multiplier (pre-applied)', value: activeMultipliers.mu_multiplier_L1 },
        { symbol: getLatexMultiplierSymbol('delta', 'L1'), name: 'Primary Care Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_L1 },
        { symbol: getLatexMultiplierSymbol('rho', 'L1'), name: 'Primary Care Referral Multiplier (pre-applied)', value: activeMultipliers.rho_multiplier_L1 },
      ],
      example: 'At Primary Care, with health system multipliers pre-applied to parameters: ' + formatDecimal(params.mu1 * 100, 0) + '% resolve, ' + formatDecimal(params.delta1 * 100, 2) + '% die, and ' + formatDecimal(params.rho1 * 100, 0) + '% are referred. New primary care patients (L1_new) come from CHW referrals.'
    },
    {
      title: 'District Hospital (L2) Transitions',
      equation: 'L2_{resolved} = \\mu_{L2} \\cdot L2_t \\\\ L2_{deaths} = \\delta_{L2} \\cdot L2_t \\\\ L2_{referrals} = \\rho_{L2} \\cdot L2_t \\\\ L2_{new} = L1_{referrals} \\\\ L2_{t+1} = L2_t + L2_{new} - L2_{resolved} - L2_{deaths} - L2_{referrals}',
      explanation: 'Weekly transitions for patients at the district hospital level. Note: Health system multipliers for μ_L2, δ_L2, and ρ_L2 have already been applied to these parameters. New district hospital patients (L2_new) come from primary care referrals.',
      variables: [
        { symbol: 'L2_t', name: 'Current Cases at District Hospitals', value: 'Dynamic' },
        { symbol: 'L2_{t+1}', name: 'District Hospital Cases Next Week', value: 'Dynamic' },
        { symbol: '\\mu_{L2}', name: 'District Hospital Resolution Rate (weekly probability, including multiplier)', value: params.mu2 },
        { symbol: '\\delta_{L2}', name: 'District Hospital Death Rate (weekly probability, including multiplier)', value: params.delta2 },
        { symbol: '\\rho_{L2}', name: 'District to Tertiary Hospital Referral Rate (weekly probability, including multiplier)', value: params.rho2 },
        { symbol: getLatexMultiplierSymbol('mu', 'L2'), name: 'District Hospital Resolution Multiplier (pre-applied)', value: activeMultipliers.mu_multiplier_L2 },
        { symbol: getLatexMultiplierSymbol('delta', 'L2'), name: 'District Hospital Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_L2 },
        { symbol: getLatexMultiplierSymbol('rho', 'L2'), name: 'District Hospital Referral Multiplier (pre-applied)', value: activeMultipliers.rho_multiplier_L2 },
      ],
      example: 'At District Hospital, with health system multipliers pre-applied to parameters: ' + formatDecimal(params.mu2 * 100, 0) + '% resolve, ' + formatDecimal(params.delta2 * 100, 2) + '% die, and ' + formatDecimal(params.rho2 * 100, 0) + '% are referred. New district hospital patients (L2_new) come from primary care referrals.'
    },
    {
      title: 'Tertiary Hospital (L3) Transitions',
      equation: 'L3_{resolved} = \\mu_{L3} \\cdot L3_t \\\\ L3_{deaths} = \\delta_{L3} \\cdot L3_t \\\\ L3_{new} = L2_{referrals} \\\\ L3_{t+1} = L3_t + L3_{new} - L3_{resolved} - L3_{deaths}',
      explanation: 'Weekly transitions for patients at the tertiary hospital level. Note: Health system multipliers for μ_L3 and δ_L3 have already been applied to these parameters. New tertiary hospital patients (L3_new) come from district hospital referrals.',
      variables: [
        { symbol: 'L3_t', name: 'Current Cases at Tertiary Hospitals', value: 'Dynamic' },
        { symbol: 'L3_{t+1}', name: 'Tertiary Hospital Cases Next Week', value: 'Dynamic' },
        { symbol: '\\mu_{L3}', name: 'Tertiary Hospital Resolution Rate (weekly probability, including multiplier)', value: params.mu3 },
        { symbol: '\\delta_{L3}', name: 'Tertiary Hospital Death Rate (weekly probability, including multiplier)', value: params.delta3 },
        { symbol: getLatexMultiplierSymbol('mu', 'L3'), name: 'Tertiary Hospital Resolution Multiplier (pre-applied)', value: activeMultipliers.mu_multiplier_L3 },
        { symbol: getLatexMultiplierSymbol('delta', 'L3'), name: 'Tertiary Hospital Death Multiplier (pre-applied)', value: activeMultipliers.delta_multiplier_L3 },
      ],
      example: 'At Tertiary Hospital, with health system multipliers pre-applied to parameters: ' + formatDecimal(params.mu3 * 100, 0) + '% resolve and ' + formatDecimal(params.delta3 * 100, 2) + '% die. New tertiary hospital patients (L3_new) come from district hospital referrals.'
    },
    {
      title: 'Cumulative Health Outcomes',
      equation: 'R_{total} = R + (\\mu_U \\cdot U_t) + (\\mu_I \\cdot I_t) + (\\mu_{L0} \\cdot L0_t) + (\\mu_{L1} \\cdot L1_t) + (\\mu_{L2} \\cdot L2_t) + (\\mu_{L3} \\cdot L3_t) \\\\\\\ D_{total} = D + (\\delta_U \\cdot U_t) + (\\delta_I \\cdot I_t) + (\\delta_{L0} \\cdot L0_t) + (\\delta_{L1} \\cdot L1_t) + (\\delta_{L2} \\cdot L2_t) + (\\delta_{L3} \\cdot L3_t)',
      explanation: 'Cumulative resolved cases and deaths across all pathways. All μ and δ parameters represent weekly probabilities with health system multipliers already incorporated.',
      variables: [
        { symbol: 'R', name: 'Cumulative Resolved Cases', value: 'Dynamic' },
        { symbol: 'D', name: 'Cumulative Deaths', value: 'Dynamic' },
      ],
      example: 'The model tracks cumulative health outcomes by adding weekly resolutions and deaths from all care levels, with all health system multipliers already applied to the parameters.'
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
      equation: 'DALY = Deaths \\cdot (LE - Age) \\cdot DiscountFactor + \\frac{patientDays}{365.25} \\cdot DisabilityWeight \\cdot DiscountFactor',
      explanation: 'Disability-Adjusted Life Years combining mortality and morbidity impact, adjusted for age and with time discounting if applied.',
      variables: [
        { symbol: 'LE', name: 'Regional Life Expectancy', value: params.regionalLifeExpectancy },
        { symbol: 'Age', name: 'Mean Age of Infection', value: params.meanAgeOfInfection },
        { symbol: 'DisabilityWeight', name: 'Disease Disability Weight', value: params.disabilityWeight },
        { symbol: 'DiscountFactor', name: 'Time Discount Factor', value: params.discountRate > 0 ? (1 - params.discountRate) : 1 },
      ],
      example: 'For ' + (params.meanAgeOfInfection === 0 ? 'newborns' : (params.meanAgeOfInfection < 1 ? `infants (${params.meanAgeOfInfection * 12} months)` : `age ${params.meanAgeOfInfection}`)) + ', each death results in ' + formatDecimal(Math.max(0, params.regionalLifeExpectancy - params.meanAgeOfInfection), 1) + ' years of life lost, while morbidity is converted from days to years and weighted by a disability factor of ' + formatDecimal(params.disabilityWeight, 2) + '.'
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
      
      <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md mb-6">
        <h4 className="text-md font-medium text-gray-700 dark:text-yellow-100 mb-2">Model Limitations</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This model has several important limitations to consider when interpreting results:
          (1) Healthcare capacity constraints are not modeled - resolution rates are proportional to patient numbers without upper limits;
          (2) The model simplifies disease progression pathways - it doesn't fully capture disease heterogeneity, non-linear progression patterns, comorbidities, demographic variations in outcomes, or complex transitions between care levels that occur in real-world settings;
          (3) All rates are weekly probabilities rather than continuous rates, which simplifies transitions but may not capture time-dependent dynamics;
          (4) The model doesn't directly capture patient suffering or quality of life beyond DALYs;
          (5) Resolution pathways assume standard care processes without accounting for complex disease interactions or comorbidities.
        </p>
      </div>
      
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Stock-and-Flow Model Diagram</h4>
        <StockFlowDiagram />
        <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
          This diagram illustrates the flow of patients through different levels of the healthcare system.
          Green highlighted paths show active AI interventions.
        </p>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md mb-6">
        <h4 className="text-md font-medium text-gray-700 dark:text-blue-100 mb-2">Variable Naming Convention</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          This model uses discrete time steps (weekly intervals) with the following variable naming convention:
        </p>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1 ml-2">
          <li><InlineMath math="X_t" /> (e.g., <InlineMath math="U_t, I_t, L0_t" />) - Current number of patients in compartment X at time t</li>
          <li><InlineMath math="X_{new}" /> (e.g., <InlineMath math="U_{new}, I_{new}" />) - New patients entering compartment X during the current time step</li>
          <li><InlineMath math="X_{t+1}" /> (e.g., <InlineMath math="U_{t+1}, I_{t+1}" />) - Updated number of patients in compartment X after all transitions, for the next time step</li>
          <li><InlineMath math="X_{deaths}, X_{resolved}, X_{referrals}" /> - Patients leaving compartment X during the current time step due to specific outcomes</li>
          <li><InlineMath math="X_{remaining}" /> - Patients who stay in compartment X after accounting for all exits during the current time step</li>
        </ul>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        These are the core equations used in the stock-and-flow model, showing how patients move through the healthcare system.
        Values shown reflect current parameter settings, with health system multipliers already applied to the parameters.
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