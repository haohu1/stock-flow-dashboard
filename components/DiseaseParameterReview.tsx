import React, { useState } from 'react';

interface DiseaseData {
  name: string;
  description: string;
  keyCharacteristics: string[];
  treatmentNeeds: string;
  mortalityRates: {
    untreated: { original: number; revised: number; rationale: string };
    informal: { original: number; revised: number; rationale: string };
    chw: { original: number; revised: number; rationale: string };
    primary: { original: number; revised: number; rationale: string };
    district: { original: number; revised: number; rationale: string };
    tertiary: { original: number; revised: number; rationale: string };
  };
  evidenceBase: string[];
}

const diseaseData: Record<string, DiseaseData> = {
  chf: {
    name: "Congestive Heart Failure",
    description: "A chronic cardiac condition where the heart cannot pump blood effectively",
    keyCharacteristics: [
      "Affects older adults (mean age 67)",
      "High disability (0.42)",
      "Requires lifelong management"
    ],
    treatmentNeeds: "ACE inhibitors, beta-blockers, diuretics, monitoring",
    mortalityRates: {
      untreated: { original: 0.09, revised: 0.09, rationale: "Unchanged - Severe CHF has ~50% 1-year mortality without treatment" },
      informal: { original: 0.06, revised: 0.08, rationale: "Increased - Informal care cannot provide ACE inhibitors, beta-blockers, or loop diuretics" },
      chw: { original: 0.05, revised: 0.04, rationale: "Decreased - CHWs can provide basic diuretics and monitor for decompensation" },
      primary: { original: 0.03, revised: 0.025, rationale: "Decreased - Access to essential medications proven to reduce mortality by 20-30%" },
      district: { original: 0.02, revised: 0.015, rationale: "Decreased - Adds echocardiography, specialist care, IV diuretics" },
      tertiary: { original: 0.01, revised: 0.01, rationale: "Unchanged - ICU care, mechanical support, transplant evaluation" }
    },
    evidenceBase: [
      "SOLVD trial: 16% mortality reduction with enalapril",
      "MERIT-HF: 34% mortality reduction with metoprolol",
      "Informal care limitation: Cannot provide prescription heart failure medications"
    ]
  },
  tuberculosis: {
    name: "Tuberculosis",
    description: "A serious bacterial infection primarily affecting the lungs",
    keyCharacteristics: [
      "6+ month treatment course",
      "Airborne transmission",
      "High stigma"
    ],
    treatmentNeeds: "Combination antibiotics (DOTS), adherence support",
    mortalityRates: {
      untreated: { original: 0.003, revised: 0.003, rationale: "Unchanged - Aligns with 70% 10-year mortality for untreated TB" },
      informal: { original: 0.0025, revised: 0.0028, rationale: "Increased - No access to anti-TB drugs; minimal benefit from traditional remedies" },
      chw: { original: 0.0025, revised: 0.0025, rationale: "Unchanged - DOTS programs show modest mortality reduction through adherence" },
      primary: { original: 0.0015, revised: 0.002, rationale: "Increased - Standard 6-month regimen but challenges with side effects, adherence" },
      district: { original: 0.001, revised: 0.0015, rationale: "Increased - MDR-TB management requires specialized regimens" },
      tertiary: { original: 0.0008, revised: 0.001, rationale: "Increased - XDR-TB care, surgical options for complex cases" }
    },
    evidenceBase: [
      "WHO: 85% cure rate with DOTS",
      "Untreated TB: 70% 10-year mortality (Tiemersma et al., 2011)",
      "Key limitation: TB requires specific antibiotics unavailable outside formal care"
    ]
  },
  pneumonia: {
    name: "Childhood Pneumonia",
    description: "Acute respiratory infection in children under 5",
    keyCharacteristics: [
      "High incidence",
      "Rapid progression",
      "Major child killer"
    ],
    treatmentNeeds: "Antibiotics, oxygen support, nutritional support",
    mortalityRates: {
      untreated: { original: 0.05, revised: 0.05, rationale: "Unchanged - Severe pneumonia has 15-20% mortality without antibiotics" },
      informal: { original: 0.035, revised: 0.045, rationale: "Increased - Symptomatic care only; cannot provide antibiotics" },
      chw: { original: 0.02, revised: 0.02, rationale: "Unchanged - Oral amoxicillin highly effective for community-acquired pneumonia" },
      primary: { original: 0.015, revised: 0.015, rationale: "Unchanged - IV antibiotics, basic oxygen support" },
      district: { original: 0.02, revised: 0.01, rationale: "Decreased - CORRECTED: Pediatric unit with continuous oxygen, chest X-ray" },
      tertiary: { original: 0.01, revised: 0.008, rationale: "Decreased - PICU with mechanical ventilation for respiratory failure" }
    },
    evidenceBase: [
      "Sazawal & Black (2003): 57% mortality reduction with antibiotics",
      "Key intervention: Antibiotics (amoxicillin) available at CHW level",
      "Critical error fixed: District hospitals cannot have higher mortality than primary care"
    ]
  },
  malaria: {
    name: "Malaria",
    description: "Parasitic disease transmitted by mosquitoes",
    keyCharacteristics: [
      "Endemic in tropical regions",
      "Cyclic fever pattern",
      "Can progress rapidly"
    ],
    treatmentNeeds: "Artemisinin-based combination therapy (ACTs), supportive care",
    mortalityRates: {
      untreated: { original: 0.03, revised: 0.03, rationale: "Unchanged - Severe malaria has 15-20% mortality" },
      informal: { original: 0.02, revised: 0.025, rationale: "Increased - Traditional remedies provide minimal benefit" },
      chw: { original: 0.0003, revised: 0.005, rationale: "Increased - CORRECTED: While ACTs are highly effective, 0.03% was unrealistically low" },
      primary: { original: 0.0002, revised: 0.003, rationale: "Increased - Parenteral artesunate for severe cases" },
      district: { original: 0.001, revised: 0.002, rationale: "Decreased - ICU support, blood transfusion capability" },
      tertiary: { original: 0.0006, revised: 0.0015, rationale: "Increased - Dialysis for blackwater fever, advanced ICU" }
    },
    evidenceBase: [
      "AQUAMAT trial: 22.5% mortality reduction with artesunate vs quinine",
      "Key intervention: RDTs + ACTs at CHW level revolutionized malaria treatment",
      "Critical fix: 75-fold mortality drop was unrealistic; smoothed progression"
    ]
  },
  diarrhea: {
    name: "Diarrheal Disease",
    description: "Acute gastrointestinal infection causing fluid loss",
    keyCharacteristics: [
      "Very high incidence",
      "Dehydration risk",
      "Preventable deaths"
    ],
    treatmentNeeds: "Oral rehydration solution (ORS), zinc, antibiotics if bacterial",
    mortalityRates: {
      untreated: { original: 0.025, revised: 0.025, rationale: "Unchanged - Severe dehydration mortality" },
      informal: { original: 0.015, revised: 0.02, rationale: "Increased - Home fluids help but less effective than ORS" },
      chw: { original: 0.003, revised: 0.003, rationale: "Unchanged - ORS reduces mortality by 93%" },
      primary: { original: 0.002, revised: 0.002, rationale: "Unchanged - IV fluids for severe dehydration" },
      district: { original: 0.003, revised: 0.0015, rationale: "Decreased - CORRECTED: Pediatric ward with continuous monitoring" },
      tertiary: { original: 0.0015, revised: 0.001, rationale: "Decreased - ICU for complications (electrolyte imbalances)" }
    },
    evidenceBase: [
      "Lancet review: ORS reduces diarrhea mortality by 93%",
      "Key intervention: ORS + zinc available at CHW level",
      "Critical fix: District cannot have higher mortality than CHW"
    ]
  },
  hiv: {
    name: "HIV Management (Chronic)",
    description: "Lifelong management of HIV infection",
    keyCharacteristics: [
      "Requires daily medication",
      "Opportunistic infections",
      "Adherence critical"
    ],
    treatmentNeeds: "Antiretroviral therapy (ART), prophylaxis, monitoring",
    mortalityRates: {
      untreated: { original: 0.007, revised: 0.007, rationale: "Unchanged - ~35% 5-year mortality without ART" },
      informal: { original: 0.005, revised: 0.0065, rationale: "Increased - No access to ART; minimal benefit" },
      chw: { original: 0.004, revised: 0.004, rationale: "Unchanged - Adherence support, basic OI prophylaxis" },
      primary: { original: 0.001, revised: 0.002, rationale: "Increased - First-line ART reduces mortality by 80%" },
      district: { original: 0.015, revised: 0.0015, rationale: "CORRECTED - Second-line ART for treatment failures" },
      tertiary: { original: 2.0, revised: 0.001, rationale: "CORRECTED - Clear data error; third-line ART, advanced OI care" }
    },
    evidenceBase: [
      "Palella et al. (1998): ART reduces mortality by 80-90%",
      "Key intervention: ART access at primary care level",
      "Critical fix: 200% weekly mortality was impossible data entry error"
    ]
  }
};

const DiseaseParameterReview: React.FC = () => {
  const [selectedDisease, setSelectedDisease] = useState<string>('chf');
  const [showDropdown, setShowDropdown] = useState(false);

  const disease = diseaseData[selectedDisease];

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;

  const getMortalityChange = (original: number, revised: number) => {
    if (original === revised) return "unchanged";
    return revised > original ? "increased" : "decreased";
  };

  const getMortalityChangeColor = (change: string) => {
    switch (change) {
      case "increased": return "text-red-600 dark:text-red-400";
      case "decreased": return "text-green-600 dark:text-green-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Disease Parameter Review
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Comprehensive mortality rate analysis with clinical rationale
        </p>
      </div>

      {/* Disease Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Disease
        </label>
        <div className="relative">
          <button
            type="button"
            className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="block truncate font-semibold">{disease.name}</span>
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
                    key === selectedDisease ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                  onClick={() => {
                    setSelectedDisease(key);
                    setShowDropdown(false);
                  }}
                >
                  <span className={`block truncate ${key === selectedDisease ? 'font-semibold' : 'font-normal'}`}>
                    {data.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Disease Overview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{disease.name}</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{disease.description}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Characteristics</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {disease.keyCharacteristics.map((char, i) => (
                <li key={i}>{char}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Primary Treatment Needs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{disease.treatmentNeeds}</p>
          </div>
        </div>
      </div>

      {/* Mortality Rates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Mortality Rates by Care Level (Weekly)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Care Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Original Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revised Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Change
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
              }).map(([level, data]) => {
                const change = getMortalityChange(data.original, data.revised);
                return (
                  <tr key={level}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {level}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatPercentage(data.original)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatPercentage(data.revised)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${getMortalityChangeColor(change)}`}>
                      {change.charAt(0).toUpperCase() + change.slice(1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                      {data.rationale}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Base */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Evidence Base
        </h3>
        <ul className="space-y-2">
          {disease.evidenceBase.map((evidence, i) => (
            <li key={i} className="flex items-start">
              <span className="text-green-600 dark:text-green-400 mr-2">•</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{evidence}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Insights */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Key Clinical Insights
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Mortality Reduction Potential
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              From untreated to best care: {((1 - disease.mortalityRates.tertiary.revised / disease.mortalityRates.untreated.revised) * 100).toFixed(0)}% reduction
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Informal Care Effectiveness
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {((1 - disease.mortalityRates.informal.revised / disease.mortalityRates.untreated.revised) * 100).toFixed(0)}% mortality reduction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseParameterReview;