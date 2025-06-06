import React from 'react';
import { useAtom } from 'jotai';
import { 
  derivedParametersAtom, 
  aiInterventionsAtom, 
  selectedDiseaseAtom, 
  selectedDiseasesAtom, 
  selectedHealthSystemStrengthAtom, 
  individualDiseaseParametersAtom 
} from '../lib/store';

const ParameterGuide: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [selectedHealthSystem] = useAtom(selectedHealthSystemStrengthAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  
  const isMultiDiseaseMode = selectedDiseases.length > 1;

  // Formatting helpers
  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'Not set';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatRate = (value: number | undefined) => {
    if (value === undefined) return 'Not set';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatIncidence = (value: number) => {
    return `${(value * 100000).toFixed(0).toLocaleString()} per 100,000`;
  };

  // Clinical section component
  const ClinicalSection = ({ title, children, className = "" }: { 
    title: string; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`rounded-lg p-6 mb-6 ${className}`}>
      <h3 className="text-lg font-bold mb-4">
        {title}
      </h3>
      {children}
    </div>
  );

  // Parameter table component
  const ParameterTable = ({ parameters }: { parameters: Array<{
    name: string;
    symbol: string;
    value: string | number;
    clinical: string;
  }>}) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <th className="py-2 pr-4">Parameter</th>
            <th className="py-2 pr-4">Symbol</th>
            <th className="py-2 pr-4">Current Value</th>
            <th className="py-2">Clinical Meaning</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {parameters.map((param, idx) => (
            <tr key={idx} className="text-sm">
              <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{param.name}</td>
              <td className="py-2 pr-4 font-mono text-gray-600 dark:text-gray-400">{param.symbol}</td>
              <td className="py-2 pr-4 font-semibold text-blue-600 dark:text-blue-400">{param.value}</td>
              <td className="py-2 text-gray-700 dark:text-gray-300">{param.clinical}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Disease contribution summary for multi-disease mode
  const DiseaseContribution = ({ disease, params: diseaseParams, totalLambda }: { 
    disease: string; 
    params: any;
    totalLambda: number;
  }) => {
    if (!diseaseParams) return null;
    
    const diseaseName = disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const contribution = totalLambda > 0 ? ((diseaseParams.lambda / totalLambda) * 100).toFixed(1) : '0';
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-start mb-2">
          <h5 className="font-semibold text-gray-900 dark:text-white">{diseaseName}</h5>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{contribution}% incidence</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>Incidence: {formatIncidence(diseaseParams.lambda)}</div>
          <div>Formal care: {formatPercentage(diseaseParams.phi0)}</div>
          <div>Untreated mort: {formatRate(diseaseParams.deltaU)}/wk</div>
          <div>CHW resolution: {formatRate(diseaseParams.mu0)}/wk</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Clinical Parameter Reference
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {isMultiDiseaseMode 
            ? `Modeling ${selectedDiseases.length} diseases in aggregate`
            : `Single disease model: ${selectedDisease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
          }
        </p>
      </div>

      {/* Multi-Disease Overview */}
      {isMultiDiseaseMode && (
        <ClinicalSection title="📊 Multi-Disease Model Overview" className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              <strong>Methodology:</strong> Each disease runs independently through the same health system structure. 
              Final outcomes (deaths, DALYs, costs) are summed across all diseases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(() => {
                // Calculate actual sum of individual disease lambdas
                const actualSum = selectedDiseases.reduce((sum, d) => {
                  return sum + (individualDiseaseParams[d]?.lambda || 0);
                }, 0);
                
                return selectedDiseases.map(disease => (
                  <DiseaseContribution 
                    key={disease} 
                    disease={disease} 
                    params={individualDiseaseParams[disease]}
                    totalLambda={actualSum}
                  />
                ));
              })()}
            </div>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Total System Load:</strong> λ = {params.lambda.toFixed(3)} ({formatIncidence(params.lambda)} annually)
            </p>
          </div>
        </ClinicalSection>
      )}

      {/* Disease Epidemiology */}
      <ClinicalSection title="🦠 Disease Epidemiology" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
        <ParameterTable parameters={[
          {
            name: "Annual Incidence",
            symbol: "λ",
            value: formatIncidence(params.lambda),
            clinical: "New cases per 100,000 population per year"
          },
          {
            name: "Weekly New Cases",
            symbol: "λ×Pop/52",
            value: `${((params.lambda * 100000) / 52).toFixed(0)} per 100k`,
            clinical: "Expected new symptomatic cases entering the system each week"
          },
          {
            name: "Mean Age",
            symbol: "Age",
            value: `${params.meanAgeOfInfection} years`,
            clinical: "Average age at disease onset (affects YLL calculations)"
          },
          {
            name: "Disability Weight",
            symbol: "DW",
            value: params.disabilityWeight.toFixed(3),
            clinical: "Disease severity (0=perfect health, 1=death equivalent)"
          }
        ]} />
      </ClinicalSection>

      {/* Care-Seeking Behavior */}
      <ClinicalSection title="🏥 Care-Seeking Patterns" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
        <ParameterTable parameters={[
          {
            name: "Initial Formal Care",
            symbol: "φ₀",
            value: formatPercentage(params.phi0),
            clinical: "Proportion seeking formal healthcare immediately"
          },
          {
            name: "Informal Care Ratio",
            symbol: "r",
            value: formatPercentage(params.informalCareRatio),
            clinical: "Among non-formal seekers, proportion using informal care vs staying untreated"
          },
          {
            name: "Informal→Formal",
            symbol: "σᵢ",
            value: formatRate(params.sigmaI) + "/wk",
            clinical: "Weekly probability of informal care patients seeking formal care"
          }
        ]} />
        
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Initial Distribution:</strong> {formatPercentage(params.phi0)} formal, {formatPercentage((1-params.phi0)*(1-params.informalCareRatio))} informal, {formatPercentage((1-params.phi0)*params.informalCareRatio)} untreated
          </p>
        </div>
      </ClinicalSection>

      {/* Clinical Outcomes by Level */}
      <ClinicalSection title="💊 Clinical Outcomes by Care Level" className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
        <div className="space-y-4">
          {/* Mortality Rates */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Weekly Mortality Rates (δ)</h4>
            <ParameterTable parameters={[
              {
                name: "Untreated",
                symbol: "δᵤ",
                value: formatRate(params.deltaU) + "/wk",
                clinical: "Baseline mortality without any care"
              },
              {
                name: "Informal Care",
                symbol: "δᵢ",
                value: formatRate(params.deltaI) + "/wk",
                clinical: "Mortality with traditional/self-care"
              },
              {
                name: "CHW Level",
                symbol: "δ₀",
                value: formatRate(params.delta0) + "/wk",
                clinical: "Mortality with community health worker care"
              },
              {
                name: "Primary Care",
                symbol: "δ₁",
                value: formatRate(params.delta1) + "/wk",
                clinical: "Mortality at primary health centers"
              },
              {
                name: "District Hospital",
                symbol: "δ₂",
                value: formatRate(params.delta2) + "/wk",
                clinical: "Mortality at district hospitals"
              },
              {
                name: "Tertiary Hospital",
                symbol: "δ₃",
                value: formatRate(params.delta3) + "/wk",
                clinical: "Mortality at referral hospitals"
              }
            ]} />
          </div>

          {/* Resolution Rates */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Weekly Resolution Rates (μ)</h4>
            <ParameterTable parameters={[
              {
                name: "Untreated",
                symbol: "μᵤ",
                value: formatRate(params.muU) + "/wk",
                clinical: "Natural recovery without care"
              },
              {
                name: "Informal Care",
                symbol: "μᵢ",
                value: formatRate(params.muI) + "/wk",
                clinical: "Recovery with traditional/self-care"
              },
              {
                name: "CHW Level",
                symbol: "μ₀",
                value: formatRate(params.mu0) + "/wk",
                clinical: "Recovery rate with CHW care"
              },
              {
                name: "Primary Care",
                symbol: "μ₁",
                value: formatRate(params.mu1) + "/wk",
                clinical: "Recovery rate at primary facilities"
              },
              {
                name: "District Hospital",
                symbol: "μ₂",
                value: formatRate(params.mu2) + "/wk",
                clinical: "Recovery rate at district hospitals"
              },
              {
                name: "Tertiary Hospital",
                symbol: "μ₃",
                value: formatRate(params.mu3) + "/wk",
                clinical: "Recovery rate at tertiary facilities"
              }
            ]} />
          </div>
        </div>
      </ClinicalSection>

      {/* Referral Patterns */}
      <ClinicalSection title="🔄 Referral Patterns" className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
        <ParameterTable parameters={[
          {
            name: "CHW → Primary",
            symbol: "ρ₀",
            value: formatRate(params.rho0) + "/wk",
            clinical: "Weekly probability of referral from CHW to primary care"
          },
          {
            name: "Primary → District",
            symbol: "ρ₁",
            value: formatRate(params.rho1) + "/wk",
            clinical: "Weekly probability of referral from primary to district hospital"
          },
          {
            name: "District → Tertiary",
            symbol: "ρ₂",
            value: formatRate(params.rho2) + "/wk",
            clinical: "Weekly probability of referral from district to tertiary hospital"
          }
        ]} />
      </ClinicalSection>

      {/* System Capacity */}
      <ClinicalSection title="⚡ System Capacity & Congestion" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
        <ParameterTable parameters={[
          {
            name: "System Congestion",
            symbol: "s",
            value: formatPercentage(params.systemCongestion || 0),
            clinical: "Current system utilization (0%=empty, 100%=at capacity)"
          },
          {
            name: "Capacity Multiplier",
            symbol: "c",
            value: (Math.max(0.2, 1 - 0.5 * (params.systemCongestion || 0))).toFixed(2),
            clinical: "Flow rate reduction due to congestion"
          },
          {
            name: "Queue Mortality",
            symbol: "δQ",
            value: formatRate(params.deltaU) + "/wk",
            clinical: "Mortality while waiting in queues (same as untreated)"
          }
        ]} />
        
        {params.systemCongestion > 0 && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Congestion Effects:</strong> Queues are forming. Patient flow reduced to {formatPercentage(Math.max(0.2, 1 - 0.5 * params.systemCongestion))} of normal capacity.
            </p>
          </div>
        )}
      </ClinicalSection>

      {/* AI Interventions */}
      <ClinicalSection title="🤖 AI Intervention Status" className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({
            triageAI: { name: 'AI Triage', effect: 'Improves initial care-seeking (φ₀)' },
            chwAI: { name: 'CHW Support', effect: 'Enhances CHW effectiveness (μ₀, ρ₀)' },
            diagnosticAI: { name: 'Diagnostics AI', effect: 'Better primary/district care (μ₁, μ₂)' },
            selfCareAI: { name: 'Self-Care AI', effect: 'Reduces visits, improves informal care' },
            bedManagementAI: { name: 'Bed Management', effect: 'Optimizes hospital capacity' },
            hospitalDecisionAI: { name: 'Clinical Decisions', effect: 'Reduces hospital mortality' }
          }).map(([key, info]) => (
            <div key={key} className={`p-3 rounded-lg border-2 ${
              aiInterventions[key as keyof typeof aiInterventions] 
                ? 'bg-teal-100 dark:bg-teal-900/40 border-teal-500' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-900 dark:text-white">{info.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  aiInterventions[key as keyof typeof aiInterventions]
                    ? 'bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {aiInterventions[key as keyof typeof aiInterventions] ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{info.effect}</p>
            </div>
          ))}
        </div>
      </ClinicalSection>

      {/* Key Clinical Insights */}
      <ClinicalSection title="💡 Key Clinical Insights" className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
        <div className="space-y-3">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Case Fatality Comparison</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Untreated: {formatPercentage(params.deltaU)} vs Best care (L3): {formatPercentage(params.delta3)} per week
              → {((params.deltaU / params.delta3 - 1) * 100).toFixed(0)}% mortality reduction with optimal care
            </p>
          </div>
          
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Time to Resolution</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Informal care: ~{(1/params.muI).toFixed(1)} weeks vs Primary care: ~{(1/params.mu1).toFixed(1)} weeks
              → {((1/params.muI - 1/params.mu1)).toFixed(1)} weeks saved with formal care
            </p>
          </div>
          
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Health System Coverage</h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {formatPercentage(params.phi0)} seek formal care initially. 
              With AI triage: potential to reach {formatPercentage(Math.min(1, params.phi0 * 1.5))}-{formatPercentage(Math.min(1, params.phi0 * 2))}
            </p>
          </div>
        </div>
      </ClinicalSection>
    </div>
  );
};

export default ParameterGuide;