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
    
    // Get geography defaults
    const geographyDefault = geography && geographyDefaults[geography as keyof typeof geographyDefaults];
    
    // Get disease profile
    const diseaseProfile = disease && diseaseProfiles[disease as keyof typeof diseaseProfiles];
    
    // Apply geography defaults if available
    if (geographyDefault) {
      // Copy all geography parameters except for diseaseModifiers
      const { diseaseModifiers, ...geographyParams } = geographyDefault;
      params = { ...params, ...geographyParams };
    }
    
    // Apply disease profile if available
    if (diseaseProfile) {
      params = { ...params, ...diseaseProfile };
      
      // Apply region-specific disease incidence modifier if available
      if (geographyDefault && 'diseaseModifiers' in geographyDefault && disease) {
        const modifiers = geographyDefault.diseaseModifiers;
        if (disease in modifiers) {
          // Modify the incidence rate (lambda) based on the regional modifier
          params.lambda = params.lambda * (modifiers as any)[disease];
        }
      }
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
          : primaryParamConfig.baseValue;
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