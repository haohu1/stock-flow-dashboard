export interface StockAndFlowState {
  U: number;      // symptomatic but not yet in any care pathway
  I: number;      // individuals self-treating or in informal care
  F: number;      // individuals in formal care entry point
  L0: number;     // cases managed by community health workers
  L1: number;     // cases at primary care facilities
  L2: number;     // cases in district hospitals
  L3: number;     // cases in tertiary hospitals
  R: number;      // resolved alive
  D: number;      // resolved dead
  patientDays: {  // accumulated patient days for each level
    I: number;
    F: number;    // patient days in formal care entry
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
    F: number;    // formal care entry point costs
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
  averageTimeToResolution: number;  // Average weeks from symptom onset to resolution
                                    // Clinical reference points: 
                                    // - Diarrhea: ~1-1.5 weeks with treatment
                                    // - Pneumonia: ~2-3 weeks with antibiotics
                                    // - Tuberculosis: ~24-26 weeks with treatment
                                    // - Maternal conditions: ~2-6 weeks depending on severity
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
    F: 0,
    L0: 0,
    L1: 0,
    L2: 0,
    L3: 0,
    R: 0,
    D: 0,
    patientDays: {
      I: 0,
      F: 0,
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
  
  // Calculate flow from new cases
  const directToFormal = params.phi0 * weeklyIncidence;
  const stayUntreated = (1 - params.phi0) * weeklyIncidence;
  
  // Use the configurable parameter to determine how many untreated patients move to informal care
  const toInformalCare = (1 - params.informalCareRatio) * stayUntreated;
  const trulyUntreated = params.informalCareRatio * stayUntreated;
  
  // Calculate transitions from U (untreated)
  const untreatedDeaths = params.deltaU * state.U;
  const remainingUntreated = state.U - untreatedDeaths;
  
  // Calculate transitions from I (informal care)
  const informalToFormal = params.sigmaI * state.I;
  const informalResolved = params.muI * state.I;
  const informalDeaths = params.deltaI * state.I;
  const remainingInformal = state.I - informalToFormal - informalResolved - informalDeaths;
  
  // Calculate distribution from F (formal care) to L0 only
  // All formal care patients go to CHW (L0) level first
  const formalToL0 = state.F; // 100% of formal care goes to L0
  const remainingFormal = 0;  // No patients remain in formal care
  
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
  const newU = trulyUntreated + remainingUntreated;
  
  // Include patients who move to informal care
  const newI = toInformalCare + remainingInformal;
  
  // Update formal care entry point (new entries + remaining from previous week)
  const newF = directToFormal + informalToFormal + remainingFormal;
  
  // Update levels - now L0 gets all formal care entries
  const newL0 = formalToL0 + remainingL0;
  const newL1 = l0Referral + remainingL1;
  const newL2 = l1Referral + remainingL2;
  const newL3 = l2Referral + remainingL3;
  
  const newR = state.R + informalResolved + l0Resolved + l1Resolved + l2Resolved + l3Resolved;
  const newD = state.D + untreatedDeaths + informalDeaths + l0Deaths + l1Deaths + l2Deaths + l3Deaths;
  
  // Calculate new patient days
  const newPatientDays = {
    I: state.patientDays.I + state.I,
    F: state.patientDays.F + state.F,
    L0: state.patientDays.L0 + state.L0,
    L1: state.patientDays.L1 + state.L1,
    L2: state.patientDays.L2 + state.L2,
    L3: state.patientDays.L3 + state.L3,
  };
  
  // Calculate episodes touched by AI
  const selfCareActive = params.muI > getDefaultParameters().muI;
  const episodesTouched = state.episodesTouched + 
                          directToFormal + 
                          informalToFormal + 
                          (selfCareActive ? state.I : 0);  // Count all informal care patients if selfCareAI is active
  
  return {
    U: newU,
    I: newI,
    F: newF,
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
    state.patientDays.F * params.perDiemCosts.F +
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
    (state.patientDays.I + state.patientDays.F + state.patientDays.L0 + state.patientDays.L1 + 
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
export const healthSystemStrengthDefaults = {
  moderate_urban_system: {
    // Direct System-Wide Parameters
    phi0: 0.65, // Probability of seeking formal care initially
    sigmaI: 0.25, // Probability of transitioning from informal to formal care
    informalCareRatio: 0.15, // Proportion of patients remaining untreated (vs. informal care)
    regionalLifeExpectancy: 70, // Regional life expectancy (years)
    perDiemCosts: { I: 7, F: 12, L0: 15, L1: 30, L2: 120, L3: 350 }, // USD

    // Multipliers for Disease-Specific Base Rates (1.0 means no change from disease baseline)
    mu_multiplier_I: 1.0,   // Resolution in Informal
    mu_multiplier_L0: 1.0,  // Resolution at CHW
    mu_multiplier_L1: 1.0,  // Resolution at Primary Care
    mu_multiplier_L2: 1.0,  // Resolution at District Hospital
    mu_multiplier_L3: 1.0,  // Resolution at Tertiary Hospital

    delta_multiplier_U: 1.0, // Death if Untreated
    delta_multiplier_I: 1.0, // Death in Informal
    delta_multiplier_L0: 1.0, // Death at CHW
    delta_multiplier_L1: 1.0, // Death at Primary Care
    delta_multiplier_L2: 1.0, // Death at District Hospital
    delta_multiplier_L3: 1.0, // Death at Tertiary Hospital

    rho_multiplier_L0: 1.0,  // Referral CHW to Primary
    rho_multiplier_L1: 1.0,  // Referral Primary to District
    rho_multiplier_L2: 1.0,  // Referral District to Tertiary
  },
  weak_rural_system: {
    // Direct System-Wide Parameters
    phi0: 0.30, // Lower access/trust
    sigmaI: 0.10, // Harder to transition
    informalCareRatio: 0.40, // Higher proportion untreated or in very basic informal
    regionalLifeExpectancy: 55,
    perDiemCosts: { I: 3, F: 5, L0: 8, L1: 15, L2: 70, L3: 250 }, // Lower, but may reflect scarcity

    // Multipliers (Effectiveness reduction, mortality increase, referral issues)
    mu_multiplier_I: 0.6,
    mu_multiplier_L0: 0.5,
    mu_multiplier_L1: 0.5,
    mu_multiplier_L2: 0.6,
    mu_multiplier_L3: 0.7,

    delta_multiplier_U: 1.5,
    delta_multiplier_I: 1.8,
    delta_multiplier_L0: 2.0,
    delta_multiplier_L1: 2.0,
    delta_multiplier_L2: 1.8,
    delta_multiplier_L3: 1.5,

    rho_multiplier_L0: 0.7, // Referrals less likely to complete or be made
    rho_multiplier_L1: 0.6,
    rho_multiplier_L2: 0.5,
  },
  strong_urban_system_lmic: { // Aspirational strong system in an LMIC urban context
    // Direct System-Wide Parameters
    phi0: 0.80,
    sigmaI: 0.35,
    informalCareRatio: 0.10,
    regionalLifeExpectancy: 75,
    perDiemCosts: { I: 10, F: 15, L0: 20, L1: 40, L2: 150, L3: 400 }, // Higher quality might mean higher cost

    // Multipliers (Improved effectiveness, reduced mortality, efficient referrals)
    mu_multiplier_I: 1.2,
    mu_multiplier_L0: 1.3,
    mu_multiplier_L1: 1.3,
    mu_multiplier_L2: 1.2,
    mu_multiplier_L3: 1.1,

    delta_multiplier_U: 0.8,
    delta_multiplier_I: 0.7,
    delta_multiplier_L0: 0.6,
    delta_multiplier_L1: 0.6,
    delta_multiplier_L2: 0.7,
    delta_multiplier_L3: 0.8,

    rho_multiplier_L0: 1.1, // Efficient and appropriate referrals
    rho_multiplier_L1: 1.1,
    rho_multiplier_L2: 1.1,
  },
  fragile_conflict_system: { // Humanitarian/conflict zone system
    // Direct System-Wide Parameters
    phi0: 0.20, // Severely limited access due to insecurity, destroyed infrastructure
    sigmaI: 0.08, // Very difficult to transition from informal to formal care
    informalCareRatio: 0.60, // Majority of patients unable to access formal care
    regionalLifeExpectancy: 50, // Significantly reduced life expectancy
    perDiemCosts: { I: 2, F: 6, L0: 10, L1: 20, L2: 150, L3: 400 }, // Variable costs, NGO-supported

    // Multipliers (Severely compromised effectiveness, high mortality, broken referral chains)
    mu_multiplier_I: 0.4,
    mu_multiplier_L0: 0.3,
    mu_multiplier_L1: 0.4,
    mu_multiplier_L2: 0.5,
    mu_multiplier_L3: 0.6,

    delta_multiplier_U: 2.5,
    delta_multiplier_I: 2.3,
    delta_multiplier_L0: 2.0,
    delta_multiplier_L1: 2.0,
    delta_multiplier_L2: 1.7,
    delta_multiplier_L3: 1.5,

    rho_multiplier_L0: 0.4, // Severely compromised referral paths
    rho_multiplier_L1: 0.3,
    rho_multiplier_L2: 0.2,
  },
  high_income_system: { // High income country system
    // Direct System-Wide Parameters
    phi0: 0.90, // Very high healthcare seeking
    sigmaI: 0.70, // High transition to formal
    informalCareRatio: 0.05, // Very few remain untreated
    regionalLifeExpectancy: 82, // High life expectancy
    perDiemCosts: { I: 15, F: 30, L0: 50, L1: 100, L2: 500, L3: 1200 }, // High costs

    // Multipliers (Very high effectiveness, very low mortality, efficient referrals)
    mu_multiplier_I: 1.5,
    mu_multiplier_L0: 1.6,
    mu_multiplier_L1: 1.7,
    mu_multiplier_L2: 1.6,
    mu_multiplier_L3: 1.5,

    delta_multiplier_U: 0.5,
    delta_multiplier_I: 0.4,
    delta_multiplier_L0: 0.3,
    delta_multiplier_L1: 0.3,
    delta_multiplier_L2: 0.4,
    delta_multiplier_L3: 0.5,

    rho_multiplier_L0: 1.2, // Very efficient, standardized referrals
    rho_multiplier_L1: 1.2,
    rho_multiplier_L2: 1.2,
  }
};

// Predefined disease profiles
export const diseaseProfiles = {
  congestive_heart_failure: {
    lambda: 0.012,            // ~1.2% annual incidence in adults >65 years (representative for older adults)
    disabilityWeight: 0.42,   // moderate-high disability during acute decompensation
    meanAgeOfInfection: 67,   // primarily affects older adults
    muI: 0.01,                // negligible spontaneous resolution at home (1% per week)
    mu0: 0.03,                // very limited CHW role in resolution (3% per week)
    mu1: 0.35,                // moderate resolution at primary care with medications (35% per week)
    mu2: 0.55,                // good resolution at district hospital (55% per week)
    mu3: 0.75,                // high resolution at tertiary hospital with advanced care (75% per week)
    deltaI: 0.06,             // high mortality risk if inadequately treated at home (6% per week)
    deltaU: 0.09,             // very high mortality risk if completely untreated (9% per week)
    delta0: 0.05,             // high mortality risk at CHW level (5% per week)
    delta1: 0.03,             // moderate mortality risk at primary care (3% per week)
    delta2: 0.02,             // lower mortality risk at district hospital (2% per week)
    delta3: 0.01,             // low mortality risk at tertiary hospital (1% per week)
    rho0: 0.70,               // high referral from CHW to primary (70%)
    rho1: 0.55,               // substantial referral from primary to district (55%)
    rho2: 0.35                // moderate referral to tertiary for advanced care (35%)
  },
  tuberculosis: {
    lambda: 0.002,            // 0.2% annual incidence (200 per 100,000), reflecting high-burden LMIC
    disabilityWeight: 0.333,  // moderate disability weight for active TB
    meanAgeOfInfection: 35,   // typical age of TB diagnosis
    muI: 0.02,                // very low spontaneous resolution for active TB (2% per week)
    mu0: 0.03,                // CHW role primarily DOTS/referral, low direct resolution (3% per week)
    mu1: 0.04,                // weekly resolution rate on standard 6-month primary care treatment (4% per week, implies ~25wks)
    mu2: 0.05,                // slightly better/faster for complex cases at district hospital (5% per week)
    mu3: 0.06,                // for severe/MDR-TB cases at tertiary care (6% per week)
    deltaI: 0.0025,           // untreated/informal care TB mortality (0.25% per week)
    deltaU: 0.003,            // completely untreated TB mortality (0.3% per week)
    delta0: 0.002,            // mortality at CHW level (0.2% per week, with DOTS support)
    delta1: 0.001,            // mortality on treatment at primary care (0.1% per week)
    delta2: 0.0008,           // mortality on treatment at district hospital (0.08% per week)
    delta3: 0.0005,           // mortality for complex/MDR-TB at tertiary (0.05% per week)
    rho0: 0.85,               // high referral CHW to primary for diagnosis/treatment (85%)
    rho1: 0.40,               // moderate referral primary to district for complications/MDR suspicion (40%)
    rho2: 0.25                // lower referral district to tertiary for specialized MDR/complex care (25%)
  },
  pneumonia: { // Primarily non-severe childhood pneumonia
    lambda: 0.90,             // very high incidence in under-fives (episodes per child-year)
    disabilityWeight: 0.28,   // moderate disability
    meanAgeOfInfection: 3,    // primarily affects young children
    muI: 0.10,                // some spontaneous resolution, esp. viral (10% per week)
    mu0: 0.70,                // CHW with antibiotics (e.g. Amox DT) for non-severe (70% per week)
    mu1: 0.80,                // primary care with antibiotics for non-severe (80% per week)
    mu2: 0.70,                // district hospital for severe pneumonia (resolution may take longer) (70% per week)
    mu3: 0.80,                // tertiary care for very severe/complicated pneumonia (80% per week)
    deltaI: 0.035,            // mortality with informal care (3.5% per week)
    deltaU: 0.05,             // mortality if completely untreated (5% per week)
    delta0: 0.01,             // mortality under CHW care (covers misclassification/delay for severe) (1% per week)
    delta1: 0.005,            // mortality under primary care for appropriately treated non-severe (0.5% per week)
    delta2: 0.02,             // mortality for severe pneumonia at district hospital (2% per week)
    delta3: 0.015,            // mortality for very severe/complicated at tertiary (1.5% per week)
    rho0: 0.60,               // CHW referral to primary for danger signs/non-response (60%)
    rho1: 0.30,               // primary care referral to district for severe cases (30%)
    rho2: 0.20                // district referral to tertiary for highly complex cases (20%)
  },
  malaria: { // Uncomplicated and severe malaria in endemic LMICs
    lambda: 0.40,             // moderate-high incidence in endemic areas (episodes per person-year)
    disabilityWeight: 0.192,  // moderate disability
    meanAgeOfInfection: 9,    // affects children and adults, children at higher risk
    muI: 0.15,                // some spontaneous resolution of uncomplicated malaria (15% per week)
    mu0: 0.80,                // CHW with RDTs and ACTs for uncomplicated (80% per week)
    mu1: 0.85,                // primary care with ACTs for uncomplicated (85% per week)
    mu2: 0.60,                // district hospital for severe malaria (recovery longer) (60% per week)
    mu3: 0.70,                // tertiary care for very severe/complicated malaria (70% per week)
    deltaI: 0.02,             // mortality with informal care (uncomplicated progressing/severe missed) (2% per week)
    deltaU: 0.03,             // mortality if completely untreated (3% per week)
    delta0: 0.002,            // mortality under CHW care (uncomplicated, accounts for some failures/progression) (0.2% per week)
    delta1: 0.001,            // mortality under primary care (uncomplicated) (0.1% per week)
    delta2: 0.03,             // mortality for severe malaria at district hospital (3% per week)
    delta3: 0.02,             // mortality for very severe/complicated at tertiary (2% per week)
    rho0: 0.50,               // CHW referral to primary (danger signs, RDT positive non-response) (50%)
    rho1: 0.40,               // primary care referral to district (severe malaria criteria) (40%)
    rho2: 0.20                // district referral to tertiary (complex severe cases, organ failure) (20%)
  },
  fever: { // Fever of Unknown Origin (non-specific)
    lambda: 0.60,             // moderate-high incidence (episodes per person-year)
    disabilityWeight: 0.10,   // lower disability weight
    meanAgeOfInfection: 15,   // affects all ages
    muI: 0.30,                // moderate spontaneous resolution for many fevers (30% per week)
    mu0: 0.55,                // CHW (symptomatic relief, advice, identify danger signs) (55% per week)
    mu1: 0.70,                // primary care (basic investigation, empiric treatment) (70% per week)
    mu2: 0.80,                // district hospital (further investigation) (80% per week)
    mu3: 0.90,                // tertiary hospital (extensive investigation) (90% per week)
    deltaI: 0.008,            // low mortality for general fevers, but some are serious (0.8% per week)
    deltaU: 0.015,            // higher if completely untreated (1.5% per week)
    delta0: 0.005,            // mortality at CHW level (0.5% per week)
    delta1: 0.003,            // mortality at primary care (0.3% per week)
    delta2: 0.002,            // mortality at district hospital (0.2% per week)
    delta3: 0.001,            // mortality at tertiary (0.1% per week)
    rho0: 0.30,               // CHW referral to primary (persistent/severe fever) (30%)
    rho1: 0.20,               // primary care referral to district (unclear diagnosis, non-response) (20%)
    rho2: 0.10                // district referral to tertiary (complex cases) (10%)
  },
  diarrhea: { // Acute diarrheal disease, primarily in children
    lambda: 1.50,             // very high incidence especially in children (episodes per child-year)
    disabilityWeight: 0.15,   // moderate disability (dehydration)
    meanAgeOfInfection: 2,    // primarily affects young children
    muI: 0.35,                // moderate spontaneous resolution with home fluids (35% per week)
    mu0: 0.85,                // CHW with ORS/Zinc for non-severe (85% per week)
    mu1: 0.90,                // primary care with ORS/Zinc, antibiotics if dysentery (90% per week)
    mu2: 0.80,                // district hospital for severe dehydration/complications (recovery longer) (80% per week)
    mu3: 0.85,                // tertiary care for very severe/refractory cases (85% per week)
    deltaI: 0.015,            // mortality with informal care (risk of dehydration) (1.5% per week)
    deltaU: 0.025,            // mortality if completely untreated (severe dehydration) (2.5% per week)
    delta0: 0.002,            // mortality under CHW care (ORS failures, delayed referral for severe) (0.2% per week)
    delta1: 0.001,            // mortality under primary care (well-managed non-severe) (0.1% per week)
    delta2: 0.01,             // mortality for severe dehydration/complications at district (1% per week)
    delta3: 0.005,            // mortality for very severe cases at tertiary (0.5% per week)
    rho0: 0.50,               // CHW referral to primary (danger signs, dehydration, persistent) (50%)
    rho1: 0.30,               // primary care referral to district (severe dehydration, not responding) (30%)
    rho2: 0.10                // district referral to tertiary (highly complex cases) (10%)
  },
  maternal_hemorrhage: { // Postpartum hemorrhage (PPH), an acute emergency
    lambda: 0.05,             // incident cases relative to pregnancies/births (model-specific interpretation)
    disabilityWeight: 0.56,   // high disability weight
    meanAgeOfInfection: 26,   // typical age of childbearing
    muI: 0.01,                // negligible spontaneous resolution (1% per week)
    mu0: 0.05,                // CHW (uterine massage, misoprostol if policy, rapid referral) - limited resolution (5% per week)
    mu1: 0.40,                // primary care (uterotonics, IV fluids, basic PPH management) (40% per week)
    mu2: 0.75,                // district hospital (blood transfusion, surgical interventions) (75% per week)
    mu3: 0.80,                // tertiary hospital (advanced interventions, ICU) (80% per week)
    deltaI: 0.15,             // very high mortality if PPH unmanaged or only informal care (15% per week)
    deltaU: 0.20,             // extremely high mortality if completely untreated (20% per week)
    delta0: 0.12,             // mortality at CHW level (delay in reaching definitive care) (12% per week)
    delta1: 0.10,             // mortality at primary care (if capacity limited for severe PPH) (10% per week)
    delta2: 0.05,             // mortality at district hospital (with good PPH management) (5% per week)
    delta3: 0.03,             // mortality at tertiary hospital (complex/severe cases) (3% per week)
    rho0: 0.90,               // CHW immediate referral to primary/facility (90%)
    rho1: 0.75,               // primary care referral to district (uncontrolled bleeding, shock) (75%)
    rho2: 0.40                // district referral to tertiary (need for advanced surgery/ICU) (40%)
  },
  infant_pneumonia: { // Pneumonia specifically in infants (<1 year old), often more severe
    lambda: 1.20,             // very high incidence in infants (episodes per infant-year)
    disabilityWeight: 0.35,   // moderate-high disability
    meanAgeOfInfection: 0.5,  // infants (6 months average age)
    muI: 0.10,                // some spontaneous resolution (viral, very mild bacterial) (10% per week)
    mu0: 0.50,                // CHW with antibiotics for non-severe infant pneumonia/PSBI (Amox DT) (50% per week)
    mu1: 0.70,                // primary care with antibiotics for non-severe (70% per week)
    mu2: 0.75,                // district hospital for severe infant pneumonia (75% per week)
    mu3: 0.85,                // tertiary care for very severe/complicated infant pneumonia (85% per week)
    deltaI: 0.04,             // mortality with informal care for infant pneumonia (4% per week)
    deltaU: 0.06,             // mortality if completely untreated (6% per week)
    delta0: 0.015,            // mortality under CHW care (covers misclassification, delay, severity) (1.5% per week)
    delta1: 0.008,            // mortality under primary care (appropriately treated non-severe) (0.8% per week)
    delta2: 0.025,            // mortality for severe infant pneumonia at district hospital (2.5% per week)
    delta3: 0.02,             // mortality for very severe/complicated at tertiary (2% per week)
    rho0: 0.65,               // CHW referral to primary for danger signs/non-response in infants (65%)
    rho1: 0.45,               // primary care referral to district for severe cases (45%)
    rho2: 0.30                // district referral to tertiary for highly complex cases (30%)
  },
  maternal_hypertension: { // Hypertensive disorders of pregnancy (e.g. pre-eclampsia)
    lambda: 0.08,             // incident cases relative to pregnancies/births (model-specific interpretation)
    disabilityWeight: 0.35,   // moderate disability (can be higher for eclampsia/severe pre-eclampsia)
    meanAgeOfInfection: 27,   // typical age of childbearing
    muI: 0.02,                // negligible spontaneous resolution of pre-eclampsia without delivery/care (2% per week)
    mu0: 0.05,                // CHW (BP monitoring, education, urgent referral) - limited direct resolution (5% per week)
    mu1: 0.30,                // primary care (antihypertensives, MgSO4 if policy, assess/refer for delivery) (30% per week)
    mu2: 0.70,                // district hospital (manage severe pre-eclampsia, eclampsia, delivery) (70% per week)
    mu3: 0.80,                // tertiary hospital (management of severe complications, ICU) (80% per week)
    deltaI: 0.04,             // mortality with unmanaged maternal hypertension/pre-eclampsia (4% per week)
    deltaU: 0.06,             // mortality if completely untreated (progression to eclampsia, stroke etc.) (6% per week)
    delta0: 0.03,             // mortality at CHW level (delay in reaching definitive care) (3% per week)
    delta1: 0.02,             // mortality at primary care (if capacity limited for severe cases) (2% per week)
    delta2: 0.01,             // mortality at district hospital (with good management) (1% per week)
    delta3: 0.005,            // mortality at tertiary hospital (complex/severe cases) (0.5% per week)
    rho0: 0.80,               // CHW immediate referral to primary/facility for high BP/danger signs (80%)
    rho1: 0.60,               // primary care referral to district (severe features, need for delivery) (60%)
    rho2: 0.40                // district referral to tertiary (complex cases, ICU need) (40%)
  },
  anemia: { // Focus on Iron Deficiency Anemia in women/children
    lambda: 0.20,             // 20% annual incidence of symptomatic anemia needing attention
    disabilityWeight: 0.06,   // moderate for symptomatic anemia
    meanAgeOfInfection: 15,   // bimodal (young children, women of reproductive age)
    muI: 0.05,                // some response to dietary changes or informal iron (5% weekly improvement)
    mu0: 0.15,                // CHW providing iron supplements (15% weekly improvement to target Hb)
    mu1: 0.20,                // primary care diagnosis, iron supplementation, basic investigation (20% weekly improvement)
    mu2: 0.25,                // district hospital for severe anemia/non-response, investigation, transfusion (25% weekly improvement/stabilization)
    mu3: 0.30,                // tertiary for complex cases, severe underlying causes (30% weekly improvement/stabilization)
    deltaI: 0.0005,           // low mortality for mild/moderate IDA (0.05% weekly)
    deltaU: 0.001,            // slightly higher if completely unmanaged (0.1% weekly)
    delta0: 0.0003,           // very low mortality with CHW iron (0.03% weekly)
    delta1: 0.0002,           // very low mortality with primary care (0.02% weekly)
    delta2: 0.001,            // low, relates to complications of severe anemia or underlying cause (0.1% weekly)
    delta3: 0.0008,           // low, similar to L2 (0.08% weekly)
    rho0: 0.40,               // moderate CHW referral for symptomatic/severe cases or non-response (40%)
    rho1: 0.30,               // moderate primary referral for investigation or severe cases (30%)
    rho2: 0.15                // lower district referral for highly specialized investigation (15%)
  },
  hiv_management_chronic: { // Chronic care for stable HIV on ART
    lambda: 0.001,            // 0.1% annual new diagnoses needing linkage to chronic ART care
    disabilityWeight: 0.078,  // low for stable HIV on ART
    meanAgeOfInfection: 30,   // typical age of diagnosis
    muI: 0.01,                // "Self-management" pre-linkage - very low success in viral suppression (1% weekly to stable)
    mu0: 0.05,                // CHW support for linkage, adherence (5% weekly to stable on ART)
    mu1: 0.10,                // primary care initiating ART, counseling, monitoring (10% weekly to stable initial phase)
    mu2: 0.12,                // district hospital for complex starts or managing side effects (12% weekly to stable)
    mu3: 0.15,                // tertiary for very complex cases, salvage regimens (15% weekly to stable)
    deltaI: 0.005,            // high mortality if diagnosed but not linked (progression) (0.5% weekly)
    deltaU: 0.007,            // higher mortality for undiagnosed/untreated (0.7% weekly)
    delta0: 0.002,            // mortality during CHW linkage/support (0.2% weekly)
    delta1: 0.0005,           // mortality on ART at primary care (treatment failure, NCDs) (0.05% weekly)
    delta2: 0.0006,           // similar to L1, maybe slightly higher if sicker patients (0.06% weekly)
    delta3: 0.0004,           // mortality for very complex/failing patients at tertiary (0.04% weekly)
    rho0: 0.90,               // high CHW referral for ART initiation (90%)
    rho1: 0.15,               // low primary referral if stable, higher if complications (15%)
    rho2: 0.10                // low district referral to tertiary (10%)
  },
  high_risk_pregnancy_low_anc: { // High-risk pregnancy with limited/no antenatal care
    lambda: 0.02,             // 2% of women of reproductive age annually experience this (very rough estimate)
    disabilityWeight: 0.30,   // high average disability during complicated HRP
    meanAgeOfInfection: 28,   // typical reproductive age
    muI: 0.01,                // spontaneous favorable outcome despite HRP & low ANC (very low, 1% weekly)
    mu0: 0.02,                // CHW identifies risk, encourages facility visits (2% weekly improved outcome by CHW alone)
    mu1: 0.10,                // primary care (if accessed) basic ANC, identifies major issues (10% weekly successful management of some risks)
    mu2: 0.50,                // district hospital managing complications, C-sections (50% weekly resolution of acute complication/delivery)
    mu3: 0.60,                // tertiary for severe maternal/fetal complications (60% weekly resolution/delivery)
    deltaI: 0.015,            // high mortality/morbidity if HRP managed informally/no ANC (1.5% weekly risk of severe adverse outcome/death)
    deltaU: 0.02,             // very high mortality/morbidity if completely unmanaged (2% weekly)
    delta0: 0.01,             // high mortality at CHW level (limited intervention for true HRP) (1% weekly)
    delta1: 0.005,            // moderate mortality at primary care (can manage some HRP issues) (0.5% weekly)
    delta2: 0.002,            // lower mortality at district with C-section, blood (0.2% weekly)
    delta3: 0.001,            // lowest mortality at tertiary (0.1% weekly)
    rho0: 0.90,               // very high CHW referral for any HRP sign (90%)
    rho1: 0.70,               // high primary referral for actual complications (70%)
    rho2: 0.40                // moderate district to tertiary for most severe (40%)
  },
  urti: { // Upper Respiratory Tract Infection
    lambda: 2.0,              // very high incidence (2 episodes per person-year)
    disabilityWeight: 0.01,   // very low disability
    meanAgeOfInfection: 10,   // affects all ages, common in children
    muI: 0.70,                // high spontaneous resolution (70% per week)
    mu0: 0.75,                // CHW (reassurance, symptomatic advice) - similar to spontaneous (75% per week)
    mu1: 0.80,                // primary care (similar, rule out more serious) (80% per week)
    mu2: 0.85,                // rarely reaches hospital unless misdiagnosed/severe complication (85% per week)
    mu3: 0.90,                // (90% per week)
    deltaI: 0.00001,          // extremely low mortality (0.001% weekly)
    deltaU: 0.00002,          // extremely low mortality (0.002% weekly)
    delta0: 0.00001,          // extremely low mortality at CHW level (0.001% weekly)
    delta1: 0.000005,         // extremely low mortality at primary care (0.0005% weekly)
    delta2: 0.000001,         // negligible, likely related to other severe underlying conditions if at this level (0.0001% weekly)
    delta3: 0.000001,         // negligible (0.0001% weekly)
    rho0: 0.05,               // low CHW referral, only if danger signs or prolonged (5%)
    rho1: 0.02,               // very low primary referral, only if atypical/severe (2%)
    rho2: 0.01                // very low district referral (1%)
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
    // Triage AI improves formal care seeking and transitions from informal care
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
    F: 10,      // formal care entry point cost (triage, registration, initial assessment)
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