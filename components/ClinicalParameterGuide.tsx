import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { 
  derivedParametersAtom, 
  selectedDiseaseAtom, 
  selectedDiseasesAtom, 
  selectedHealthSystemStrengthAtom, 
  individualDiseaseParametersAtom 
} from '../lib/store';

interface DiseaseData {
  name: string;
  description: string;
  keyCharacteristics: string[];
  treatmentNeeds: string;
  mortalityRates: {
    untreated: { value: number; rationale: string };
    informal: { value: number; rationale: string };
    chw: { value: number; rationale: string };
    primary: { value: number; rationale: string };
    district: { value: number; rationale: string };
    tertiary: { value: number; rationale: string };
  };
  resolutionRates: {
    untreated: { value: number; rationale: string };
    informal: { value: number; rationale: string };
    chw: { value: number; rationale: string };
    primary: { value: number; rationale: string };
    district: { value: number; rationale: string };
    tertiary: { value: number; rationale: string };
  };
  evidenceBase: string[];
}

const diseaseData: Record<string, DiseaseData> = {
  congestive_heart_failure: {
    name: "Congestive Heart Failure",
    description: "A chronic cardiac condition where the heart cannot pump blood effectively",
    keyCharacteristics: [
      "Affects older adults (mean age 67)",
      "High disability weight (0.42)",
      "Progressive condition requiring lifelong management"
    ],
    treatmentNeeds: "ACE inhibitors, beta-blockers, diuretics, regular monitoring",
    mortalityRates: {
      untreated: { value: 0.09, rationale: "Severe CHF has ~50% 1-year mortality without treatment" },
      informal: { value: 0.08, rationale: "Minimal benefit - cannot provide ACE inhibitors or beta-blockers" },
      chw: { value: 0.04, rationale: "Basic diuretics and decompensation monitoring" },
      primary: { value: 0.025, rationale: "Essential medications reduce mortality by 20-30%" },
      district: { value: 0.015, rationale: "Echocardiography, specialist care, IV diuretics" },
      tertiary: { value: 0.01, rationale: "ICU care, mechanical support, transplant evaluation" }
    },
    resolutionRates: {
      untreated: { value: 0.004, rationale: "Very low spontaneous improvement in CHF" },
      informal: { value: 0.01, rationale: "Negligible resolution without proper medications" },
      chw: { value: 0.03, rationale: "Limited role - mainly symptom management" },
      primary: { value: 0.35, rationale: "Moderate stabilization with medications" },
      district: { value: 0.55, rationale: "Good response with specialist management" },
      tertiary: { value: 0.75, rationale: "High stabilization with advanced care" }
    },
    evidenceBase: [
      "SOLVD trial: 16% mortality reduction with enalapril",
      "MERIT-HF: 34% mortality reduction with metoprolol",
      "Diuretics reduce hospitalization by 40% (Faris et al., 2012)"
    ]
  },
  tuberculosis: {
    name: "Tuberculosis",
    description: "A serious bacterial infection primarily affecting the lungs",
    keyCharacteristics: [
      "6+ month treatment course required",
      "Airborne transmission risk",
      "Drug resistance emerging concern"
    ],
    treatmentNeeds: "Combination antibiotics (RIPE), adherence monitoring, contact tracing",
    mortalityRates: {
      untreated: { value: 0.003, rationale: "70% 10-year mortality for untreated TB" },
      informal: { value: 0.0028, rationale: "No access to anti-TB drugs" },
      chw: { value: 0.0025, rationale: "DOTS programs improve adherence" },
      primary: { value: 0.002, rationale: "Standard regimen with side effect management" },
      district: { value: 0.0015, rationale: "MDR-TB management capability" },
      tertiary: { value: 0.001, rationale: "XDR-TB care, surgical options" }
    },
    resolutionRates: {
      untreated: { value: 0.005, rationale: "Extremely low spontaneous cure rate" },
      informal: { value: 0.02, rationale: "Very low resolution without antibiotics" },
      chw: { value: 0.03, rationale: "DOTS support but limited direct treatment" },
      primary: { value: 0.04, rationale: "Weekly rate implies ~25 week treatment" },
      district: { value: 0.05, rationale: "Slightly faster for complex cases" },
      tertiary: { value: 0.06, rationale: "Intensive management for severe TB" }
    },
    evidenceBase: [
      "WHO: 85% cure rate with DOTS",
      "Tiemersma et al., 2011: Natural history of tuberculosis",
      "TB requires specific 4-drug regimen unavailable informally"
    ]
  },
  childhood_pneumonia: {
    name: "Childhood Pneumonia",
    description: "Acute lower respiratory infection in children under 5",
    keyCharacteristics: [
      "Leading infectious killer of children",
      "Rapid progression possible",
      "Responds well to early antibiotics"
    ],
    treatmentNeeds: "Antibiotics (amoxicillin), oxygen for severe cases, nutritional support",
    mortalityRates: {
      untreated: { value: 0.05, rationale: "15-20% mortality for severe pneumonia" },
      informal: { value: 0.045, rationale: "Symptomatic care only, no antibiotics" },
      chw: { value: 0.02, rationale: "Oral amoxicillin highly effective" },
      primary: { value: 0.015, rationale: "IV antibiotics, basic oxygen" },
      district: { value: 0.01, rationale: "Pediatric unit, continuous oxygen" },
      tertiary: { value: 0.008, rationale: "PICU with mechanical ventilation" }
    },
    resolutionRates: {
      untreated: { value: 0.06, rationale: "Some viral pneumonia self-resolves" },
      informal: { value: 0.10, rationale: "Supportive care provides some benefit" },
      chw: { value: 0.70, rationale: "Excellent response to oral antibiotics" },
      primary: { value: 0.80, rationale: "IV antibiotics for non-severe cases" },
      district: { value: 0.85, rationale: "Oxygen and IV antibiotics" },
      tertiary: { value: 0.90, rationale: "Full respiratory support available" }
    },
    evidenceBase: [
      "Sazawal & Black (2003): 57% mortality reduction with antibiotics",
      "WHO: Amoxicillin as effective as injectable for non-severe pneumonia",
      "Oxygen reduces mortality by 35% in severe pneumonia"
    ]
  },
  malaria: {
    name: "Malaria",
    description: "Parasitic disease transmitted by Anopheles mosquitoes",
    keyCharacteristics: [
      "Endemic in tropical regions",
      "Cyclic fever pattern (48-72 hours)",
      "Can rapidly progress to severe"
    ],
    treatmentNeeds: "Artemisinin-based combination therapy (ACTs), supportive care",
    mortalityRates: {
      untreated: { value: 0.03, rationale: "15-20% mortality for severe malaria" },
      informal: { value: 0.025, rationale: "Traditional remedies ineffective" },
      chw: { value: 0.005, rationale: "RDTs + ACTs revolutionized treatment" },
      primary: { value: 0.003, rationale: "Parenteral artesunate for severe" },
      district: { value: 0.002, rationale: "ICU support, transfusion capability" },
      tertiary: { value: 0.0015, rationale: "Dialysis for blackwater fever" }
    },
    resolutionRates: {
      untreated: { value: 0.08, rationale: "Limited natural immunity recovery" },
      informal: { value: 0.15, rationale: "Symptomatic improvement only" },
      chw: { value: 0.75, rationale: "ACTs cure 95%+ uncomplicated malaria" },
      primary: { value: 0.80, rationale: "ACTs plus monitoring" },
      district: { value: 0.90, rationale: "IV artesunate for severe malaria" },
      tertiary: { value: 0.95, rationale: "ICU support for complications" }
    },
    evidenceBase: [
      "AQUAMAT trial: 22.5% mortality reduction with artesunate",
      "ACTs cure >95% of uncomplicated P. falciparum",
      "RDTs enable accurate diagnosis at community level"
    ]
  },
  diarrhea: {
    name: "Diarrheal Disease",
    description: "Acute gastroenteritis causing fluid and electrolyte loss",
    keyCharacteristics: [
      "Very high incidence in children",
      "Dehydration main cause of death",
      "Highly preventable mortality"
    ],
    treatmentNeeds: "Oral rehydration solution (ORS), zinc supplementation, antibiotics if bacterial",
    mortalityRates: {
      untreated: { value: 0.025, rationale: "Severe dehydration mortality" },
      informal: { value: 0.02, rationale: "Home fluids less effective than ORS" },
      chw: { value: 0.003, rationale: "ORS reduces mortality by 93%" },
      primary: { value: 0.002, rationale: "IV fluids for severe dehydration" },
      district: { value: 0.0015, rationale: "Pediatric monitoring, electrolyte management" },
      tertiary: { value: 0.001, rationale: "ICU for shock, complications" }
    },
    resolutionRates: {
      untreated: { value: 0.35, rationale: "Self-limiting in many cases" },
      informal: { value: 0.35, rationale: "Natural resolution unchanged" },
      chw: { value: 0.85, rationale: "ORS + zinc accelerates recovery" },
      primary: { value: 0.90, rationale: "IV rehydration for severe cases" },
      district: { value: 0.80, rationale: "Complex cases may take longer" },
      tertiary: { value: 0.85, rationale: "Management of complications" }
    },
    evidenceBase: [
      "Lancet: ORS reduces diarrhea mortality by 93%",
      "Zinc supplementation reduces duration by 25%",
      "Most deaths preventable with simple interventions"
    ]
  },
  hiv_management_chronic: {
    name: "HIV Management (Chronic)",
    description: "Lifelong management of HIV infection",
    keyCharacteristics: [
      "Requires daily ART adherence",
      "Risk of opportunistic infections",
      "Regular monitoring essential"
    ],
    treatmentNeeds: "Antiretroviral therapy (ART), OI prophylaxis, CD4/viral load monitoring",
    mortalityRates: {
      untreated: { value: 0.007, rationale: "~35% 5-year mortality without ART" },
      informal: { value: 0.0065, rationale: "No access to ART" },
      chw: { value: 0.004, rationale: "Adherence support, basic prophylaxis" },
      primary: { value: 0.002, rationale: "First-line ART reduces mortality 80%" },
      district: { value: 0.0015, rationale: "Second-line ART for failures" },
      tertiary: { value: 0.001, rationale: "Third-line ART, OI management" }
    },
    resolutionRates: {
      untreated: { value: 0.001, rationale: "No cure without ART" },
      informal: { value: 0.001, rationale: "HIV is chronic without treatment" },
      chw: { value: 0.001, rationale: "CHW cannot provide ART directly" },
      primary: { value: 0.10, rationale: "Viral suppression, not cure" },
      district: { value: 0.12, rationale: "Managing treatment failures" },
      tertiary: { value: 0.15, rationale: "Complex regimens for resistance" }
    },
    evidenceBase: [
      "Palella et al. (1998): ART reduces mortality by 80-90%",
      "90-90-90 targets: 90% diagnosed, 90% on ART, 90% suppressed",
      "Treatment as prevention reduces transmission"
    ]
  },
  upper_respiratory_tract_infection: {
    name: "Upper Respiratory Tract Infection",
    description: "Common viral infection of nose, throat, and sinuses",
    keyCharacteristics: [
      "Self-limiting viral infection",
      "Very low mortality",
      "High healthcare utilization"
    ],
    treatmentNeeds: "Symptomatic relief only - no antibiotics indicated",
    mortalityRates: {
      untreated: { value: 0.00001, rationale: "Essentially zero mortality in healthy individuals" },
      informal: { value: 0.00001, rationale: "Minimal risk regardless of care" },
      chw: { value: 0.00001, rationale: "Same as untreated" },
      primary: { value: 0.00001, rationale: "No mortality benefit from medical care" },
      district: { value: 0.00001, rationale: "Same across all levels" },
      tertiary: { value: 0.00001, rationale: "Same across all levels" }
    },
    resolutionRates: {
      untreated: { value: 0.70, rationale: "Natural resolution within 7-10 days" },
      informal: { value: 0.70, rationale: "Symptomatic relief doesn't change course" },
      chw: { value: 0.75, rationale: "Reassurance may improve perceived recovery" },
      primary: { value: 0.80, rationale: "Symptom management" },
      district: { value: 0.85, rationale: "Rule out complications" },
      tertiary: { value: 0.90, rationale: "Manage rare complications" }
    },
    evidenceBase: [
      "Cochrane: Antibiotics provide no benefit for URTI",
      "Natural history: 90% resolve within 2 weeks",
      "Main risk is inappropriate antibiotic use"
    ]
  },
  fever: {
    name: "Fever of Unknown Origin",
    description: "Fever >38.3°C lasting >3 weeks without identified cause",
    keyCharacteristics: [
      "Diagnostic challenge",
      "Multiple possible etiologies",
      "Requires systematic workup"
    ],
    treatmentNeeds: "Systematic diagnostics, empiric therapy based on likely causes",
    mortalityRates: {
      untreated: { value: 0.015, rationale: "Variable by underlying cause" },
      informal: { value: 0.012, rationale: "Antipyretics alone miss serious causes" },
      chw: { value: 0.008, rationale: "Basic antibiotics help some bacterial causes" },
      primary: { value: 0.005, rationale: "Better diagnostics identify treatable causes" },
      district: { value: 0.003, rationale: "Imaging, cultures expand diagnosis" },
      tertiary: { value: 0.002, rationale: "Specialized tests for rare causes" }
    },
    resolutionRates: {
      untreated: { value: 0.30, rationale: "Some self-limiting viral causes" },
      informal: { value: 0.30, rationale: "Symptomatic care doesn't address cause" },
      chw: { value: 0.50, rationale: "Empiric antibiotics help bacterial causes" },
      primary: { value: 0.70, rationale: "Targeted therapy based on findings" },
      district: { value: 0.80, rationale: "Broader diagnostic capability" },
      tertiary: { value: 0.90, rationale: "Comprehensive workup available" }
    },
    evidenceBase: [
      "Petersdorf criteria for FUO definition",
      "30% infectious, 30% inflammatory, 20% malignancy, 20% misc/undiagnosed",
      "Diagnostic yield increases with systematic approach"
    ]
  }
};

const ClinicalParameterGuide: React.FC = () => {
  const [params] = useAtom(derivedParametersAtom);
  const [selectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases] = useAtom(selectedDiseasesAtom);
  const [selectedHealthSystem] = useAtom(selectedHealthSystemStrengthAtom);
  const [individualDiseaseParams] = useAtom(individualDiseaseParametersAtom);
  const [activeTab, setActiveTab] = useState<'overview' | 'disease-parameters' | 'health-system'>('overview');
  const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState<string>(selectedDisease);
  const [showDropdown, setShowDropdown] = useState(false);
  
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

  const disease = diseaseData[selectedDiseaseDetail];

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Clinical Parameter Guide
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Evidence-based parameter values and clinical rationale for model validation
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'disease-parameters', name: 'Disease Parameters' },
            { id: 'health-system', name: 'Health System Context' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                border-b-2 py-2 px-1 text-sm font-medium
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Principles */}
          <ClinicalSection title="🔑 Key Clinical Principles for Parameter Selection" className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mortality Rate Principles</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Monotonic Decrease</strong>: Mortality must decrease with higher levels of care</li>
                  <li><strong>Treatment Access</strong>: Informal care cannot provide prescription medications</li>
                  <li><strong>Evidence-Based</strong>: Rates derived from WHO data and clinical trials</li>
                  <li><strong>Weekly Rates</strong>: 1% weekly ≈ 40% annual mortality</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Resolution Rate Principles</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Disease Natural History</strong>: Reflects expected treatment duration</li>
                  <li><strong>Treatment Availability</strong>: Higher with access to specific medications</li>
                  <li><strong>Chronic vs Acute</strong>: Chronic diseases have lower resolution rates</li>
                  <li><strong>Not Cure Rate</strong>: For chronic diseases, represents stabilization</li>
                </ul>
              </div>
            </div>
          </ClinicalSection>

          {/* Parameter Categories */}
          <ClinicalSection title="📊 Parameter Categories Explained" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Disease-Specific Parameters</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Incidence (λ)</strong>: New cases per capita per year</li>
                  <li><strong>Disability Weight</strong>: Disease severity (0=healthy, 1=death)</li>
                  <li><strong>Mean Age</strong>: Typical age at onset (affects YLL calculations)</li>
                  <li><strong>Natural History</strong>: Untreated disease progression</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Health System Parameters</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Care-Seeking (φ₀)</strong>: Initial formal healthcare use</li>
                  <li><strong>Referral Rates (ρ)</strong>: Movement between care levels</li>
                  <li><strong>System Capacity</strong>: Congestion and queue effects</li>
                  <li><strong>Cost Structure</strong>: Per diem costs by level</li>
                </ul>
              </div>
            </div>
          </ClinicalSection>

          {/* Clinical Interpretation */}
          <ClinicalSection title="💡 Clinical Interpretation Guide" className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
            <div className="space-y-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Understanding Weekly Rates</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Annual risk = 1 - (1 - weekly rate)^52. Example: 1% weekly = 40% annual risk
                </p>
              </div>
              
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Resolution vs Cure</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Resolution (μ) means: Acute diseases = cure; Chronic diseases = stabilization/control
                </p>
              </div>
              
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Referral Patterns</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  High referral (ρ) indicates: Disease severity, care level limitations, or system protocol
                </p>
              </div>
            </div>
          </ClinicalSection>
        </div>
      )}

      {activeTab === 'disease-parameters' && (
        <div>
          {/* Disease Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Disease for Detailed Parameters
            </label>
            <div className="relative">
              <button
                type="button"
                className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="block truncate font-semibold">{disease?.name || 'Select a disease'}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </button>

              {showDropdown && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {Object.entries(diseaseData).map(([key, data]) => (
                    <li
                      key={key}
                      className={`relative cursor-pointer select-none py-2 pl-4 pr-4 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        key === selectedDiseaseDetail ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={() => {
                        setSelectedDiseaseDetail(key);
                        setShowDropdown(false);
                      }}
                    >
                      <span className={`block truncate ${key === selectedDiseaseDetail ? 'font-semibold' : 'font-normal'}`}>
                        {data.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {disease && (
            <>
              {/* Disease Overview */}
              <ClinicalSection title={`🦠 ${disease.name}`} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <p className="text-gray-700 dark:text-gray-300 mb-4">{disease.description}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Clinical Characteristics</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {disease.keyCharacteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Essential Treatment</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{disease.treatmentNeeds}</p>
                  </div>
                </div>
              </ClinicalSection>

              {/* Mortality Parameters */}
              <ClinicalSection title="💊 Mortality Rates by Care Level (Weekly)" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Care Level
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Clinical Rationale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries({
                        'Untreated': disease.mortalityRates.untreated,
                        'Informal Care': disease.mortalityRates.informal,
                        'CHW': disease.mortalityRates.chw,
                        'Primary Care': disease.mortalityRates.primary,
                        'District Hospital': disease.mortalityRates.district,
                        'Tertiary Hospital': disease.mortalityRates.tertiary
                      }).map(([level, data]) => (
                        <tr key={level}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {level}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                            {formatPercentage(data.value)}/wk
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                            {data.rationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClinicalSection>

              {/* Resolution Parameters */}
              <ClinicalSection title="✅ Resolution Rates by Care Level (Weekly)" className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Care Level
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Clinical Rationale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries({
                        'Untreated': disease.resolutionRates.untreated,
                        'Informal Care': disease.resolutionRates.informal,
                        'CHW': disease.resolutionRates.chw,
                        'Primary Care': disease.resolutionRates.primary,
                        'District Hospital': disease.resolutionRates.district,
                        'Tertiary Hospital': disease.resolutionRates.tertiary
                      }).map(([level, data]) => (
                        <tr key={level}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {level}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatPercentage(data.value)}/wk
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                            {data.rationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ClinicalSection>

              {/* Evidence Base */}
              <ClinicalSection title="📚 Evidence Base" className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                <ul className="space-y-2">
                  {disease.evidenceBase.map((evidence, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-purple-600 dark:text-purple-400 mr-2">•</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{evidence}</span>
                    </li>
                  ))}
                </ul>
              </ClinicalSection>
            </>
          )}
        </div>
      )}

      {activeTab === 'health-system' && (
        <div>
          {/* Health System Context */}
          <ClinicalSection title="🏥 Current Health System Parameters" className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Care-Seeking Behavior</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Initial Formal Care:</strong> {formatPercentage(params.phi0)}</li>
                  <li><strong>Informal → Formal:</strong> {formatRate(params.sigmaI)}/week</li>
                  <li><strong>Stay Untreated:</strong> {formatPercentage(params.informalCareRatio)}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">System Characteristics</h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li><strong>Life Expectancy:</strong> {params.regionalLifeExpectancy || 70} years</li>
                  <li><strong>System Congestion:</strong> {formatPercentage(params.systemCongestion || 0)}</li>
                  <li><strong>Model Configuration:</strong> {isMultiDiseaseMode ? `${selectedDiseases.length} diseases` : 'Single disease'}</li>
                </ul>
              </div>
            </div>
          </ClinicalSection>

          {/* Referral Patterns */}
          <ClinicalSection title="🔄 Referral Patterns in Current System" className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Referral Path
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Weekly Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Clinical Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">CHW → Primary</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{formatRate(params.rho0)}/wk</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Recognition of cases beyond CHW scope</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Primary → District</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{formatRate(params.rho1)}/wk</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Need for specialist care or admission</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">District → Tertiary</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{formatRate(params.rho2)}/wk</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Complex cases requiring subspecialty care</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ClinicalSection>

          {/* Cost Structure */}
          <ClinicalSection title="💰 Per Diem Costs by Care Level" className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Care Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cost (USD/day)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Components Included
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Informal</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">${params.perDiemCosts?.I || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Traditional healers, drug shops, transport</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">CHW</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">${params.perDiemCosts?.L0 || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">CHW time, basic medications, supplies</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Primary</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">${params.perDiemCosts?.L1 || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Clinic visit, diagnostics, medications</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">District</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">${params.perDiemCosts?.L2 || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Inpatient care, specialist consults, procedures</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">Tertiary</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600 dark:text-teal-400">${params.perDiemCosts?.L3 || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">ICU, surgery, subspecialty care</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ClinicalSection>
        </div>
      )}
    </div>
  );
};

export default ClinicalParameterGuide;