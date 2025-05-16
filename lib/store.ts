import { atom } from 'jotai';
import { 
  ModelParameters, 
  SimulationResults, 
  AIInterventions,
  getDefaultParameters, 
  applyAIInterventions, 
  runSimulation, 
  calculateICER, 
  geographyDefaults, 
  diseaseProfiles 
} from '../models/stockAndFlowModel';

// Selected geography and disease
export const selectedGeographyAtom = atom<string>('ethiopia');
export const selectedDiseaseAtom = atom<string>('pneumonia');
// New atom for multi-disease selection
export const selectedDiseasesAtom = atom<string[]>(['pneumonia']);

// Population settings
export const populationSizeAtom = atom<number>(1000000);
export const simulationWeeksAtom = atom<number>(52);

// Model parameters with default values
export const baseParametersAtom = atom<ModelParameters>(getDefaultParameters());

// Store results for multiple diseases
export const simulationResultsMapAtom = atom<Record<string, SimulationResults | null>>({});

// Add a map for baselines per disease
export const baselineResultsMapAtom = atom<Record<string, SimulationResults | null>>({});

// Simulation results
export const simulationResultsAtom = atom<SimulationResults | null>(null);

// Baseline results for comparison
export const baselineResultsAtom = atom<SimulationResults | null>(null);

// Derive parameters for a specific disease
export const getDerivedParamsForDisease = (
  baseParams: ModelParameters,
  geography: string,
  disease: string,
  aiInterventions: AIInterventions,
  effectMagnitudes: {[key: string]: number}
): ModelParameters => {
  // Start with base parameters
  let params = { ...baseParams };
  
  // Get geography defaults
  const geographyDefault = geography && geographyDefaults[geography as keyof typeof geographyDefaults];
  
  // Get disease profile
  const diseaseProfile = disease && diseaseProfiles[disease as keyof typeof diseaseProfiles];
  
  // Apply geography defaults if available
  if (geographyDefault) {
    params = { ...params, ...geographyDefault };
  }
  
  // Apply disease profile if available
  if (diseaseProfile) {
    params = { ...params, ...diseaseProfile };
  }
  
  // Apply AI interventions
  return applyAIInterventions(params, aiInterventions, effectMagnitudes);
};

// Update parameters when geography or disease changes
export const derivedParametersAtom = atom(
  (get) => {
    const baseParams = get(baseParametersAtom);
    const geography = get(selectedGeographyAtom);
    const disease = get(selectedDiseaseAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const effectMagnitudes = get(effectMagnitudesAtom);
    
    return getDerivedParamsForDisease(baseParams, geography, disease, aiInterventions, effectMagnitudes);
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
      const geography = get(selectedGeographyAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      const baseline = get(baselineResultsAtom);
      const baselineMap = get(baselineResultsMapAtom);
      
      // Create a new results map
      const newResultsMap: Record<string, SimulationResults | null> = {};
      
      // Run simulation for each selected disease
      selectedDiseases.forEach(disease => {
        console.log("  Running simulation for disease:", disease);
        
        // Get derived parameters for this disease
        const params = getDerivedParamsForDisease(baseParams, geography, disease, aiInterventions, effectMagnitudes);
        
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
      const geography = get(selectedGeographyAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      
      // Get derived parameters for this disease
      const params = getDerivedParamsForDisease(baseParams, geography, disease, aiInterventions, effectMagnitudes);
      
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
    geography?: string;
    disease?: string;
    population?: number;
  };
  aiInterventions: AIInterventions;
  effectMagnitudes: {[key: string]: number};
  results: SimulationResults | null;
  baselineResults?: SimulationResults | null;
  feasibility?: number; // 0 to 1, where 1 is most feasible (closest to launch)
  // Add multi-disease support
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
    const scenarios = get(scenariosAtom);
    const geography = get(selectedGeographyAtom);
    const disease = get(selectedDiseaseAtom);
    const selectedDiseases = get(selectedDiseasesAtom);
    const population = get(populationSizeAtom);
    const selectedAIScenario = get(selectedAIScenarioAtom);
    
    // Enhanced debug logs with full data inspection
    console.log('DETAILED DEBUG - Adding scenario(s) for diseases:', selectedDiseases);
    console.log('Raw resultsMap structure:', Object.keys(resultsMap));
    console.log('Selected AI scenario:', selectedAIScenario);
    
    // Determine the base scenario name
    const scenarioNumber = scenarios.length + 1;
    const activeAIInterventions = Object.entries(aiInterventions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);
    
    // Create scenario name based on AI scenario preset, AI interventions, or sequence number
    let baseName = '';
    
    // If we have a selected AI scenario, use its name
    if (selectedAIScenario) {
      // Find the preset name based on the selected scenario ID
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
    }
    // Otherwise, fall back to AI interventions or sequence number
    else if (activeAIInterventions.length > 0) {
      if (activeAIInterventions.length === 1) {
        // Use the specific AI intervention name
        const aiName = (() => {
          switch(activeAIInterventions[0]) {
            case 'triageAI': return 'AI Triage';
            case 'chwAI': return 'CHW Decision Support';
            case 'diagnosticAI': return 'Diagnostic AI';
            case 'bedManagementAI': return 'Bed Management AI';
            case 'hospitalDecisionAI': return 'Hospital Decision Support';
            case 'selfCareAI': return 'Self-Care Apps';
            default: return activeAIInterventions[0];
          }
        })();
        baseName = `${aiName}`;
      } else if (activeAIInterventions.length > 1) {
        // Multiple AI interventions
        baseName = `Combined AI (${activeAIInterventions.length})`;
      }
    } else {
      // No AI interventions - use sequence number
      baseName = `Scenario ${scenarioNumber}`;
    }
    
    // Check if we should create separate scenarios for each disease
    if (selectedDiseases.length > 1 && Object.keys(resultsMap).length > 1) {
      console.log('Creating separate scenarios for each disease');
      
      // Track the newly created scenarios
      const newScenarios = [...scenarios];
      let lastScenarioId = null;
      
      // Create a scenario for each disease
      selectedDiseases.forEach((diseaseName, index) => {
        // Skip diseases with no results
        if (!resultsMap[diseaseName]) {
          console.log(`Skipping ${diseaseName} as it has no results`);
          return;
        }
        
        console.log(`Creating scenario for disease: ${diseaseName}`);
        
        // Create a single-disease results map
        const singleDiseaseMap: Record<string, SimulationResults | null> = {
          [diseaseName]: resultsMap[diseaseName]
        };
        
        // Create a deep copy of the single result
        const diseaseResultsCopy = (() => {
          if (!resultsMap[diseaseName]) {
            return undefined;
          }
          
          // Make a proper deep copy of this disease's result
          const diseaseResult = resultsMap[diseaseName];
          
          const resultCopy: SimulationResults = {
            cumulativeDeaths: diseaseResult.cumulativeDeaths,
            cumulativeResolved: diseaseResult.cumulativeResolved,
            totalCost: diseaseResult.totalCost,
            averageTimeToResolution: diseaseResult.averageTimeToResolution,
            dalys: diseaseResult.dalys,
            icer: diseaseResult.icer,
            weeklyStates: diseaseResult.weeklyStates.map(state => ({...state})),
          };
          
          return { [diseaseName]: resultCopy };
        })();
        
        // Use just the base name without the disease name for multi-disease scenarios
        const scenarioName = baseName;
        
        // Create the scenario with proper copies
        const newScenario: Scenario = {
          id: `scenario-${Date.now()}-${index}`,
          name: scenarioName,
          parameters: { 
            ...params,
            geography,
            disease: diseaseName,  // Set the primary disease to this disease
            population
          },
          aiInterventions: { ...aiInterventions },
          effectMagnitudes: { ...effectMagnitudes },
          // Set the primary result to this disease's result
          results: resultsMap[diseaseName] ? { 
            ...JSON.parse(JSON.stringify(resultsMap[diseaseName])),
            weeklyStates: resultsMap[diseaseName].weeklyStates.map(state => ({...state}))
          } : null,
          baselineResults: baseline ? { 
            ...JSON.parse(JSON.stringify(baseline)),
            weeklyStates: baseline.weeklyStates.map(state => ({...state}))
          } : null,
          // Store just this disease
          selectedDiseases: [diseaseName],
          diseaseResultsMap: diseaseResultsCopy
        };
        
        // Check the created scenario
        console.log(`Created scenario for ${diseaseName}:`, {
          id: newScenario.id,
          name: newScenario.name,
          disease: diseaseName,
          deaths: resultsMap[diseaseName]?.cumulativeDeaths,
          costs: resultsMap[diseaseName]?.totalCost,
          icer: resultsMap[diseaseName]?.icer
        });
        
        // Add to the list of new scenarios
        newScenarios.push(newScenario);
        lastScenarioId = newScenario.id;
      });
      
      // Save all the new scenarios
      set(scenariosAtom, newScenarios);
      
      // Select the last created scenario
      if (lastScenarioId) {
        set(selectedScenarioIdAtom, lastScenarioId);
      }
      
      console.log(`Created ${newScenarios.length - scenarios.length} new scenarios`);
    } else {
      // Original code for creating a single scenario
      console.log('Creating single scenario with all diseases');
      
      // Use just the base name without appending disease information
      const scenarioName = baseName;
      
      // CRITICAL FIX: Make sure we use selectedDiseases for the resultsMap if needed
      let effectiveResultsMap = {...resultsMap};
      
      // If we have selectedDiseases but they're not all in the resultsMap,
      // make sure the primary disease result is at least duplicated to all selected diseases
      if (selectedDiseases.length > 1 && Object.keys(effectiveResultsMap).length < selectedDiseases.length) {
        console.log('Warning: Selected diseases count does not match results map size.', 
          'Attempting to use primary disease result for missing diseases.');
        
        if (results) {
          // Use the main results for any missing diseases
          selectedDiseases.forEach(disease => {
            if (!effectiveResultsMap[disease] && disease !== selectedDiseases[0]) {
              console.log(`Adding missing disease ${disease} to results map using primary disease results`);
              effectiveResultsMap[disease] = JSON.parse(JSON.stringify(results));
            }
          });
        }
      }
      
      // Improved deep copy implementation for the results map
      const diseaseResultsMapCopy = (() => {
        if (Object.keys(effectiveResultsMap).length === 0) {
          console.log('Results map is empty, returning undefined');
          return undefined;
        }
        
        // Create a new object to hold the deep copies
        const deepCopy: Record<string, SimulationResults | null> = {};
        
        // Manually copy each disease's results with proper handling of complex properties
        Object.entries(effectiveResultsMap).forEach(([disease, results]) => {
          if (!results) {
            deepCopy[disease] = null;
            return;
          }
          
          // Create a base copy of the result
          const resultCopy: SimulationResults = {
            // Copy all primitive values
            cumulativeDeaths: results.cumulativeDeaths,
            cumulativeResolved: results.cumulativeResolved,
            totalCost: results.totalCost,
            averageTimeToResolution: results.averageTimeToResolution,
            dalys: results.dalys,
            icer: results.icer,
            
            // Handle arrays by mapping to new objects
            weeklyStates: results.weeklyStates.map(state => ({...state})),
          };
          
          // Add to the deep copy map
          deepCopy[disease] = resultCopy;
        });
        
        console.log('Created manual deep copy of results map with keys:', Object.keys(deepCopy));
        
        // Verify the copy worked by checking a value
        if (Object.keys(deepCopy).length > 0) {
          const firstDisease = Object.keys(deepCopy)[0];
          console.log(`First disease in copy (${firstDisease}) has ICER:`, deepCopy[firstDisease]?.icer);
        }
        
        return deepCopy;
      })();
      
      // Create the scenario with proper copies
      const newScenario: Scenario = {
        id: `scenario-${Date.now()}`,
        name: scenarioName,
        parameters: { 
          ...params,
          geography,
          disease,
          population
        },
        aiInterventions: { ...aiInterventions },
        effectMagnitudes: { ...effectMagnitudes },
        results: results ? { 
          ...JSON.parse(JSON.stringify(results)),
          weeklyStates: results.weeklyStates.map(state => ({...state}))
        } : null,
        baselineResults: baseline ? { 
          ...JSON.parse(JSON.stringify(baseline)),
          weeklyStates: baseline.weeklyStates.map(state => ({...state}))
        } : null,
        // Store the multi-disease data
        selectedDiseases: [...selectedDiseases],
        diseaseResultsMap: diseaseResultsMapCopy
      };
      
      // Check the created scenario
      console.log('Created combined scenario:', {
        id: newScenario.id,
        selectedDiseases: newScenario.selectedDiseases,
        diseaseResultsMapKeys: newScenario.diseaseResultsMap ? Object.keys(newScenario.diseaseResultsMap) : [],
        hasMultiDiseaseResults: !!newScenario.diseaseResultsMap && Object.keys(newScenario.diseaseResultsMap).length > 0,
        multiDiseaseCount: newScenario.diseaseResultsMap ? Object.keys(newScenario.diseaseResultsMap).length : 0
      });
      
      // VERY DETAILED inspection of the final saved data
      if (newScenario.diseaseResultsMap) {
        console.log('Verification of disease results in combined scenario:');
        Object.entries(newScenario.diseaseResultsMap).forEach(([disease, diseaseResults]) => {
          console.log(`  ${disease}: ${diseaseResults ? 
            `deaths=${diseaseResults.cumulativeDeaths}, costs=${diseaseResults.totalCost}, icer=${diseaseResults.icer}` 
            : 'null'}`);
        });
      }
      
      // Save it
      const newScenarios = [...scenarios, newScenario];
      set(scenariosAtom, newScenarios);
      set(selectedScenarioIdAtom, newScenario.id);
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
      // Load effect magnitudes if they exist in the scenario, otherwise use empty object
      set(effectMagnitudesAtom, scenario.effectMagnitudes || {});
      set(simulationResultsAtom, scenario.results);
      set(selectedScenarioIdAtom, scenarioId);
      
      // Load disease selections if available
      if (scenario.selectedDiseases && scenario.selectedDiseases.length > 0) {
        console.log('Setting selected diseases:', scenario.selectedDiseases);
        
        // Ensure the diseases array has real content
        if (scenario.selectedDiseases.some(d => d && d.trim() !== '')) {
          set(selectedDiseasesAtom, scenario.selectedDiseases);
          set(selectedDiseaseAtom, scenario.selectedDiseases[0]);
        } else {
          // Fallback to the single disease from parameters if available
          console.log('Empty selectedDiseases array, falling back to parameters.disease');
          const fallbackDisease = scenario.parameters.disease || 'pneumonia';
          set(selectedDiseasesAtom, [fallbackDisease]);
          set(selectedDiseaseAtom, fallbackDisease);
        }
      } else if (scenario.parameters.disease) {
        console.log('No multi-disease selection, using primary disease:', scenario.parameters.disease);
        set(selectedDiseaseAtom, scenario.parameters.disease);
        set(selectedDiseasesAtom, [scenario.parameters.disease]);
      }
      
      // Load multi-disease results if available
      if (scenario.diseaseResultsMap && Object.keys(scenario.diseaseResultsMap).length > 0) {
        console.log('Setting disease results map with keys:', Object.keys(scenario.diseaseResultsMap));
        console.log('Disease results map ICER values:', 
          Object.entries(scenario.diseaseResultsMap)
            .map(([disease, results]) => `${disease}: ICER=${results?.icer}`)
        );
            
        // Ensure we're creating a fresh deep copy to avoid reference issues
        const deepCopyMap: Record<string, SimulationResults | null> = {};
        
        // Manually copy each disease's results with proper handling of complex properties
        Object.entries(scenario.diseaseResultsMap).forEach(([disease, results]) => {
          if (!results) {
            deepCopyMap[disease] = null;
            return;
          }
          
          // Create a base copy of the result
          const resultCopy: SimulationResults = {
            // Copy all primitive values
            cumulativeDeaths: results.cumulativeDeaths,
            cumulativeResolved: results.cumulativeResolved,
            totalCost: results.totalCost,
            averageTimeToResolution: results.averageTimeToResolution,
            dalys: results.dalys,
            icer: results.icer,
            
            // Handle arrays by mapping to new objects
            weeklyStates: results.weeklyStates.map(state => ({...state})),
          };
          
          // Add to the deep copy map
          deepCopyMap[disease] = resultCopy;
        });
        
        console.log('Created manual deep copy of loaded results map with keys:', Object.keys(deepCopyMap));
        set(simulationResultsMapAtom, deepCopyMap);
        
        // Make sure the hasMultipleDiseaseResults logic in Dashboard.tsx will work
        if (Object.keys(deepCopyMap).length > 1) {
          console.log('Multi-disease view should be available with', Object.keys(deepCopyMap).length, 'diseases');
        }
      } else if (scenario.results) {
        // Backward compatibility - create a results map with just the primary disease
        const diseasesToUse = scenario.selectedDiseases && scenario.selectedDiseases.length > 0 
          ? scenario.selectedDiseases 
          : [scenario.parameters.disease || get(selectedDiseaseAtom)];
          
        console.log('No multi-disease results, creating results map with diseases:', diseasesToUse);
        
        // Create results map with all selected diseases
        const newResultsMap: Record<string, SimulationResults | null> = {};
        
        diseasesToUse.forEach(disease => {
          // Create a proper deep copy of the single result for each disease
          if (scenario.results) {
            newResultsMap[disease] = {
              ...JSON.parse(JSON.stringify(scenario.results)),
              weeklyStates: scenario.results.weeklyStates.map(state => ({...state}))
            };
          }
        });
        
        console.log('Created results map with keys:', Object.keys(newResultsMap));
        set(simulationResultsMapAtom, newResultsMap);
      }
      
      // Load baseline if it exists in the scenario
      if (scenario.baselineResults) {
        const baselineCopy = {
          ...JSON.parse(JSON.stringify(scenario.baselineResults)),
          weeklyStates: scenario.baselineResults.weeklyStates.map(state => ({...state}))
        };
        set(baselineResultsAtom, baselineCopy);
      } else {
        // Clear baseline if it doesn't exist in the scenario
        set(baselineResultsAtom, null);
      }
    }
  }
);

// Update current scenario
export const updateScenarioAtom = atom(
  null,
  (get, set, updatedScenario?: Scenario) => {
    if (updatedScenario) {
      // If provided with a scenario, update it directly
      const scenarios = get(scenariosAtom);
      const updatedScenarios = scenarios.map(s => 
        s.id === updatedScenario.id ? updatedScenario : s
      );
      set(scenariosAtom, updatedScenarios);
    } else {
      // Otherwise update the current selected scenario
      const scenarioId = get(selectedScenarioIdAtom);
      const scenarios = get(scenariosAtom);
      const params = get(derivedParametersAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const results = get(simulationResultsAtom);
      const resultsMap = get(simulationResultsMapAtom);
      const baseline = get(baselineResultsAtom);
      const population = get(populationSizeAtom);
      const selectedDiseases = get(selectedDiseasesAtom);
      
      // Deep copy the entire results map using the same approach as in addScenarioAtom
      const diseaseResultsMapCopy = (() => {
        if (Object.keys(resultsMap).length === 0) {
          console.log('Update scenario: Results map is empty, returning undefined');
          return undefined;
        }
        
        // Create a new object to hold the deep copies
        const deepCopy: Record<string, SimulationResults | null> = {};
      
        // Manually copy each disease's results with proper handling of complex properties
        Object.entries(resultsMap).forEach(([disease, results]) => {
          if (!results) {
            deepCopy[disease] = null;
            return;
          }
          
          // Create a base copy of the result
          const resultCopy: SimulationResults = {
            // Copy all primitive values
            cumulativeDeaths: results.cumulativeDeaths,
            cumulativeResolved: results.cumulativeResolved,
            totalCost: results.totalCost,
            averageTimeToResolution: results.averageTimeToResolution,
            dalys: results.dalys,
            icer: results.icer,
            
            // Handle arrays by mapping to new objects
            weeklyStates: results.weeklyStates.map(state => ({...state})),
          };
          
          // Add to the deep copy map
          deepCopy[disease] = resultCopy;
        });
        
        console.log('Update scenario: Created manual deep copy of results map with keys:', Object.keys(deepCopy));
        return deepCopy;
      })();
      
      if (scenarioId) {
        console.log('Updating scenario:', scenarioId, 'with diseases:', selectedDiseases, 
          'resultsMap keys:', Object.keys(resultsMap).length > 0 ? Object.keys(resultsMap) : 'none');
        
        const updatedScenarios = scenarios.map(s => 
          s.id === scenarioId 
            ? { 
                ...s, 
                parameters: { 
                  ...params, 
                  population,
                  geography: s.parameters.geography,
                  disease: s.parameters.disease
                }, 
                aiInterventions: { ...aiInterventions },
                effectMagnitudes: { ...effectMagnitudes },
                results: results ? { 
                  ...JSON.parse(JSON.stringify(results)),
                  weeklyStates: results.weeklyStates.map(state => ({...state}))
                } : null,
                baselineResults: baseline ? { 
                  ...JSON.parse(JSON.stringify(baseline)),
                  weeklyStates: baseline.weeklyStates.map(state => ({...state}))
                } : null,
                // Add multi-disease data with improved deep copy
                selectedDiseases: [...selectedDiseases],
                diseaseResultsMap: diseaseResultsMapCopy
              }
            : s
        );
        
        set(scenariosAtom, updatedScenarios);
      }
    }
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