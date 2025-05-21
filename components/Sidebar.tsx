import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  selectedHealthSystemStrengthAtom,
  selectedDiseaseAtom,
  selectedDiseasesAtom,
  populationSizeAtom,
  aiInterventionsAtom,
  runSimulationAtom,
  setBaselineAtom,
  addScenarioAtom,
  scenariosAtom,
  selectedScenarioIdAtom,
  loadScenarioAtom,
  simulationResultsAtom,
  healthSystemMultipliersAtom,
  HealthSystemMultipliers
} from '../lib/store';
import { healthSystemStrengthDefaults } from '../models/stockAndFlowModel';

const Sidebar: React.FC = () => {
  const [selectedHealthSystemStrength, setSelectedHealthSystemStrength] = useAtom(selectedHealthSystemStrengthAtom);
  const [, setHealthSystemMultipliers] = useAtom(healthSystemMultipliersAtom);
  const [selectedDisease, setSelectedDisease] = useAtom(selectedDiseaseAtom);
  const [selectedDiseases, setSelectedDiseases] = useAtom(selectedDiseasesAtom);
  const [population, setPopulation] = useAtom(populationSizeAtom);
  const [aiInterventions, setAIInterventions] = useAtom(aiInterventionsAtom);
  const [, runSimulation] = useAtom(runSimulationAtom);
  const [, setBaseline] = useAtom(setBaselineAtom);
  const [, addScenario] = useAtom(addScenarioAtom);
  const [scenarios] = useAtom(scenariosAtom);
  const [selectedScenarioId] = useAtom(selectedScenarioIdAtom);
  const [, loadScenario] = useAtom(loadScenarioAtom);
  const [results] = useAtom(simulationResultsAtom);
  
  // Local state for disease checkboxes
  const [diseaseOptions, setDiseaseOptions] = useState<{
    id: string;
    name: string;
    group: string;
    checked: boolean;
  }[]>([]);
  
  // State for expandable sections
  const [compareDiseaseExpanded, setCompareDiseaseExpanded] = useState(false);
  const [healthSystemExpanded, setHealthSystemExpanded] = useState(false);
  const [diseaseDescriptionExpanded, setDiseaseDescriptionExpanded] = useState(false);

  // Initialize disease options
  useEffect(() => {
    const options = [
      // Infectious Diseases
      { id: 'tuberculosis', name: 'Tuberculosis', group: 'Infectious Diseases', checked: selectedDiseases.includes('tuberculosis') },
      { id: 'pneumonia', name: 'Pneumonia', group: 'Infectious Diseases', checked: selectedDiseases.includes('pneumonia') },
      { id: 'infant_pneumonia', name: 'Infant Pneumonia', group: 'Infectious Diseases', checked: selectedDiseases.includes('infant_pneumonia') },
      { id: 'malaria', name: 'Malaria', group: 'Infectious Diseases', checked: selectedDiseases.includes('malaria') },
      { id: 'fever', name: 'Fever of Unknown Origin', group: 'Infectious Diseases', checked: selectedDiseases.includes('fever') },
      { id: 'diarrhea', name: 'Diarrheal Disease', group: 'Infectious Diseases', checked: selectedDiseases.includes('diarrhea') },
      { id: 'hiv_opportunistic', name: 'HIV Opportunistic Infections', group: 'Infectious Diseases', checked: selectedDiseases.includes('hiv_opportunistic') },
      { id: 'urti', name: 'Upper Respiratory Tract Infection (URTI)', group: 'Infectious Diseases', checked: selectedDiseases.includes('urti') },
      
      // General & Chronic Conditions (merged with Maternal & Neonatal)
      { id: 'high_risk_pregnancy_low_anc', name: 'High-Risk Pregnancy (Low ANC)', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('high_risk_pregnancy_low_anc') },
      { id: 'anemia', name: 'Anemia', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('anemia') },
      { id: 'hiv_management_chronic', name: 'HIV Management (Chronic)', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('hiv_management_chronic') },
      { id: 'congestive_heart_failure', name: 'Congestive Heart Failure', group: 'General & Chronic Conditions', checked: selectedDiseases.includes('congestive_heart_failure') },
    ];
    
    setDiseaseOptions(options);
  }, [selectedDiseases]);

  const handleHealthSystemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScenarioKey = e.target.value as keyof typeof healthSystemStrengthDefaults | 'custom';
    setSelectedHealthSystemStrength(newScenarioKey);

    if (newScenarioKey !== 'custom' && healthSystemStrengthDefaults[newScenarioKey as keyof typeof healthSystemStrengthDefaults]) {
      const scenario = healthSystemStrengthDefaults[newScenarioKey as keyof typeof healthSystemStrengthDefaults];
      const newMultipliers: HealthSystemMultipliers = {
        mu_multiplier_I: scenario.mu_multiplier_I ?? 1.0,
        mu_multiplier_L0: scenario.mu_multiplier_L0 ?? 1.0,
        mu_multiplier_L1: scenario.mu_multiplier_L1 ?? 1.0,
        mu_multiplier_L2: scenario.mu_multiplier_L2 ?? 1.0,
        mu_multiplier_L3: scenario.mu_multiplier_L3 ?? 1.0,
        delta_multiplier_U: scenario.delta_multiplier_U ?? 1.0,
        delta_multiplier_I: scenario.delta_multiplier_I ?? 1.0,
        delta_multiplier_L0: scenario.delta_multiplier_L0 ?? 1.0,
        delta_multiplier_L1: scenario.delta_multiplier_L1 ?? 1.0,
        delta_multiplier_L2: scenario.delta_multiplier_L2 ?? 1.0,
        delta_multiplier_L3: scenario.delta_multiplier_L3 ?? 1.0,
        rho_multiplier_L0: scenario.rho_multiplier_L0 ?? 1.0,
        rho_multiplier_L1: scenario.rho_multiplier_L1 ?? 1.0,
        rho_multiplier_L2: scenario.rho_multiplier_L2 ?? 1.0,
      };
      setHealthSystemMultipliers(newMultipliers);
    }
    // If 'custom', multipliers are managed by ParametersPanel.tsx
  };

  const handleDiseaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrimaryDisease = e.target.value;
    
    // Set the primary disease
    setSelectedDisease(newPrimaryDisease);
    
    // Update the selectedDiseases array to ONLY include the new primary disease
    setSelectedDiseases([newPrimaryDisease]);
    
    // Update checkboxes state to reflect only the new disease is checked
    setDiseaseOptions(
      diseaseOptions.map(option => 
        option.id === newPrimaryDisease
          ? { ...option, checked: true }
          : { ...option, checked: false }
      )
    );
    
    // Force display to switch to this disease in the dashboard
    window.dispatchEvent(new CustomEvent('primary-disease-changed', { detail: { disease: newPrimaryDisease } }));
  };

  const handleDiseaseToggle = (diseaseId: string, isChecked: boolean) => {
    let newSelectedDiseases: string[];
    
    if (isChecked) {
      // Add disease to selection if not already included
      newSelectedDiseases = selectedDiseases.includes(diseaseId)
        ? selectedDiseases
        : [...selectedDiseases, diseaseId];
    } else {
      // Remove disease from selection
      newSelectedDiseases = selectedDiseases.filter(d => d !== diseaseId);
    }
    
    // Update selected diseases
    setSelectedDiseases(newSelectedDiseases);
    
    // Also update the main selected disease if needed
    if (newSelectedDiseases.length > 0 && selectedDisease !== newSelectedDiseases[0]) {
      setSelectedDisease(newSelectedDiseases[0]);
    }
    
    // Update checkboxes state
    setDiseaseOptions(
      diseaseOptions.map(option => 
        option.id === diseaseId
          ? { ...option, checked: isChecked }
          : option
      )
    );
  };

  // Add handler for selecting all diseases
  const handleSelectAllDiseases = () => {
    const allDiseaseIds = diseaseOptions.map(option => option.id);
    setSelectedDiseases(allDiseaseIds);
    setDiseaseOptions(
      diseaseOptions.map(option => ({ ...option, checked: true }))
    );
    
    // Keep the primary disease as is, or set it to the first one if none selected
    if (selectedDiseases.length === 0 && allDiseaseIds.length > 0) {
      setSelectedDisease(allDiseaseIds[0]);
    }
  };

  // Add handler for clearing all diseases
  const handleClearAllDiseases = () => {
    // Keep at least the primary disease selected
    const newSelection = selectedDisease ? [selectedDisease] : [];
    setSelectedDiseases(newSelection);
    
    setDiseaseOptions(
      diseaseOptions.map(option => 
        ({ ...option, checked: option.id === selectedDisease })
      )
    );
  };

  const handlePopulationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPopulation(Number(e.target.value));
  };

  const handleAIToggle = (intervention: keyof typeof aiInterventions) => {
    setAIInterventions({
      ...aiInterventions,
      [intervention]: !aiInterventions[intervention]
    });
  };

  const handleRunSimulation = () => {
    // Now we always use runSimulation which handles both single and multiple disease cases
    runSimulation();
    // Dispatch a custom event to switch to the dashboard tab
    window.dispatchEvent(new CustomEvent('view-dashboard'));
  };

  const handleSetBaseline = () => {
    setBaseline();
  };

  const handleAddScenario = () => {
    addScenario();
  };

  const handleLoadScenario = (id: string) => {
    loadScenario(id);
  };

  const handleViewParameters = () => {
    // Dispatch an event to view parameters
    window.dispatchEvent(new Event('view-parameters'));
  };

  const handleViewEquations = () => {
    // Dispatch an event to view equations
    window.dispatchEvent(new Event('view-equations'));
  };

  // Format disease names for display
  const formatDiseaseName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
  };

  // Group disease options by category
  const groupedDiseaseOptions = diseaseOptions.reduce((acc, option) => {
    if (!acc[option.group]) {
      acc[option.group] = [];
    }
    acc[option.group].push(option);
    return acc;
  }, {} as Record<string, typeof diseaseOptions>);

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Model Settings</h2>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Health System Scenario
          </label>
          <button 
            onClick={() => setHealthSystemExpanded(!healthSystemExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {healthSystemExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <select
          value={selectedHealthSystemStrength}
          onChange={handleHealthSystemChange}
          className="input w-full"
        >
          {Object.keys(healthSystemStrengthDefaults).map(key => (
            <option key={key} value={key}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>

        {/* Add health system scenario descriptions */}
        {healthSystemExpanded && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
            {selectedHealthSystemStrength === 'moderate_urban_system' && (
              <p>A typical urban health system with moderate resources. Balanced care-seeking behavior and healthcare quality.</p>
            )}
            {selectedHealthSystemStrength === 'weak_rural_system' && (
              <p>Limited healthcare capacity in rural settings. Lower initial care-seeking, harder transitions between levels, higher mortality rates.</p>
            )}
            {selectedHealthSystemStrength === 'strong_urban_system_lmic' && (
              <p>Well-functioning urban system in a lower/middle income country. Higher healthcare access, improved outcomes, and efficient referrals.</p>
            )}
            {selectedHealthSystemStrength === 'fragile_conflict_system' && (
              <p>Healthcare system in a humanitarian crisis or conflict zone. Severely limited access, compromised care quality, and disrupted referral pathways.</p>
            )}
            {selectedHealthSystemStrength === 'high_income_system' && (
              <p>Advanced healthcare system in a high-income country. Very high treatment quality and access, low mortality, with higher costs of care.</p>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Disease
          </label>
          <button 
            onClick={() => setDiseaseDescriptionExpanded(!diseaseDescriptionExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {diseaseDescriptionExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <select
          value={selectedDisease}
          onChange={handleDiseaseChange}
          className="input w-full"
        >
          <optgroup label="Infectious Diseases">
            <option value="tuberculosis">Tuberculosis</option>
            <option value="pneumonia">Pneumonia</option>
            <option value="infant_pneumonia">Infant Pneumonia</option>
            <option value="malaria">Malaria</option>
            <option value="fever">Fever of Unknown Origin</option>
            <option value="diarrhea">Diarrheal Disease</option>
            <option value="hiv_opportunistic">HIV Opportunistic Infections</option>
            <option value="urti">Upper Respiratory Tract Infection (URTI)</option>
          </optgroup>
          <optgroup label="General & Chronic Conditions">
            <option value="high_risk_pregnancy_low_anc">High-Risk Pregnancy (Low ANC)</option>
            <option value="anemia">Anemia</option>
            <option value="hiv_management_chronic">HIV Management (Chronic)</option>
            <option value="congestive_heart_failure">Congestive Heart Failure</option>
          </optgroup>
        </select>
        
        {/* Add disease descriptions */}
        {diseaseDescriptionExpanded && (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
            {selectedDisease === 'malaria' && (
              <p>Malaria in Nigeria, a high-burden setting, has substantial incidence (20% annual) in endemic regions, particularly affecting young children (mean age 7). Features limited spontaneous resolution if completely untreated (8% weekly) and somewhat better with traditional remedies (15% weekly). Mortality is high at 7.5% weekly if untreated or with ineffective informal care. CHWs and primary care facilities with effective antimalarials achieve very low mortality rates (0.1% weekly) alongside good resolution rates (75-80% weekly). Severe cases requiring hospital admission face higher mortality despite treatment (10% at district hospitals, 5% at tertiary centers), reflecting the critical nature of advanced disease. Referral patterns follow Nigerian healthcare cascades, with 25% of CHW cases, 20% of primary care cases, and 10% of district hospital cases requiring higher-level care.</p>
            )}
            {selectedDisease === 'tuberculosis' && (
              <p>Tuberculosis in South Africa has a very high incidence (615 per 100,000 population annually), reflecting one of the highest TB burdens globally. Features extremely low spontaneous resolution if untreated (0.5% weekly) or with informal care (2% weekly) and higher mortality rates than global averages (0.4% weekly if untreated). Complicated by high HIV co-infection rates. Requires sustained treatment with resolution rates of 4-6% weekly depending on care level. CHW role focuses on DOTS support with high referral rate (85%).</p>
            )}
            {selectedDisease === 'pneumonia' && (
              <p>Pneumonia is an acute respiratory infection with high incidence (0.9 episodes per child-year) primarily affecting young children. Features limited spontaneous resolution if untreated (6% weekly) and somewhat better with informal care (10% weekly) but significant mortality if untreated (5% weekly). CHWs providing antibiotics achieve high resolution rates (70% weekly) for non-severe cases. Hospital care needed for severe cases with mortality rates of 1.5-2% weekly despite treatment.</p>
            )}
            {selectedDisease === 'urti' && (
              <p>Upper Respiratory Tract Infection with very high incidence (2 episodes per person-year). Features very high spontaneous resolution even without any care (65% weekly) and with minimal additional benefit from informal care (70% weekly) or healthcare intervention. Extremely low mortality (0.001-0.002% weekly) and minimal referral requirements (5% from CHW level). Represents a high-volume, low-severity condition affecting all ages.</p>
            )}
            {selectedDisease === 'infant_pneumonia' && (
              <p>Severe respiratory infection affecting infants (&lt;1 year) with very high incidence (1.2 episodes per infant-year). Minimal spontaneous resolution if untreated (4% weekly) and slightly better with informal care (10% weekly). Much higher mortality (6% if untreated) than adult pneumonia. CHWs treating non-severe cases achieve 50% weekly resolution. Hospital care for severe cases still carries 2-2.5% weekly mortality despite treatment. Requires prompt medical intervention.</p>
            )}
            {selectedDisease === 'fever' && (
              <p>Fever of unknown origin has moderate-high incidence (0.6 episodes per person-year) affecting all ages. Significant spontaneous resolution for many non-specific fevers (25% weekly) even without care, and better with informal care (30% weekly), but requires diagnostic evaluation to rule out serious conditions. Mortality ranges from 1.5% weekly if untreated to 0.1% weekly at tertiary care. Primary care can diagnose and provide empiric treatment with good outcomes (70% weekly resolution).</p>
            )}
            {selectedDisease === 'diarrhea' && (
              <p>Acute diarrheal disease with very high incidence (1.5 episodes per child-year), primarily affecting young children. Reasonable spontaneous resolution even without fluid management (20% weekly) and better with home fluids (35% weekly), but risk of severe dehydration if untreated (2.5% weekly mortality). CHWs with ORS/zinc achieve excellent outcomes (85% weekly resolution) for non-severe cases. Severe dehydration requires hospital management with 0.5-1% weekly mortality despite treatment.</p>
            )}
            {selectedDisease === 'hiv_opportunistic' && (
              <p>HIV-related opportunistic infections in South Africa occur at high rates due to 13.5% HIV prevalence. Conditions include TB, pneumocystis pneumonia, cryptococcal meningitis, and others. No spontaneous resolution without intervention (0% weekly) and no significant improvement with informal care (0% weekly). Mortality rate if untreated is 0.2% weekly (≈10-year survival) and similar with informal care. Requires specialized care with mortality rates ranging from 0.01% weekly at primary care with effective ART to 2% weekly at tertiary centers for advanced disease. High CHW referral essential (90%) with moderate secondary to tertiary referral (50%).</p>
            )}
            {selectedDisease === 'high_risk_pregnancy_low_anc' && (
              <p>High-risk pregnancies with inadequate antenatal care affect approximately 2% of women of reproductive age annually. Extremely low favorable spontaneous outcome with no care (0.5% weekly) and slightly better with informal care (1% weekly). High mortality/morbidity if untreated (2% weekly) or managed informally (1.5% weekly). District hospitals with C-section capability and blood products achieve much better outcomes (50% weekly resolution of complications). Very high referral rates recommended (90% from CHW level).</p>
            )}
            {selectedDisease === 'anemia' && (
              <p>Primarily iron deficiency anemia with moderate incidence (20% annual) affecting young children and women of reproductive age. Minimal spontaneous improvement without any iron intake (1% weekly) and slightly better with dietary changes in informal care (5% weekly). CHW-provided iron supplements achieve moderate improvement (15% weekly). Severe anemia may require hospital investigation and transfusion. Very low mortality (0.05-0.1% weekly) unless severe underlying complications present.</p>
            )}
            {selectedDisease === 'hiv_management_chronic' && (
              <p>Chronic HIV management in South Africa with high incidence of new diagnoses (0.5% annual) requiring linkage to care, reflecting the 13.5% national prevalence. No spontaneous viral suppression if untreated (0% weekly) and no improvement with self-management (0% weekly). Primary care ART initiation and monitoring achieves stabilization but not cure. Mortality is 0.2% weekly if untreated/informal care (≈10-year survival), but considerably lower with proper ART (0.01% weekly at primary care). However, patients with advanced disease requiring tertiary care face higher mortality (2% weekly) despite treatment. High CHW referral essential (90%) with moderate secondary to tertiary referral (50%).</p>
            )}
            {selectedDisease === 'congestive_heart_failure' && (
              <p>Chronic cardiac condition with low incidence (1.2% annual) primarily affecting older adults (mean age 67). Very low spontaneous recovery rate without any care (0.4% weekly) and negligible with informal home care (1% weekly). High mortality if untreated (9% weekly) or with informal care only (6% weekly). Requires medication management at primary care (35% weekly resolution) with progressively better outcomes at higher levels. Even with tertiary care maintains 1% weekly mortality.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Add Population Size field */}
      <div className="mb-6">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Population Size
        </label>
        <input
          type="number"
          value={population}
          onChange={handlePopulationChange}
          min="1000"
          step="1000"
          className="input w-full"
        />
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left">
          <p>Total population in the modeled region. Affects absolute numbers in outcomes but not proportions.</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Compare Multiple Diseases
          </label>
          <button 
            onClick={() => setCompareDiseaseExpanded(!compareDiseaseExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {compareDiseaseExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="mt-1 text-xs text-gray-500 flex justify-between items-center">
          <span>Selected: {selectedDiseases.length} disease{selectedDiseases.length !== 1 ? 's' : ''}</span>
          {compareDiseaseExpanded && (
            <div className="space-x-2">
              <button 
                onClick={handleSelectAllDiseases}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                Add All
              </button>
              <button 
                onClick={handleClearAllDiseases}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
        
        {compareDiseaseExpanded && (
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md mt-2">
            {Object.entries(groupedDiseaseOptions).map(([group, options]) => (
              <div key={group} className="mb-2">
                <h4 className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">{group}</h4>
                <div className="space-y-1">
                  {options.map(option => (
                    <label key={option.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={option.checked}
                        onChange={(e) => handleDiseaseToggle(option.id, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {option.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">AI Interventions</h3>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.triageAI}
              onChange={() => handleAIToggle('triageAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              AI Triage
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.chwAI}
              onChange={() => handleAIToggle('chwAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              CHW Decision Support
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.diagnosticAI}
              onChange={() => handleAIToggle('diagnosticAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Diagnostic AI
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.bedManagementAI}
              onChange={() => handleAIToggle('bedManagementAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Bed Management AI
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.hospitalDecisionAI}
              onChange={() => handleAIToggle('hospitalDecisionAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Hospital Decision Support
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={aiInterventions.selfCareAI}
              onChange={() => handleAIToggle('selfCareAI')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Self-Care Apps
            </span>
          </label>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <button 
          onClick={handleRunSimulation}
          className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg w-full text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Run Simulation
        </button>
        
        {results && (
          <>
            <button 
              onClick={handleSetBaseline}
              className="btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg w-full mt-2"
            >
              Set as Baseline
            </button>
            <button 
              onClick={handleAddScenario}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full mt-2"
            >
              Save as Scenario
            </button>
          </>
        )}
      </div>

      {scenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Saved Scenarios</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleLoadScenario(scenario.id)}
                className={`text-left p-2 text-sm rounded w-full ${
                  selectedScenarioId === scenario.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 