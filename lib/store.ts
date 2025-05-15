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

// Population settings
export const populationSizeAtom = atom<number>(300000);
export const simulationWeeksAtom = atom<number>(52);

// Model parameters with default values
export const baseParametersAtom = atom<ModelParameters>(getDefaultParameters());

// Update parameters when geography or disease changes
export const derivedParametersAtom = atom(
  (get) => {
    const baseParams = get(baseParametersAtom);
    const geography = get(selectedGeographyAtom);
    const disease = get(selectedDiseaseAtom);
    const aiInterventions = get(aiInterventionsAtom);
    
    // Start with base parameters
    let params = { ...baseParams };
    
    // Apply geography defaults if available
    if (geography && geographyDefaults[geography as keyof typeof geographyDefaults]) {
      params = { 
        ...params, 
        ...geographyDefaults[geography as keyof typeof geographyDefaults] 
      };
    }
    
    // Apply disease profile if available
    if (disease && diseaseProfiles[disease as keyof typeof diseaseProfiles]) {
      params = { 
        ...params, 
        ...diseaseProfiles[disease as keyof typeof diseaseProfiles] 
      };
    }
    
    // Apply AI interventions
    return applyAIInterventions(params, aiInterventions);
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

// Atom to trigger simulation run
export const runSimulationTriggerAtom = atom<number>(0);

// Simulation results
export const simulationResultsAtom = atom<SimulationResults | null>(null);

// Baseline results for comparison
export const baselineResultsAtom = atom<SimulationResults | null>(null);

// Run simulation when triggered
export const runSimulationAtom = atom(
  (get) => get(simulationResultsAtom),
  (get, set) => {
    const params = get(derivedParametersAtom);
    const population = get(populationSizeAtom);
    const weeks = get(simulationWeeksAtom);
    
    const results = runSimulation(params, {
      numWeeks: weeks,
      population,
    });
    
    set(simulationResultsAtom, results);
    
    // Calculate ICER if we have a baseline
    const baseline = get(baselineResultsAtom);
    if (baseline) {
      const icer = calculateICER(results, baseline);
      set(simulationResultsAtom, { ...results, icer });
    }
  }
);

// Set current results as baseline
export const setBaselineAtom = atom(
  null,
  (get, set) => {
    const results = get(simulationResultsAtom);
    if (results) {
      set(baselineResultsAtom, results);
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
  results: SimulationResults | null;
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
    const results = get(simulationResultsAtom);
    const scenarios = get(scenariosAtom);
    const geography = get(selectedGeographyAtom);
    const disease = get(selectedDiseaseAtom);
    const population = get(populationSizeAtom);
    
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      parameters: { 
        ...params,
        geography,
        disease,
        population
      },
      aiInterventions: { ...aiInterventions },
      results: results ? { ...results } : null,
    };
    
    set(scenariosAtom, [...scenarios, newScenario]);
    set(selectedScenarioIdAtom, newScenario.id);
  }
);

// Load a scenario
export const loadScenarioAtom = atom(
  null,
  (get, set, scenarioId: string) => {
    const scenarios = get(scenariosAtom);
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (scenario) {
      set(baseParametersAtom, scenario.parameters);
      set(aiInterventionsAtom, scenario.aiInterventions);
      set(simulationResultsAtom, scenario.results);
      set(selectedScenarioIdAtom, scenarioId);
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
      const results = get(simulationResultsAtom);
      const population = get(populationSizeAtom);
      
      if (scenarioId) {
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
                results: results ? { ...results } : null 
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
  { name: 'phi0', baseValue: 0.45, label: 'Formal Care Entry (φ₀)', min: 0.1, max: 0.9, step: 0.05 },
  { name: 'sigmaI', baseValue: 0.2, label: 'Informal to Formal (σI)', min: 0.05, max: 0.5, step: 0.05 },
  { name: 'mu1', baseValue: 0.6, label: 'Primary Care Resolution (μ₁)', min: 0.3, max: 0.9, step: 0.05 },
  { name: 'delta2', baseValue: 0.05, label: 'District Hospital Mortality (δ₂)', min: 0.01, max: 0.1, step: 0.01 },
]);

// Selected parameter for sensitivity analysis
export const selectedSensitivityParamAtom = atom<string | null>(null);

// Sensitivity analysis results
export interface SensitivityResult {
  paramValue: number;
  deaths: number;
  costs: number;
  dalys: number;
  icer?: number;
}

export const sensitivityResultsAtom = atom<SensitivityResult[]>([]);

// Run sensitivity analysis
export const runSensitivityAnalysisAtom = atom(
  null,
  (get, set) => {
    const paramName = get(selectedSensitivityParamAtom);
    if (!paramName) return;
    
    const baseParams = get(derivedParametersAtom);
    const population = get(populationSizeAtom);
    const weeks = get(simulationWeeksAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const baseline = get(baselineResultsAtom);
    
    const sensitivityParams = get(sensitivityParametersAtom);
    const paramConfig = sensitivityParams.find(p => p.name === paramName);
    
    if (!paramConfig) return;
    
    // Create an array of parameter values to test
    const baseValue = baseParams[paramName as keyof ModelParameters] as number;
    const minValue = baseValue * 0.75; // -25%
    const maxValue = baseValue * 1.25; // +25%
    const stepCount = 10;
    const stepSize = (maxValue - minValue) / stepCount;
    
    const results: SensitivityResult[] = [];
    
    // Run simulation for each value
    for (let i = 0; i <= stepCount; i++) {
      const paramValue = minValue + (stepSize * i);
      const modifiedParams = { ...baseParams, [paramName]: paramValue };
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
  }
); 