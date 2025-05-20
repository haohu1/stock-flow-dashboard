import { atom } from 'jotai';
import {
  ModelParameters,
  SimulationResults,
  AIInterventions,
  getDefaultParameters,
  applyAIInterventions,
  runSimulation,
  calculateICER,
  healthSystemStrengthDefaults,
  diseaseProfiles
} from '../models/stockAndFlowModel';
import { calculateSuggestedFeasibility, formatNumber } from './utils';

// Selected health system strength and disease
export const selectedHealthSystemStrengthAtom = atom<string>('moderate_urban_system');
export const selectedDiseaseAtom = atom<string>('pneumonia');
// New atom for multi-disease selection
export const selectedDiseasesAtom = atom<string[]>(['pneumonia']);

// Population settings
export const populationSizeAtom = atom<number>(1000000);
export const simulationWeeksAtom = atom<number>(52);

// Model parameters with default values
export const baseParametersAtom = atom<ModelParameters>(getDefaultParameters());

// Define an interface for the health system multipliers
export interface HealthSystemMultipliers {
  mu_multiplier_I: number;
  mu_multiplier_L0: number;
  mu_multiplier_L1: number;
  mu_multiplier_L2: number;
  mu_multiplier_L3: number;
  delta_multiplier_U: number;
  delta_multiplier_I: number;
  delta_multiplier_L0: number;
  delta_multiplier_L1: number;
  delta_multiplier_L2: number;
  delta_multiplier_L3: number;
  rho_multiplier_L0: number;
  rho_multiplier_L1: number;
  rho_multiplier_L2: number;
}

// Atom to store the current health system multipliers
// These can be initialized by a scenario and then potentially edited by the user
export const healthSystemMultipliersAtom = atom<HealthSystemMultipliers>({
  // Initialize with moderate_urban_system multipliers as a default baseline
  // This will be overwritten by ParametersPanel when a scenario is selected
  mu_multiplier_I: healthSystemStrengthDefaults.moderate_urban_system.mu_multiplier_I,
  mu_multiplier_L0: healthSystemStrengthDefaults.moderate_urban_system.mu_multiplier_L0,
  mu_multiplier_L1: healthSystemStrengthDefaults.moderate_urban_system.mu_multiplier_L1,
  mu_multiplier_L2: healthSystemStrengthDefaults.moderate_urban_system.mu_multiplier_L2,
  mu_multiplier_L3: healthSystemStrengthDefaults.moderate_urban_system.mu_multiplier_L3,
  delta_multiplier_U: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_U,
  delta_multiplier_I: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_I,
  delta_multiplier_L0: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_L0,
  delta_multiplier_L1: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_L1,
  delta_multiplier_L2: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_L2,
  delta_multiplier_L3: healthSystemStrengthDefaults.moderate_urban_system.delta_multiplier_L3,
  rho_multiplier_L0: healthSystemStrengthDefaults.moderate_urban_system.rho_multiplier_L0,
  rho_multiplier_L1: healthSystemStrengthDefaults.moderate_urban_system.rho_multiplier_L1,
  rho_multiplier_L2: healthSystemStrengthDefaults.moderate_urban_system.rho_multiplier_L2,
});


// Store results for multiple diseases
export const simulationResultsMapAtom = atom<Record<string, SimulationResults | null>>({});

// Add a map for baselines per disease
export const baselineResultsMapAtom = atom<Record<string, SimulationResults | null>>({});

// Simulation results
export const simulationResultsAtom = atom<SimulationResults | null>(null);

// Baseline results for comparison
export const baselineResultsAtom = atom<SimulationResults | null>(null);

// Derive parameters for a specific disease and health system strength
export const getDerivedParamsForDisease = (
  baseParams: ModelParameters,
  healthSystemStrength: string,
  disease: string,
  aiInterventions: AIInterventions,
  effectMagnitudes: {[key: string]: number},
  activeMultipliers: HealthSystemMultipliers,
  aiCostParams?: AICostParameters
): ModelParameters => {
  // Start with base parameters
  let params = { ...baseParams };

  // Get health system scenario defaults
  const healthSystemScenario = healthSystemStrength && healthSystemStrengthDefaults[healthSystemStrength as keyof typeof healthSystemStrengthDefaults];

  // Apply health system scenario direct defaults if available
  if (healthSystemScenario) {
    // Apply only non-multiplier parameters directly from the scenario
    const { 
      // Exclude multipliers from direct assignment
      /* eslint-disable @typescript-eslint/no-unused-vars */
      mu_multiplier_I, mu_multiplier_L0, mu_multiplier_L1, mu_multiplier_L2, mu_multiplier_L3,
      delta_multiplier_U, delta_multiplier_I, delta_multiplier_L0, delta_multiplier_L1, delta_multiplier_L2, delta_multiplier_L3,
      rho_multiplier_L0, rho_multiplier_L1, rho_multiplier_L2,
      /* eslint-enable @typescript-eslint/no-unused-vars */
      ...directScenarioParams 
    } = healthSystemScenario;
    params = { ...params, ...directScenarioParams };
  }

  // Get disease profile
  const diseaseProfile = disease && diseaseProfiles[disease as keyof typeof diseaseProfiles];

  // Apply disease profile if available
  if (diseaseProfile) {
    params = { ...params, ...diseaseProfile };
  }
  
  // Apply health system strength multipliers to disease-specific rates
  if (healthSystemScenario) { // Ensure scenario exists before applying multipliers
    params.muI *= activeMultipliers.mu_multiplier_I;
    params.mu0 *= activeMultipliers.mu_multiplier_L0;
    params.mu1 *= activeMultipliers.mu_multiplier_L1;
    params.mu2 *= activeMultipliers.mu_multiplier_L2;
    params.mu3 *= activeMultipliers.mu_multiplier_L3;

    params.deltaU *= activeMultipliers.delta_multiplier_U;
    params.deltaI *= activeMultipliers.delta_multiplier_I;
    params.delta0 *= activeMultipliers.delta_multiplier_L0;
    params.delta1 *= activeMultipliers.delta_multiplier_L1;
    params.delta2 *= activeMultipliers.delta_multiplier_L2;
    params.delta3 *= activeMultipliers.delta_multiplier_L3;
    
    params.rho0 *= activeMultipliers.rho_multiplier_L0;
    params.rho1 *= activeMultipliers.rho_multiplier_L1;
    params.rho2 *= activeMultipliers.rho_multiplier_L2;

    // Ensure probabilities do not exceed 1 or go below 0 after multiplication
    const probabilityParamKeys = [
      'muI', 'mu0', 'mu1', 'mu2', 'mu3', 
      'deltaU', 'deltaI', 'delta0', 'delta1', 'delta2', 'delta3', 
      'rho0', 'rho1', 'rho2', 
      'phi0', 'sigmaI'
    ] as const; 
    for (const pKey of probabilityParamKeys) {
      // With `as const`, params[pKey] is now correctly typed as 'number'.
      // The `typeof params[pKey] === 'number'` check is thus implicitly satisfied.
      if (params[pKey] > 1) {
        params[pKey] = 1;
      }
      if (params[pKey] < 0) { // Probabilities shouldn't be negative
        params[pKey] = 0;
      }
    }
  }

  // Apply AI interventions
  return applyAIInterventions(params, aiInterventions, effectMagnitudes, aiCostParams);
};

// Update parameters when health system strength or disease changes, but preserve custom user changes
export const derivedParametersAtom = atom(
  (get) => {
    const baseParams = get(baseParametersAtom);
    const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
    const disease = get(selectedDiseaseAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const effectMagnitudes = get(effectMagnitudesAtom);
    const activeMultipliers = get(healthSystemMultipliersAtom);
    const aiCostParams = get(aiCostParametersAtom);
    
    // Return base params with applied changes for visualization, but don't modify base params
    // This allows the components to see derived values but doesn't overwrite user changes
    return getDerivedParamsForDisease(baseParams, healthSystemStrength, disease, aiInterventions, effectMagnitudes, activeMultipliers, aiCostParams);
  }
);

// AI intervention toggles
export const aiInterventionsAtom = atom<AIInterventions>({
  triageAI: false,
  chwAI: false,
  diagnosticAI: false,
  bedManagementAI: false,
  hospitalDecisionAI: false,
  selfCareAI: false
});

// AI cost parameters
export interface AICostParameters {
  triageAI: { fixed: number, variable: number };
  chwAI: { fixed: number, variable: number };
  diagnosticAI: { fixed: number, variable: number };
  bedManagementAI: { fixed: number, variable: number };
  hospitalDecisionAI: { fixed: number, variable: number };
  selfCareAI: { fixed: number, variable: number };
}

// Default values match the hardcoded values in stockAndFlowModel.ts
export const aiCostParametersAtom = atom<AICostParameters>({
  triageAI: { fixed: 35000, variable: 2 },
  chwAI: { fixed: 25000, variable: 1.5 },
  diagnosticAI: { fixed: 40000, variable: 3.5 },
  bedManagementAI: { fixed: 45000, variable: 1 },
  hospitalDecisionAI: { fixed: 50000, variable: 4.5 },
  selfCareAI: { fixed: 20000, variable: 0.8 }
});

// AI intervention effect magnitudes
export const effectMagnitudesAtom = atom<{[key: string]: number}>({});

// Track selected AI scenario preset
export const selectedAIScenarioAtom = atom<string | null>(null);

// Atom to trigger simulation run
export const runSimulationTriggerAtom = atom<number>(0);

// Run simulation when triggered
export const runSimulationAtom = atom(
  (get) => get(simulationResultsAtom),
  (get, set) => {
    // Handle both single disease and multiple disease cases
    const selectedDiseases = get(selectedDiseasesAtom);
    
    console.log("Starting simulation with selected diseases:", selectedDiseases);
    
    if (selectedDiseases.length > 1) {
      // If multiple diseases selected, use the multi-disease simulation directly
      const baseParams = get(baseParametersAtom);
      const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      const baseline = get(baselineResultsAtom);
      const baselineMap = get(baselineResultsMapAtom);
      const activeMultipliers = get(healthSystemMultipliersAtom);
      
      // Create a new results map
      const newResultsMap: Record<string, SimulationResults | null> = {};
      
      // Run simulation for each selected disease
      selectedDiseases.forEach(disease => {
        console.log("  Running simulation for disease:", disease);
        
        // Get derived parameters for this disease
        const params = getDerivedParamsForDisease(baseParams, healthSystemStrength, disease, aiInterventions, effectMagnitudes, activeMultipliers);
        
        // Run simulation with these parameters
        const results = runSimulation(params, {
          numWeeks: weeks,
          population,
        });
        
        // Calculate ICER if we have a baseline for this specific disease
        const diseaseBaseline = baselineMap[disease];
        if (diseaseBaseline) {
          console.log(`  Calculating ICER for ${disease} using its own baseline`);
          const icer = calculateICER(results, diseaseBaseline);
          newResultsMap[disease] = { ...results, icer };
        } else if (baseline) {
          // Fall back to the primary baseline if no specific baseline exists
          console.log(`  Calculating ICER for ${disease} using primary disease baseline`);
          const icer = calculateICER(results, baseline);
          newResultsMap[disease] = { ...results, icer };
        } else {
          // Store in results map without ICER
          newResultsMap[disease] = results;
        }
      });
      
      console.log("  Multi-disease simulation complete, results map has", Object.keys(newResultsMap).length, "diseases:", Object.keys(newResultsMap));
      
      // Update the results map
      set(simulationResultsMapAtom, newResultsMap);
      
      // Also update the single result for backward compatibility
      if (selectedDiseases.length > 0) {
        const mainDisease = selectedDiseases[0];
        set(simulationResultsAtom, newResultsMap[mainDisease]);
        // Update the selected disease atom to match 
        set(selectedDiseaseAtom, mainDisease);
        console.log("  Setting primary disease to:", mainDisease);
      }
    } else {
      // Traditional single-disease simulation
      const disease = selectedDiseases[0] || get(selectedDiseaseAtom);
      console.log("  Running single-disease simulation for:", disease);
      
      const baseParams = get(baseParametersAtom);
      const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      const activeMultipliers = get(healthSystemMultipliersAtom);
      
      // Get derived parameters for this disease
      const params = getDerivedParamsForDisease(baseParams, healthSystemStrength, disease, aiInterventions, effectMagnitudes, activeMultipliers);
      
      const results = runSimulation(params, {
        numWeeks: weeks,
        population,
      });
      
      // Calculate ICER if we have a baseline
      const baselineMap = get(baselineResultsMapAtom);
      const diseaseBaseline = baselineMap[disease];
      const primaryBaseline = get(baselineResultsAtom);
      
      if (diseaseBaseline) {
        // Use disease-specific baseline if available
        console.log(`  Calculating ICER for ${disease} using its own baseline`);
        const icer = calculateICER(results, diseaseBaseline);
        set(simulationResultsAtom, { ...results, icer });
      } else if (primaryBaseline) {
        // Fall back to the primary baseline
        console.log(`  Calculating ICER for ${disease} using primary disease baseline`);
        const icer = calculateICER(results, primaryBaseline);
        set(simulationResultsAtom, { ...results, icer });
      } else {
        set(simulationResultsAtom, results);
      }
      
      // Also update the results map with this single disease result
      set(simulationResultsMapAtom, { [disease]: get(simulationResultsAtom) });
      
      // Update the selected disease atom to ensure sync
      set(selectedDiseaseAtom, disease);
      
      console.log("  Single-disease simulation complete for:", disease);
    }
  }
);

// Set current results as baseline
export const setBaselineAtom = atom(
  null,
  (get, set) => {
    // Use the primary disease result as the baseline
    const results = get(simulationResultsAtom);
    const resultsMap = get(simulationResultsMapAtom);
    const selectedDiseases = get(selectedDiseasesAtom);
    
    console.log("Setting baseline with selected diseases:", selectedDiseases);
    console.log("Current results map has keys:", Object.keys(resultsMap));
    
    if (results) {
      // Set the baseline using the primary disease's results
      set(baselineResultsAtom, results);
      
      // When a baseline is set, recalculate all ICERs for the current result set
      if (Object.keys(resultsMap).length > 1) {
        console.log("Setting per-disease baselines and recalculating ICERs");
        
        // Store per-disease baselines
        const baselineMap: Record<string, SimulationResults | null> = {};
        
        // First, store all current results as baselines for each disease
        Object.entries(resultsMap).forEach(([disease, diseaseResults]) => {
          if (diseaseResults) {
            // Store the current result as baseline for this disease
            baselineMap[disease] = { 
              ...JSON.parse(JSON.stringify(diseaseResults)),
              weeklyStates: diseaseResults.weeklyStates.map(state => ({...state}))
            };
          }
        });
        
        // Update the baseline map
        set(baselineResultsMapAtom, baselineMap);
        
        // For now, don't recalculate ICERs - they will be calculated dynamically when needed
        // This ensures we have the correct baselines for each disease while allowing
        // future simulations to properly calculate ICERs against their respective baselines
      } else {
        console.log("Using single disease baseline for:", selectedDiseases[0]);
        // For single disease, still store in the map
        set(baselineResultsMapAtom, { [selectedDiseases[0]]: results });
      }
    }
  }
);

// Scenarios management
export interface Scenario {
  id: string;
  name: string;
  parameters: ModelParameters & {
    healthSystemStrength?: string;
    disease?: string;
    population?: number;
  };
  aiInterventions: AIInterventions;
  effectMagnitudes: {[key: string]: number};
  results: SimulationResults | null;
  baselineResults?: SimulationResults | null;
  savedBaselineResultsMap?: Record<string, SimulationResults | null>;
  feasibility?: number; // 0 to 1, where 1 is most feasible (closest to launch)
  selectedDiseases?: string[];
  diseaseResultsMap?: Record<string, SimulationResults | null>;
}

export const scenariosAtom = atom<Scenario[]>([]);

// Selected scenario ID
export const selectedScenarioIdAtom = atom<string | null>(null);

// Add current settings as a new scenario
export const addScenarioAtom = atom(
  null,
  (get, set) => {
    const params = get(derivedParametersAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const effectMagnitudes = get(effectMagnitudesAtom);
    const results = get(simulationResultsAtom);
    const resultsMap = get(simulationResultsMapAtom);
    const baseline = get(baselineResultsAtom);
    const currentBaselineResultsMap = get(baselineResultsMapAtom);
    const scenarios = get(scenariosAtom);
    const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
    const disease = get(selectedDiseaseAtom);
    const selectedDiseases = get(selectedDiseasesAtom);
    const population = get(populationSizeAtom);
    const selectedAIScenario = get(selectedAIScenarioAtom);
    
    const scenarioNumber = scenarios.length + 1;
    const activeAIInterventionsList = Object.entries(aiInterventions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);
    const activeAIInterventionsCount = activeAIInterventionsList.length;

    let baseName = '';
    if (selectedAIScenario) {
      const presetNames: {[key: string]: string} = {
        'best-case-2025': 'Best Case',
        'worst-case-2025': 'Worst Case',
        'clinical-decision-support-2025': 'Clinical Decision Support',
        'workflow-efficiency-2025': 'Workflow Efficiency',
        'patient-facing-ai-success-2025': 'Patient-Facing AI',
        'diagnostic-imaging-2025': 'Diagnostic & Imaging',
        'resource-constrained-2025': 'Resource-Constrained',
        'community-health-2025': 'Community Health',
        'referral-triage-2025': 'Referral & Triage'
      };
      
      baseName = presetNames[selectedAIScenario] || selectedAIScenario;
    } else if (activeAIInterventionsCount > 0) {
      if (activeAIInterventionsCount === 1) {
        const aiName = (() => {
          switch(activeAIInterventionsList[0]) {
            case 'triageAI': return 'AI Triage';
            case 'chwAI': return 'CHW Decision Support';
            case 'diagnosticAI': return 'Diagnostic AI';
            case 'bedManagementAI': return 'Bed Management AI';
            case 'hospitalDecisionAI': return 'Hospital Decision Support';
            case 'selfCareAI': return 'Self-Care Apps';
            default: return activeAIInterventionsList[0];
          }
        })();
        baseName = `${aiName}`;
      } else if (activeAIInterventionsCount > 1) {
        baseName = `Combined AI (${activeAIInterventionsCount})`;
      }
    } else {
      baseName = `Scenario ${scenarioNumber}`;
    }
    
    const initialFeasibility = calculateSuggestedFeasibility(activeAIInterventionsCount);

    const deepCopyBaselineResultsMap = currentBaselineResultsMap 
      ? JSON.parse(JSON.stringify(currentBaselineResultsMap)) 
      : undefined;

    if (selectedDiseases.length > 1 && Object.keys(resultsMap).length > 1) {
      const newScenariosList = [...scenarios];
      let lastScenarioIdForSelection = null;
      selectedDiseases.forEach((currentDiseaseName, index) => {
        if (!resultsMap[currentDiseaseName]) {
          console.log(`Skipping scenario creation for ${currentDiseaseName} as it has no results in resultsMap`);
          return;
        }
        
        const singleDiseaseMapForThisScenario: Record<string, SimulationResults | null> = {
          [currentDiseaseName]: resultsMap[currentDiseaseName] ? JSON.parse(JSON.stringify(resultsMap[currentDiseaseName])) : null
        };

        const newScenarioEntry: Scenario = {
          id: `scenario-${Date.now()}-${index}`,
          name: baseName,
          parameters: { 
            ...params,
            healthSystemStrength,
            disease: currentDiseaseName, 
            population
          },
          aiInterventions: { ...aiInterventions },
          effectMagnitudes: { ...effectMagnitudes },
          results: resultsMap[currentDiseaseName] ? JSON.parse(JSON.stringify(resultsMap[currentDiseaseName])) : null,
          baselineResults: baseline ? JSON.parse(JSON.stringify(baseline)) : null,
          savedBaselineResultsMap: deepCopyBaselineResultsMap,
          feasibility: initialFeasibility,
          selectedDiseases: [currentDiseaseName],
          diseaseResultsMap: singleDiseaseMapForThisScenario 
        };
        newScenariosList.push(newScenarioEntry);
        lastScenarioIdForSelection = newScenarioEntry.id;
      });
      set(scenariosAtom, newScenariosList);
      if (lastScenarioIdForSelection) {
        set(selectedScenarioIdAtom, lastScenarioIdForSelection);
      }
    } else {
      const scenarioName = baseName;
      
      const deepCopiedResultsMap = resultsMap ? JSON.parse(JSON.stringify(resultsMap)) : undefined;

      const newScenarioEntry: Scenario = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        parameters: { ...params, healthSystemStrength, disease, population },
        aiInterventions: { ...aiInterventions },
        effectMagnitudes: { ...effectMagnitudes },
        results: results ? JSON.parse(JSON.stringify(results)) : null,
        baselineResults: baseline ? JSON.parse(JSON.stringify(baseline)) : null,
        savedBaselineResultsMap: deepCopyBaselineResultsMap,
        feasibility: initialFeasibility,
        selectedDiseases: [...selectedDiseases],
        diseaseResultsMap: deepCopiedResultsMap
      };
      set(scenariosAtom, [...scenarios, newScenarioEntry]);
      set(selectedScenarioIdAtom, newScenarioEntry.id);
    }
  }
);

// Helper function to format disease names for display
function formatDiseaseName(disease: string): string {
  return disease.charAt(0).toUpperCase() + disease.slice(1).replace(/_/g, ' ');
}

// Load a scenario
export const loadScenarioAtom = atom(
  null,
  (get, set, scenarioId: string) => {
    const scenarios = get(scenariosAtom);
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (scenario) {
      console.log('DETAILED DEBUG - Loading scenario:', {
        id: scenario.id, 
        selectedDiseases: scenario.selectedDiseases || [], 
        diseaseResultsMapKeys: scenario.diseaseResultsMap ? Object.keys(scenario.diseaseResultsMap) : [],
        hasResultsMap: !!scenario.diseaseResultsMap,
        mapType: scenario.diseaseResultsMap ? typeof scenario.diseaseResultsMap : 'undefined',
        isEmptyObject: scenario.diseaseResultsMap && Object.keys(scenario.diseaseResultsMap).length === 0
      });
      
      // Directly inspect the contents of the scenario's diseaseResultsMap
      if (scenario.diseaseResultsMap) {
        console.log('Raw scenario.diseaseResultsMap structure:');
        Object.entries(scenario.diseaseResultsMap).forEach(([disease, diseaseResults]) => {
          console.log(`  ${disease}: ${diseaseResults ? 
            `deaths=${diseaseResults.cumulativeDeaths}, costs=${diseaseResults.totalCost}, icer=${diseaseResults.icer}` 
            : 'null'}`);
        });
      }
      
      // IMPORTANT LOGIC FIX: If we have selectedDiseases but no diseaseResultsMap,
      // create a results map using the primary result
      if (scenario.selectedDiseases && 
          scenario.selectedDiseases.length > 1 && 
          (!scenario.diseaseResultsMap || Object.keys(scenario.diseaseResultsMap).length <= 1) &&
          scenario.results) {
        console.log('IMPORTANT: Found multi-disease scenario with missing results map. Reconstructing from primary results.');
        
        // Create a new diseaseResultsMap for the scenario
        const reconstructedMap: Record<string, SimulationResults | null> = {};
        
        scenario.selectedDiseases.forEach(disease => {
          if (scenario.results) {
            // Create deep copies of the main result for each disease
            const resultCopy = JSON.parse(JSON.stringify(scenario.results));
            // Add weeklyStates separately to avoid circular references
            resultCopy.weeklyStates = scenario.results.weeklyStates.map(state => ({...state}));
            reconstructedMap[disease] = resultCopy;
          }
        });
        
        console.log('Reconstructed results map with keys:', Object.keys(reconstructedMap));
        // Add the reconstructed map to the scenario object (this doesn't save it permanently)
        scenario.diseaseResultsMap = reconstructedMap;
      }
      
      set(baseParametersAtom, scenario.parameters);
      set(aiInterventionsAtom, scenario.aiInterventions);
      set(effectMagnitudesAtom, scenario.effectMagnitudes || {});
      set(simulationResultsAtom, scenario.results ? JSON.parse(JSON.stringify(scenario.results)) : null);
      set(selectedScenarioIdAtom, scenarioId);
      
      // Restore primary disease and selected diseases list
      if (scenario.selectedDiseases && scenario.selectedDiseases.length > 0) {
        set(selectedDiseasesAtom, [...scenario.selectedDiseases]);
        set(selectedDiseaseAtom, scenario.selectedDiseases[0]);
      } else if (scenario.parameters.disease) {
        set(selectedDiseaseAtom, scenario.parameters.disease);
        set(selectedDiseasesAtom, [scenario.parameters.disease]);
      } else {
        // Fallback if no disease info
        set(selectedDiseasesAtom, ['pneumonia']); // Default or clear
        set(selectedDiseaseAtom, 'pneumonia');
      }

      // Restore multi-disease results map
      if (scenario.diseaseResultsMap && Object.keys(scenario.diseaseResultsMap).length > 0) {
        set(simulationResultsMapAtom, JSON.parse(JSON.stringify(scenario.diseaseResultsMap)));
      } else if (scenario.results) {
        // Backward compatibility: if only primary result exists, populate map with it for selected diseases
        const mapForBackwardCompat: Record<string, SimulationResults | null> = {};
        const diseasesToUse = get(selectedDiseasesAtom);
        diseasesToUse.forEach(d => {
          mapForBackwardCompat[d] = JSON.parse(JSON.stringify(scenario.results));
        });
        set(simulationResultsMapAtom, mapForBackwardCompat);
      } else {
        set(simulationResultsMapAtom, {}); // Clear if no results
      }

      // Restore primary baseline
      if (scenario.baselineResults) {
        set(baselineResultsAtom, JSON.parse(JSON.stringify(scenario.baselineResults)));
      } else {
        set(baselineResultsAtom, null); // Clear primary baseline if not in scenario
      }

      // Restore the per-disease baseline map
      if (scenario.savedBaselineResultsMap && Object.keys(scenario.savedBaselineResultsMap).length > 0) {
        set(baselineResultsMapAtom, JSON.parse(JSON.stringify(scenario.savedBaselineResultsMap)));
      } else {
        // If no saved map, decide on fallback: clear it, or try to construct from primary baseline?
        // For now, let's clear it to avoid using stale data. 
        // Or, better: if a primary baseline exists, create a map from it for currently selected diseases.
        const primaryBaseline = get(baselineResultsAtom);
        if (primaryBaseline) {
            const mapFromPrimaryBaseline: Record<string, SimulationResults | null> = {};
            const currentSelectedDiseases = get(selectedDiseasesAtom);
            currentSelectedDiseases.forEach(d => {
                mapFromPrimaryBaseline[d] = JSON.parse(JSON.stringify(primaryBaseline));
            });
            set(baselineResultsMapAtom, mapFromPrimaryBaseline);
        } else {
            set(baselineResultsMapAtom, {}); // Fully clear if no primary baseline either
        }
      }
      // Population size needs to be restored too if it's part of scenario parameters
      if (scenario.parameters.population !== undefined) {
        set(populationSizeAtom, scenario.parameters.population);
      }
    }
  }
);

// Update current scenario
export const updateScenarioAtom = atom(
  null,
  (get, set, updatedScenario?: Scenario) => {
    const scenarioToUpdate = updatedScenario || scenariosAtom.init.find(s => s.id === get(selectedScenarioIdAtom));
    if (!scenarioToUpdate) return;

    const currentParams = get(derivedParametersAtom);
    const currentAiInterventions = get(aiInterventionsAtom);
    const currentEffectMagnitudes = get(effectMagnitudesAtom);
    const currentResults = get(simulationResultsAtom); // Primary result
    const currentResultsMap = get(simulationResultsMapAtom); // Multi-disease results map
    const currentPopulation = get(populationSizeAtom);
    const currentSelectedDiseases = get(selectedDiseasesAtom);
    const currentPrimaryBaseline = get(baselineResultsAtom);
    const currentBaselineMap = get(baselineResultsMapAtom);
    
    const scenarioIndex = get(scenariosAtom).findIndex(s => s.id === scenarioToUpdate.id);
    if (scenarioIndex === -1) return;

    const newScenarios = [...get(scenariosAtom)];
    newScenarios[scenarioIndex] = {
      ...scenarioToUpdate, // Keep original ID, name, feasibility
      parameters: { 
        ...currentParams, // Use current model params from store
        population: currentPopulation,
        // Preserve original health system and primary disease from the scenario being updated
        // unless they are meant to be updated from global state too.
        healthSystemStrength: scenarioToUpdate.parameters.healthSystemStrength || get(selectedHealthSystemStrengthAtom),
        disease: scenarioToUpdate.parameters.disease || get(selectedDiseaseAtom) 
      }, 
      aiInterventions: { ...currentAiInterventions },
      effectMagnitudes: { ...currentEffectMagnitudes },
      results: currentResults ? JSON.parse(JSON.stringify(currentResults)) : null,
      baselineResults: currentPrimaryBaseline ? JSON.parse(JSON.stringify(currentPrimaryBaseline)) : null,
      savedBaselineResultsMap: currentBaselineMap ? JSON.parse(JSON.stringify(currentBaselineMap)) : undefined,
      selectedDiseases: [...currentSelectedDiseases],
      diseaseResultsMap: currentResultsMap ? JSON.parse(JSON.stringify(currentResultsMap)) : undefined,
      // Feasibility is managed by slider/BubbleChartView, or set initially. Should it be updated here?
      // For now, assume feasibility is updated separately if needed, or comes from scenarioToUpdate.
      feasibility: scenarioToUpdate.feasibility 
    };

    set(scenariosAtom, newScenarios);
  }
);

// Delete a scenario
export const deleteScenarioAtom = atom(
  null,
  (get, set, scenarioId: string) => {
    const scenarios = get(scenariosAtom);
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    
    set(scenariosAtom, updatedScenarios);
    
    // If we deleted the selected scenario, clear the selection
    const currentlySelectedId = get(selectedScenarioIdAtom);
    if (currentlySelectedId === scenarioId) {
      set(selectedScenarioIdAtom, null);
    }
  }
);

// Sensitivity analysis
export interface SensitivityParameter {
  name: string;
  baseValue: number;
  label: string;
  min: number;
  max: number;
  step: number;
}

// List of parameters that can be analyzed for sensitivity
export const sensitivityParametersAtom = atom<SensitivityParameter[]>([
  // Care-seeking parameters
  { name: 'phi0', baseValue: 0.45, label: 'Formal Care Entry (φ₀)', min: 0.1, max: 0.9, step: 0.05 },
  { name: 'sigmaI', baseValue: 0.2, label: 'Informal to Formal (σI)', min: 0.05, max: 0.5, step: 0.05 },
  { name: 'informalCareRatio', baseValue: 0.2, label: 'Untreated Ratio', min: 0.05, max: 0.5, step: 0.05 },
  
  // Resolution probabilities
  { name: 'muI', baseValue: 0.3, label: 'Informal Care Resolution (μI)', min: 0.1, max: 0.6, step: 0.05 },
  { name: 'mu0', baseValue: 0.5, label: 'CHW Resolution (μ₀)', min: 0.2, max: 0.8, step: 0.05 },
  { name: 'mu1', baseValue: 0.6, label: 'Primary Care Resolution (μ₁)', min: 0.3, max: 0.9, step: 0.05 },
  { name: 'mu2', baseValue: 0.7, label: 'District Hospital Resolution (μ₂)', min: 0.4, max: 0.9, step: 0.05 },
  { name: 'mu3', baseValue: 0.8, label: 'Tertiary Hospital Resolution (μ₃)', min: 0.5, max: 1.0, step: 0.05 },
  
  // Mortality parameters
  { name: 'deltaU', baseValue: 0.01, label: 'Untreated Mortality (δU)', min: 0.001, max: 0.05, step: 0.005 },
  { name: 'deltaI', baseValue: 0.02, label: 'Informal Care Mortality (δI)', min: 0.005, max: 0.1, step: 0.005 },
  { name: 'delta0', baseValue: 0.03, label: 'CHW Mortality (δ₀)', min: 0.005, max: 0.1, step: 0.005 },
  { name: 'delta1', baseValue: 0.02, label: 'Primary Care Mortality (δ₁)', min: 0.005, max: 0.1, step: 0.005 },
  { name: 'delta2', baseValue: 0.05, label: 'District Hospital Mortality (δ₂)', min: 0.01, max: 0.15, step: 0.01 },
  { name: 'delta3', baseValue: 0.08, label: 'Tertiary Hospital Mortality (δ₃)', min: 0.02, max: 0.2, step: 0.01 },
  
  // Referral parameters
  { name: 'rho0', baseValue: 0.75, label: 'CHW Referral (ρ₀)', min: 0.4, max: 1.0, step: 0.05 },
  { name: 'rho1', baseValue: 0.25, label: 'Primary Care Referral (ρ₁)', min: 0.1, max: 0.6, step: 0.05 },
  { name: 'rho2', baseValue: 0.15, label: 'District Hospital Referral (ρ₂)', min: 0.05, max: 0.4, step: 0.05 },
  
  // Economic parameters
  { name: 'meanAgeOfInfection', baseValue: 30, label: 'Mean Age of Infection', min: 0, max: 70, step: 5 },
  { name: 'regionalLifeExpectancy', baseValue: 70, label: 'Regional Life Expectancy', min: 50, max: 85, step: 5 },
  { name: 'disabilityWeight', baseValue: 0.2, label: 'Disability Weight', min: 0.05, max: 0.8, step: 0.05 },
  
  // Cost parameters
  { name: 'perDiemCosts.I', baseValue: 5, label: 'Informal Care Cost', min: 1, max: 20, step: 1 },
  { name: 'perDiemCosts.L0', baseValue: 10, label: 'CHW Visit Cost', min: 5, max: 30, step: 2.5 },
  { name: 'perDiemCosts.L1', baseValue: 25, label: 'Primary Care Cost', min: 10, max: 50, step: 5 },
  { name: 'perDiemCosts.L2', baseValue: 100, label: 'District Hospital Cost', min: 50, max: 200, step: 10 },
  { name: 'perDiemCosts.L3', baseValue: 300, label: 'Tertiary Hospital Cost', min: 150, max: 600, step: 25 },
  { name: 'aiFixedCost', baseValue: 50000, label: 'AI Fixed Implementation Cost', min: 10000, max: 200000, step: 10000 },
  { name: 'aiVariableCost', baseValue: 2, label: 'AI Variable Cost Per Case', min: 0.5, max: 10, step: 0.5 },
  { name: 'discountRate', baseValue: 0.03, label: 'Cost Discount Rate', min: 0, max: 0.1, step: 0.01 },
  
  // Cost parameters
  { name: 'perDiemCosts.I', baseValue: 5, label: 'Informal Care Cost', min: 1, max: 20, step: 1 },
  { name: 'perDiemCosts.L0', baseValue: 10, label: 'CHW Visit Cost', min: 5, max: 30, step: 2.5 },
  { name: 'perDiemCosts.L1', baseValue: 25, label: 'Primary Care Cost', min: 10, max: 50, step: 5 },
  { name: 'perDiemCosts.L2', baseValue: 100, label: 'District Hospital Cost', min: 50, max: 200, step: 10 },
  { name: 'perDiemCosts.L3', baseValue: 300, label: 'Tertiary Hospital Cost', min: 150, max: 600, step: 25 },
  { name: 'costTransport', baseValue: 15, label: 'Transport Cost', min: 5, max: 50, step: 5 },
  { name: 'discountRate', baseValue: 0.03, label: 'Cost Discount Rate', min: 0, max: 0.1, step: 0.01 },
  { name: 'catastrophicThreshold', baseValue: 0.4, label: 'Catastrophic Expense Threshold', min: 0.1, max: 0.6, step: 0.05 },
  { name: 'costPerCapitaGDP', baseValue: 1000, label: 'Per Capita GDP', min: 500, max: 5000, step: 250 },
]);

// Selected parameters for sensitivity analysis
export const selectedSensitivityParamAtom = atom<string | null>(null);
export const selectedSecondaryParamAtom = atom<string | null>(null);

// Sensitivity analysis mode (1D or 2D)
export const sensitivityAnalysisModeAtom = atom<'1D' | '2D'>('1D');

// Sensitivity analysis results
export interface SensitivityResult {
  paramValue: number;
  secondaryParamValue?: number;
  deaths: number;
  costs: number;
  dalys: number;
  icer?: number;
}

export const sensitivityResultsAtom = atom<SensitivityResult[]>([]);

// 2D Sensitivity analysis results (grid)
export interface SensitivityGrid {
  primaryValues: number[];
  secondaryValues: number[];
  results: {
    deaths: number[][];
    costs: number[][];
    dalys: number[][];
    icer?: number[][];
  };
}

export const sensitivityGridAtom = atom<SensitivityGrid | null>(null);

// Run sensitivity analysis
export const runSensitivityAnalysisAtom = atom(
  null,
  (get, set) => {
    const paramName = get(selectedSensitivityParamAtom);
    if (!paramName) return;
    
    const analysisMode = get(sensitivityAnalysisModeAtom);
    const secondaryParamName = get(selectedSecondaryParamAtom);
    
    const baseParams = get(derivedParametersAtom);
    const population = get(populationSizeAtom);
    const weeks = get(simulationWeeksAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const baseline = get(baselineResultsAtom);
    
    const sensitivityParams = get(sensitivityParametersAtom);
    const primaryParamConfig = sensitivityParams.find(p => p.name === paramName);
    
    if (!primaryParamConfig) return;
    
    // For 1D analysis (just one parameter)
    if (analysisMode === '1D' || !secondaryParamName) {
      // Get the base value of the parameter, handling nested parameters
      let baseValue: number;
      if (paramName.includes('.')) {
        const [objectName, propertyName] = paramName.split('.');
        const objectKey = objectName as keyof ModelParameters;
        const obj = baseParams[objectKey];
        baseValue = (obj && typeof obj === 'object' && propertyName in obj) 
          ? (obj as any)[propertyName] 
          : primaryParamConfig.baseValue;
      } else {
        baseValue = baseParams[paramName as keyof ModelParameters] as number;
      }
      
      const minValue = baseValue * 0.75; // -25%
      const maxValue = baseValue * 1.25; // +25%
      const stepCount = 10;
      const stepSize = (maxValue - minValue) / stepCount;
      
      const results: SensitivityResult[] = [];
      
      // Run simulation for each value
      for (let i = 0; i <= stepCount; i++) {
        const paramValue = minValue + (stepSize * i);
        
        // Create modified parameters object
        let modifiedParams = { ...baseParams };
        
        // Handle nested parameter paths (e.g., 'perDiemCosts.I')
                  if (paramName.includes('.')) {
            const [objectName, propertyName] = paramName.split('.');
            // Safe way to handle nested objects with TypeScript
            const objectKey = objectName as keyof ModelParameters;
            const currentObj = modifiedParams[objectKey];
            
            if (currentObj && typeof currentObj === 'object') {
              modifiedParams = {
                ...modifiedParams,
                [objectKey]: {
                  ...currentObj,
                  [propertyName]: paramValue
                }
              };
            }
          } else {
          // Handle regular parameters
          modifiedParams = { ...modifiedParams, [paramName]: paramValue };
        }
        
        const modifiedParamsWithAI = applyAIInterventions(modifiedParams, aiInterventions);
        
        const simResult = runSimulation(modifiedParamsWithAI, {
          numWeeks: weeks,
          population,
        });
        
        const result: SensitivityResult = {
          paramValue,
          deaths: simResult.cumulativeDeaths,
          costs: simResult.totalCost,
          dalys: simResult.dalys,
        };
        
        if (baseline) {
          result.icer = calculateICER(simResult, baseline);
        }
        
        results.push(result);
      }
      
      set(sensitivityResultsAtom, results);
      set(sensitivityGridAtom, null); // Clear any previous grid results
    } 
    // For 2D analysis (two parameters)
    else if (analysisMode === '2D' && secondaryParamName) {
      const secondaryParamConfig = sensitivityParams.find(p => p.name === secondaryParamName);
      if (!secondaryParamConfig) return;
      
      // Get the primary parameter base value
      let primaryBaseValue: number;
      if (paramName.includes('.')) {
        const [objectName, propertyName] = paramName.split('.');
        const objectKey = objectName as keyof ModelParameters;
        const obj = baseParams[objectKey];
        primaryBaseValue = (obj && typeof obj === 'object' && propertyName in obj) 
          ? (obj as any)[propertyName] 
          : primaryParamConfig?.baseValue || 0;
      } else {
        primaryBaseValue = baseParams[paramName as keyof ModelParameters] as number;
      }
      
      const primaryMinValue = primaryBaseValue * 0.80; // -20%
      const primaryMaxValue = primaryBaseValue * 1.20; // +20%
      const primaryStepCount = 5; // Use fewer steps for 2D to keep total simulations manageable
      const primaryStepSize = (primaryMaxValue - primaryMinValue) / primaryStepCount;
      
      // Get the secondary parameter base value
      let secondaryBaseValue: number;
      if (secondaryParamName.includes('.')) {
        const [objectName, propertyName] = secondaryParamName.split('.');
        const objectKey = objectName as keyof ModelParameters;
        const obj = baseParams[objectKey];
        secondaryBaseValue = (obj && typeof obj === 'object' && propertyName in obj) 
          ? (obj as any)[propertyName] 
          : secondaryParamConfig?.baseValue || 0;
      } else {
        secondaryBaseValue = baseParams[secondaryParamName as keyof ModelParameters] as number;
      }
      
      const secondaryMinValue = secondaryBaseValue * 0.80; // -20%
      const secondaryMaxValue = secondaryBaseValue * 1.20; // +20%
      const secondaryStepCount = 5;
      const secondaryStepSize = (secondaryMaxValue - secondaryMinValue) / secondaryStepCount;
      
      // Generate parameter value arrays
      const primaryValues: number[] = [];
      for (let i = 0; i <= primaryStepCount; i++) {
        primaryValues.push(primaryMinValue + (primaryStepSize * i));
      }
      
      const secondaryValues: number[] = [];
      for (let j = 0; j <= secondaryStepCount; j++) {
        secondaryValues.push(secondaryMinValue + (secondaryStepSize * j));
      }
      
      // Initialize result grids
      const deathsGrid: number[][] = Array(primaryValues.length).fill(0).map(() => Array(secondaryValues.length).fill(0));
      const costsGrid: number[][] = Array(primaryValues.length).fill(0).map(() => Array(secondaryValues.length).fill(0));
      const dalysGrid: number[][] = Array(primaryValues.length).fill(0).map(() => Array(secondaryValues.length).fill(0));
      const icerGrid: number[][] | undefined = baseline ? 
        Array(primaryValues.length).fill(0).map(() => Array(secondaryValues.length).fill(0)) : 
        undefined;
      
      const results: SensitivityResult[] = [];
      
      // Run simulation for each combination of values
      for (let i = 0; i < primaryValues.length; i++) {
        for (let j = 0; j < secondaryValues.length; j++) {
          const primaryValue = primaryValues[i];
          const secondaryValue = secondaryValues[j];
          
          // Create modified parameters
          let modifiedParams = { ...baseParams };
          
          // Handle primary parameter
          if (paramName.includes('.')) {
            const [objectName, propertyName] = paramName.split('.');
            const objectKey = objectName as keyof ModelParameters;
            const currentObj = modifiedParams[objectKey];
            
            if (currentObj && typeof currentObj === 'object') {
              modifiedParams = {
                ...modifiedParams,
                [objectKey]: {
                  ...currentObj,
                  [propertyName]: primaryValue
                }
              };
            }
          } else {
            modifiedParams = { ...modifiedParams, [paramName]: primaryValue };
          }
          
          // Handle secondary parameter
          if (secondaryParamName.includes('.')) {
            const [objectName, propertyName] = secondaryParamName.split('.');
            const objectKey = objectName as keyof ModelParameters;
            const currentObj = modifiedParams[objectKey];
            
            if (currentObj && typeof currentObj === 'object') {
              modifiedParams = {
                ...modifiedParams,
                [objectKey]: {
                  ...currentObj,
                  [propertyName]: secondaryValue
                }
              };
            }
          } else {
            modifiedParams = { ...modifiedParams, [secondaryParamName]: secondaryValue };
          }
          const modifiedParamsWithAI = applyAIInterventions(modifiedParams, aiInterventions);
          
          // Run simulation with modified parameters
          const simResult = runSimulation(modifiedParamsWithAI, {
            numWeeks: weeks,
            population,
          });
          
          // Store results
          deathsGrid[i][j] = simResult.cumulativeDeaths;
          costsGrid[i][j] = simResult.totalCost;
          dalysGrid[i][j] = simResult.dalys;
          
          if (baseline && icerGrid) {
            const icer = calculateICER(simResult, baseline);
            icerGrid[i][j] = icer;
          }
          
          // Also store as a flat result for compatibility
          const result: SensitivityResult = {
            paramValue: primaryValue,
            secondaryParamValue: secondaryValue,
            deaths: simResult.cumulativeDeaths,
            costs: simResult.totalCost,
            dalys: simResult.dalys,
          };
          
          if (baseline) {
            result.icer = calculateICER(simResult, baseline);
          }
          
          results.push(result);
        }
      }
      
      // Set the grid results
      set(sensitivityGridAtom, {
        primaryValues,
        secondaryValues,
        results: {
          deaths: deathsGrid,
          costs: costsGrid,
          dalys: dalysGrid,
          icer: icerGrid
        }
      });
      
      // Also update the regular results for compatibility
      set(sensitivityResultsAtom, results);
    }
  }
);

// Run multi-disease simulations - kept for API consistency but no longer used directly
export const runMultipleSimulationsAtom = atom(
  null,
  (get, set) => {
    // This function is now handled directly in runSimulationAtom
    // Call runSimulation instead
    const runSimulation = runSimulationAtom.write;
    runSimulation(get, set);
  }
); 