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
  meanAgeOfInfection: number; // mean age at which infection/condition occurs
  
  // Flow probabilities (weekly)
  phi0: number;               // probability of seeking formal care initially
  sigmaI: number;             // probability of transitioning from informal to formal care
  informalCareRatio: number;  // proportion of untreated patients who move to informal care
  
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
  
  // AI effectiveness parameters
  selfCareAIEffectMuI: number;   // improvement in resolution from self-care AI  
  selfCareAIEffectDeltaI: number; // multiplier for death rate reduction from self-care AI
  
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
  yearsOfLifeLost: number;    // base YLL parameter (will be adjusted by meanAgeOfInfection)
  regionalLifeExpectancy: number; // region-specific life expectancy
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
  rawIcerValue?: number;      // raw calculated ICER value before any adjustments
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
  
  // Use the configurable parameter to determine how many untreated patients move to informal care
  const toInformalCare = (1 - params.informalCareRatio) * stayUntreated;
  const trulyUntreated = params.informalCareRatio * stayUntreated;
  
  const untreatedDeaths = params.deltaU * trulyUntreated;
  const remainingUntreated = trulyUntreated - untreatedDeaths;
  
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
  
  // Include patients who move to informal care
  const newI = toInformalCare + remainingInformal;
  
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
  
  // Calculate episodes touched by AI
  const selfCareActive = params.muI > getDefaultParameters().muI;
  const episodesTouched = state.episodesTouched + 
                          seekFormal + 
                          informalToFormal + 
                          (selfCareActive ? state.I : 0);  // Count all informal care patients if selfCareAI is active
  
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
  
  // Calculate DALYs with age-adjusted YLL and apply discounting
  // Adjust YLL based on mean age of infection and regional life expectancy
  const adjustedYLL = Math.max(0, params.regionalLifeExpectancy - params.meanAgeOfInfection);
  
  // Apply discounting factor (1 = no discount, 0.97 = 3% annual discount)
  const discountFactor = params.discountRate > 0 ? 
    (1 - params.discountRate) : 1;
  
  const deathDalys = state.D * adjustedYLL * discountFactor;
  const disabilityDalys = 
    (state.patientDays.I + state.patientDays.L0 + state.patientDays.L1 + 
     state.patientDays.L2 + state.patientDays.L3) * (params.disabilityWeight / 365.25) * discountFactor;
  
  const dalys = deathDalys + disabilityDalys;
  
  return { totalCost, dalys };
};

// Calculate average time to resolution
const calculateTimeToResolution = (weeklyStates: StockAndFlowState[]): number => {
  let totalWeeksInSystem = 0;
  let totalResolved = weeklyStates[weeklyStates.length - 1].R;
  let cumulativeNewCases = 0;
  let resolvedPatients = 0;
  
  // First, count total patients that entered the system during the simulation
  for (let i = 0; i < weeklyStates.length; i++) {
    cumulativeNewCases += weeklyStates[i].newCases;
  }
  
  // Calculate how many patients were actually processed to resolution
  resolvedPatients = Math.min(totalResolved, cumulativeNewCases);
  
  if (resolvedPatients === 0) return 0;
  
  // Track active cohorts and their resolution
  let activeCases = 0;
  let avgWeeks = 0;
  let casesWithResolutionTracked = 0;
  
  for (let i = 0; i < weeklyStates.length; i++) {
    const state = weeklyStates[i];
    // Add new cases each week
    activeCases += state.newCases;
    
    // Estimate the number of resolved cases this week
    const resolvedThisWeek = i > 0 ? 
      state.R - weeklyStates[i-1].R : 0;
    
    // Add their resolution time to the average
    if (resolvedThisWeek > 0) {
      // These patients resolved after i weeks in the system
      // Assume average resolution time of half the current week
      // plus the weeks they've been in the system
      avgWeeks += resolvedThisWeek * (i/2);
      casesWithResolutionTracked += resolvedThisWeek;
    }
  }
  
  // If we have tracked resolutions, use that for more accurate measure
  if (casesWithResolutionTracked > 0) {
    return avgWeeks / casesWithResolutionTracked;
  }
  
  // Fallback: estimate based on resolution rates from params
  // Get average weekly resolution rate across all care levels
  const getDefaultParams = getDefaultParameters();
  const avgResolutionRate = (
    getDefaultParams.muI + getDefaultParams.mu0 + 
    getDefaultParams.mu1 + getDefaultParams.mu2 + getDefaultParams.mu3
  ) / 5;
  
  // Average time to resolution is roughly 1 / resolution rate
  return Math.min(1 / avgResolutionRate, 26); // Cap at 26 weeks (6 months) to avoid unrealistic values
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
  
  // Add debugging for DALY values
  console.log(`ICER calculation: Cost diff: ${costDiff}, DALY diff: ${dalyDiff}`);
  console.log(`Baseline DALYs: ${baseline.dalys}, Intervention DALYs: ${intervention.dalys}`);
  console.log(`Raw ICER value: ${costDiff / dalyDiff}`);
  
  // Store raw calculated value on the intervention results
  intervention.rawIcerValue = dalyDiff !== 0 ? costDiff / dalyDiff : Infinity;
  
  // If both costs are reduced and DALYs are reduced, this is a dominant intervention
  // Return a small positive value rather than a negative value
  if (costDiff < 0 && dalyDiff > 0) {
    return 1; // Dominant (both better and cheaper) - return symbolic value
  }
  
  return dalyDiff !== 0 ? costDiff / dalyDiff : Infinity;
};

// Predefined geography defaults
export const geographyDefaults = {
  ethiopia: {
    phi0: 0.45,  // formal care entry probability
    rho1: 0.75,  // facility referral rate
    mu0: 0.50,   // CHW resolution probability
    regionalLifeExpectancy: 67.5, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.2,           // 20% higher than baseline
      tuberculosis: 1.3,        // 30% higher than baseline
      malaria: 1.1,             // 10% higher than baseline
      diarrhea: 1.3,            // 30% higher than baseline
      maternal_hemorrhage: 1.4, // 40% higher than baseline
      neonatal_sepsis: 1.2,     // 20% higher than baseline
      preterm_birth: 1.3,       // 30% higher than baseline
      hiv_opportunistic: 1.5,   // 50% higher than baseline
      infant_pneumonia: 1.4,    // 40% higher than baseline
      maternal_hypertension: 1.3 // 30% higher than baseline
    }
  },
  malawi: {
    phi0: 0.37,  // lower formal care entry due to travel times
    rho2: 0.65,  // higher referral rates in some areas
    mu1: 0.45,   // lower primary care resolution
    informalCareRatio: 0.25, // higher untreated ratio due to access barriers
    regionalLifeExpectancy: 65.1, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.4,           // 40% higher than baseline
      tuberculosis: 1.2,        // 20% higher than baseline
      malaria: 1.5,             // 50% higher than baseline
      diarrhea: 1.2,            // 20% higher than baseline
      maternal_hemorrhage: 1.3, // 30% higher than baseline
      neonatal_sepsis: 1.35,    // 35% higher than baseline
      preterm_birth: 1.25,      // 25% higher than baseline
      hiv_opportunistic: 1.6,   // 60% higher than baseline
      infant_pneumonia: 1.5,    // 50% higher than baseline
      maternal_hypertension: 1.25 // 25% higher than baseline
    }
  },
  bihar: {
    phi0: 0.50,  // strong ASHA influence
    rho1: 0.80,  // high referral from community to primary
    mu0: 0.55,   // slightly higher community worker effectiveness
    regionalLifeExpectancy: 69.2, // 2023 estimate for Bihar
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.1,           // 10% higher than baseline
      tuberculosis: 1.4,        // 40% higher than baseline
      malaria: 0.8,             // 20% lower than baseline
      diarrhea: 1.4,            // 40% higher than baseline
      maternal_hemorrhage: 1.2, // 20% higher than baseline
      neonatal_sepsis: 1.3,     // 30% higher than baseline
      preterm_birth: 1.2,       // 20% higher than baseline
      hiv_opportunistic: 0.7,   // 30% lower than baseline
      infant_pneumonia: 1.2,    // 20% higher than baseline
      maternal_hypertension: 1.1 // 10% higher than baseline
    }
  },
  tanzania: {
    phi0: 0.40,  // moderate formal care entry probability
    rho1: 0.65,  // moderate facility referral rate
    mu0: 0.45,   // moderate CHW resolution probability
    deltaI: 0.025, // slightly higher informal death rate
    regionalLifeExpectancy: 66.2, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.15,          // 15% higher than baseline
      tuberculosis: 1.2,        // 20% higher than baseline
      malaria: 1.4,             // 40% higher than baseline
      diarrhea: 1.25,           // 25% higher than baseline
      maternal_hemorrhage: 1.3, // 30% higher than baseline
      neonatal_sepsis: 1.2,     // 20% higher than baseline
      preterm_birth: 1.15,      // 15% higher than baseline
      hiv_opportunistic: 1.4,   // 40% higher than baseline
      infant_pneumonia: 1.3,    // 30% higher than baseline
      maternal_hypertension: 1.2 // 20% higher than baseline
    }
  },
  nigeria: {
    phi0: 0.38,  // moderate-low formal care entry 
    rho1: 0.70,  // good referral systems in some areas
    mu1: 0.48,   // moderate primary care resolution
    informalCareRatio: 0.30, // higher untreated ratio due to access barriers
    regionalLifeExpectancy: 55.2, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.3,           // 30% higher than baseline
      tuberculosis: 1.1,        // 10% higher than baseline
      malaria: 1.5,             // 50% higher than baseline
      diarrhea: 1.4,            // 40% higher than baseline
      maternal_hemorrhage: 1.5, // 50% higher than baseline
      neonatal_sepsis: 1.4,     // 40% higher than baseline
      preterm_birth: 1.35,      // 35% higher than baseline
      hiv_opportunistic: 1.3,   // 30% higher than baseline
      infant_pneumonia: 1.45,   // 45% higher than baseline
      maternal_hypertension: 1.4 // 40% higher than baseline
    }
  },
  uganda: {
    phi0: 0.42,  // moderate formal care entry
    mu0: 0.48,   // moderate CHW resolution
    rho0: 0.72,  // good CHW referral programs
    regionalLifeExpectancy: 64.3, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.2,           // 20% higher than baseline
      tuberculosis: 1.15,       // 15% higher than baseline
      malaria: 1.35,            // 35% higher than baseline
      diarrhea: 1.2,            // 20% higher than baseline
      maternal_hemorrhage: 1.3, // 30% higher than baseline
      neonatal_sepsis: 1.25,    // 25% higher than baseline
      preterm_birth: 1.2,       // 20% higher than baseline
      hiv_opportunistic: 1.4,   // 40% higher than baseline
      infant_pneumonia: 1.35,   // 35% higher than baseline
      maternal_hypertension: 1.25 // 25% higher than baseline
    }
  },
  kenya: {
    phi0: 0.48,  // relatively good formal care entry
    mu1: 0.58,   // relatively good primary care resolution
    rho1: 0.68,  // moderate referral rate
    regionalLifeExpectancy: 67.5, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.1,           // 10% higher than baseline
      tuberculosis: 1.2,        // 20% higher than baseline
      malaria: 1.2,             // 20% higher than baseline
      diarrhea: 1.15,           // 15% higher than baseline
      maternal_hemorrhage: 1.2, // 20% higher than baseline
      neonatal_sepsis: 1.15,    // 15% higher than baseline
      preterm_birth: 1.1,       // 10% higher than baseline
      hiv_opportunistic: 1.4,   // 40% higher than baseline
      infant_pneumonia: 1.2,    // 20% higher than baseline
      maternal_hypertension: 1.15 // 15% higher than baseline
    }
  },
  bangladesh: {
    phi0: 0.44,  // moderate formal care entry
    mu0: 0.52,   // effective community health workers
    rho0: 0.76,  // high CHW referral rate
    regionalLifeExpectancy: 73.4, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.1,           // 10% higher than baseline
      tuberculosis: 1.2,        // 20% higher than baseline
      malaria: 0.7,             // 30% lower than baseline
      diarrhea: 1.3,            // 30% higher than baseline
      maternal_hemorrhage: 1.1, // 10% higher than baseline
      neonatal_sepsis: 1.15,    // 15% higher than baseline
      preterm_birth: 1.1,       // 10% higher than baseline
      hiv_opportunistic: 0.6,   // 40% lower than baseline
      infant_pneumonia: 1.15,   // 15% higher than baseline
      maternal_hypertension: 1.1 // 10% higher than baseline
    }
  },
  pakistan: {
    phi0: 0.35,  // lower formal care entry in many regions
    informalCareRatio: 0.28, // higher untreated ratio
    deltaI: 0.022, // slightly higher informal death rate
    mu1: 0.50,   // moderate primary care resolution
    regionalLifeExpectancy: 67.8, // 2023 estimate
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.2,           // 20% higher than baseline
      tuberculosis: 1.3,        // 30% higher than baseline
      malaria: 0.9,             // 10% lower than baseline
      diarrhea: 1.35,           // 35% higher than baseline
      maternal_hemorrhage: 1.3, // 30% higher than baseline
      neonatal_sepsis: 1.25,    // 25% higher than baseline
      preterm_birth: 1.2,       // 20% higher than baseline
      hiv_opportunistic: 0.7,   // 30% lower than baseline
      infant_pneumonia: 1.3,    // 30% higher than baseline
      maternal_hypertension: 1.25 // 25% higher than baseline
    }
  },
  uttar_pradesh: {
    phi0: 0.38,  // moderate formal care entry
    mu0: 0.45,   // moderate CHW effectiveness
    rho1: 0.70,  // moderate-high primary care referral
    informalCareRatio: 0.32, // higher untreated ratio in some areas
    regionalLifeExpectancy: 67.8, // 2023 estimate for UP
    // Region-specific disease incidence modifiers
    diseaseModifiers: {
      pneumonia: 1.25,          // 25% higher than baseline
      tuberculosis: 1.35,       // 35% higher than baseline
      malaria: 0.85,            // 15% lower than baseline
      diarrhea: 1.4,            // 40% higher than baseline
      maternal_hemorrhage: 1.35, // 35% higher than baseline
      neonatal_sepsis: 1.3,     // 30% higher than baseline
      preterm_birth: 1.25,      // 25% higher than baseline
      hiv_opportunistic: 0.75,  // 25% lower than baseline
      infant_pneumonia: 1.35,   // 35% higher than baseline
      maternal_hypertension: 1.3 // 30% higher than baseline
    }
  }
};

// Predefined disease profiles
export const diseaseProfiles = {
  tuberculosis: {
    lambda: 0.03,             // low incidence rate
    disabilityWeight: 0.333,  // moderate disability weight
    meanAgeOfInfection: 35,   // typical age of TB diagnosis
    // Lower mu values unless correct treatment
    muI: 0.15,                // low spontaneous resolution
    deltaI: 0.025,            // higher untreated death risk
  },
  pneumonia: {
    lambda: 0.90,             // very high incidence in under-fives
    disabilityWeight: 0.28,   // moderate disability
    meanAgeOfInfection: 3,    // primarily affects young children
    mu0: 0.55,                // responsive to CHW interventions
    deltaI: 0.035,            // significant risk if untreated
    muI: 0.20,                // low spontaneous resolution
  },
  malaria: {
    lambda: 0.40,             // moderate-high incidence
    disabilityWeight: 0.192,  // moderate disability
    meanAgeOfInfection: 9,    // affects children and adults, but children at higher risk
    deltaI: 0.020,            // moderate death risk
    muI: 0.25,                // some spontaneous resolution
    mu0: 0.60,                // responsive to community treatment
  },
  fever: {
    lambda: 0.60,             // moderate-high incidence
    disabilityWeight: 0.10,   // lower disability weight
    meanAgeOfInfection: 15,   // affects all ages
    muI: 0.35,                // higher spontaneous resolution
    deltaI: 0.008,            // lower death risk
  },
  diarrhea: {
    lambda: 1.50,             // very high incidence especially in children
    disabilityWeight: 0.15,   // moderate disability
    meanAgeOfInfection: 2,    // primarily affects young children
    muI: 0.40,                // relatively high spontaneous resolution
    deltaI: 0.015,            // moderate death risk if untreated
    mu0: 0.65,                // highly responsive to basic treatment
  },
  maternal_hemorrhage: {
    lambda: 0.05,             // low incidence but serious
    disabilityWeight: 0.56,   // high disability weight
    meanAgeOfInfection: 26,   // typical age of childbearing
    muI: 0.05,                // very low spontaneous resolution
    deltaI: 0.08,             // high death risk if untreated
    mu0: 0.20,                // limited effectiveness at CHW level
    mu1: 0.50,                // moderate resolution at primary care
    mu2: 0.75,                // good resolution at district hospital
    rho0: 0.90,               // high referral from CHW
    rho1: 0.70,               // high referral from primary care
  },
  neonatal_sepsis: {
    lambda: 0.025,            // relatively low incidence
    disabilityWeight: 0.60,   // high disability weight
    meanAgeOfInfection: 0.05, // newborns (expressed in years, ~2-3 weeks)
    muI: 0.05,                // very low spontaneous resolution
    deltaI: 0.10,             // very high death risk if untreated
    deltaU: 0.15,             // extremely high death risk if completely untreated
    mu0: 0.30,                // limited effectiveness at CHW level
    mu1: 0.60,                // moderate resolution at primary care
    mu2: 0.80,                // good resolution at district hospital
  },
  preterm_birth: {
    lambda: 0.10,             // moderate incidence
    disabilityWeight: 0.54,   // high disability weight
    meanAgeOfInfection: 0,    // at birth
    muI: 0.10,                // very low spontaneous healthy outcome
    deltaI: 0.15,             // very high death risk if inadequate care
    mu0: 0.15,                // very limited effectiveness at CHW level
    mu1: 0.40,                // limited effectiveness at primary care
    mu2: 0.70,                // moderate-good at district hospital
    mu3: 0.85,                // good at tertiary care
    rho0: 0.95,               // very high referral from CHW
    rho1: 0.85,               // very high referral from primary
  },
  hiv_opportunistic: {
    lambda: 0.15,             // moderate incidence in HIV+ population
    disabilityWeight: 0.40,   // moderate-high disability
    meanAgeOfInfection: 32,   // average age for opportunistic infections
    muI: 0.08,                // very low spontaneous resolution
    deltaI: 0.05,             // high death risk if untreated
    mu0: 0.25,                // limited effectiveness at CHW level
    mu1: 0.65,                // good resolution at primary with ARVs
  },
  infant_pneumonia: {
    lambda: 1.20,             // very high incidence in infants
    disabilityWeight: 0.35,   // moderate-high disability
    meanAgeOfInfection: 0.5,  // infants (6 months)
    muI: 0.15,                // low spontaneous resolution
    deltaI: 0.04,             // high death risk in infants
    deltaU: 0.06,             // very high death risk if completely untreated
    mu0: 0.50,                // moderate effectiveness at CHW level
    mu1: 0.70,                // good resolution at primary care
  },
  maternal_hypertension: {
    lambda: 0.08,             // moderate incidence
    disabilityWeight: 0.35,   // moderate disability
    meanAgeOfInfection: 27,   // typical age in pregnancy
    muI: 0.10,                // very low spontaneous resolution
    deltaI: 0.04,             // high risk if untreated
    mu0: 0.20,                // limited effectiveness at CHW level
    mu1: 0.60,                // moderate resolution at primary care
    rho0: 0.85,               // high referral from CHW
  }
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
  interventions: AIInterventions,
  effectMagnitudes: {[key: string]: number} = {}
): ModelParameters => {
  const modifiedParams = { ...baseParams };
  
  // Reset aiFixedCost and aiVariableCost to 0 before applying interventions
  modifiedParams.aiFixedCost = 0;
  modifiedParams.aiVariableCost = 0;

  // Helper function to apply magnitude to an effect
  const applyMagnitude = (key: string, baseEffect: number, isMultiplier: boolean = false): number => {
    const magnitude = effectMagnitudes[key] !== undefined ? effectMagnitudes[key] : 1;
    
    // If magnitude is 0, return a value that results in no effect
    if (magnitude === 0) {
      return isMultiplier ? 1.0 : 0.0;
    }
    
    if (isMultiplier) {
      // For multipliers (like 0.85 for reduction), we need to adjust differently
      // If magnitude is 0, effect should be 1.0 (no effect)
      // If magnitude is 1, effect should be the base effect (e.g., 0.85)
      // If magnitude is 2, effect should be even stronger (e.g., 0.70)
      if (baseEffect < 1) {
        return 1 - ((1 - baseEffect) * magnitude);
      } else {
        return 1 + ((baseEffect - 1) * magnitude);
      }
    } else {
      // For additive effects, simply multiply the effect by the magnitude
      return baseEffect * magnitude;
    }
  };

  if (interventions.triageAI) {
    modifiedParams.phi0 += applyMagnitude('triageAI_φ₀', 0.15);
    modifiedParams.sigmaI *= applyMagnitude('triageAI_σI', 1.25, true);
    modifiedParams.aiFixedCost += 20000;
    modifiedParams.aiVariableCost += 1;
  }
  
  if (interventions.chwAI) {
    modifiedParams.mu0 += applyMagnitude('chwAI_μ₀', 0.10);
    modifiedParams.delta0 *= applyMagnitude('chwAI_δ₀', 0.85, true);
    modifiedParams.rho0 *= applyMagnitude('chwAI_ρ₀', 0.85, true);
    modifiedParams.aiFixedCost += 15000;
    modifiedParams.aiVariableCost += 0.5;
  }
  
  if (interventions.diagnosticAI) {
    modifiedParams.mu1 += applyMagnitude('diagnosticAI_μ₁', 0.10);
    modifiedParams.delta1 *= applyMagnitude('diagnosticAI_δ₁', 0.85, true);
    modifiedParams.rho1 *= applyMagnitude('diagnosticAI_ρ₁', 0.85, true);
    modifiedParams.aiFixedCost += 25000;
    modifiedParams.aiVariableCost += 2.5;
  }
  
  if (interventions.bedManagementAI) {
    modifiedParams.mu2 += applyMagnitude('bedManagementAI_μ₂', 0.05);
    modifiedParams.mu3 += applyMagnitude('bedManagementAI_μ₃', 0.05);
    modifiedParams.aiFixedCost += 30000;
    modifiedParams.aiVariableCost += 0;
  }
  
  if (interventions.hospitalDecisionAI) {
    modifiedParams.delta2 *= applyMagnitude('hospitalDecisionAI_δ₂', 0.80, true);
    modifiedParams.delta3 *= applyMagnitude('hospitalDecisionAI_δ₃', 0.80, true);
    modifiedParams.aiFixedCost += 35000;
    modifiedParams.aiVariableCost += 3;
  }
  
  if (interventions.selfCareAI) {
    // Use configurable parameters for self-care AI effects
    modifiedParams.muI += applyMagnitude('selfCareAI_μI', modifiedParams.selfCareAIEffectMuI);
    modifiedParams.deltaI *= applyMagnitude('selfCareAI_δI', modifiedParams.selfCareAIEffectDeltaI, true);
    modifiedParams.aiFixedCost += 10000;
    modifiedParams.aiVariableCost += 0.2;
  }
  
  return modifiedParams;
};

// Default baseline parameters
export const getDefaultParameters = (): ModelParameters => ({
  // Disease characteristics
  lambda: 0.20,
  disabilityWeight: 0.20,
  meanAgeOfInfection: 30,
  
  // Flow probabilities
  phi0: 0.45,
  sigmaI: 0.20,
  informalCareRatio: 0.20,
  
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
  
  // AI effectiveness parameters
  selfCareAIEffectMuI: 0.15,   // improvement in resolution from self-care AI  
  selfCareAIEffectDeltaI: 0.70, // multiplier for death rate reduction from self-care AI
  
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
  discountRate: 0,
  yearsOfLifeLost: 30,
  regionalLifeExpectancy: 70,
}); 