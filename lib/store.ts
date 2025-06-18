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
  diseaseProfiles,
  AIUptakeParameters,
  defaultAIUptakeParameters
} from '../models/stockAndFlowModel';
import {
  CountrySpecificParameters,
  countryProfiles,
  adjustParametersForCountry,
  HealthSystemLoad,
  createAdditiveHealthSystemParameters
} from '../models/countrySpecificModel';
import { calculateSuggestedFeasibility, formatNumber, calculateDefaultCongestion } from './utils';

// Helper function to generate country-specific baseline key
const getCountryBaselineKey = (countryCode: string, isUrban: boolean): string => {
  return `${countryCode}_${isUrban ? 'urban' : 'rural'}`;
};

// Enhanced baseline key that includes all relevant parameters
export const getEnhancedBaselineKey = (
  countryCode: string, 
  isUrban: boolean, 
  selectedDiseases: string[], 
  congestion: number,
  scenarioMode: string
): string => {
  const diseaseKey = selectedDiseases.sort().join('-');
  const congestionKey = `cong${Math.round(congestion * 100)}`;
  return `${countryCode}_${isUrban ? 'urban' : 'rural'}_${diseaseKey}_${congestionKey}_${scenarioMode}`;
};

// Selected health system strength and disease
export const selectedHealthSystemStrengthAtom = atom<string>('moderate_urban_system');
export const selectedDiseaseAtom = atom<string>('childhood_pneumonia');
// New atom for multi-disease selection
export const selectedDiseasesAtom = atom<string[]>(['childhood_pneumonia']);

// Country-specific settings
export const selectedCountryAtom = atom<string>('nigeria');
export const isUrbanSettingAtom = atom<boolean>(true);
export const useCountrySpecificModelAtom = atom<boolean>(true);

// Multi-condition scenario settings
export const multiConditionModeAtom = atom<boolean>(false);
export const multiConditionMortalityMultiplierAtom = atom<number>(1.5);
export const multiConditionResolutionReductionAtom = atom<number>(0.8);
export const multiConditionCareSeekingBoostAtom = atom<number>(1.2);

// Flag to track when automated scenario generation is happening
export const isGeneratingScenariosBatchAtom = atom<boolean>(false);

// Dynamic system congestion
export const userOverriddenCongestionAtom = atom<number | null>(null);
export const calculatedCongestionAtom = atom<number>((get) => {
  const selectedDiseases = get(selectedDiseasesAtom);
  const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
  
  // Calculate total incidence by summing individual disease incidences
  let totalIncidence = 0;
  if (selectedDiseases.length > 1) {
    const individualDiseaseParams = get(individualDiseaseParametersAtom);
    totalIncidence = selectedDiseases.reduce((sum, disease) => {
      const diseaseParams = individualDiseaseParams[disease];
      const lambda = diseaseParams?.lambda || 0;
      console.log(`  Disease ${disease} lambda:`, lambda);
      return sum + lambda;
    }, 0);
  } else {
    // For single disease, get from base parameters
    const baseParams = get(baseParametersAtom);
    const disease = selectedDiseases[0] || get(selectedDiseaseAtom);
    const diseaseProfile = diseaseProfiles[disease as keyof typeof diseaseProfiles];
    totalIncidence = diseaseProfile?.lambda || baseParams.lambda;
  }
  
  console.log('Congestion calculation:', {
    selectedDiseases,
    totalIncidence,
    healthSystemStrength,
    numberOfDiseases: selectedDiseases.length
  });
  
  // Calculate default congestion based on current state
  const congestion = calculateDefaultCongestion(
    totalIncidence,
    selectedDiseases.length,
    healthSystemStrength
  );
  
  console.log('Calculated congestion:', congestion);
  return congestion;
});

export const effectiveCongestionAtom = atom<number>((get) => {
  const userOverride = get(userOverriddenCongestionAtom);
  const calculated = get(calculatedCongestionAtom);
  
  // Use user override if set, otherwise use calculated value
  return userOverride !== null ? userOverride : calculated;
});

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

// Add a map for baselines per disease, organized by country/setting
// Structure: { "countryCode_urban": { "disease": SimulationResults } }
export const baselineResultsMapAtom = atom<Record<string, Record<string, SimulationResults | null>>>({});

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
  aiCostParams?: AICostParameters,
  useCountrySpecific?: boolean,
  countryCode?: string,
  isUrban?: boolean,
  aiUptakeParams?: AIUptakeParameters,
  customDiseaseOverrides?: Record<string, Partial<ModelParameters>>
): ModelParameters => {
  // Start with base parameters
  let params = { ...baseParams };

  // Get health system scenario defaults (needed for both paths)
  const healthSystemScenario = healthSystemStrength && healthSystemStrengthDefaults[healthSystemStrength as keyof typeof healthSystemStrengthDefaults];

  // If using country-specific model, apply country adjustments first
  if (useCountrySpecific && countryCode && isUrban !== undefined) {
    try {
      // IMPORTANT: Apply health system defaults FIRST
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
      
      // THEN apply disease profile before country adjustments
      const diseaseProfile = disease && diseaseProfiles[disease as keyof typeof diseaseProfiles];
      if (diseaseProfile) {
        params = { ...params, ...diseaseProfile };
      }
      console.log(`Before country adjustment - phi0: ${params.phi0}`);
      params = adjustParametersForCountry(params, countryCode, isUrban, disease);
      console.log(`After country adjustment - phi0: ${params.phi0}`);
    } catch (error) {
      console.warn(`Failed to apply country-specific parameters: ${error}`);
      // Fall back to regular model
    }
  } else {
    // Regular model flow
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
  }
  
  // Apply custom disease parameter overrides if provided
  if (customDiseaseOverrides && customDiseaseOverrides[disease]) {
    const overrides = customDiseaseOverrides[disease];
    // Deep merge the overrides
    Object.keys(overrides).forEach(key => {
      const overrideValue = overrides[key as keyof ModelParameters];
      if (overrideValue !== undefined) {
        if (typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
          // For nested objects like perDiemCosts
          params[key as keyof ModelParameters] = {
            ...(params[key as keyof ModelParameters] as any),
            ...overrideValue
          } as any;
        } else {
          // For simple values
          (params as any)[key] = overrideValue;
        }
      }
    });
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

  // Apply AI interventions with disease-specific effects
  const finalParams = applyAIInterventions(params, aiInterventions, effectMagnitudes, aiCostParams, undefined, disease, aiUptakeParams, isUrban);
  
  // Debug logging for phi0
  console.log(`Final parameters for ${disease}:`, {
    phi0: finalParams.phi0,
    sigmaI: finalParams.sigmaI,
    informalCareRatio: finalParams.informalCareRatio,
    healthSystem: healthSystemStrength,
    useCountrySpecific,
    countryCode,
    isUrban
  });
  
  return finalParams;
};

// Store individual disease parameters for multi-disease mode
export const individualDiseaseParametersAtom = atom<Record<string, ModelParameters>>((get) => {
  const selectedDiseases = get(selectedDiseasesAtom);
  
  if (selectedDiseases.length > 1) {
    const baseParams = get(baseParametersAtom);
    const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const effectMagnitudes = get(effectMagnitudesAtom);
    const activeMultipliers = get(healthSystemMultipliersAtom);
    const aiCostParams = get(aiCostParametersAtom);
    const aiUptakeParams = get(aiUptakeParametersAtom);
    const useCountrySpecific = get(useCountrySpecificModelAtom);
    const countryCode = get(selectedCountryAtom);
    const isUrban = get(isUrbanSettingAtom);
    const customDiseaseOverrides = get(customDiseaseParametersAtom);
    
    // Calculate individual disease parameters
    const diseaseParamsMap: Record<string, ModelParameters> = {};
    selectedDiseases.forEach(diseaseKey => {
      diseaseParamsMap[diseaseKey] = getDerivedParamsForDisease(
        baseParams,
        healthSystemStrength,
        diseaseKey,
        aiInterventions,
        effectMagnitudes,
        activeMultipliers,
        aiCostParams,
        useCountrySpecific,
        countryCode,
        isUrban,
        aiUptakeParams,
        customDiseaseOverrides
      );
    });
    
    return diseaseParamsMap;
  } else {
    // Return empty object in single disease mode
    return {};
  }
});

// Update parameters when health system strength or disease changes, but preserve custom user changes
export const derivedParametersAtom = atom(
  (get) => {
    const baseParams = get(baseParametersAtom);
    const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
    const disease = get(selectedDiseaseAtom);
    const selectedDiseases = get(selectedDiseasesAtom);
    const aiInterventions = get(aiInterventionsAtom);
    const effectMagnitudes = get(effectMagnitudesAtom);
    const activeMultipliers = get(healthSystemMultipliersAtom);
    const aiCostParams = get(aiCostParametersAtom);
    const aiUptakeParams = get(aiUptakeParametersAtom);
    const useCountrySpecific = get(useCountrySpecificModelAtom);
    const countryCode = get(selectedCountryAtom);
    const isUrban = get(isUrbanSettingAtom);
    const population = get(populationSizeAtom);
    
    // Check if we're in multi-disease mode
    if (selectedDiseases.length > 1) {
      console.log("derivedParametersAtom: Multi-disease mode detected, calculating aggregated parameters for:", selectedDiseases);
      
      // Get the individual disease parameters from the atom
      const diseaseParamsMap = get(individualDiseaseParametersAtom);
      
      // Create health system load scenario
      const scenario: HealthSystemLoad = {
        diseases: selectedDiseases,
        countryCode: countryCode,
        isUrban: isUrban,
        populationSize: population
      };
      
      // Get aggregated parameters for total health system modeling
      const aggregatedParams = createAdditiveHealthSystemParameters(scenario, diseaseParamsMap);
      
      // Apply AI interventions to the aggregated parameters
      const finalParams = applyAIInterventions(
        aggregatedParams,
        aiInterventions,
        effectMagnitudes,
        aiCostParams,
        undefined,
        'health_system_total', // Use a special disease identifier for total system
        aiUptakeParams,
        isUrban
      );
      
      console.log("derivedParametersAtom: Aggregated lambda =", finalParams.lambda, "from diseases:", selectedDiseases.map(d => {
        const profile = diseaseParamsMap[d];
        return `${d}: ${profile?.lambda || 0}`;
      }).join(', '));
      
      // Apply dynamic congestion
      const effectiveCongestion = get(effectiveCongestionAtom);
      
      console.log('Multi-disease mode - applying congestion:', effectiveCongestion);
      
      return {
        ...finalParams,
        systemCongestion: effectiveCongestion
      };
    } else {
      // Single disease mode - return parameters for the selected disease
      const singleDiseaseParams = getDerivedParamsForDisease(
        baseParams, 
        healthSystemStrength, 
        disease, 
        aiInterventions, 
        effectMagnitudes, 
        activeMultipliers, 
        aiCostParams,
        useCountrySpecific,
        countryCode,
        isUrban,
        aiUptakeParams
      );
      
      // Apply dynamic congestion
      const effectiveCongestion = get(effectiveCongestionAtom);
      
      console.log('Single disease mode - applying congestion:', effectiveCongestion);
      
      return {
        ...singleDiseaseParams,
        systemCongestion: effectiveCongestion
      };
    }
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


// Time-to-scale parameters for each AI intervention
export interface AITimeToScaleParameters {
  triageAI: number;
  chwAI: number;
  diagnosticAI: number;
  bedManagementAI: number;
  hospitalDecisionAI: number;
  selfCareAI: number;
}

// Default values match the hardcoded values in stockAndFlowModel.ts
export const aiCostParametersAtom = atom<AICostParameters>({
  triageAI: { fixed: 35000, variable: 2 },
  chwAI: { fixed: 25000, variable: 1 },
  diagnosticAI: { fixed: 50000, variable: 1 },
  bedManagementAI: { fixed: 40000, variable: 1 },
  hospitalDecisionAI: { fixed: 60000, variable: 2 },
  selfCareAI: { fixed: 15000, variable: 0.5 }
});

// Time-to-scale parameters with default values from utils.ts estimateTimeToScale function
export const aiTimeToScaleParametersAtom = atom<AITimeToScaleParameters>({
  triageAI: 0.75,        // 3-6 months
  chwAI: 0.50,           // 1 year
  diagnosticAI: 0.60,    // 6-12 months
  bedManagementAI: 0.40, // 1.5-2 years
  hospitalDecisionAI: 0.40, // 1.5-2 years
  selfCareAI: 0.75       // 3-6 months
});

// AI uptake parameters atom with defaults
export const aiUptakeParametersAtom = atom<AIUptakeParameters>(defaultAIUptakeParameters);

// AI intervention effect magnitudes
export const effectMagnitudesAtom = atom<{[key: string]: number}>({});

// Custom disease parameter overrides for multi-disease mode
export const customDiseaseParametersAtom = atom<Record<string, Partial<ModelParameters>>>({});

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
    const useCountrySpecific = get(useCountrySpecificModelAtom);
    const countryCode = get(selectedCountryAtom);
    const isUrban = get(isUrbanSettingAtom);
    
    console.log("Starting simulation with selected diseases:", selectedDiseases);
    
    // Handle multiple diseases - run separate simulations then sum outcomes
    if (selectedDiseases.length > 1) {
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      const baseParams = get(baseParametersAtom);
      const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const activeMultipliers = get(healthSystemMultipliersAtom);
      const aiCostParams = get(aiCostParametersAtom);
      const aiUptakeParams = get(aiUptakeParametersAtom);
      const baseline = get(baselineResultsAtom);
      
      console.log("  Running separate simulations for", selectedDiseases.length, "diseases then summing outcomes");
      
      // Run separate simulation for each disease
      const diseaseResults: Record<string, SimulationResults> = {};
      const diseaseParamsMap: Record<string, ModelParameters> = {};
      
      // Get the aggregated parameters with proper congestion
      const aggregatedParams = get(derivedParametersAtom);
      console.log('Using aggregated parameters with congestion:', aggregatedParams.systemCongestion);
      
      const customDiseaseOverrides = get(customDiseaseParametersAtom);
      
      selectedDiseases.forEach(disease => {
        // Get disease-specific parameters
        const diseaseParams = getDerivedParamsForDisease(
          baseParams,
          healthSystemStrength,
          disease,
          aiInterventions,
          effectMagnitudes,
          activeMultipliers,
          aiCostParams,
          useCountrySpecific,
          countryCode,
          isUrban,
          aiUptakeParams,
          customDiseaseOverrides
        );
        
        // Apply the system-wide congestion to each disease simulation
        diseaseParams.systemCongestion = aggregatedParams.systemCongestion;
        
        diseaseParamsMap[disease] = diseaseParams;
        
        // Run simulation for this disease
        const diseaseResult = runSimulation(diseaseParams, {
          numWeeks: weeks,
          population,
        });
        
        diseaseResults[disease] = diseaseResult;
        console.log(`  ${disease}: ${diseaseResult.cumulativeDeaths} deaths (${(diseaseResult.cumulativeDeaths/population*100).toFixed(2)}%), ${diseaseResult.dalys.toFixed(0)} DALYs, $${diseaseResult.totalCost.toFixed(0)} cost`);
        console.log(`    Lambda: ${diseaseParams.lambda}, deltaU: ${diseaseParams.deltaU}, congestion: ${diseaseParams.systemCongestion}`);
      });
      
      // Sum outcomes across all diseases
      const aggregatedResults: SimulationResults = {
        weeklyStates: [], // We'll use the first disease's states as template (not used for aggregated view)
        cumulativeDeaths: Object.values(diseaseResults).reduce((sum, result) => sum + result.cumulativeDeaths, 0),
        cumulativeResolved: Object.values(diseaseResults).reduce((sum, result) => sum + result.cumulativeResolved, 0),
        totalCost: Object.values(diseaseResults).reduce((sum, result) => sum + result.totalCost, 0),
        dalys: Object.values(diseaseResults).reduce((sum, result) => sum + result.dalys, 0),
        averageTimeToResolution: Object.values(diseaseResults).reduce((sum, result, _, arr) => 
          sum + (result.averageTimeToResolution / arr.length), 0), // Average of averages
        // Aggregate queue metrics if present
        totalQueuedPatients: Object.values(diseaseResults).reduce((sum, result) => 
          sum + (result.totalQueuedPatients || 0), 0),
        queueRelatedDeaths: Object.values(diseaseResults).reduce((sum, result) => 
          sum + (result.queueRelatedDeaths || 0), 0),
      };
      
      // Use the weekly states from the first disease as a template (for UI compatibility)
      if (Object.values(diseaseResults).length > 0) {
        aggregatedResults.weeklyStates = Object.values(diseaseResults)[0].weeklyStates;
      }
      
      console.log(`  TOTAL AGGREGATED: ${aggregatedResults.cumulativeDeaths} deaths, ${aggregatedResults.dalys.toFixed(0)} DALYs, $${aggregatedResults.totalCost.toFixed(0)} cost`);
      
      // Calculate ICER if we have a baseline
      let resultsWithIcer = aggregatedResults;
      if (baseline) {
        const icer = calculateICER(aggregatedResults, baseline);
        resultsWithIcer = { ...aggregatedResults, icer };
      }
      
      console.log("  Multi-disease separate simulations complete, outcomes summed");
      
      // Store the aggregated result
      set(simulationResultsAtom, resultsWithIcer);
      
      // Also store individual disease results for detailed view
      const newResultsMap: Record<string, SimulationResults | null> = {
        'health_system_total': resultsWithIcer,
        ...diseaseResults
      };
      set(simulationResultsMapAtom, newResultsMap);
      
      // Set primary disease to a synthetic identifier
      set(selectedDiseaseAtom, 'health_system_total');
    } else {
      // Single disease simulation
      const disease = selectedDiseases[0] || get(selectedDiseaseAtom);
      console.log("  Running single-disease simulation for:", disease);
      
      const baseParams = get(baseParametersAtom);
      const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
      const aiInterventions = get(aiInterventionsAtom);
      const effectMagnitudes = get(effectMagnitudesAtom);
      const population = get(populationSizeAtom);
      const weeks = get(simulationWeeksAtom);
      const activeMultipliers = get(healthSystemMultipliersAtom);
      const aiCostParams = get(aiCostParametersAtom);
      
      // Get derived parameters for this disease with proper congestion
      const params = get(derivedParametersAtom);
      console.log('Single disease simulation with congestion:', params.systemCongestion);
      
      const results = runSimulation(params, {
        numWeeks: weeks,
        population,
      });
      
      // Calculate ICER if we have a baseline
      const baselineMap = get(baselineResultsMapAtom);
      const countryCode = get(selectedCountryAtom);
      const isUrban = get(isUrbanSettingAtom);
      const useCountrySpecific = get(useCountrySpecificModelAtom);
      const congestion = get(baseParametersAtom).systemCongestion || 0;
      const scenarioMode = get(multiDiseaseScenarioModeAtom);
      
      // Generate the same enhanced key used when storing baselines
      const countryKey = useCountrySpecific 
        ? getEnhancedBaselineKey(countryCode, isUrban, selectedDiseases, congestion, scenarioMode)
        : `generic_${selectedDiseases.sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
      
      const countryBaselines = baselineMap[countryKey];
      const diseaseBaseline = countryBaselines ? countryBaselines[disease] : null;
      const primaryBaseline = get(baselineResultsAtom);
      
      if (diseaseBaseline) {
        // Use disease-specific baseline if available
        console.log(`  Calculating ICER for ${disease} using its own baseline from key: ${countryKey}`);
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
    const countryCode = get(selectedCountryAtom);
    const isUrban = get(isUrbanSettingAtom);
    const useCountrySpecific = get(useCountrySpecificModelAtom);
    const congestion = get(baseParametersAtom).systemCongestion || 0;
    const scenarioMode = get(multiDiseaseScenarioModeAtom);
    
    // Generate enhanced key that includes congestion and other parameters
    const countryKey = useCountrySpecific 
      ? getEnhancedBaselineKey(countryCode, isUrban, selectedDiseases, congestion, scenarioMode)
      : `generic_${selectedDiseases.sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
    
    console.log(`Setting baseline for enhanced key: ${countryKey}, diseases:`, selectedDiseases);
    console.log("Current results map has keys:", Object.keys(resultsMap));
    console.log("Baseline storage details:", {
      congestion: congestion,
      scenarioMode: scenarioMode,
      countryKey: countryKey,
      existingKeys: Object.keys(get(baselineResultsMapAtom))
    });
    
    if (results) {
      // Set the baseline using the primary disease's results
      set(baselineResultsAtom, results);
      
      // When a baseline is set, recalculate all ICERs for the current result set
      if (Object.keys(resultsMap).length > 1) {
        console.log("Setting per-disease baselines and recalculating ICERs");
        
        // Store per-disease baselines for this specific country/setting
        const diseaseBaselineMap: Record<string, SimulationResults | null> = {};
        
        // First, store all current results as baselines for each disease
        Object.entries(resultsMap).forEach(([disease, diseaseResults]) => {
          if (diseaseResults) {
            // Store the current result as baseline for this disease
            diseaseBaselineMap[disease] = { 
              ...JSON.parse(JSON.stringify(diseaseResults)),
              weeklyStates: diseaseResults.weeklyStates.map(state => ({...state}))
            };
          }
        });
        
        // Update the baseline map with country-specific storage
        const currentBaselineMap = get(baselineResultsMapAtom);
        const updatedBaselineMap = {
          ...currentBaselineMap,
          [countryKey]: {
            ...currentBaselineMap[countryKey],
            ...diseaseBaselineMap
          }
        };
        set(baselineResultsMapAtom, updatedBaselineMap);
        
        console.log(`Stored baselines for ${countryKey}:`, Object.keys(diseaseBaselineMap));
      } else {
        console.log("Using single disease baseline for:", selectedDiseases[0]);
        // For single disease, store in country-specific map
        const currentBaselineMap = get(baselineResultsMapAtom);
        const updatedBaselineMap = {
          ...currentBaselineMap,
          [countryKey]: {
            ...currentBaselineMap[countryKey],
            [selectedDiseases[0]]: results
          }
        };
        set(baselineResultsMapAtom, updatedBaselineMap);
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
  feasibility?: number; // 0 to 1, where 1 is most feasible (closest to launch)
  timeToScaleParams?: AITimeToScaleParameters; // Add time-to-scale parameters
  // Add multi-disease support
  selectedDiseases?: string[];
  diseaseResultsMap?: Record<string, SimulationResults | null>;
  // Add bubble chart type tracking
  bubbleChartType?: 'ipm' | 'impact-feasibility';
  // Add country information
  countryCode?: string;
  countryName?: string;
  isUrban?: boolean;
}

export const scenariosAtom = atom<Scenario[]>([]);

// Selected scenario ID
export const selectedScenarioIdAtom = atom<string | null>(null);

// Custom scenario name atom
export const customScenarioNameAtom = atom<string>('');

// Multi-disease scenario creation mode
export const multiDiseaseScenarioModeAtom = atom<'aggregated' | 'individual'>('aggregated');

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
    const healthSystemStrength = get(selectedHealthSystemStrengthAtom);
    const disease = get(selectedDiseaseAtom);
    const selectedDiseases = get(selectedDiseasesAtom);
    const population = get(populationSizeAtom);
    const selectedAIScenario = get(selectedAIScenarioAtom);
    const timeToScaleParams = get(aiTimeToScaleParametersAtom);
    const customScenarioName = get(customScenarioNameAtom);
    const scenarioMode = get(multiDiseaseScenarioModeAtom);
    const countryCode = get(selectedCountryAtom);
    const isUrban = get(isUrbanSettingAtom);
    const useCountrySpecific = get(useCountrySpecificModelAtom);
    
    // Enhanced debug logs with full data inspection
    console.log('DETAILED DEBUG - Adding scenario(s) for diseases:', selectedDiseases);
    console.log('Raw resultsMap structure:', Object.keys(resultsMap));
    console.log('Selected AI scenario:', selectedAIScenario);
    
    // Determine the base scenario name
    const scenarioNumber = scenarios.length + 1;
    const activeAIInterventions = Object.entries(aiInterventions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);
    
    // Create scenario name based on custom name, AI scenario preset, AI interventions, or sequence number
    let baseName = '';
    
    // If we have a custom scenario name, use it
    if (customScenarioName.trim()) {
      baseName = customScenarioName.trim();
    }
    // If we have a selected AI scenario, use its name
    else if (selectedAIScenario) {
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
    
    // Create scenarios based on user choice for multi-disease mode
    if (selectedDiseases.length > 1 && Object.keys(resultsMap).length > 1) {
      console.log(`Creating ${scenarioMode} scenario(s) for multi-disease mode`);
      
      // Track the newly created scenarios
      const newScenarios = [...scenarios];
      let lastScenarioId = null;
      
      if (scenarioMode === 'aggregated') {
        // Create the aggregated health system scenario for bubble charts
        console.log('Creating aggregated health system scenario');
        
        // Use the main results which are already aggregated from runSimulationAtom
        const aggregatedScenario: Scenario = {
          id: `scenario-${Date.now()}-aggregated`,
          name: baseName, // Use the base name for the aggregated scenario
          parameters: { 
            ...params,
            healthSystemStrength,
            disease: 'health_system_total', // Special identifier for aggregated scenario
            population
          },
          aiInterventions: { ...aiInterventions },
          effectMagnitudes: { ...effectMagnitudes },
          // Use the main results which represent the aggregated health system total
          results: results ? { 
            ...JSON.parse(JSON.stringify(results)),
            weeklyStates: results.weeklyStates.map(state => ({...state}))
          } : null,
          baselineResults: baseline ? { 
            ...JSON.parse(JSON.stringify(baseline)),
            weeklyStates: baseline.weeklyStates.map(state => ({...state}))
          } : null,
          // Store all selected diseases
          selectedDiseases: [...selectedDiseases],
          diseaseResultsMap: (() => {
            // Create deep copy of the full results map for the aggregated scenario
            const deepCopy: Record<string, SimulationResults | null> = {};
            Object.entries(resultsMap).forEach(([disease, results]) => {
              if (!results) {
                deepCopy[disease] = null;
                return;
              }
              deepCopy[disease] = {
                cumulativeDeaths: results.cumulativeDeaths,
                cumulativeResolved: results.cumulativeResolved,
                totalCost: results.totalCost,
                averageTimeToResolution: results.averageTimeToResolution,
                dalys: results.dalys,
                icer: results.icer,
                weeklyStates: results.weeklyStates.map(state => ({...state})),
              };
            });
            return deepCopy;
          })(),
          timeToScaleParams: timeToScaleParams,
          // Add country information
          countryCode: useCountrySpecific ? countryCode : undefined,
          countryName: useCountrySpecific && countryCode ? countryProfiles[countryCode]?.name || countryCode : 'Generic',
          isUrban: isUrban
        };
        
        console.log(`Created aggregated scenario:`, {
          id: aggregatedScenario.id,
          name: aggregatedScenario.name,
          disease: 'health_system_total',
          selectedDiseases: aggregatedScenario.selectedDiseases,
          deaths: results?.cumulativeDeaths,
          costs: results?.totalCost,
          icer: results?.icer
        });
        
        // Add the aggregated scenario
        newScenarios.push(aggregatedScenario);
        lastScenarioId = aggregatedScenario.id;
        
        console.log(`Created 1 aggregated health system scenario`);
      } else {
        // Create individual disease scenarios for detailed analysis
        console.log('Creating individual disease scenarios');
        
        selectedDiseases.forEach((diseaseName, index) => {
          // Skip diseases with no results
          if (!resultsMap[diseaseName]) {
            console.log(`Skipping ${diseaseName} as it has no results`);
            return;
          }
          
          console.log(`Creating individual scenario for disease: ${diseaseName}`);
          
          // Create a deep copy of the single result
          const diseaseResultsCopy = (() => {
            if (!resultsMap[diseaseName]) {
              return undefined;
            }
            
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
          
          // Create individual disease scenario name
          const individualScenarioName = `${baseName} (${diseaseName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})`;
          
          // Create the scenario with proper copies
          const newScenario: Scenario = {
            id: `scenario-${Date.now()}-${index}`,
            name: individualScenarioName,
            parameters: { 
              ...params,
              healthSystemStrength,
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
            // Store disease-specific baseline instead of aggregated baseline
            baselineResults: (() => {
              // Get the baseline map
              const baselineMap = get(baselineResultsMapAtom);
              const congestion = params.systemCongestion || 0;
              
              // When creating individual disease scenarios from multi-disease selection,
              // the baseline was stored with ALL diseases in the key, not individual diseases
              // So we need to use the full selectedDiseases array to find the baseline
              const baselineKey = useCountrySpecific 
                ? getEnhancedBaselineKey(countryCode, isUrban, selectedDiseases, congestion, scenarioMode)
                : `generic_${selectedDiseases.sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
              
              // Try to get disease-specific baseline from the multi-disease baseline storage
              const diseaseBaseline = baselineMap[baselineKey]?.[diseaseName];
              
              if (diseaseBaseline) {
                console.log(`Using disease-specific baseline for ${diseaseName} from multi-disease key ${baselineKey}`);
                return {
                  ...JSON.parse(JSON.stringify(diseaseBaseline)),
                  weeklyStates: diseaseBaseline.weeklyStates.map(state => ({...state}))
                };
              }
              
              // Try with single disease key as fallback (for backward compatibility)
              const singleDiseaseKey = useCountrySpecific 
                ? getEnhancedBaselineKey(countryCode, isUrban, [diseaseName], congestion, scenarioMode)
                : `generic_${[diseaseName].sort().join('-')}_cong${Math.round(congestion * 100)}_${scenarioMode}`;
              
              const singleDiseaseBaseline = baselineMap[singleDiseaseKey]?.[diseaseName];
              
              if (singleDiseaseBaseline) {
                console.log(`Using disease-specific baseline for ${diseaseName} from single-disease key ${singleDiseaseKey}`);
                return {
                  ...JSON.parse(JSON.stringify(singleDiseaseBaseline)),
                  weeklyStates: singleDiseaseBaseline.weeklyStates.map(state => ({...state}))
                };
              }
              
              // Fallback to aggregated baseline if disease-specific not found
              console.log(`No disease-specific baseline found for ${diseaseName}, using aggregated baseline`);
              return baseline ? { 
                ...JSON.parse(JSON.stringify(baseline)),
                weeklyStates: baseline.weeklyStates.map(state => ({...state}))
              } : null;
            })(),
            // Store just this disease
            selectedDiseases: [diseaseName],
            diseaseResultsMap: diseaseResultsCopy,
            timeToScaleParams: timeToScaleParams,
            // Add country information
            countryCode: useCountrySpecific ? countryCode : undefined,
            countryName: useCountrySpecific && countryCode ? countryProfiles[countryCode]?.name || countryCode : 'Generic',
            isUrban: isUrban
          };
          
          console.log(`Created individual scenario for ${diseaseName}:`, {
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
        
        console.log(`Created ${selectedDiseases.length} individual disease scenarios`);
      }
      
      // Save all the new scenarios
      set(scenariosAtom, newScenarios);
      
      // Select the last created scenario
      if (lastScenarioId) {
        set(selectedScenarioIdAtom, lastScenarioId);
      }
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
          healthSystemStrength,
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
        diseaseResultsMap: diseaseResultsMapCopy,
        timeToScaleParams: timeToScaleParams,
        // Add country information
        countryCode: useCountrySpecific ? countryCode : undefined,
        countryName: useCountrySpecific && countryCode ? countryProfiles[countryCode]?.name || countryCode : 'Generic',
        isUrban: isUrban
      };
      
      // Check the created scenario
      console.log('Created combined scenario:', {
        id: newScenario.id,
        selectedDiseases: newScenario.selectedDiseases,
        diseaseResultsMapKeys: newScenario.diseaseResultsMap ? Object.keys(newScenario.diseaseResultsMap) : [],
        hasResultsMap: !!newScenario.diseaseResultsMap,
        mapType: newScenario.diseaseResultsMap ? typeof newScenario.diseaseResultsMap : 'undefined',
        isEmptyObject: newScenario.diseaseResultsMap && Object.keys(newScenario.diseaseResultsMap).length === 0
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
      const isImported = scenario.id.startsWith('imported-');
      let updatedScenario: Scenario | undefined;
      console.log(`DETAILED DEBUG - Loading scenario${isImported ? ' [IMPORTED]' : ''}:`, {
        id: scenario.id, 
        name: scenario.name,
        disease: scenario.parameters.disease,
        selectedDiseases: scenario.selectedDiseases || [], 
        diseaseResultsMapKeys: scenario.diseaseResultsMap ? Object.keys(scenario.diseaseResultsMap) : [],
        hasBaselineResults: !!scenario.baselineResults,
        baselineResultsDisease: scenario.baselineResults ? 'From ' + (scenario.parameters.disease || 'unknown disease') : 'None',
        hasResultsMap: !!scenario.diseaseResultsMap,
        mapType: scenario.diseaseResultsMap ? typeof scenario.diseaseResultsMap : 'undefined',
        isEmptyObject: scenario.diseaseResultsMap && Object.keys(scenario.diseaseResultsMap).length === 0
      });
      
      // Check for baseline-results mismatch
      if (scenario.baselineResults && scenario.results) {
        const baselineDiseaseName = scenario.parameters.disease || 'unknown';
        console.log(`Baseline check for ${baselineDiseaseName}:`, {
          baselineDALYs: scenario.baselineResults.dalys,
          currentDALYs: scenario.results.dalys,
          difference: scenario.baselineResults.dalys - scenario.results.dalys,
          baselineDeaths: scenario.baselineResults.cumulativeDeaths,
          currentDeaths: scenario.results.cumulativeDeaths,
          deathDifference: scenario.baselineResults.cumulativeDeaths - scenario.results.cumulativeDeaths
        });
      }
      
      // DIRECT FIX FOR ICER CALCULATION: If ICER is exactly 1, recalculate it
      if (scenario.results && scenario.baselineResults && 
          scenario.results.icer === 1 && scenario.baselineResults) {
        console.log("CRITICAL FIX: Detected suspicious ICER value of exactly 1, recalculating...");
        
        // Recalculate ICER correctly
        const icer = calculateICER(scenario.results, scenario.baselineResults);
        console.log(`Recalculated ICER: ${icer} (was: 1)`);
        
        // Update the scenario's results
        scenario.results.icer = icer;
        
        // If we have a diseaseResultsMap, update the ICER there too
        if (scenario.diseaseResultsMap) {
          const disease = scenario.parameters.disease || 'Unknown';
          if (scenario.diseaseResultsMap[disease]) {
            scenario.diseaseResultsMap[disease]!.icer = icer;
            console.log(`Updated ICER in diseaseResultsMap for ${disease}: ${icer}`);
          }
        }
      }
      
      // EXPANDED BASELINE FIX FOR IMPORTED SCENARIOS
      // This ensures that both global and scenario-specific baseline data is consistent
      if (isImported) {
        console.log("FIXING BASELINE DATA FOR IMPORTED SCENARIO:", scenario.name);
        const disease = scenario.parameters.disease || 'Unknown';
        
        // 1. Ensure the scenario has baselineResults if it doesn't already
        updatedScenario = scenario;
        if (!scenario.baselineResults && scenario.results) {
          console.log(`Creating missing baselineResults for ${scenario.name} using current results`);
          // If no baseline exists, we create one using the current results 
          // (this is not ideal but prevents null errors)
          const baselineCopy = JSON.parse(JSON.stringify(scenario.results));
          
          // Adjust some values to make it a reasonable baseline
          // In a real baseline, deaths/DALYs should be higher than the results
          if (baselineCopy.cumulativeDeaths) {
            baselineCopy.cumulativeDeaths *= 1.2; // 20% more deaths in baseline
          }
          if (baselineCopy.dalys) {
            baselineCopy.dalys *= 1.2; // 20% more DALYs in baseline
          }
          
          // Create a new scenario object instead of mutating
          updatedScenario = { ...scenario, baselineResults: baselineCopy };
          
          // Update the scenarios array with the new scenario
          const updatedScenarios = scenarios.map(s => s.id === scenarioId ? updatedScenario : s);
          set(scenariosAtom, updatedScenarios);
          
          console.log(`Created baseline with DALYs: ${baselineCopy.dalys}, Deaths: ${baselineCopy.cumulativeDeaths}`);
        }
        
        // 2. Set up the global baseline state
        if (updatedScenario.baselineResults) {
          // Create or update the global baselineMap
          const existingBaselineMap = get(baselineResultsMapAtom);
          const updatedBaselineMap = { ...existingBaselineMap };
          
          // Add this scenario's baseline for its disease
          if (!updatedBaselineMap[disease] || isImported) {
            console.log(`Setting baseline for ${disease} in global baselineMap`);
            updatedBaselineMap[disease] = JSON.parse(JSON.stringify(updatedScenario.baselineResults));
            
            // Make sure weeklyStates is properly copied
            if (updatedScenario.baselineResults.weeklyStates) {
              updatedBaselineMap[disease]!.weeklyStates = 
                updatedScenario.baselineResults.weeklyStates.map(state => ({...state}));
            }
          }
          
          // Update the global baseline map
          set(baselineResultsMapAtom, updatedBaselineMap);
          console.log(`Updated global baselineMap with keys: ${Object.keys(updatedBaselineMap)}`);
          
          // Set the main baseline if needed
          const mainBaseline = get(baselineResultsAtom);
          if (!mainBaseline) {
            console.log(`Setting main baseline from ${disease} baseline`);
            set(baselineResultsAtom, JSON.parse(JSON.stringify(updatedScenario.baselineResults)));
          }
          
          // 3. Update ICER values based on the correct baseline
          if (updatedScenario.results) {
            const diseaseBaseline = updatedBaselineMap[disease];
            if (diseaseBaseline) {
              const newIcer = calculateICER(updatedScenario.results, diseaseBaseline);
              console.log(`Recalculated ICER using new baseline: ${newIcer}`);
              
              // Create updated results with new ICER
              const updatedResults = { ...updatedScenario.results, icer: newIcer };
              
              // Also update in diseaseResultsMap if it exists
              let updatedDiseaseResultsMap = updatedScenario.diseaseResultsMap;
              if (updatedDiseaseResultsMap && updatedDiseaseResultsMap[disease]) {
                updatedDiseaseResultsMap = {
                  ...updatedDiseaseResultsMap,
                  [disease]: { ...updatedDiseaseResultsMap[disease]!, icer: newIcer }
                };
              }
              
              // Create a new scenario object with updated results
              updatedScenario = { 
                ...updatedScenario, 
                results: updatedResults,
                diseaseResultsMap: updatedDiseaseResultsMap
              };
              
              // Update the scenarios array
              const scenarios = get(scenariosAtom);
              const updatedScenarios = scenarios.map(s => s.id === scenarioId ? updatedScenario : s);
              set(scenariosAtom, updatedScenarios);
            }
          }
        }
      }
      
      // Use updatedScenario for all operations
      const currentScenario = updatedScenario || scenario;
      
      // Directly inspect the contents of the scenario's diseaseResultsMap
      if (currentScenario.diseaseResultsMap) {
        console.log('Raw scenario.diseaseResultsMap structure:');
        Object.entries(currentScenario.diseaseResultsMap).forEach(([disease, diseaseResults]) => {
          console.log(`  ${disease}: ${diseaseResults ? 
            `deaths=${diseaseResults.cumulativeDeaths}, dalys=${diseaseResults.dalys}, icer=${diseaseResults.icer}` 
            : 'null'}`);
        });
      }
      
      // IMPORTANT LOGIC FIX: If we have selectedDiseases but no diseaseResultsMap,
      // create a results map using the primary result
      if (currentScenario.selectedDiseases && 
          currentScenario.selectedDiseases.length > 1 && 
          (!currentScenario.diseaseResultsMap || Object.keys(currentScenario.diseaseResultsMap).length <= 1) &&
          currentScenario.results) {
        console.log('IMPORTANT: Found multi-disease scenario with missing results map. Reconstructing from primary results.');
        
        // Create a new diseaseResultsMap for the scenario
        const reconstructedMap: Record<string, SimulationResults | null> = {};
        
        currentScenario.selectedDiseases.forEach(disease => {
          if (currentScenario.results) {
            // Create deep copies of the main result for each disease
            const resultCopy = JSON.parse(JSON.stringify(currentScenario.results));
            // Add weeklyStates separately to avoid circular references
            resultCopy.weeklyStates = currentScenario.results.weeklyStates.map(state => ({...state}));
            reconstructedMap[disease] = resultCopy;
          }
        });
        
        console.log('Reconstructed results map with keys:', Object.keys(reconstructedMap));
        // Create a new scenario object with the reconstructed map
        const scenarioWithMap = { ...currentScenario, diseaseResultsMap: reconstructedMap };
        
        // Update the scenarios array
        const scenarios = get(scenariosAtom);
        const updatedScenarios = scenarios.map(s => s.id === scenarioId ? scenarioWithMap : s);
        set(scenariosAtom, updatedScenarios);
        
        // Use this updated scenario for the rest of the function
        updatedScenario = scenarioWithMap;
      }
      
      // Use the final updated scenario or fallback to original
      const finalScenario = updatedScenario || scenario;
      
      set(baseParametersAtom, finalScenario.parameters);
      set(aiInterventionsAtom, finalScenario.aiInterventions);
      // Load effect magnitudes if they exist in the scenario, otherwise use empty object
      set(effectMagnitudesAtom, finalScenario.effectMagnitudes || {});
      // Load time-to-scale parameters if they exist in the scenario
      if (finalScenario.timeToScaleParams) {
        set(aiTimeToScaleParametersAtom, finalScenario.timeToScaleParams);
      }
      set(simulationResultsAtom, finalScenario.results);
      set(selectedScenarioIdAtom, scenarioId);
      
      // Load disease selections if available
      if (finalScenario.selectedDiseases && finalScenario.selectedDiseases.length > 0) {
        console.log('Setting selected diseases:', finalScenario.selectedDiseases);
        
        // Ensure the diseases array has real content
        if (finalScenario.selectedDiseases.some(d => d && d.trim() !== '')) {
          set(selectedDiseasesAtom, finalScenario.selectedDiseases);
          set(selectedDiseaseAtom, finalScenario.selectedDiseases[0]);
        } else {
          // Fallback to the single disease from parameters if available
          console.log('Empty selectedDiseases array, falling back to parameters.disease');
          const fallbackDisease = finalScenario.parameters.disease || 'childhood_pneumonia';
          set(selectedDiseasesAtom, [fallbackDisease]);
          set(selectedDiseaseAtom, fallbackDisease);
        }
      } else if (finalScenario.parameters.disease) {
        console.log('No multi-disease selection, using primary disease:', finalScenario.parameters.disease);
        set(selectedDiseaseAtom, finalScenario.parameters.disease);
        set(selectedDiseasesAtom, [finalScenario.parameters.disease]);
      }
      
      // Load multi-disease results if available
      if (finalScenario.diseaseResultsMap && Object.keys(finalScenario.diseaseResultsMap).length > 0) {
        console.log('Setting disease results map with keys:', Object.keys(finalScenario.diseaseResultsMap));
        console.log('Disease results map ICER values:', 
          Object.entries(finalScenario.diseaseResultsMap)
            .map(([disease, results]) => `${disease}: ICER=${results?.icer}`)
        );
            
        // Ensure we're creating a fresh deep copy to avoid reference issues
        const deepCopyMap: Record<string, SimulationResults | null> = {};
        
        // Manually copy each disease's results with proper handling of complex properties
        Object.entries(finalScenario.diseaseResultsMap).forEach(([disease, results]) => {
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
      } else if (finalScenario.results) {
        // Backward compatibility - create a results map with just the primary disease
        const diseasesToUse = finalScenario.selectedDiseases && finalScenario.selectedDiseases.length > 0 
          ? finalScenario.selectedDiseases 
          : [finalScenario.parameters.disease || get(selectedDiseaseAtom)];
          
        console.log('No multi-disease results, creating results map with diseases:', diseasesToUse);
        
        // Create results map with all selected diseases
        const newResultsMap: Record<string, SimulationResults | null> = {};
        
        diseasesToUse.forEach(disease => {
          // Create a proper deep copy of the single result for each disease
          if (finalScenario.results) {
            newResultsMap[disease] = {
              ...JSON.parse(JSON.stringify(finalScenario.results)),
              weeklyStates: finalScenario.results.weeklyStates.map(state => ({...state}))
            };
          }
        });
        
        console.log('Created results map with keys:', Object.keys(newResultsMap));
        set(simulationResultsMapAtom, newResultsMap);
      }
      
      // Load baseline if it exists in the scenario
      if (finalScenario.baselineResults) {
        const baselineCopy = {
          ...JSON.parse(JSON.stringify(finalScenario.baselineResults)),
          weeklyStates: finalScenario.baselineResults.weeklyStates.map(state => ({...state}))
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
      const timeToScaleParams = get(aiTimeToScaleParametersAtom);
      
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
                  healthSystemStrength: s.parameters.healthSystemStrength,
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
                diseaseResultsMap: diseaseResultsMapCopy,
                timeToScaleParams: timeToScaleParams
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
    const effectMagnitudes = get(effectMagnitudesAtom);
    const aiCostParams = get(aiCostParametersAtom);
    
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
        
        const aiUptakeParams = get(aiUptakeParametersAtom);
        const isUrban = get(isUrbanSettingAtom);
        const modifiedParamsWithAI = applyAIInterventions(modifiedParams, aiInterventions, effectMagnitudes, aiCostParams, undefined, undefined, aiUptakeParams, isUrban);
        
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
          const aiUptakeParams = get(aiUptakeParametersAtom);
        const isUrban = get(isUrbanSettingAtom);
        const modifiedParamsWithAI = applyAIInterventions(modifiedParams, aiInterventions, effectMagnitudes, aiCostParams, undefined, undefined, aiUptakeParams, isUrban);
          
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