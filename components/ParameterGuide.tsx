import React from 'react';
import { useAtom } from 'jotai';
import { derivedParametersAtom, aiInterventionsAtom, selectedDiseaseAtom, selectedHealthSystemStrengthAtom } from '../lib/store';

const ParameterGuide: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedHealthSystem] = useAtom(selectedHealthSystemStrengthAtom);

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'Not configured';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatRate = (value: number | undefined) => {
    if (value === undefined) return 'Not configured';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCost = (value: number | undefined) => {
    if (value === undefined) return 'Not configured';
    return `$${value.toFixed(0)}`;
  };

  const getDiseaseName = (diseaseKey: string) => {
    const diseaseNames: { [key: string]: string } = {
      'childhood_pneumonia': 'Childhood Pneumonia',
      'maternal_sepsis': 'Maternal Sepsis',
      'tuberculosis': 'Tuberculosis',
      'acute_diarrhea': 'Acute Diarrhea',
      'hiv_management_chronic': 'HIV Management (Chronic)'
    };
    return diseaseNames[diseaseKey] || diseaseKey;
  };

  const getHealthSystemName = (systemKey: string) => {
    const systemNames: { [key: string]: string } = {
      'weak_rural_system': 'Weak Rural Health System',
      'moderate_urban_system': 'Moderate Urban Health System',
      'strong_urban_system': 'Strong Urban Health System'
    };
    return systemNames[systemKey] || systemKey;
  };

  const ClinicalSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );

  const ClinicalInsight = ({ title, value, interpretation, context }: { 
    title: string; 
    value: string; 
    interpretation: string; 
    context?: string;
  }) => (
    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{value}</span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-2">{interpretation}</p>
      {context && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">{context}</p>
      )}
    </div>
  );

  const ActiveInterventions = () => {
    const interventionNames = {
      triageAI: 'AI-Powered Triage',
      chwAI: 'CHW Decision Support',
      diagnosticAI: 'Point-of-Care Diagnostics',
      bedManagementAI: 'Hospital Bed Management',
      hospitalDecisionAI: 'Clinical Decision Support',
      selfCareAI: 'Patient Self-Care Guidance'
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(aiInterventions).map(([key, active]) => (
          <div key={key} className={`p-3 rounded-lg border-2 ${active ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-700'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {interventionNames[key as keyof typeof interventionNames]}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                {active ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Clinical Parameter Overview
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          Understanding your model configuration for <strong>{getDiseaseName(selectedDisease)}</strong> in a <strong>{getHealthSystemName(selectedHealthSystem)}</strong>
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            This guide translates the technical model parameters into clinically meaningful insights for healthcare professionals and policy makers.
          </p>
        </div>
      </div>

      {/* Disease Burden & Care Seeking */}
      <ClinicalSection title="Disease Burden & Patient Care-Seeking Behavior">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClinicalInsight
            title="Annual Disease Incidence"
            value={`${(params.lambda * 100000).toFixed(0)} cases per 100,000 people`}
            interpretation="This represents the expected number of new cases of this condition per year in a population of 100,000 people."
            context="For comparison: childhood pneumonia typically ranges from 1,000-5,000 per 100,000 children annually in LMICs."
          />
          
          <ClinicalInsight
            title="Healthcare-Seeking Behavior"
            value={formatPercentage(params.phi0)}
            interpretation={`${formatPercentage(params.phi0)} of patients with this condition initially seek formal healthcare, while ${formatPercentage(1 - (params.phi0 || 0))} either self-treat or seek traditional care first.`}
            context="Higher rates indicate better health system access and trust. Rural areas typically show lower formal care-seeking rates."
          />
        </div>

        <ClinicalInsight
          title="Care Pathway Transitions"
          value={`${formatPercentage(params.sigmaI)} weekly transition rate`}
          interpretation={`Each week, ${formatPercentage(params.sigmaI)} of patients receiving traditional/informal care will transition to formal healthcare, typically when their condition worsens or traditional treatment fails.`}
          context="This reflects the integration between traditional and modern healthcare systems."
        />
      </ClinicalSection>

      {/* Clinical Outcomes by Care Level */}
      <ClinicalSection title="Treatment Effectiveness Across Care Levels">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          These rates show the weekly probability of recovery and death at each level of care, reflecting both the natural disease progression and the effectiveness of interventions.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recovery Rates */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Recovery Rates</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <span>No Treatment</span>
                <span className="font-bold text-red-600">{formatRate(params.muU)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span>Traditional Care</span>
                <span className="font-bold text-orange-600">{formatRate(params.muI)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <span>Community Health Worker</span>
                <span className="font-bold text-yellow-600">{formatRate(params.mu0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span>Primary Care</span>
                <span className="font-bold text-blue-600">{formatRate(params.mu1)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                <span>District Hospital</span>
                <span className="font-bold text-indigo-600">{formatRate(params.mu2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span>Tertiary Hospital</span>
                <span className="font-bold text-green-600">{formatRate(params.mu3)}</span>
              </div>
            </div>
          </div>

          {/* Mortality Rates */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Mortality Rates</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <span>No Treatment</span>
                <span className="font-bold text-red-600">{formatRate(params.deltaU)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                <span>Traditional Care</span>
                <span className="font-bold text-orange-600">{formatRate(params.deltaI)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <span>Community Health Worker</span>
                <span className="font-bold text-yellow-600">{formatRate(params.delta0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span>Primary Care</span>
                <span className="font-bold text-blue-600">{formatRate(params.delta1)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                <span>District Hospital</span>
                <span className="font-bold text-indigo-600">{formatRate(params.delta2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span>Tertiary Hospital</span>
                <span className="font-bold text-green-600">{formatRate(params.delta3)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Clinical Interpretation</h4>
          <p className="text-gray-700 dark:text-gray-300">
            Higher-level care generally shows better recovery rates and lower mortality, but this varies by condition. 
            For acute conditions like pneumonia, the difference between levels is dramatic. For chronic conditions, 
            the differences may be smaller but still clinically significant over time.
          </p>
          {selectedDisease === 'hiv_management_chronic' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Note for HIV Management:</strong> "Recovery rates" for HIV represent successful achievement of stable clinical management and viral suppression, not cure. 
                Patients achieving these rates maintain stable health status while continuing treatment. Higher rates at formal care levels reflect access to antiretroviral therapy and specialized monitoring.
              </p>
            </div>
          )}
        </div>
      </ClinicalSection>

      {/* Health System Capacity & Congestion */}
      <ClinicalSection title="Health System Capacity & Patient Flow">
        <ClinicalInsight
          title="System Congestion Level"
          value={formatPercentage(params.systemCongestion)}
          interpretation={
            (params.systemCongestion || 0) < 0.5 
              ? "The health system is operating below capacity with manageable patient loads and minimal delays."
              : (params.systemCongestion || 0) < 0.8
              ? "The health system is experiencing moderate strain with some delays and resource competition."
              : "The health system is severely congested with significant delays, rationing, and compromised care quality."
          }
          context="Congestion affects all levels of care, with patients facing longer wait times and potentially seeking alternative care pathways."
        />

        {(params.systemCongestion || 0) > 0.3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <ClinicalInsight
              title="Queue Abandonment"
              value={formatPercentage(params.queueAbandonmentRate)}
              interpretation="Patients who give up waiting and return home untreated each week."
              context="Higher in rural areas due to travel costs and opportunity costs of waiting."
            />
            
            <ClinicalInsight
              title="Alternative Care Seeking"
              value={formatPercentage(params.queueBypassRate)}
              interpretation="Patients who seek traditional healers or self-medication while waiting."
              context="Common coping mechanism when formal care is delayed."
            />
            
            <ClinicalInsight
              title="Excess Mortality from Delays"
              value={`${((params.congestionMortalityMultiplier || 1) - 1) * 100}% increase`}
              interpretation="Additional deaths due to delayed care and disease progression while waiting."
              context="Most critical for time-sensitive conditions like sepsis or severe pneumonia."
            />
          </div>
        )}
      </ClinicalSection>

      {/* Patient Flow Transitions */}
      <ClinicalSection title="Patient Flow Transitions & System Navigation">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Understanding how patients move through the health system, including referral patterns, queue formation during congestion, and alternative pathways.
        </p>

        {/* Referral Flow */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Referral Patterns Between Care Levels</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-blue-50 dark:from-yellow-900/20 dark:to-blue-900/20 rounded-lg border">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">CHW → Primary Care</div>
                <div className="text-2xl font-bold text-blue-600">{formatRate(params.rho0)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">weekly referral rate</div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Primary → District Hospital</div>
                <div className="text-2xl font-bold text-indigo-600">{formatRate(params.rho1)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">weekly referral rate</div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-green-50 dark:from-indigo-900/20 dark:to-green-900/20 rounded-lg border">
              <div className="text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">District → Tertiary Hospital</div>
                <div className="text-2xl font-bold text-green-600">{formatRate(params.rho2)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">weekly referral rate</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Clinical Interpretation:</strong> Higher referral rates may indicate limited capacity at lower levels, more complex case mix, or inadequate resources for managing conditions locally. Optimal referral patterns balance appropriate escalation with system efficiency.
            </p>
          </div>
        </div>

        {/* Queue Dynamics */}
        {(params.systemCongestion || 0) > 0.2 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Queue Formation & Management During Congestion</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h5 className="font-semibold text-red-800 dark:text-red-200 mb-3">When Capacity is Exceeded</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Queue Clearance Capacity:</span>
                    <span className="font-semibold">{formatPercentage(params.queueClearanceRate)} weekly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Competition Sensitivity:</span>
                    <span className="font-semibold">{(params.competitionSensitivity || 1).toFixed(1)}×</span>
                  </div>
                  {params.queuePreventionRate && (
                    <div className="flex justify-between">
                      <span>AI Triage Prevention:</span>
                      <span className="font-semibold text-green-600">{formatPercentage(params.queuePreventionRate)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                  When demand exceeds capacity, patients form queues at each level. Higher competition sensitivity means this condition competes more aggressively for limited resources.
                </p>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">Patient Responses to Delays</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Abandon Care (Return Home):</span>
                    <span className="font-semibold">{formatPercentage(params.queueAbandonmentRate)} weekly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seek Traditional Care:</span>
                    <span className="font-semibold">{formatPercentage(params.queueBypassRate)} weekly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mortality Risk Increase:</span>
                    <span className="font-semibold text-red-600">+{((params.congestionMortalityMultiplier || 1) - 1) * 100}%</span>
                  </div>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                  Patients facing long waits may abandon formal care or seek alternatives, potentially leading to worse outcomes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Care Pathway Transitions */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Alternative Care Pathways</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Initial Care-Seeking Behavior</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                  <span className="text-sm">Seek Formal Care First</span>
                  <span className="font-bold text-blue-600">{formatPercentage(params.phi0)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                  <span className="text-sm">Self-treat or Traditional Care</span>
                  <span className="font-bold text-orange-600">{formatPercentage(1 - (params.phi0 || 0))}</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Initial healthcare-seeking patterns reflect access, affordability, cultural preferences, and trust in the formal system.
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h5 className="font-semibold text-green-800 dark:text-green-200 mb-3">Transitions to Formal Care</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                  <span className="text-sm">Traditional → Formal Care</span>
                  <span className="font-bold text-green-600">{formatPercentage(params.sigmaI)} weekly</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded">
                  <span className="text-sm">Untreated Population Mix</span>
                  <span className="font-bold text-gray-600">{formatPercentage(params.informalCareRatio)} stay untreated</span>
                </div>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                Patients typically transition to formal care when traditional treatment fails or symptoms worsen significantly.
              </p>
            </div>
          </div>
        </div>

        {/* AI Impact on Flow */}
        {Object.values(aiInterventions).some(Boolean) && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">AI Impact on Patient Flow</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {aiInterventions.selfCareAI && (
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Demand Reduction:</span>
                  <span className="ml-2">{formatPercentage(params.visitReduction)} fewer initial visits</span>
                </div>
              )}
              {aiInterventions.triageAI && (
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Smart Routing:</span>
                  <span className="ml-2">{formatPercentage(params.directRoutingImprovement)} better level matching</span>
                </div>
              )}
              {aiInterventions.diagnosticAI && (
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Referral Optimization:</span>
                  <span className="ml-2">{formatPercentage(params.referralPrecision)} reduction in unnecessary referrals</span>
                </div>
              )}
              {aiInterventions.bedManagementAI && (
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">Throughput Improvement:</span>
                  <span className="ml-2">{formatPercentage(params.lengthOfStayReduction)} faster patient turnover</span>
                </div>
              )}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
              AI interventions optimize patient flow by reducing unnecessary visits, improving routing decisions, and increasing system efficiency.
            </p>
          </div>
        )}
      </ClinicalSection>

      {/* AI Interventions Impact */}
      <ClinicalSection title="AI Interventions & Clinical Impact">
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Currently Active Interventions</h4>
          <ActiveInterventions />
        </div>

        {Object.values(aiInterventions).some(Boolean) ? (
          <div className="space-y-4">
            {aiInterventions.chwAI && (
              <ClinicalInsight
                title="CHW Decision Support Impact"
                value={formatPercentage(params.resolutionBoost)}
                interpretation="AI tools help community health workers make more accurate diagnoses and treatment decisions, improving patient outcomes at the community level."
                context="Particularly valuable in areas with limited CHW training or supervision."
              />
            )}
            
            {aiInterventions.diagnosticAI && (
              <ClinicalInsight
                title="Point-of-Care Diagnostic Impact"
                value={formatPercentage(params.pointOfCareResolution)}
                interpretation="AI-assisted diagnostics at primary care level reduce misdiagnosis and unnecessary referrals to higher levels."
                context="Helps primary care providers manage more cases locally, reducing system burden."
              />
            )}
            
            {aiInterventions.bedManagementAI && (
              <ClinicalInsight
                title="Hospital Efficiency Gains"
                value={formatPercentage(params.lengthOfStayReduction)}
                interpretation="AI optimization of bed allocation and discharge planning reduces average length of stay, increasing effective hospital capacity."
                context="Critical for managing patient flow during high-demand periods."
              />
            )}
            
            {aiInterventions.selfCareAI && (
              <ClinicalInsight
                title="Demand Management"
                value={formatPercentage(params.visitReduction)}
                interpretation="AI-powered patient guidance reduces unnecessary healthcare visits by helping patients manage appropriate conditions at home."
                context="Reduces system burden while maintaining patient safety through smart triage."
              />
            )}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              No AI interventions are currently active. Consider enabling relevant interventions to see their potential clinical impact.
            </p>
          </div>
        )}
      </ClinicalSection>

      {/* Economic Context */}
      <ClinicalSection title="Economic Context">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(params.perDiemCosts.L0)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CHW Care</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(params.perDiemCosts.L1)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Primary Care</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(params.perDiemCosts.L2)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">District Hospital</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(params.perDiemCosts.L3)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tertiary Hospital</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200">
            <strong>Cost per episode:</strong> These represent the average cost to treat one patient episode at each level of care, 
            including staff time, supplies, diagnostics, and facility overhead. Higher-level care costs more but may prevent 
            complications and reduce overall treatment duration.
          </p>
        </div>
      </ClinicalSection>

      {/* Key Clinical Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Key Clinical Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Patient Flow Patterns</h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Referral rates: CHW→Primary ({formatRate(params.rho0)}), Primary→District ({formatRate(params.rho1)}), District→Tertiary ({formatRate(params.rho2)})</li>
              <li>• Higher referral rates may indicate limited capacity at lower levels or more severe case mix</li>
              <li>• AI interventions can optimize referral patterns and reduce unnecessary escalations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">System Performance</h4>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• Recovery rates should generally increase with higher levels of care</li>
              <li>• Mortality rates should generally decrease with higher levels of care</li>
              <li>• System congestion affects all levels and can reverse these expected patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParameterGuide; 