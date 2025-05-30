import React from 'react';
import { useAtom } from 'jotai';
import { derivedParametersAtom, aiInterventionsAtom } from '../lib/store';

const ParameterGuide: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);

  const formatValue = (value: number | undefined, isPercentage = false, decimals = 2) => {
    if (value === undefined) return 'Not set';
    if (isPercentage) return `${(value * 100).toFixed(decimals)}%`;
    return value.toFixed(decimals);
  };

  const ParameterSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const ParameterItem = ({ 
    name, 
    value, 
    unit, 
    description, 
    clinicalMeaning, 
    isPercentage = false,
    decimals = 2 
  }: { 
    name: string; 
    value: number | undefined; 
    unit?: string; 
    description: string; 
    clinicalMeaning: string;
    isPercentage?: boolean;
    decimals?: number;
  }) => (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {formatValue(value, isPercentage, decimals)}{unit && ` ${unit}`}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{description}</p>
      <p className="text-xs text-blue-600 dark:text-blue-400 italic">{clinicalMeaning}</p>
    </div>
  );

  const InterventionStatus = ({ name, active, description }: { name: string; active: boolean; description: string }) => (
    <div className={`border-l-4 ${active ? 'border-green-500' : 'border-gray-300'} pl-4 py-2`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
          {active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Parameter Guide for Subject Matter Experts</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive explanation of all model parameters, their clinical significance, and current values in your simulation.
        </p>
      </div>

      {/* Health System Parameters */}
      <ParameterSection 
        title="Health System Structure & Capacity"
        description="Parameters defining the healthcare delivery system architecture, capacity constraints, and patient flow dynamics."
      >
        <ParameterItem
          name="System Congestion Level"
          value={params.systemCongestion}
          description="Overall capacity utilization across the health system"
          clinicalMeaning="Reflects how overwhelmed the system is. 70% = manageable load, 90% = severe strain with delays and rationing"
          isPercentage={true}
          decimals={0}
        />
        
        <ParameterItem
          name="Competition Sensitivity"
          value={params.competitionSensitivity}
          description="How much disease-specific factors amplify congestion effects"
          clinicalMeaning="Higher values mean this condition competes more for limited resources (e.g., ICU beds for severe cases vs. routine care)"
          decimals={1}
        />
        
        <ParameterItem
          name="Queue Clearance Rate"
          value={params.queueClearanceRate}
          description="Maximum proportion of queued patients that can be processed weekly when capacity is available"
          clinicalMeaning="Represents system efficiency in clearing backlogs. Limited by staffing, equipment, and operational capacity"
          isPercentage={true}
          decimals={0}
        />
        
        <ParameterItem
          name="Queue Prevention Rate (Triage AI)"
          value={params.queuePreventionRate}
          description="Proportion of inappropriate queue entries prevented by AI triage"
          clinicalMeaning="AI helps identify patients who don't need immediate care, reducing unnecessary queue formation"
          isPercentage={true}
          decimals={0}
        />
        
        <ParameterItem
          name="Queue Abandonment Rate"
          value={params.queueAbandonmentRate}
          description="Weekly rate at which patients leave queues and return to untreated status"
          clinicalMeaning="Patients give up waiting due to long delays, distance, or opportunity costs. Higher in rural/poor areas"
          isPercentage={true}
          decimals={1}
        />
        
        <ParameterItem
          name="Queue Bypass Rate"
          value={params.queueBypassRate}
          description="Weekly rate at which queued patients seek informal care instead"
          clinicalMeaning="Patients turn to traditional healers, pharmacies, or self-medication while waiting for formal care"
          isPercentage={true}
          decimals={1}
        />
        
        <ParameterItem
          name="Congestion Mortality Multiplier"
          value={params.congestionMortalityMultiplier}
          description="Factor by which death rates increase for patients waiting in queues"
          clinicalMeaning="Delayed care leads to disease progression and worse outcomes. Critical for time-sensitive conditions"
          decimals={1}
          unit="×"
        />
      </ParameterSection>

      {/* Disease-Specific Parameters */}
      <ParameterSection 
        title="Disease-Specific Clinical Parameters"
        description="Parameters defining the natural history, treatment outcomes, and care pathways for the specific condition being modeled."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Resolution Rates (Weekly)</h4>
            <div className="space-y-3">
              <ParameterItem
                name="Untreated Resolution"
                value={params.muU}
                description="Natural recovery rate without any treatment"
                clinicalMeaning="Self-limiting conditions have higher rates; chronic diseases have lower rates"
                isPercentage={true}
                decimals={1}
              />
              <ParameterItem
                name="Informal Care Resolution"
                value={params.muI}
                description="Recovery rate with traditional/informal care"
                clinicalMeaning="May be effective for some conditions, ineffective or harmful for others"
                isPercentage={true}
                decimals={1}
              />
              <ParameterItem
                name="CHW Level (L0) Resolution"
                value={params.mu0}
                description="Recovery rate with community health worker care"
                clinicalMeaning="Effective for basic conditions, preventive care, and health education"
                isPercentage={true}
                decimals={1}
              />
              <ParameterItem
                name="Primary Care (L1) Resolution"
                value={params.mu1}
                description="Recovery rate with primary healthcare"
                clinicalMeaning="Can handle most common conditions with basic diagnostics and treatments"
                isPercentage={true}
                decimals={1}
              />
              <ParameterItem
                name="District Hospital (L2) Resolution"
                value={params.mu2}
                description="Recovery rate with secondary care"
                clinicalMeaning="Advanced diagnostics, specialist care, minor surgeries"
                isPercentage={true}
                decimals={1}
              />
              <ParameterItem
                name="Tertiary Hospital (L3) Resolution"
                value={params.mu3}
                description="Recovery rate with tertiary care"
                clinicalMeaning="Highest level of care with specialized equipment and expertise"
                isPercentage={true}
                decimals={1}
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Mortality Rates (Weekly)</h4>
            <div className="space-y-3">
              <ParameterItem
                name="Untreated Mortality"
                value={params.deltaU}
                description="Death rate without any treatment"
                clinicalMeaning="Baseline disease severity. Higher for acute conditions, lower for chronic manageable diseases"
                isPercentage={true}
                decimals={2}
              />
              <ParameterItem
                name="Informal Care Mortality"
                value={params.deltaI}
                description="Death rate with traditional/informal care"
                clinicalMeaning="May reduce mortality through supportive care or increase it through harmful practices"
                isPercentage={true}
                decimals={2}
              />
              <ParameterItem
                name="CHW Level (L0) Mortality"
                value={params.delta0}
                description="Death rate with community health worker care"
                clinicalMeaning="Reduced through early detection, basic treatment, and appropriate referrals"
                isPercentage={true}
                decimals={2}
              />
              <ParameterItem
                name="Primary Care (L1) Mortality"
                value={params.delta1}
                description="Death rate with primary healthcare"
                clinicalMeaning="Further reduced through proper diagnosis and evidence-based treatment"
                isPercentage={true}
                decimals={2}
              />
              <ParameterItem
                name="District Hospital (L2) Mortality"
                value={params.delta2}
                description="Death rate with secondary care"
                clinicalMeaning="Lowest mortality for conditions requiring this level of care"
                isPercentage={true}
                decimals={2}
              />
              <ParameterItem
                name="Tertiary Hospital (L3) Mortality"
                value={params.delta3}
                description="Death rate with tertiary care"
                clinicalMeaning="Lowest overall mortality but may reflect sicker patient population"
                isPercentage={true}
                decimals={2}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Referral Patterns (Weekly)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ParameterItem
              name="CHW to Primary Care Referral"
              value={params.rho0}
              description="Rate at which CHWs refer patients to higher levels"
              clinicalMeaning="Reflects CHW training, protocols, and case complexity. Higher for conditions requiring advanced care"
              isPercentage={true}
              decimals={1}
            />
            <ParameterItem
              name="Primary to District Hospital Referral"
              value={params.rho1}
              description="Rate at which primary care refers to secondary level"
              clinicalMeaning="Depends on primary care capacity and case complexity requiring specialist intervention"
              isPercentage={true}
              decimals={1}
            />
            <ParameterItem
              name="District to Tertiary Hospital Referral"
              value={params.rho2}
              description="Rate at which district hospitals refer to tertiary care"
              clinicalMeaning="Reserved for most complex cases requiring subspecialty care or advanced procedures"
              isPercentage={true}
              decimals={1}
            />
          </div>
        </div>
      </ParameterSection>

      {/* Care-Seeking Behavior */}
      <ParameterSection 
        title="Care-Seeking Behavior & Access"
        description="Parameters governing how patients enter the health system and choose between formal and informal care pathways."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterItem
            name="Annual Incidence Rate"
            value={params.lambda}
            description="New cases per person per year"
            clinicalMeaning="Disease burden in the population. Varies by season, outbreaks, and demographic factors"
            decimals={4}
            unit="per person/year"
          />
          <ParameterItem
            name="Formal Care Seeking Rate"
            value={params.phi0}
            description="Proportion of new cases that initially seek formal healthcare"
            clinicalMeaning="Influenced by education, income, distance to facilities, and trust in formal system"
            isPercentage={true}
            decimals={0}
          />
          <ParameterItem
            name="Informal Care Ratio"
            value={params.informalCareRatio}
            description="Proportion of untreated patients who remain truly untreated vs. seeking informal care"
            clinicalMeaning="Higher values mean more patients stay completely untreated rather than seeking traditional healers"
            isPercentage={true}
            decimals={0}
          />
          <ParameterItem
            name="Informal to Formal Transition"
            value={params.sigmaI}
            description="Weekly rate of transition from informal to formal care"
            clinicalMeaning="Usually occurs when traditional treatment fails or for serious complications"
            isPercentage={true}
            decimals={1}
          />
        </div>
      </ParameterSection>

      {/* AI Interventions Status */}
      <ParameterSection 
        title="AI Intervention Status & Effects"
        description="Current status of AI interventions and their impact on health system performance."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Intervention Status</h4>
            <div className="space-y-3">
              <InterventionStatus
                name="Triage AI"
                active={aiInterventions.triageAI}
                description="AI-powered patient triage and queue management to optimize patient flow and reduce inappropriate admissions"
              />
              <InterventionStatus
                name="CHW AI (Resolution Boost)"
                active={aiInterventions.chwAI}
                description="AI tools for community health workers to improve diagnostic accuracy and treatment effectiveness"
              />
              <InterventionStatus
                name="Diagnostic AI (Point-of-Care)"
                active={aiInterventions.diagnosticAI}
                description="AI-assisted diagnostics at primary care level to improve accuracy and reduce referrals"
              />
              <InterventionStatus
                name="Bed Management AI"
                active={aiInterventions.bedManagementAI}
                description="AI optimization of bed allocation and length of stay at district hospitals"
              />
              <InterventionStatus
                name="Hospital Decision Support AI"
                active={aiInterventions.hospitalDecisionAI}
                description="AI clinical decision support for treatment optimization and discharge planning at tertiary hospitals"
              />
              <InterventionStatus
                name="Self-Care AI"
                active={aiInterventions.selfCareAI}
                description="AI-powered self-care guidance and smart routing to reduce unnecessary healthcare visits"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">AI Effect Magnitudes</h4>
            <div className="space-y-3">
              <ParameterItem
                name="Resolution Boost Effect"
                value={params.resolutionBoost}
                description="Improvement in CHW treatment effectiveness"
                clinicalMeaning="AI helps CHWs make better diagnoses and treatment decisions"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Point-of-Care Diagnostic Effect"
                value={params.pointOfCareResolution}
                description="Improvement in primary care diagnostic accuracy"
                clinicalMeaning="Reduces misdiagnosis and inappropriate referrals"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Length of Stay Reduction"
                value={params.lengthOfStayReduction}
                description="Reduction in hospital length of stay"
                clinicalMeaning="Faster patient turnover increases effective capacity"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Discharge Planning Effect"
                value={params.dischargeOptimization}
                description="Improvement in discharge planning efficiency"
                clinicalMeaning="Reduces readmissions and optimizes bed utilization"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Treatment Optimization Effect"
                value={params.treatmentEfficiency}
                description="Improvement in treatment protocol adherence"
                clinicalMeaning="Better outcomes through evidence-based care protocols"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Resource Optimization Effect"
                value={params.resourceUtilization}
                description="Improvement in resource allocation efficiency"
                clinicalMeaning="Better utilization of staff, equipment, and supplies"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Visit Reduction Effect"
                value={params.visitReduction}
                description="Reduction in unnecessary healthcare visits"
                clinicalMeaning="AI helps patients manage conditions at home when appropriate"
                isPercentage={true}
                decimals={0}
              />
              <ParameterItem
                name="Smart Routing Effect"
                value={params.directRoutingImprovement}
                description="Improvement in patient routing during congestion"
                clinicalMeaning="Directs patients to appropriate care levels, reducing bottlenecks"
                isPercentage={true}
                decimals={0}
              />
            </div>
          </div>
        </div>
      </ParameterSection>

      {/* Cost Parameters */}
      <ParameterSection 
        title="Economic Parameters"
        description="Cost parameters for economic evaluation of interventions and health system resource requirements."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Per-Episode Costs (USD)</h4>
            <div className="space-y-2">
              <ParameterItem
                name="CHW Care"
                value={params.perDiemCosts.L0}
                description="Cost per patient episode at CHW level"
                clinicalMeaning="Includes CHW time, basic supplies, and transportation costs"
                decimals={0}
                unit="USD"
              />
              <ParameterItem
                name="Primary Care"
                value={params.perDiemCosts.L1}
                description="Cost per patient episode at primary care"
                clinicalMeaning="Includes consultation, basic diagnostics, and medications"
                decimals={0}
                unit="USD"
              />
              <ParameterItem
                name="District Hospital"
                value={params.perDiemCosts.L2}
                description="Cost per patient episode at district hospital"
                clinicalMeaning="Includes advanced diagnostics, specialist care, and procedures"
                decimals={0}
                unit="USD"
              />
              <ParameterItem
                name="Tertiary Hospital"
                value={params.perDiemCosts.L3}
                description="Cost per patient episode at tertiary hospital"
                clinicalMeaning="Includes complex procedures, intensive care, and subspecialty services"
                decimals={0}
                unit="USD"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">AI Implementation Costs (USD)</h4>
            <div className="space-y-2">
              <ParameterItem
                name="AI Fixed Cost"
                value={params.aiFixedCost}
                description="Fixed cost of AI implementation"
                clinicalMeaning="One-time setup costs for AI systems including software, hardware, and training"
                decimals={0}
                unit="USD"
              />
              <ParameterItem
                name="AI Variable Cost"
                value={params.aiVariableCost}
                description="Variable cost per episode touched by AI"
                clinicalMeaning="Ongoing costs per patient interaction with AI systems"
                decimals={2}
                unit="USD/episode"
              />
            </div>
          </div>
        </div>
      </ParameterSection>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Clinical Interpretation Notes</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Resolution rates</strong> should sum with mortality and referral rates to approximately 100% for each level</li>
          <li>• <strong>Health system multipliers</strong> &lt; 1.0 indicate better performance, &gt; 1.0 indicate worse performance</li>
          <li>• <strong>Queue dynamics</strong> become critical when system congestion exceeds 50-60%</li>
          <li>• <strong>AI effects</strong> are multiplicative - multiple interventions can compound benefits</li>
          <li>• <strong>Cost-effectiveness</strong> depends on disease burden, intervention costs, and health system efficiency</li>
        </ul>
      </div>
    </div>
  );
};

export default ParameterGuide; 