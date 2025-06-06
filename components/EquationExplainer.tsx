import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { 
  derivedParametersAtom, 
  populationSizeAtom,
  healthSystemMultipliersAtom,
  selectedDiseasesAtom,
  individualDiseaseParametersAtom
} from '../lib/store';
import { formatDecimal } from '../lib/utils';
import StockFlowDiagram from './StockFlowDiagram';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

const EquationExplainer: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [population] = useAtom(populationSizeAtom);
  const [activeMultipliers] = useAtom(healthSystemMultipliersAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  
  const isMultiDiseaseMode = selectedDiseases.length > 1;
  
  // State for selected disease and expanded sections
  const [selectedDiseaseForView, setSelectedDiseaseForView] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  
  // Initialize selected disease
  React.useEffect(() => {
    if (isMultiDiseaseMode && !selectedDiseaseForView && selectedDiseases.length > 0) {
      setSelectedDiseaseForView(selectedDiseases[0]);
    }
  }, [isMultiDiseaseMode, selectedDiseases, selectedDiseaseForView]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Section component
  const CollapsibleSection = ({ 
    id, 
    title, 
    children, 
    defaultExpanded = false 
  }: { 
    id: string; 
    title: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className="text-gray-500 dark:text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        {isExpanded && (
          <div className="p-6 bg-white dark:bg-gray-900">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Quick reference card
  const QuickReference = () => (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">📋 Quick Reference</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Flow Parameters</h5>
          <ul className="text-blue-700 dark:text-blue-300 space-y-1">
            <li>• λ: Incidence rate</li>
            <li>• φ₀: Initial formal care</li>
            <li>• σᵢ: Informal→formal</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Outcome Rates</h5>
          <ul className="text-blue-700 dark:text-blue-300 space-y-1">
            <li>• μ: Resolution rate</li>
            <li>• δ: Mortality rate</li>
            <li>• ρ: Referral rate</li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Compartments</h5>
          <ul className="text-blue-700 dark:text-blue-300 space-y-1">
            <li>• U: Untreated</li>
            <li>• I: Informal care</li>
            <li>• L0-L3: Care levels</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Disease-specific parameters for selected disease
  const DiseaseParameters = ({ disease }: { disease: string }) => {
    const diseaseParams = individualDiseaseParams[disease];
    if (!diseaseParams) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Incidence & Burden</h5>
            <ul className="space-y-1 text-sm text-orange-700 dark:text-orange-300">
              <li>• Annual incidence: {(diseaseParams.lambda * 100000).toFixed(0)} per 100k</li>
              <li>• Weekly new cases: {((diseaseParams.lambda * population) / 52).toFixed(0)}</li>
              <li>• Mean age: {diseaseParams.meanAgeOfInfection} years</li>
              <li>• Disability weight: {diseaseParams.disabilityWeight.toFixed(3)}</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Care Seeking</h5>
            <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
              <li>• Formal care: {(diseaseParams.phi0 * 100).toFixed(1)}%</li>
              <li>• Informal care: {((1-diseaseParams.phi0)*(1-diseaseParams.informalCareRatio)*100).toFixed(1)}%</li>
              <li>• Untreated: {((1-diseaseParams.phi0)*diseaseParams.informalCareRatio*100).toFixed(1)}%</li>
              <li>• Informal→formal: {(diseaseParams.sigmaI * 100).toFixed(2)}%/wk</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Key Clinical Outcomes</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-purple-600 dark:text-purple-400">Untreated mortality:</span>
              <div className="font-semibold text-purple-800 dark:text-purple-200">{(diseaseParams.deltaU * 100).toFixed(2)}%/wk</div>
            </div>
            <div>
              <span className="text-purple-600 dark:text-purple-400">CHW resolution:</span>
              <div className="font-semibold text-purple-800 dark:text-purple-200">{(diseaseParams.mu0 * 100).toFixed(1)}%/wk</div>
            </div>
            <div>
              <span className="text-purple-600 dark:text-purple-400">Primary mortality:</span>
              <div className="font-semibold text-purple-800 dark:text-purple-200">{(diseaseParams.delta1 * 100).toFixed(2)}%/wk</div>
            </div>
            <div>
              <span className="text-purple-600 dark:text-purple-400">Tertiary mortality:</span>
              <div className="font-semibold text-purple-800 dark:text-purple-200">{(diseaseParams.delta3 * 100).toFixed(2)}%/wk</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Model Equations & Structure
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isMultiDiseaseMode 
            ? `Modeling ${selectedDiseases.length} diseases through a unified health system`
            : 'Single disease stock-and-flow model'
          }
        </p>
      </div>

      {/* Quick Reference */}
      <QuickReference />

      {/* Model Overview Section */}
      <CollapsibleSection 
        id="overview" 
        title="📊 Model Overview" 
        defaultExpanded={true}
      >
        {isMultiDiseaseMode && (
          <div className="mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Multi-Disease Approach</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Each disease runs independently through the health system with its own parameters. 
                Final outcomes (deaths, DALYs, costs) are summed across all diseases.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                {(() => {
                  // Calculate the actual sum of individual lambdas
                  const actualSum = selectedDiseases.reduce((sum, d) => {
                    return sum + (individualDiseaseParams[d]?.lambda || 0);
                  }, 0);
                  
                  return selectedDiseases.map(disease => {
                    const diseaseParams = individualDiseaseParams[disease];
                    // Use actual sum for percentage calculation
                    const contribution = actualSum > 0 ? ((diseaseParams?.lambda || 0) / actualSum * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={disease} className="text-xs bg-white dark:bg-gray-800 p-2 rounded">
                        <div className="font-medium text-purple-800 dark:text-purple-200">
                          {disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-purple-600 dark:text-purple-400">{contribution}% of incidence</div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Stock-and-Flow Diagram</h4>
          <StockFlowDiagram 
            selectedDisease={isMultiDiseaseMode ? selectedDiseaseForView || selectedDiseases[0] : undefined}
            onDiseaseChange={isMultiDiseaseMode ? setSelectedDiseaseForView : undefined}
          />
        </div>
        
        {/* Disease-specific parameters */}
        {isMultiDiseaseMode && selectedDiseaseForView && (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Disease-Specific Parameters: {selectedDiseaseForView.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <DiseaseParameters disease={selectedDiseaseForView} />
          </div>
        )}
      </CollapsibleSection>

      {/* Core Flow Equations */}
      <CollapsibleSection id="flows" title="🔄 Patient Flow Equations">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Weekly Incidence</h5>
            <BlockMath math="New = \frac{\lambda \cdot Population}{52}" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              New symptomatic cases: {formatDecimal((params.lambda * population) / 52, 0)} per week
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Initial Care Distribution</h5>
            <BlockMath math="Formal = \phi_0 \cdot New" />
            <BlockMath math="Informal = (1-\phi_0) \cdot (1-r) \cdot New" />
            <BlockMath math="Untreated = (1-\phi_0) \cdot r \cdot New" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Distribution: {(params.phi0 * 100).toFixed(1)}% formal, 
              {((1-params.phi0)*(1-params.informalCareRatio)*100).toFixed(1)}% informal, 
              {((1-params.phi0)*params.informalCareRatio*100).toFixed(1)}% untreated
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Care Level Transitions */}
      <CollapsibleSection id="transitions" title="🏥 Care Level Transitions">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Weekly transition probabilities between care levels. All rates shown include health system multipliers.
          </p>
          
          {/* Compact transition table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Level</th>
                  <th className="px-4 py-2 text-center">Resolution (μ)</th>
                  <th className="px-4 py-2 text-center">Mortality (δ)</th>
                  <th className="px-4 py-2 text-center">Referral (ρ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-2 font-medium">Untreated</td>
                  <td className="px-4 py-2 text-center">{(params.muU * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.deltaU * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Informal</td>
                  <td className="px-4 py-2 text-center">{(params.muI * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.deltaI * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.sigmaI * 100).toFixed(2)}%*</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">CHW (L0)</td>
                  <td className="px-4 py-2 text-center">{(params.mu0 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.delta0 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.rho0 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Primary (L1)</td>
                  <td className="px-4 py-2 text-center">{(params.mu1 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.delta1 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.rho1 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">District (L2)</td>
                  <td className="px-4 py-2 text-center">{(params.mu2 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.delta2 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.rho2 * 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Tertiary (L3)</td>
                  <td className="px-4 py-2 text-center">{(params.mu3 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">{(params.delta3 * 100).toFixed(2)}%</td>
                  <td className="px-4 py-2 text-center">-</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              * σᵢ represents transition from informal to formal care
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Capacity and Congestion */}
      <CollapsibleSection id="capacity" title="⚡ Capacity & Congestion">
        <div className="space-y-4">
          {params.systemCongestion > 0 ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <h5 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  System Under Stress: {(params.systemCongestion * 100).toFixed(0)}% Congestion
                </h5>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  <li>• Flow capacity reduced to {(Math.max(0.2, 1 - 0.5 * params.systemCongestion) * 100).toFixed(0)}%</li>
                  <li>• Queues forming at all care levels</li>
                  <li>• Queue mortality rate: {(params.deltaU * 100).toFixed(2)}% per week</li>
                  {params.systemCongestion > 0.5 && (
                    <>
                      <li>• Staff productivity boost: +{((0.4 * (params.systemCongestion - 0.5)) * 100).toFixed(0)}%</li>
                      <li>• Referral reduction: -{((0.6 * (params.systemCongestion - 0.5)) * 100).toFixed(0)}%</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h5 className="font-semibold mb-2">Capacity Constraint Equation</h5>
                <BlockMath math="Flow_{actual} = Flow_{base} \cdot max(0.2, 1 - 0.5 \cdot s)" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Where s = system congestion level
                </p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                System Operating Normally
              </h5>
              <p className="text-sm text-green-700 dark:text-green-300">
                No congestion detected. All patients flow through the system without delays.
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Economic Calculations */}
      <CollapsibleSection id="economics" title="💰 Economic & DALY Calculations">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">Cost Calculation</h5>
            <BlockMath math="TotalCost = \sum_{level} (PatientDays_{level} \times PerDiem_{level}) + AI_{fixed} + AI_{variable}" />
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>CHW: ${params.perDiemCosts.L0}/day</div>
              <div>Primary: ${params.perDiemCosts.L1}/day</div>
              <div>District: ${params.perDiemCosts.L2}/day</div>
              <div>Tertiary: ${params.perDiemCosts.L3}/day</div>
              <div>AI Fixed: ${params.aiFixedCost}</div>
              <div>AI Variable: ${params.aiVariableCost}/episode</div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h5 className="font-semibold mb-2">DALY Calculation</h5>
            <BlockMath math="DALY = YLL + YLD = Deaths \times (LE - Age) + \frac{PatientDays}{365.25} \times DW" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Life expectancy: {params.regionalLifeExpectancy} years, 
              Mean age: {params.meanAgeOfInfection} years,
              Disability weight: {params.disabilityWeight}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Model Limitations */}
      <CollapsibleSection id="limitations" title="⚠️ Model Limitations">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>• <strong>Simplified capacity:</strong> Real health systems have facility-specific constraints</li>
            <li>• <strong>Disease independence:</strong> No modeling of comorbidities or disease interactions</li>
            <li>• <strong>Weekly time steps:</strong> May not capture rapid disease dynamics</li>
            <li>• <strong>Homogeneous population:</strong> No age/risk stratification within diseases</li>
            <li>• <strong>Static parameters:</strong> Rates don't change over time or with season</li>
            <li>• <strong>No geographic variation:</strong> Assumes uniform access within settings</li>
          </ul>
        </div>
      </CollapsibleSection>
    </div>
  );
};

export default EquationExplainer;