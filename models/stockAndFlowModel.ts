export interface StockAndFlowState {
  U: number;      // symptomatic but not yet in any care pathway
  I: number;      // individuals self-treating or in informal care
  L0: number;     // cases managed by community health workers
  L1: number;     // cases at primary care facilities
  L2: number;     // cases in district hospitals
  L3: number;     // cases in tertiary hospitals
  R: number;      // resolved alive
  D: number;      // resolved dead
  patientDays: {  // accumulated patient days for each level
    I: number;
    L0: number;
    L1: number;
    L2: number;
    L3: number;
  };
  newCases: number;
  episodesTouched: number;
}

export interface ModelParameters {
  // Disease characteristics
  lambda: number;             // annual incidence rate per person
  disabilityWeight: number;   // for DALY calculations
  
  // Flow probabilities (weekly)
  phi0: number;               // probability of seeking formal care initially
  sigmaI: number;             // probability of transitioning from informal to formal care
  
  // Resolution and death probabilities by level (weekly)
  muI: number;                // resolution probability in informal care
  deltaI: number;             // death probability in informal care
  deltaU: number;             // death probability if untreated
  
  mu0: number;                // resolution probability at L0
  delta0: number;             // death probability at L0
  rho0: number;               // referral probability from L0 to L1
  
  mu1: number;                // resolution probability at L1
  delta1: number;             // death probability at L1
  rho1: number;               // referral probability from L1 to L2
  
  mu2: number;                // resolution probability at L2
  delta2: number;             // death probability at L2
  rho2: number;               // referral probability from L2 to L3
  
  mu3: number;                // resolution probability at L3
  delta3: number;             // death probability at L3
  
  // Economic parameters
  perDiemCosts: {
    I: number;
    L0: number;
    L1: number;
    L2: number;
    L3: number;
  };
  aiFixedCost: number;        // fixed cost of AI implementation
  aiVariableCost: number;     // variable cost per episode touched by AI
  discountRate: number;       // annual discount rate for economic calculations
  yearsOfLifeLost: number;    // average years of life lost per death
}

export interface SimulationConfig {
  numWeeks: number;           // number of weeks to simulate
  population: number;         // population size
  initialState?: Partial<StockAndFlowState>;  // optional initial state
}

export interface SimulationResults {
  weeklyStates: StockAndFlowState[];
  cumulativeDeaths: number;
  cumulativeResolved: number;
  averageTimeToResolution: number;
  totalCost: number;
  dalys: number;
  icer?: number;              // only populated when comparing to baseline
}

// Initialize model with default state
const initializeState = (
  population: number,
  lambda: number,
  initialState?: Partial<StockAndFlowState>
): StockAndFlowState => {
  // Calculate initial weekly incidence
  const weeklyIncidence = (lambda * population) / 52;
  
  const defaultState: StockAndFlowState = {
    U: weeklyIncidence,
    I: 0,
    L0: 0,
    L1: 0,
    L2: 0,
    L3: 0,
    R: 0,
    D: 0,
    patientDays: {
      I: 0,
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
    },
    newCases: weeklyIncidence,
    episodesTouched: 0,
  };
  
  return { ...defaultState, ...initialState };
};

// Run a single week of the simulation
const runWeek = (
  state: StockAndFlowState,
  params: ModelParameters,
  population: number
): StockAndFlowState => {
  // Calculate weekly incidence
  const weeklyIncidence = (params.lambda * population) / 52;
  
  // Calculate transitions from U (untreated)
  const seekFormal = params.phi0 * state.U;
  const stayUntreated = state.U - seekFormal;
  const untreatedDeaths = params.deltaU * stayUntreated;
  const remainingUntreated = stayUntreated - untreatedDeaths;
  
  // Calculate transitions from I (informal care)
  const informalToFormal = params.sigmaI * state.I;
  const informalResolved = params.muI * state.I;
  const informalDeaths = params.deltaI * state.I;
  const remainingInformal = state.I - informalToFormal - informalResolved - informalDeaths;
  
  // Calculate transitions from L0 (community health workers)
  const l0Referral = params.rho0 * state.L0;
  const l0Resolved = params.mu0 * state.L0;
  const l0Deaths = params.delta0 * state.L0;
  const remainingL0 = state.L0 - l0Referral - l0Resolved - l0Deaths;
  
  // Calculate transitions from L1 (primary care)
  const l1Referral = params.rho1 * state.L1;
  const l1Resolved = params.mu1 * state.L1;
  const l1Deaths = params.delta1 * state.L1;
  const remainingL1 = state.L1 - l1Referral - l1Resolved - l1Deaths;
  
  // Calculate transitions from L2 (district hospital)
  const l2Referral = params.rho2 * state.L2;
  const l2Resolved = params.mu2 * state.L2;
  const l2Deaths = params.delta2 * state.L2;
  const remainingL2 = state.L2 - l2Referral - l2Resolved - l2Deaths;
  
  // Calculate transitions from L3 (tertiary hospital)
  const l3Resolved = params.mu3 * state.L3;
  const l3Deaths = params.delta3 * state.L3;
  const remainingL3 = state.L3 - l3Resolved - l3Deaths;
  
  // Calculate new patient totals for the next week
  const newU = weeklyIncidence + remainingUntreated;
  const newI = (state.U - seekFormal - remainingUntreated - untreatedDeaths) + remainingInformal;
  const newL0 = (seekFormal * 0.6) + (informalToFormal * 0.4) + remainingL0; // Distribute seekers
  const newL1 = (seekFormal * 0.3) + (informalToFormal * 0.4) + l0Referral + remainingL1;
  const newL2 = (seekFormal * 0.1) + (informalToFormal * 0.2) + l1Referral + remainingL2;
  const newL3 = l2Referral + remainingL3;
  const newR = state.R + informalResolved + l0Resolved + l1Resolved + l2Resolved + l3Resolved;
  const newD = state.D + untreatedDeaths + informalDeaths + l0Deaths + l1Deaths + l2Deaths + l3Deaths;
  
  // Calculate new patient days
  const newPatientDays = {
    I: state.patientDays.I + state.I,
    L0: state.patientDays.L0 + state.L0,
    L1: state.patientDays.L1 + state.L1,
    L2: state.patientDays.L2 + state.L2,
    L3: state.patientDays.L3 + state.L3,
  };
  
  // Calculate episodes touched by AI (simplified - adjust based on which AI interventions are active)
  const episodesTouched = state.episodesTouched + seekFormal + informalToFormal;
  
  return {
    U: newU,
    I: newI,
    L0: newL0,
    L1: newL1,
    L2: newL2,
    L3: newL3,
    R: newR,
    D: newD,
    patientDays: newPatientDays,
    newCases: weeklyIncidence,
    episodesTouched,
  };
};

// Calculate economic outcomes
const calculateEconomics = (
  state: StockAndFlowState,
  params: ModelParameters
): { totalCost: number; dalys: number } => {
  // Calculate total cost
  const patientDaysCost = 
    state.patientDays.I * params.perDiemCosts.I +
    state.patientDays.L0 * params.perDiemCosts.L0 +
    state.patientDays.L1 * params.perDiemCosts.L1 +
    state.patientDays.L2 * params.perDiemCosts.L2 +
    state.patientDays.L3 * params.perDiemCosts.L3;
  
  const aiCost = params.aiFixedCost + (params.aiVariableCost * state.episodesTouched);
  const totalCost = patientDaysCost + aiCost;
  
  // Calculate DALYs
  const deathDalys = state.D * params.yearsOfLifeLost;
  const disabilityDalys = 
    (state.patientDays.I + state.patientDays.L0 + state.patientDays.L1 + 
     state.patientDays.L2 + state.patientDays.L3) * (params.disabilityWeight / 365.25);
  
  const dalys = deathDalys + disabilityDalys;
  
  return { totalCost, dalys };
};

// Calculate average time to resolution
const calculateTimeToResolution = (weeklyStates: StockAndFlowState[]): number => {
  let totalWeeksInSystem = 0;
  let totalResolved = weeklyStates[weeklyStates.length - 1].R;
  
  for (let i = 0; i < weeklyStates.length; i++) {
    const state = weeklyStates[i];
    // Count each patient in each level weighted by week
    totalWeeksInSystem += (state.U + state.I + state.L0 + state.L1 + state.L2 + state.L3) * i;
  }
  
  return totalResolved > 0 ? totalWeeksInSystem / totalResolved : 0;
};

// Main simulation function
export const runSimulation = (
  params: ModelParameters,
  config: SimulationConfig
): SimulationResults => {
  const weeklyStates: StockAndFlowState[] = [];
  let currentState = initializeState(config.population, params.lambda, config.initialState);
  
  // Run simulation for specified number of weeks
  for (let week = 0; week < config.numWeeks; week++) {
    weeklyStates.push(currentState);
    currentState = runWeek(currentState, params, config.population);
  }
  
  const finalState = weeklyStates[weeklyStates.length - 1];
  const { totalCost, dalys } = calculateEconomics(finalState, params);
  
  return {
    weeklyStates,
    cumulativeDeaths: finalState.D,
    cumulativeResolved: finalState.R,
    averageTimeToResolution: calculateTimeToResolution(weeklyStates),
    totalCost,
    dalys,
  };
};

// Calculate ICER between intervention and baseline
export const calculateICER = (
  intervention: SimulationResults,
  baseline: SimulationResults
): number => {
  const costDiff = intervention.totalCost - baseline.totalCost;
  const dalyDiff = baseline.dalys - intervention.dalys; // Negative DALYs = health improvement
  
  return dalyDiff !== 0 ? costDiff / dalyDiff : Infinity;
};

// Predefined geography defaults
export const geographyDefaults = {
  ethiopia: {
    phi0: 0.45,  // formal care entry probability
    rho1: 0.75,  // facility referral rate
    mu0: 0.50,   // CHW resolution probability
    // Other parameters would be set to baseline values
  },
  mozambique: {
    phi0: 0.35,  // lower formal care entry due to travel times
    rho2: 0.60,  // higher referral rates
    mu1: 0.45,   // lower primary care resolution (baseline might be 0.60)
    // Other parameters would be set to baseline values
  },
  bihar: {
    phi0: 0.50,  // strong ASHA influence
    rho1: 0.80,  // high referral from community to primary
    mu0: 0.55,   // slightly higher community worker effectiveness
    // Other parameters would be set to baseline values
  },
};

// Predefined disease profiles
export const diseaseProfiles = {
  tuberculosis: {
    lambda: 0.03,             // low incidence rate
    disabilityWeight: 0.333,  // moderate disability weight
    // Lower mu values unless correct treatment
    // Other parameters would be set appropriately for TB
  },
  pneumonia: {
    lambda: 0.90,             // very high incidence in under-fives
    disabilityWeight: 0.28,   // moderate disability
    // Other parameters would be set appropriately for pneumonia
  },
  malaria: {
    lambda: 0.40,             // moderate-high incidence
    disabilityWeight: 0.192,  // moderate disability
    // Other parameters would be set appropriately for malaria
  },
  fever: {
    lambda: 0.60,             // moderate-high incidence
    disabilityWeight: 0.10,   // lower disability weight
    // Other parameters would be set appropriately for fever
  },
};

// AI intervention modifiers
export interface AIInterventions {
  triageAI: boolean;          // Direct-to-consumer AI triage
  chwAI: boolean;             // CHW decision support
  diagnosticAI: boolean;      // Point-of-care diagnostic AI
  bedManagementAI: boolean;   // Hospital bed management
  hospitalDecisionAI: boolean; // Hospital decision support
  selfCareAI: boolean;        // Enhanced self-care apps
}

// Apply AI intervention effects to parameters
export const applyAIInterventions = (
  baseParams: ModelParameters,
  interventions: AIInterventions
): ModelParameters => {
  const modifiedParams = { ...baseParams };
  
  if (interventions.triageAI) {
    modifiedParams.phi0 += 0.15;      // Increase formal care seeking
    modifiedParams.sigmaI *= 1.25;    // Faster transition from informal to formal
  }
  
  if (interventions.chwAI) {
    modifiedParams.mu0 += 0.10;       // Better resolution at community level
    modifiedParams.delta0 *= 0.85;    // Lower death rate at community level
    modifiedParams.rho0 *= 0.85;      // Fewer unnecessary referrals
  }
  
  if (interventions.diagnosticAI) {
    modifiedParams.mu1 += 0.10;       // Better resolution at primary care
    modifiedParams.delta1 *= 0.85;    // Lower death rate at primary care
    modifiedParams.rho1 *= 0.85;      // Fewer unnecessary referrals
  }
  
  if (interventions.bedManagementAI) {
    modifiedParams.mu2 += 0.05;       // Faster discharge from district hospital
    modifiedParams.mu3 += 0.05;       // Faster discharge from tertiary hospital
  }
  
  if (interventions.hospitalDecisionAI) {
    modifiedParams.delta2 *= 0.80;    // Lower death rate at district hospital
    modifiedParams.delta3 *= 0.80;    // Lower death rate at tertiary hospital
  }
  
  if (interventions.selfCareAI) {
    modifiedParams.muI += 0.15;       // Better informal care resolution
    modifiedParams.deltaI *= 0.90;    // Lower death rate in informal care
  }
  
  return modifiedParams;
};

// Default baseline parameters
export const getDefaultParameters = (): ModelParameters => ({
  // Disease characteristics
  lambda: 0.20,
  disabilityWeight: 0.20,
  
  // Flow probabilities
  phi0: 0.45,
  sigmaI: 0.20,
  
  // Resolution and death probabilities
  muI: 0.30,
  deltaI: 0.02,
  deltaU: 0.01,
  
  mu0: 0.50,
  delta0: 0.03,
  rho0: 0.75,
  
  mu1: 0.60,
  delta1: 0.02,
  rho1: 0.25,
  
  mu2: 0.70,
  delta2: 0.05,
  rho2: 0.15,
  
  mu3: 0.80,
  delta3: 0.08,
  
  // Economic parameters
  perDiemCosts: {
    I: 5,
    L0: 12,
    L1: 25,
    L2: 70,
    L3: 110,
  },
  aiFixedCost: 0,
  aiVariableCost: 0,
  discountRate: 0.03,
  yearsOfLifeLost: 30,
}); 