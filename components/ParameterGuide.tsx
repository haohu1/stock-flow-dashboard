import React from 'react';
import { useAtom } from 'jotai';
import { derivedParametersAtom, aiInterventionsAtom, selectedDiseaseAtom, selectedDiseasesAtom, selectedHealthSystemStrengthAtom, individualDiseaseParametersAtom } from '../lib/store';

const ParameterGuide: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [aiInterventions] = useAtom(aiInterventionsAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [selectedHealthSystem] = useAtom(selectedHealthSystemStrengthAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  
  // Check if we're in multi-disease mode
  const isMultiDiseaseMode = selectedDiseases.length > 1;

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
      'hiv_management_chronic': 'HIV Management (Chronic)',
      'congestive_heart_failure': 'Congestive Heart Failure',
      'malaria': 'Malaria',
      'fever': 'Fever of Unknown Origin',
      'diarrhea': 'Diarrheal Disease',
      'anemia': 'Anemia',
      'high_risk_pregnancy_low_anc': 'High-Risk Pregnancy (Low ANC)',
      'urti': 'Upper Respiratory Tract Infection',
      'hiv_opportunistic': 'HIV-Related Opportunistic Infections'
    };
    return diseaseNames[diseaseKey] || diseaseKey;
  };

  const getHealthSystemName = (systemKey: string) => {
    const systemNames: { [key: string]: string } = {
      'weak_rural_system': 'Weak Rural Health System',
      'moderate_urban_system': 'Moderate Urban Health System',
      'strong_urban_system': 'Strong Urban Health System',
      'fragile_conflict_system': 'Fragile/Conflict-Affected System',
      'well_functioning_system': 'Well-Functioning Health System'
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
          {isMultiDiseaseMode ? 'Health System Parameter Overview' : 'Clinical Parameter Overview'}
        </h2>
        {isMultiDiseaseMode ? (
          <>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Understanding your aggregated health system model with <strong>{selectedDiseases.length} diseases</strong>: {selectedDiseases.map(d => getDiseaseName(d)).join(', ')}
            </p>
            
            {/* Multi-Disease Calculation Methodology */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">🔬 How Multi-Disease Outcomes Are Calculated</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-700">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">1. Individual Disease Simulations</h5>
                  <p className="text-purple-700 dark:text-purple-300">
                    <strong>Each disease runs its own complete simulation</strong> using disease-specific parameters:
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 mt-1 ml-2">
                    <li>• Separate 52-week simulation per disease</li>
                    <li>• Disease-specific λ, φ₀, μ, δ values</li>
                    <li>• Individual deaths, DALYs, costs calculated</li>
                    <li>• No parameter averaging or mixing</li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-700">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">2. Outcome Summation</h5>
                  <p className="text-purple-700 dark:text-purple-300">
                    <strong>Final outcomes are summed across diseases:</strong>
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 mt-1 ml-2">
                    <li>• Total Deaths = Deaths₁ + Deaths₂ + ...</li>
                    <li>• Total DALYs = DALYs₁ + DALYs₂ + ...</li>
                    <li>• Total Costs = Costs₁ + Costs₂ + ...</li>
                    <li>• Epidemiologically accurate approach</li>
                  </ul>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-700">
                  <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">3. True Health System Burden</h5>
                  <p className="text-purple-700 dark:text-purple-300">
                    <strong>Results represent real multi-disease burden:</strong>
                  </p>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 mt-1 ml-2">
                    <li>• Each disease contributes its own burden</li>
                    <li>• No cross-disease interactions assumed</li>
                    <li>• Total reflects additive disease impact</li>
                    <li>• Suitable for health system planning</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-green-800 dark:text-green-200">
                <strong>Summed Results:</strong> The outcomes shown below represent the total health system burden from all {selectedDiseases.length} diseases. 
                Each disease was simulated separately using its own parameters, then deaths, DALYs, and costs were summed for total impact.
              </p>
            </div>
          </>
        ) : (
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Understanding your model configuration for <strong>{getDiseaseName(selectedDisease)}</strong> in a <strong>{getHealthSystemName(selectedHealthSystem)}</strong>
          </p>
        )}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            This guide translates the technical model parameters into clinically meaningful insights for healthcare professionals and policy makers.
          </p>
        </div>
      </div>

      {/* Total Health System Burden (Multi-Disease) */}
      {isMultiDiseaseMode && (
        <ClinicalSection title="Total Health System Burden">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Summed Disease Burden</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              These values represent the total burden from all {selectedDiseases.length} selected diseases after separate simulations.
              <strong> Total λ = {params.lambda.toFixed(3)}</strong> (sum of individual disease incidence rates)
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClinicalInsight
              title="Total Annual Health System Load"
              value={`${(params.lambda * 100000).toFixed(0)} cases per 100,000 people`}
              interpretation="This represents the combined expected number of new cases across all selected diseases per year. Each disease contributed its individual incidence rate to this total."
              context="This is the sum of separate disease burdens, not an average - it represents the true total health system load."
            />
            
            <ClinicalInsight
              title="Overall System Outcomes"
              value="Individual Disease Calculations"
              interpretation="Each disease calculates its own deaths, DALYs, and costs using disease-specific parameters. The final results shown in the dashboard are the sum of these individual calculations."
              context="This ensures each disease's unique clinical characteristics are preserved while showing total health system impact."
            />
          </div>
          
          <ClinicalInsight
            title="Multi-Disease Methodology"
            value="Separate Simulations + Summation"
            interpretation="Unlike single-disease models, this approach runs a complete 52-week simulation for each disease independently, then sums the final outcomes. This is epidemiologically accurate and suitable for health system planning."
            context="Each disease 'competes' for the same health system resources but maintains its own clinical behavior patterns."
          />
        </ClinicalSection>
      )}
      
      {/* Individual Disease Breakdown (Multi-Disease) */}
      {isMultiDiseaseMode && (
        <ClinicalSection title="Individual Disease Simulations">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">🔍 Separate Disease Calculations</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>Each disease below ran its own complete 52-week simulation</strong> using disease-specific clinical parameters. 
              Deaths, DALYs, and costs were calculated separately for each disease using its own incidence rates, mortality rates, and care-seeking patterns. 
              These individual results were then summed to create the total health system burden shown in the dashboard.
            </p>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Understanding how each disease contributes to the total health system burden through separate disease-specific calculations.
          </p>
          
          {selectedDiseases.map((disease) => {
            // Get actual calculated disease parameters (includes country adjustments, health system multipliers, etc.)
            const diseaseParams = individualDiseaseParams[disease];
            const diseaseName = getDiseaseName(disease);
            
            // Calculate contribution percentage using actual calculated values
            const diseaseIncidence = diseaseParams?.lambda || 0;
            const contributionPercentage = params.lambda > 0 ? ((diseaseIncidence / params.lambda) * 100).toFixed(1) : '0';
            
            // Generate description based on calculated parameters
            const getDescription = (params: any) => {
              if (!params) return 'Parameters not calculated';
              const lambda = params.lambda || 0;
              const phi0 = params.phi0 || 0;
              
              const incidenceLevel = lambda >= 1.5 ? 'Very high' : 
                                   lambda >= 0.5 ? 'High' : 
                                   lambda >= 0.1 ? 'Moderate' : 
                                   lambda >= 0.01 ? 'Low' : 'Very low';
              
              const careSeekingLevel = phi0 >= 0.8 ? 'excellent' : 
                                     phi0 >= 0.6 ? 'good' : 
                                     phi0 >= 0.4 ? 'moderate' : 
                                     phi0 >= 0.2 ? 'low' : 'very low';
              
              return `${incidenceLevel} incidence, ${careSeekingLevel} care-seeking behavior`;
            };
            
            return (
              <div key={disease} className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  {diseaseName}
                  <span className="text-sm font-normal text-orange-600 dark:text-orange-400 ml-2">
                    ({contributionPercentage}% of total burden)
                  </span>
                </h5>
                {diseaseParams && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Individual Incidence:</strong> {(diseaseIncidence * 100000).toFixed(0).toLocaleString()} per 100,000
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        λ = {diseaseIncidence.toFixed(4)} episodes per person per year
                      </div>
                    </div>
                    <div>
                      <strong>Formal Care-Seeking:</strong> {formatPercentage(diseaseParams.phi0)}
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        φ₀ = {(diseaseParams.phi0 || 0).toFixed(3)} initial formal care probability
                      </div>
                    </div>
                    <div>
                      <strong>Clinical Profile:</strong> {getDescription(diseaseParams)}
                    </div>
                  </div>
                )}
                {!diseaseParams && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Disease parameters not yet calculated. Please ensure the disease is properly selected.
                  </div>
                )}
              </div>
            );
          })}
        </ClinicalSection>
      )}
      
      {/* Disease Burden & Care Seeking (Single Disease) */}
      {!isMultiDiseaseMode && (
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
      )}

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

        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-300 dark:border-gray-500">
            Disease-Specific Clinical Context
          </h4>
          
          {/* Helper function to get disease-specific content */}
          {(() => {
            const diseaseInfo = {
              'childhood_pneumonia': {
                name: 'Childhood Pneumonia',
                category: 'Acute Infectious Disease',
                overview: 'A leading cause of death in children under 5, particularly in low-resource settings. The dramatic improvement in outcomes from CHW to primary care reflects the critical importance of timely access to appropriate antibiotics and oxygen therapy.',
                treatmentRationale: 'Most childhood pneumonia is bacterial and responds well to antibiotics. CHWs can provide first-line amoxicillin, but severe cases require oxygen therapy and parenteral antibiotics available at health facilities.',
                keyPoints: [
                  'High spontaneous recovery rates (70-80%) reflect mild viral cases that resolve without intervention',
                  'Bacterial pneumonia requires immediate antibiotic treatment - delays significantly increase mortality',
                  'High CHW→Primary referral rate (60%) ensures access to oxygen therapy for severe cases',
                  'Fast-breathing pneumonia can be managed by CHWs, but danger signs require facility care'
                ]
              },
              'tuberculosis': {
                name: 'Tuberculosis',
                category: 'Chronic Infectious Disease',
                overview: 'Requires standardized long-term treatment (6+ months) with multiple drugs. The modest differences in recovery rates across care levels reflect the standardized nature of TB treatment protocols, though higher levels provide crucial monitoring.',
                treatmentRationale: 'TB treatment is highly standardized globally. Success depends more on treatment completion than care level, but higher facilities provide better adherence monitoring and drug resistance management.',
                keyPoints: [
                  'Treatment protocols are standardized across all levels following WHO guidelines',
                  'High CHW→Primary referral rate (85%) reflects need for specialized TB clinics and DOTS programs',
                  'Lower mortality at higher levels reflects better adherence monitoring and side effect management',
                  'Drug-resistant TB requires specialized facilities with culture and sensitivity testing'
                ]
              },
              'malaria': {
                name: 'Malaria',
                category: 'Acute Parasitic Disease',
                overview: 'Highly treatable with rapid diagnostic tests (RDTs) and artemisinin-based combination therapy (ACT). Excellent outcomes at CHW and primary care levels demonstrate the remarkable effectiveness of community-based malaria management programs.',
                treatmentRationale: 'Uncomplicated malaria is easily treated at community level with RDTs and ACT. Hospital cases typically represent severe malaria requiring intensive supportive care.',
                keyPoints: [
                  'Community health workers achieve 80-85% cure rates with RDTs and ACT',
                  'Lower recovery rates at hospitals reflect severe malaria cases requiring intensive care',
                  'Rapid diagnosis and treatment within 24 hours prevents progression to severe disease',
                  'Community case management has dramatically reduced malaria mortality in endemic areas'
                ]
              },
              'diarrhea': {
                name: 'Diarrheal Disease',
                category: 'Acute Gastrointestinal Condition',
                overview: 'Primarily managed with oral rehydration solution (ORS) and zinc supplementation. The excellent outcomes at CHW level demonstrate the remarkable effectiveness of community-based case management for acute diarrhea.',
                treatmentRationale: 'Most childhood diarrhea responds to simple rehydration. The WHO/UNICEF protocol of ORS + zinc is highly effective and can be safely administered by trained CHWs.',
                keyPoints: [
                  'ORS + zinc treatment achieves 85-90% success rates at community level',
                  'CHWs can effectively manage mild to moderate dehydration using ORS',
                  'Hospital referral is reserved for severe dehydration requiring IV fluids',
                  'Prevention through improved water, sanitation, and hygiene remains crucial'
                ]
              },
              'hiv_management_chronic': {
                name: 'HIV Management (Chronic)',
                category: 'Chronic Viral Disease',
                overview: 'Focuses on stable patients receiving antiretroviral therapy (ART). Success depends on consistent medication adherence, regular monitoring, and proactive management of comorbidities and opportunistic infections.',
                treatmentRationale: 'HIV is a chronic manageable condition with ART. "Recovery" means viral suppression and immune reconstitution, not cure. Higher care levels provide specialized monitoring and complex case management.',
                keyPoints: [
                  '"Recovery rates" represent viral suppression and stable clinical management, not cure',
                  'ART adherence >95% is required for sustained viral suppression',
                  'Higher referral rates (90%) reflect need for specialist HIV care and monitoring',
                  'Regular CD4 counts and viral load monitoring optimize treatment outcomes'
                ]
              },
              'anemia': {
                name: 'Anemia',
                category: 'Nutritional/Hematologic Condition',
                overview: 'Often nutritional (iron deficiency) but may have multiple underlying causes requiring systematic investigation. The gradual improvement across care levels reflects increasing diagnostic and therapeutic capabilities.',
                treatmentRationale: 'Most anemia in LMICs is iron deficiency, treatable with iron supplements. However, proper diagnosis requires blood testing, and severe cases may need transfusion or treatment of underlying causes.',
                keyPoints: [
                  'Very low mortality reflects the chronic, non-life-threatening nature of most anemia',
                  'Iron deficiency anemia responds well to oral iron supplementation',
                  'Higher care levels provide diagnostic testing to identify underlying causes',
                  'Severe anemia (Hb <7g/dL) may require blood transfusion at hospital level'
                ]
              },
              'congestive_heart_failure': {
                name: 'Congestive Heart Failure',
                category: 'Chronic Cardiovascular Disease',
                overview: 'A complex chronic condition requiring specialized management with evidence-based medications (ACE inhibitors, diuretics) and careful monitoring. Poor outcomes without formal care reflect the critical need for guideline-based heart failure management.',
                treatmentRationale: 'Heart failure requires complex medication management, fluid balance monitoring, and treatment of underlying causes. This expertise is typically only available at hospital levels.',
                keyPoints: [
                  'High mortality without formal care reflects the life-threatening nature of untreated heart failure',
                  'Evidence-based medications (ACE inhibitors, diuretics) dramatically improve survival',
                  'Requires specialized cardiology expertise for optimal medication titration',
                  'High referral rates (70%+) are clinically appropriate for this complex condition'
                ]
              },
              'high_risk_pregnancy_low_anc': {
                name: 'High-Risk Pregnancy (Low ANC)',
                category: 'Maternal Health Emergency',
                overview: 'Pregnant women without adequate antenatal care monitoring, representing high-risk deliveries. Poor outcomes at lower levels reflect the critical need for skilled birth attendance and emergency obstetric care.',
                treatmentRationale: 'High-risk pregnancies require skilled birth attendants and access to emergency obstetric care. Complications like hemorrhage, eclampsia, and obstructed labor need immediate hospital intervention.',
                keyPoints: [
                  'Very high referral rates (90%+) reflect appropriate need for skilled birth attendance',
                  'Emergency obstetric care (cesarean, blood transfusion) is only available at hospitals',
                  'Maternal mortality decreases dramatically with access to comprehensive emergency care',
                  'Lack of ANC increases risks of undetected complications during delivery'
                ]
              },
              'urti': {
                name: 'Upper Respiratory Tract Infection',
                category: 'Acute Viral Illness',
                overview: 'Common viral infections that are typically self-limiting with excellent prognosis. The minimal differences across care levels and very low referral rates reflect the mild, self-resolving nature of most URTIs.',
                treatmentRationale: 'Most URTIs are viral and self-limiting. Treatment is symptomatic. Healthcare primarily provides reassurance and identifies rare bacterial complications requiring antibiotics.',
                keyPoints: [
                  'Very high spontaneous recovery rates (70%+) reflect viral, self-limiting nature',
                  'Minimal mortality reflects the benign course of most viral URTIs',
                  'Formal care provides symptomatic relief and identifies rare complications',
                  'Antibiotic use should be reserved for proven bacterial infections'
                ]
              },
              'fever': {
                name: 'Fever of Unknown Origin',
                category: 'Symptom Complex',
                overview: 'A clinical presentation requiring systematic diagnostic evaluation for underlying causes including malaria, respiratory infections, typhoid, or other febrile illnesses. Variable outcomes reflect the diversity of underlying conditions.',
                treatmentRationale: 'Fever is a symptom, not a diagnosis. Successful management depends on identifying and treating the underlying cause, which requires diagnostic capabilities that increase with care level.',
                keyPoints: [
                  'Moderate spontaneous recovery (30%) reflects self-limiting viral illnesses',
                  'Higher care levels provide better diagnostic capabilities (lab tests, imaging)',
                  'Common causes include malaria, pneumonia, typhoid, and viral syndromes',
                  'Systematic evaluation prevents missed diagnoses of serious conditions'
                ]
              },
              'hiv_opportunistic': {
                name: 'HIV-Related Opportunistic Infections',
                category: 'Immunodeficiency Complications',
                overview: 'Serious infections occurring in HIV patients with severely compromised immune systems. Poor outcomes without formal care reflect the urgent need for specialized treatment and immune system support.',
                treatmentRationale: 'Opportunistic infections in HIV patients require specialized knowledge, diagnostic capabilities, and specific antimicrobial treatments typically only available at higher care levels.',
                keyPoints: [
                  'High mortality without formal care reflects severity in immunocompromised patients',
                  'Requires specialized HIV expertise and specific antimicrobial treatments',
                  'Common infections include TB, Pneumocystis pneumonia, cryptococcal meningitis',
                  'Prevention through ART and prophylaxis is more effective than treatment'
                ]
              }
            };

            const currentDisease = diseaseInfo[selectedDisease as keyof typeof diseaseInfo];
            
            if (currentDisease) {
              return (
                <div className="space-y-6">
                  {/* Disease Header */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {currentDisease.name}
                      </h5>
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {currentDisease.category}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentDisease.overview}
                    </p>
                  </div>

                  {/* Treatment Rationale */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h6 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Treatment Rationale & Care Level Logic
                    </h6>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentDisease.treatmentRationale}
                    </p>
                  </div>

                  {/* Key Clinical Points */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h6 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Key Clinical Insights
                    </h6>
                    <ul className="space-y-2">
                      {currentDisease.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            } else {
              // Default explanation for diseases not specifically covered
              return (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    Higher-level care generally shows better recovery rates and lower mortality, but this varies significantly by condition. 
                    For acute conditions like pneumonia, the difference between care levels can be dramatic due to access to life-saving interventions. 
                    For chronic conditions, the differences may be smaller but still clinically significant over time, often reflecting 
                    improved monitoring, medication management, and specialist expertise available at higher levels.
                  </p>
                </div>
              );
            }
          })()}
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