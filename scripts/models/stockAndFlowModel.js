"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeModelParameters = exports.getDefaultParameters = exports.applyAIInterventions = exports.diseaseSpecificAIEffects = exports.diseaseAIRationales = exports.defaultAIBaseEffects = exports.defaultAIUptakeParameters = exports.defaultAICostParameters = exports.diseaseProfiles = exports.healthSystemStrengthDefaults = exports.calculateICER = exports.runSimulation = void 0;
// Initialize model with default state
const initializeState = (population, lambda, initialState) => {
    // Calculate initial weekly incidence
    const weeklyIncidence = (lambda * population) / 52;
    const defaultState = {
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
        queues: {
            L0: 0,
            L1: 0,
            L2: 0,
            L3: 0,
        },
        queueRelatedDeaths: 0,
    };
    return { ...defaultState, ...initialState };
};
// Run a single week of the simulation
const runWeek = (state, params, population) => {
    // Calculate weekly incidence
    let weeklyIncidence = (params.lambda * population) / 52;
    // Apply visit reduction if self-care AI is active
    const visitReduction = params.visitReduction || 0;
    const effectiveIncidence = weeklyIncidence * (1 - visitReduction);
    const avoidedVisits = weeklyIncidence * visitReduction; // These resolve at home
    // Get congestion level early for feedback effects
    const congestion = params.systemCongestion || 0;
    // Congestion feedback - reduce new arrivals when system is overwhelmed
    let arrivalMultiplier = 1.0;
    if (congestion > 0.5) {
        // People hear hospitals are full and some stay home
        // At 50% congestion: no reduction, at 100% congestion: 25% reduction
        arrivalMultiplier = 1 - ((congestion - 0.5) * 0.5);
    }
    // Calculate flow from new cases (using effective incidence after visit reduction)
    const directToFormal = params.phi0 * effectiveIncidence * arrivalMultiplier;
    const stayUntreated = (1 - params.phi0) * effectiveIncidence * arrivalMultiplier;
    // Use the configurable parameter to determine how many untreated patients move to informal care
    const toInformalCare = (1 - params.informalCareRatio) * stayUntreated;
    const trulyUntreated = params.informalCareRatio * stayUntreated;
    // Calculate transitions from U (untreated)
    const untreatedDeaths = params.deltaU * state.U;
    const untreatedResolved = params.muU * state.U; // New: spontaneous resolution for untreated patients
    const remainingUntreated = state.U - untreatedDeaths - untreatedResolved; // Updated to include resolved
    // Calculate transitions from I (informal care)
    const informalToFormal = params.sigmaI * state.I;
    const informalResolved = params.muI * state.I;
    const informalDeaths = params.deltaI * state.I;
    const remainingInformal = state.I - informalToFormal - informalResolved - informalDeaths;
    // Calculate distribution from F (formal care) with smart routing
    const directRoutingImprovement = params.directRoutingImprovement || 0;
    // With smart routing, some patients can bypass congested lower levels
    let formalToL0 = state.F;
    let formalToL1Direct = 0;
    let formalToL2Direct = 0;
    if (directRoutingImprovement > 0 && congestion > 0.5) {
        // When system is congested (>50%), route some patients directly to higher levels
        const bypassProbability = directRoutingImprovement * congestion;
        // 60% of bypassed patients go to L1, 40% to L2
        const bypassedPatients = state.F * bypassProbability;
        formalToL1Direct = bypassedPatients * 0.6;
        formalToL2Direct = bypassedPatients * 0.4;
        formalToL0 = state.F - bypassedPatients;
    }
    const remainingFormal = 0; // No patients remain in formal care
    // System adaptation when congested - staff work harder, treat more locally
    let muBoost = 1.0;
    let rhoReduction = 1.0;
    if (congestion > 0.5) {
        // Staff work faster when overwhelmed: up to 20% faster resolution
        muBoost = 1 + ((congestion - 0.5) * 0.4);
        // Fewer referrals when congested: up to 30% reduction
        rhoReduction = 1 - ((congestion - 0.5) * 0.6);
    }
    // Calculate transitions from L0 (community health workers)
    const l0Referral = params.rho0 * state.L0 * rhoReduction;
    const l0Resolved = params.mu0 * state.L0 * muBoost;
    const l0Deaths = params.delta0 * state.L0;
    const remainingL0 = state.L0 - l0Referral - l0Resolved - l0Deaths;
    // Calculate transitions from L1 (primary care)
    const l1Referral = params.rho1 * state.L1 * rhoReduction;
    const l1Resolved = params.mu1 * state.L1 * muBoost;
    const l1Deaths = params.delta1 * state.L1;
    const remainingL1 = state.L1 - l1Referral - l1Resolved - l1Deaths;
    // Calculate transitions from L2 (district hospital)
    const l2Referral = params.rho2 * state.L2 * rhoReduction;
    const l2Resolved = params.mu2 * state.L2 * muBoost;
    const l2Deaths = params.delta2 * state.L2;
    const remainingL2 = state.L2 - l2Referral - l2Resolved - l2Deaths;
    // Calculate transitions from L3 (tertiary hospital)
    const l3Resolved = params.mu3 * state.L3 * muBoost;
    const l3Deaths = params.delta3 * state.L3;
    const remainingL3 = state.L3 - l3Resolved - l3Deaths;
    // Calculate new patient totals for the next week
    const newUBeforeQueues = trulyUntreated + remainingUntreated;
    // Include patients who move to informal care
    const newIBeforeQueues = toInformalCare + remainingInformal;
    // Update formal care entry point (new entries + remaining from previous week)
    const newF = directToFormal + informalToFormal + remainingFormal;
    // Apply capacity constraints if system congestion is specified
    // Get disease-specific capacity parameters
    const capacityShare = params.capacityShare || 0.1; // Default 10% share
    const competitionSensitivity = params.competitionSensitivity || 1.0;
    const clinicalPriority = params.clinicalPriority || 0.5;
    // Calculate capacity-constrained flows
    // System congestion reduces the ability to admit new patients
    // Disease-specific effects: higher competition sensitivity = more affected by congestion
    // Remove the cap to allow over-congestion effects (effectiveCongestion can now be > 1)
    const effectiveCongestion = congestion * competitionSensitivity;
    // More gradual capacity reduction to prevent catastrophic failure
    // At 50% congestion: 75% capacity, at 100% congestion: 50% capacity
    const capacityMultiplier = Math.max(0.2, 1 - (effectiveCongestion * 0.5));
    // Calculate desired flows (before capacity constraints)
    const desiredL0Flow = formalToL0;
    const desiredL1Flow = l0Referral;
    const desiredL2Flow = l1Referral;
    const desiredL3Flow = l2Referral;
    // Apply capacity constraints to flows
    const actualL0Flow = desiredL0Flow * capacityMultiplier;
    const actualL1Flow = desiredL1Flow * capacityMultiplier;
    const actualL2Flow = desiredL2Flow * capacityMultiplier;
    const actualL3Flow = desiredL3Flow * capacityMultiplier;
    // Calculate queued patients (those who couldn't enter due to capacity)
    // Apply triage AI queue prevention - reduces inappropriate visits that would otherwise queue
    const queuePreventionEffect = params.queuePreventionRate || 0;
    let queuedL0 = desiredL0Flow - actualL0Flow;
    let queuedL1 = desiredL1Flow - actualL1Flow;
    let queuedL2 = desiredL2Flow - actualL2Flow;
    let queuedL3 = desiredL3Flow - actualL3Flow;
    // Triage AI prevents some inappropriate visits from entering queues
    if (queuePreventionEffect > 0) {
        queuedL0 *= (1 - queuePreventionEffect);
        queuedL1 *= (1 - queuePreventionEffect);
        queuedL2 *= (1 - queuePreventionEffect);
        queuedL3 *= (1 - queuePreventionEffect);
    }
    // Initialize queues if not present
    const currentQueues = state.queues || { L0: 0, L1: 0, L2: 0, L3: 0 };
    // Queue dynamics parameters with defaults
    const queueAbandonmentRate = params.queueAbandonmentRate || 0.05; // Default: 5% of queued patients abandon per week
    const queueBypassRate = params.queueBypassRate || 0.10; // Default: 10% of queued patients seek alternative care
    // Process existing queues - some get served as capacity becomes available
    const queueClearanceRate = params.queueClearanceRate || 0.3; // Default: 30% of queue can be cleared per week if capacity available
    // Queue mortality - same as untreated mortality since they're waiting for care
    const queueMortalityL0 = currentQueues.L0 * params.deltaU;
    const queueMortalityL1 = currentQueues.L1 * params.deltaU;
    const queueMortalityL2 = currentQueues.L2 * params.deltaU;
    const queueMortalityL3 = currentQueues.L3 * params.deltaU;
    const queueMortality = queueMortalityL0 + queueMortalityL1 + queueMortalityL2 + queueMortalityL3;
    // Queue abandonment - patients give up and return to untreated
    const queueAbandonL0 = currentQueues.L0 * queueAbandonmentRate;
    const queueAbandonL1 = currentQueues.L1 * queueAbandonmentRate;
    const queueAbandonL2 = currentQueues.L2 * queueAbandonmentRate;
    const queueAbandonL3 = currentQueues.L3 * queueAbandonmentRate;
    // Queue bypass - patients seek informal care instead
    const queueBypassL0 = currentQueues.L0 * queueBypassRate;
    const queueBypassL1 = currentQueues.L1 * queueBypassRate;
    const queueBypassL2 = currentQueues.L2 * queueBypassRate;
    const queueBypassL3 = currentQueues.L3 * queueBypassRate;
    // Queue self-resolution - patients get better while waiting
    const queueSelfResolveRate = params.queueSelfResolveRate || 0.10;
    const queueSelfResolveL0 = currentQueues.L0 * queueSelfResolveRate;
    const queueSelfResolveL1 = currentQueues.L1 * queueSelfResolveRate;
    const queueSelfResolveL2 = currentQueues.L2 * queueSelfResolveRate;
    const queueSelfResolveL3 = currentQueues.L3 * queueSelfResolveRate;
    // Clear some queue based on freed capacity (priority-based)
    // AI interventions improve queue clearance rates
    const resolutionBoostEffect = params.resolutionBoost || 0; // CHW AI
    const pointOfCareEffect = params.pointOfCareResolution || 0; // Diagnostic AI
    const lengthOfStayEffect = params.lengthOfStayReduction || 0; // Bed Management AI
    const dischargeOptEffect = params.dischargeOptimization || 0; // Bed Management AI
    const treatmentEffEffect = params.treatmentEfficiency || 0; // Hospital Decision AI
    const resourceUtilEffect = params.resourceUtilization || 0; // Hospital Decision AI
    let availableCapacityL0 = Math.max(0, capacityMultiplier * queueClearanceRate);
    let availableCapacityL1 = Math.max(0, capacityMultiplier * queueClearanceRate);
    let availableCapacityL2 = Math.max(0, capacityMultiplier * queueClearanceRate);
    let availableCapacityL3 = Math.max(0, capacityMultiplier * queueClearanceRate);
    // Apply AI improvements to queue clearance
    availableCapacityL0 *= (1 + resolutionBoostEffect); // CHW AI improves L0 throughput
    availableCapacityL1 *= (1 + pointOfCareEffect); // Diagnostic AI improves L1 throughput
    availableCapacityL2 *= (1 + lengthOfStayEffect + dischargeOptEffect + treatmentEffEffect); // Multiple hospital AIs
    availableCapacityL3 *= (1 + lengthOfStayEffect + dischargeOptEffect + treatmentEffEffect + resourceUtilEffect); // All hospital AIs
    const queueClearedL0 = Math.min(currentQueues.L0 * availableCapacityL0, currentQueues.L0 - queueMortalityL0 - queueAbandonL0 - queueBypassL0 - queueSelfResolveL0);
    const queueClearedL1 = Math.min(currentQueues.L1 * availableCapacityL1, currentQueues.L1 - queueMortalityL1 - queueAbandonL1 - queueBypassL1 - queueSelfResolveL1);
    const queueClearedL2 = Math.min(currentQueues.L2 * availableCapacityL2, currentQueues.L2 - queueMortalityL2 - queueAbandonL2 - queueBypassL2 - queueSelfResolveL2);
    const queueClearedL3 = Math.min(currentQueues.L3 * availableCapacityL3, currentQueues.L3 - queueMortalityL3 - queueAbandonL3 - queueBypassL3 - queueSelfResolveL3);
    // Update levels with capacity-constrained flows plus cleared queues and direct routing
    const newL0 = actualL0Flow + remainingL0 + queueClearedL0;
    const newL1 = actualL1Flow + remainingL1 + queueClearedL1 + formalToL1Direct;
    const newL2 = actualL2Flow + remainingL2 + queueClearedL2 + formalToL2Direct;
    const newL3 = actualL3Flow + remainingL3 + queueClearedL3;
    // Add abandoned patients back to untreated and bypassed to informal
    const totalAbandoned = queueAbandonL0 + queueAbandonL1 + queueAbandonL2 + queueAbandonL3;
    const totalBypassed = queueBypassL0 + queueBypassL1 + queueBypassL2 + queueBypassL3;
    const newR = state.R + untreatedResolved + informalResolved + l0Resolved + l1Resolved + l2Resolved + l3Resolved + avoidedVisits; // Include untreated resolved and avoided visits
    const newD = state.D + untreatedDeaths + informalDeaths + l0Deaths + l1Deaths + l2Deaths + l3Deaths + queueMortality;
    // Calculate new patient days - apply length of stay reduction from AI
    const newPatientDays = {
        I: state.patientDays.I + state.I,
        F: state.patientDays.F + state.F,
        L0: state.patientDays.L0 + state.L0 * (1 - (resolutionBoostEffect * 0.5)), // CHW AI reduces time at L0
        L1: state.patientDays.L1 + state.L1 * (1 - (pointOfCareEffect * 0.5)), // Diagnostic AI reduces time at L1
        L2: state.patientDays.L2 + state.L2 * (1 - lengthOfStayEffect), // Bed Management AI reduces length of stay
        L3: state.patientDays.L3 + state.L3 * (1 - lengthOfStayEffect), // Bed Management AI reduces length of stay
    };
    // Calculate episodes touched by AI
    const selfCareActive = params.selfCareAIActive;
    const episodesTouched = state.episodesTouched +
        directToFormal +
        informalToFormal +
        (selfCareActive ? state.I : 0); // Count all informal care patients if selfCareAI is active
    // Final U and I states include patients who abandoned or bypassed queues
    const newU = newUBeforeQueues + totalAbandoned;
    const newI = newIBeforeQueues + totalBypassed;
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
        queues: {
            L0: Math.max(0, currentQueues.L0 + queuedL0 - queueMortalityL0 - queueAbandonL0 - queueBypassL0 - queueClearedL0),
            L1: Math.max(0, currentQueues.L1 + queuedL1 - queueMortalityL1 - queueAbandonL1 - queueBypassL1 - queueClearedL1),
            L2: Math.max(0, currentQueues.L2 + queuedL2 - queueMortalityL2 - queueAbandonL2 - queueBypassL2 - queueClearedL2),
            L3: Math.max(0, currentQueues.L3 + queuedL3 - queueMortalityL3 - queueAbandonL3 - queueBypassL3 - queueClearedL3),
        },
        queueRelatedDeaths: (state.queueRelatedDeaths || 0) + queueMortality,
    };
};
// Calculate economic outcomes
const calculateEconomics = (state, params) => {
    // Calculate total cost
    const patientDaysCost = state.patientDays.I * params.perDiemCosts.I +
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
    // Calculate disability days - now including untreated days
    const disabilityDalys = (state.U + // Include untreated days in disability calculation
        state.patientDays.I + state.patientDays.F + state.patientDays.L0 + state.patientDays.L1 +
        state.patientDays.L2 + state.patientDays.L3) * (params.disabilityWeight / 365.25) * discountFactor;
    const dalys = deathDalys + disabilityDalys;
    return { totalCost, dalys };
};
// Calculate average time to resolution
const calculateTimeToResolution = (weeklyStates, params) => {
    // If we have no data, return 0
    if (weeklyStates.length === 0)
        return 0;
    // Calculate probability of reaching each level based on referral rates
    const pInformal = 1 - params.phi0; // Probability of going to informal care
    const pFormal = params.phi0; // Probability of going to formal care
    // For untreated, it's a portion of those who don't go to formal care
    const pUntreated = pInformal * params.informalCareRatio;
    // Adjust informal care probability to account for the portion who are untreated
    const pInformalAdjusted = pInformal * (1 - params.informalCareRatio);
    // Probability of being at different formal care levels
    const pL0 = pFormal;
    const pL1 = pL0 * params.rho0;
    const pL2 = pL1 * params.rho1;
    const pL3 = pL2 * params.rho2;
    // Calculate weighted average resolution rate based on pathway probabilities
    const weightedResolutionRate = pUntreated * params.muU + // Include untreated spontaneous resolution
        pInformalAdjusted * params.muI +
        pL0 * params.mu0 +
        pL1 * params.mu1 +
        pL2 * params.mu2 +
        pL3 * params.mu3;
    // Expected weeks to resolution is inverse of weighted resolution rate
    // Add a minimum rate to prevent division by zero or unrealistic results
    const minResolutionRate = 0.01; // 1% weekly resolution rate minimum (100 weeks maximum)
    const effectiveRate = Math.max(weightedResolutionRate, minResolutionRate);
    return 1 / effectiveRate;
};
// Main simulation function
const runSimulation = (params, config) => {
    const weeklyStates = [];
    let currentState = initializeState(config.population, params.lambda, config.initialState);
    // Add burn-in period (52 weeks = 1 year) to reach steady state
    const burnInWeeks = 52;
    // Run burn-in period without collecting states
    for (let week = 0; week < burnInWeeks; week++) {
        currentState = runWeek(currentState, params, config.population);
    }
    // Run simulation for specified number of weeks, collecting results
    for (let week = 0; week < config.numWeeks; week++) {
        weeklyStates.push(currentState);
        currentState = runWeek(currentState, params, config.population);
    }
    const finalState = weeklyStates[weeklyStates.length - 1];
    const { totalCost, dalys } = calculateEconomics(finalState, params);
    // Calculate capacity utilization metrics
    let totalQueueLengths = { L0: 0, L1: 0, L2: 0, L3: 0 };
    let peakQueues = { L0: 0, L1: 0, L2: 0, L3: 0 };
    let weeksWithQueues = 0;
    weeklyStates.forEach(state => {
        if (state.queues) {
            totalQueueLengths.L0 += state.queues.L0;
            totalQueueLengths.L1 += state.queues.L1;
            totalQueueLengths.L2 += state.queues.L2;
            totalQueueLengths.L3 += state.queues.L3;
            peakQueues.L0 = Math.max(peakQueues.L0, state.queues.L0);
            peakQueues.L1 = Math.max(peakQueues.L1, state.queues.L1);
            peakQueues.L2 = Math.max(peakQueues.L2, state.queues.L2);
            peakQueues.L3 = Math.max(peakQueues.L3, state.queues.L3);
            if (state.queues.L0 + state.queues.L1 + state.queues.L2 + state.queues.L3 > 0) {
                weeksWithQueues++;
            }
        }
    });
    const averageQueueLength = weeksWithQueues > 0 ? {
        L0: totalQueueLengths.L0 / config.numWeeks,
        L1: totalQueueLengths.L1 / config.numWeeks,
        L2: totalQueueLengths.L2 / config.numWeeks,
        L3: totalQueueLengths.L3 / config.numWeeks,
    } : undefined;
    const totalQueuedPatients = totalQueueLengths.L0 + totalQueueLengths.L1 +
        totalQueueLengths.L2 + totalQueueLengths.L3;
    return {
        weeklyStates,
        cumulativeDeaths: finalState.D,
        cumulativeResolved: finalState.R,
        // Pass the params to the calculateTimeToResolution function
        averageTimeToResolution: calculateTimeToResolution(weeklyStates, params),
        totalCost,
        dalys,
        // Capacity metrics
        averageQueueLength,
        peakQueueLength: (peakQueues.L0 + peakQueues.L1 + peakQueues.L2 + peakQueues.L3) > 0 ? peakQueues : undefined,
        totalQueuedPatients: totalQueuedPatients > 0 ? totalQueuedPatients : undefined,
        queueRelatedDeaths: finalState.queueRelatedDeaths || undefined,
    };
};
exports.runSimulation = runSimulation;
// Calculate ICER between intervention and baseline
const calculateICER = (intervention, baseline) => {
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
exports.calculateICER = calculateICER;
// Predefined geography defaults
exports.healthSystemStrengthDefaults = {
    moderate_urban_system: {
        // Direct System-Wide Parameters
        phi0: 0.65, // Probability of seeking formal care initially
        sigmaI: 0.25, // Probability of transitioning from informal to formal care
        informalCareRatio: 0.15, // Proportion of patients remaining untreated (vs. informal care)
        regionalLifeExpectancy: 70, // Regional life expectancy (years)
        perDiemCosts: {
            I: 12, // Informal care - mix of traditional healers and pharmacies
            F: 25, // Formal entry - urban facilities have higher overhead
            L0: 20, // CHW costs in urban areas (higher stipends)
            L1: 40, // Primary care - aligned with Kenya public data (~$41)
            L2: 120, // District hospitals - between Nigeria ($100) and Kenya ($150)
            L3: 250 // Tertiary hospitals - South Africa lower range
        }, // USD - validated against Kenya, Nigeria, India urban public sector data
        // Multipliers for Disease-Specific Base Rates (1.0 means no change from disease baseline)
        mu_multiplier_I: 1.0, // Resolution in Informal
        mu_multiplier_L0: 1.0, // Resolution at CHW
        mu_multiplier_L1: 1.0, // Resolution at Primary Care
        mu_multiplier_L2: 1.0, // Resolution at District Hospital
        mu_multiplier_L3: 1.0, // Resolution at Tertiary Hospital
        delta_multiplier_U: 1.0, // Death if Untreated
        delta_multiplier_I: 1.0, // Death in Informal
        delta_multiplier_L0: 1.0, // Death at CHW
        delta_multiplier_L1: 1.0, // Death at Primary Care
        delta_multiplier_L2: 1.0, // Death at District Hospital
        delta_multiplier_L3: 1.0, // Death at Tertiary Hospital
        rho_multiplier_L0: 1.0, // Referral CHW to Primary
        rho_multiplier_L1: 1.0, // Referral Primary to District
        rho_multiplier_L2: 1.0, // Referral District to Tertiary
    },
    weak_rural_system: {
        // Direct System-Wide Parameters
        phi0: 0.30, // Lower access/trust
        sigmaI: 0.10, // Harder to transition
        informalCareRatio: 0.40, // Higher proportion untreated or in very basic informal
        regionalLifeExpectancy: 55,
        perDiemCosts: {
            I: 5, // Low-cost informal providers, drug shops
            F: 10, // Basic facility entry costs
            L0: 8, // CHWs with minimal supplies
            L1: 20, // Primary facilities - Bangladesh rural levels
            L2: 80, // District hospitals - limited services
            L3: 200 // Tertiary care - often in distant cities
        }, // USD - based on Bangladesh/Nigeria rural data, includes inefficiencies
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
    strong_urban_system_lmic: {
        // Direct System-Wide Parameters
        phi0: 0.80,
        sigmaI: 0.35,
        informalCareRatio: 0.10,
        regionalLifeExpectancy: 75,
        perDiemCosts: {
            I: 15, // Even informal care is more expensive in well-developed areas
            F: 30, // Better equipped entry points
            L0: 25, // Well-trained, equipped CHWs
            L1: 50, // Primary care approaching middle-income standards
            L2: 180, // District hospitals - India urban public range
            L3: 350 // Tertiary care - approaching South Africa public levels
        }, // USD - based on India/South Africa urban public hospitals
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
    fragile_conflict_system: {
        // Direct System-Wide Parameters
        phi0: 0.20, // Severely limited access due to insecurity, destroyed infrastructure
        sigmaI: 0.08, // Very difficult to transition from informal to formal care
        informalCareRatio: 0.60, // Majority of patients unable to access formal care
        regionalLifeExpectancy: 50, // Significantly reduced life expectancy
        perDiemCosts: {
            I: 4, // Basic informal care, often traditional
            F: 15, // NGO-run entry points
            L0: 20, // CHWs often NGO-supported with supplies
            L1: 40, // Primary clinics with security/logistics costs
            L2: 150, // Field hospitals, high logistics costs
            L3: 400 // Referral to stable areas, very expensive
        }, // USD - includes 20-50% logistics/security premium over base costs
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
    high_income_system: {
        // Direct System-Wide Parameters
        phi0: 0.90, // Very high healthcare seeking
        sigmaI: 0.70, // High transition to formal
        informalCareRatio: 0.05, // Very few remain untreated
        regionalLifeExpectancy: 82, // High life expectancy
        perDiemCosts: {
            I: 30, // Alternative medicine, out-of-network care
            F: 80, // Emergency department triage
            L0: 100, // Community health services
            L1: 250, // Primary care with full diagnostics
            L2: 1000, // Secondary hospitals
            L3: 2500 // Academic medical centers
        }, // USD - based on OECD country data
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
    },
    rwanda_health_system: {
        // Direct System-Wide Parameters
        phi0: 0.92, // Extremely high formal care seeking - almost everyone uses CHWs/clinics
        sigmaI: 0.65, // Very fast transition from informal to formal due to CHW network
        informalCareRatio: 0.02, // Almost no one stays untreated (2% only)
        regionalLifeExpectancy: 68, // Rwanda's current life expectancy
        perDiemCosts: {
            I: 8, // Limited informal sector due to strong formal system
            F: 15, // Health center entry - subsidized by insurance
            L0: 10, // Community health cooperatives (lower cost but high volume)
            L1: 20, // Health centers - often overcrowded (reduced due to volume)
            L2: 80, // District hospitals - operating beyond capacity
            L3: 160 // Referral hospitals - King Faisal, CHUK
        }, // USD - based on Rwanda public sector data with Mutuelle subsidies
        // Multipliers (Severe efficiency challenges create huge AI opportunity)
        mu_multiplier_I: 0.8, // Informal care still works but people prefer formal care
        mu_multiplier_L0: 0.35, // CHWs severely overwhelmed - MASSIVE AI opportunity
        mu_multiplier_L1: 0.3, // Health centers in crisis - CRITICAL diagnostic delays
        mu_multiplier_L2: 0.35, // District hospitals gridlocked - bed management essential
        mu_multiplier_L3: 0.6, // Referral hospitals struggling but better equipped
        delta_multiplier_U: 1.1, // Lower than weak systems due to coverage
        delta_multiplier_I: 1.2,
        delta_multiplier_L0: 1.4, // Overwhelmed CHWs miss critical cases
        delta_multiplier_L1: 1.6, // Long waits lead to deterioration
        delta_multiplier_L2: 1.5, // Bed shortages increase mortality
        delta_multiplier_L3: 1.2,
        rho_multiplier_L0: 0.6, // Many referrals lost due to facility congestion
        rho_multiplier_L1: 0.5, // Severe bottlenecks prevent referral completion
        rho_multiplier_L2: 0.6, // Bed unavailability blocks transfers
    },
    test_perfect_system: {
        // Direct System-Wide Parameters
        phi0: 1.0, // 100% formal care seeking - EVERYONE goes to formal care
        sigmaI: 1.0, // Instant transition (not that it matters with phi0=1)
        informalCareRatio: 1.0, // 100% of non-formal seekers stay untreated (but there are none)
        regionalLifeExpectancy: 80, // High life expectancy
        perDiemCosts: {
            I: 5, // Informal care (no one uses it)
            F: 10, // Formal care entry
            L0: 15, // CHW level
            L1: 30, // Primary care
            L2: 100, // District hospital
            L3: 200 // Tertiary hospital
        },
        // Perfect efficiency multipliers
        mu_multiplier_I: 1.0, // Perfect informal care (but unused)
        mu_multiplier_L0: 1.0, // Perfect CHW efficiency
        mu_multiplier_L1: 1.0, // Perfect primary care
        mu_multiplier_L2: 1.0, // Perfect district hospital
        mu_multiplier_L3: 1.0, // Perfect tertiary care
        delta_multiplier_U: 1.0, // Normal mortality (but no untreated)
        delta_multiplier_I: 1.0, // Normal mortality (but no informal)
        delta_multiplier_L0: 1.0, // Normal CHW mortality
        delta_multiplier_L1: 1.0, // Normal primary mortality
        delta_multiplier_L2: 1.0, // Normal district mortality
        delta_multiplier_L3: 1.0, // Normal tertiary mortality
        rho_multiplier_L0: 1.0, // Perfect referrals
        rho_multiplier_L1: 1.0, // Perfect referrals
        rho_multiplier_L2: 1.0, // Perfect referrals
    }
};
// Predefined disease profiles
exports.diseaseProfiles = {
    congestive_heart_failure: {
        lambda: 0.002, // ~0.2% annual incidence in general population (2,000 cases per million)
        disabilityWeight: 0.42, // moderate-high disability during acute decompensation
        meanAgeOfInfection: 67, // primarily affects older adults
        muI: 0.01, // negligible spontaneous resolution at home (1% per week)
        muU: 0.004, // very low spontaneous recovery rate without any care (0.4% per week)
        mu0: 0.03, // very limited CHW role in resolution (3% per week)
        mu1: 0.35, // moderate resolution at primary care with medications (35% per week)
        mu2: 0.55, // good resolution at district hospital (55% per week)
        mu3: 0.75, // high resolution at tertiary hospital with advanced care (75% per week)
        deltaI: 0.08, // high mortality risk if inadequately treated at home (6% per week)
        deltaU: 0.09, // very high mortality risk if completely untreated (9% per week)
        delta0: 0.04, // high mortality risk at CHW level (5% per week)
        delta1: 0.025, // moderate mortality risk at primary care (3% per week)
        delta2: 0.015, // lower mortality risk at district hospital (2% per week)
        delta3: 0.01, // low mortality risk at tertiary hospital (1% per week)
        rho0: 0.70, // high referral from CHW to primary (70%)
        rho1: 0.55, // substantial referral from primary to district (55%)
        rho2: 0.35, // moderate referral to tertiary for advanced care (35%)
        // Capacity and competition parameters
        capacityShare: 0.08, // CHF patients use ~8% of overall health system capacity
        competitionSensitivity: 1.3, // CHF patients are more affected by congestion (elderly, complex needs)
        clinicalPriority: 0.85, // High priority due to acute decompensation risk
        // Queue-specific parameters
        queueAbandonmentRate: 0.02, // 2% - Patients feel very unwell, less likely to leave
        queueBypassRate: 0.03, // 3% - Limited traditional options for heart failure
        queueClearanceRate: 0.20, // 20% - Complex management, multiple medications
    },
    tuberculosis: {
        lambda: 0.003, // 0.3% annual incidence (300 per 100,000), SSA average
        disabilityWeight: 0.333, // moderate disability weight for active TB
        meanAgeOfInfection: 35, // typical age of TB diagnosis
        muI: 0.02, // very low spontaneous resolution for active TB (2% per week)
        muU: 0.005, // extremely low spontaneous resolution if untreated (0.5% per week)
        mu0: 0.03, // CHW role primarily DOTS/referral, low direct resolution (3% per week)
        mu1: 0.04, // weekly resolution rate on standard 6-month primary care treatment (4% per week, implies ~25wks)
        mu2: 0.05, // slightly better/faster for complex cases at district hospital (5% per week)
        mu3: 0.06, // for severe/MDR-TB cases at tertiary care (6% per week)
        deltaI: 0.0035, // untreated/informal care TB mortality (0.35% per week) - higher in South Africa
        deltaU: 0.004, // completely untreated TB mortality (0.4% per week) - higher in South Africa
        delta0: 0.0025, // mortality at CHW level (0.25% per week, with DOTS support)
        delta1: 0.002, // mortality on treatment at primary care (0.15% per week)
        delta2: 0.0015, // mortality on treatment at district hospital (0.1% per week)
        delta3: 0.001, // mortality for complex/MDR-TB at tertiary (0.08% per week)
        rho0: 0.85, // high referral CHW to primary for diagnosis/treatment (85%)
        rho1: 0.45, // moderate referral primary to district for complications/MDR suspicion (45%)
        rho2: 0.30, // referral district to tertiary for specialized MDR/complex care (30%)
        // Capacity and competition parameters
        capacityShare: 0.05, // TB patients use ~5% of overall health system capacity
        competitionSensitivity: 0.9, // TB patients less affected by congestion (scheduled visits)
        clinicalPriority: 0.7, // Moderate priority (chronic condition with scheduled care)
        // Queue-specific parameters
        queueAbandonmentRate: 0.04, // 4% - Patients understand importance of treatment
        queueBypassRate: 0.05, // 5% - Less traditional treatment, more education
        queueClearanceRate: 0.25, // 25% - Complex protocols, counseling needed
    },
    childhood_pneumonia: {
        lambda: 0.05, // 50,000 cases per million population (affects mainly under-5s)
        disabilityWeight: 0.28, // moderate disability
        meanAgeOfInfection: 3, // primarily affects young children
        muI: 0.10, // some spontaneous resolution, esp. viral (10% per week)
        muU: 0.06, // limited spontaneous resolution if untreated (6% per week)
        mu0: 0.70, // CHW with antibiotics (e.g. Amox DT) for non-severe (70% per week)
        mu1: 0.80, // primary care with antibiotics for non-severe (80% per week)
        mu2: 0.85, // district hospital with oxygen and IV antibiotics (85% per week)
        mu3: 0.90, // tertiary care with ventilatory support if needed (90% per week)
        deltaI: 0.045, // mortality with informal care (3.5% per week)
        deltaU: 0.05, // mortality if completely untreated (5% per week)
        delta0: 0.02, // mortality under CHW care (covers misclassification/delay for severe) (1% per week)
        delta1: 0.015, // mortality under primary care for appropriately treated non-severe (0.5% per week)
        delta2: 0.01, // mortality with oxygen and proper antibiotics (0.8% per week)
        delta3: 0.008, // low mortality with full respiratory support (0.5% per week)
        rho0: 0.60, // CHW referral to primary for danger signs/non-response (60%)
        rho1: 0.30, // primary care referral to district for severe cases (30%)
        rho2: 0.20, // district referral to tertiary for highly complex cases (20%)
        // Capacity and competition parameters
        capacityShare: 0.15, // Childhood pneumonia uses ~15% of health system capacity (high volume)
        competitionSensitivity: 1.5, // Children more affected by congestion (urgent needs, less able to wait)
        clinicalPriority: 0.9, // Very high priority (acute respiratory distress in children)
        // Queue-specific parameters
        queueAbandonmentRate: 0.03, // 3% - Parents very concerned about child breathing
        queueBypassRate: 0.08, // 8% - Some traditional treatments but parents more cautious
        queueClearanceRate: 0.25, // 25% - Careful assessment, oxygen needs
    },
    malaria: {
        lambda: 0.20, // 20% annual incidence in endemic regions of Nigeria (higher than national avg of ~6%)
        disabilityWeight: 0.186, // From IHME GBD, weighted average for uncomplicated and severe cases
        meanAgeOfInfection: 7, // Lower mean age, reflecting higher burden in children in Nigeria
        muI: 0.15, // Spontaneous resolution with traditional/home remedies (~15% weekly)
        muU: 0.08, // Limited spontaneous resolution if completely untreated (8% weekly)
        mu0: 0.75, // CHW with RDTs and ACTs for uncomplicated cases (75% weekly resolution)
        mu1: 0.80, // Primary care with ACTs and better monitoring (80% weekly resolution)
        mu2: 0.90, // District hospital with IV artesunate for severe malaria (90% weekly resolution)
        mu3: 0.95, // Tertiary care with ICU support for complicated malaria (95% weekly resolution)
        deltaI: 0.025, // Mortality with informal care (7.5% weekly - comparable to untreated)
        deltaU: 0.03, // Mortality if completely untreated (7.5% weekly, ~5%-10% range)
        delta0: 0.005, // Mortality under CHW care (0.1% weekly - includes some misdiagnosis/late referral)
        delta1: 0.003, // Mortality under primary care (0.1% weekly - similar to CHW)
        delta2: 0.002, // Mortality with proper severe malaria treatment (1% weekly - AQUAMAT trial)
        delta3: 0.0015, // Low mortality at tertiary with full ICU support (0.5% weekly)
        rho0: 0.25, // CHW referral to primary (danger signs/severe cases) - lower than previous estimate
        rho1: 0.20, // Primary care referral to district (severe malaria) - lower than previous estimate
        rho2: 0.10, // District to tertiary referral (very complicated cases) - lower rate as suggested
        // Capacity and competition parameters
        capacityShare: 0.10, // Malaria uses ~10% of health system capacity in endemic areas
        competitionSensitivity: 1.2, // Malaria patients moderately affected by congestion
        clinicalPriority: 0.8, // High priority (rapid progression possible)
        // Queue-specific parameters
        queueAbandonmentRate: 0.06, // 6% - Patients know it's serious but may seek traditional care
        queueBypassRate: 0.15, // 15% - Traditional antimalarials sometimes used
        queueClearanceRate: 0.40, // 40% - RDT + ACT protocol is fast
    },
    fever: {
        lambda: 0.60, // moderate-high incidence (episodes per person-year)
        disabilityWeight: 0.10, // lower disability weight
        meanAgeOfInfection: 15, // affects all ages
        muI: 0.30, // moderate spontaneous resolution for many fevers (30% per week)
        muU: 0.25, // significant spontaneous resolution for many non-specific fevers (25% per week)
        mu0: 0.55, // CHW (symptomatic relief, advice, identify danger signs) (55% per week)
        mu1: 0.70, // primary care (basic investigation, empiric treatment) (70% per week)
        mu2: 0.80, // district hospital (further investigation) (80% per week)
        mu3: 0.90, // tertiary hospital (extensive investigation) (90% per week)
        deltaI: 0.012, // low mortality for general fevers, but some are serious (0.8% per week)
        deltaU: 0.015, // higher if completely untreated (1.5% per week)
        delta0: 0.008, // mortality at CHW level (0.5% per week)
        delta1: 0.005, // mortality at primary care (0.3% per week)
        delta2: 0.003, // mortality at district hospital (0.2% per week)
        delta3: 0.002, // mortality at tertiary (0.1% per week)
        rho0: 0.30, // CHW referral to primary (persistent/severe fever) (30%)
        rho1: 0.20, // primary care referral to district (unclear diagnosis, non-response) (20%)
        rho2: 0.10, // district referral to tertiary (complex cases) (10%)
        // Capacity and competition parameters
        capacityShare: 0.12, // Fever uses ~12% of health system capacity (common presentation)
        competitionSensitivity: 1.0, // Standard sensitivity to congestion
        clinicalPriority: 0.6, // Moderate priority (often self-limiting)
        // Queue-specific parameters
        queueAbandonmentRate: 0.12, // 12% - May feel better while waiting
        queueBypassRate: 0.25, // 25% - Many traditional remedies available
        queueClearanceRate: 0.45, // 45% - Rapid assessment possible
    },
    diarrhea: {
        lambda: 0.30, // population-adjusted incidence (300,000 cases per million annually)
        disabilityWeight: 0.15, // moderate disability (dehydration)
        meanAgeOfInfection: 2, // primarily affects young children
        muI: 0.35, // moderate spontaneous resolution with home fluids (35% per week)
        muU: 0.20, // reasonable spontaneous resolution even without fluid management (20% per week)
        mu0: 0.85, // CHW with ORS/Zinc for non-severe (85% per week)
        mu1: 0.90, // primary care with ORS/Zinc, antibiotics if dysentery (90% per week)
        mu2: 0.80, // district hospital for severe dehydration/complications (recovery longer) (80% per week)
        mu3: 0.85, // tertiary care for very severe/refractory cases (85% per week)
        deltaI: 0.02, // mortality with informal care (risk of dehydration) (1.5% per week)
        deltaU: 0.025, // mortality if completely untreated (severe dehydration) (2.5% per week)
        delta0: 0.003, // mortality under CHW care (ORS failures, delayed referral for severe) (0.2% per week)
        delta1: 0.002, // mortality under primary care (well-managed non-severe) (0.1% per week)
        delta2: 0.0015, // mortality for severe dehydration/complications at district (1% per week)
        delta3: 0.001, // mortality for very severe cases at tertiary (0.5% per week)
        rho0: 0.50, // CHW referral to primary (danger signs, dehydration, persistent) (50%)
        rho1: 0.30, // primary care referral to district (severe dehydration, not responding) (30%)
        rho2: 0.10, // district referral to tertiary (highly complex cases) (10%)
        // Capacity and competition parameters
        capacityShare: 0.18, // Diarrhea uses ~18% of health system capacity (very high volume in children)
        competitionSensitivity: 1.4, // Children with diarrhea highly affected by congestion (dehydration risk)
        clinicalPriority: 0.85, // High priority (rapid dehydration in children)
        // Queue-specific parameters
        queueAbandonmentRate: 0.08, // 8% - Parents concerned but may try home remedies
        queueBypassRate: 0.18, // 18% - ORS available, traditional treatments common
        queueClearanceRate: 0.40, // 40% - Simple ORS/zinc protocols
    },
    anemia: {
        lambda: 0.05, // 5% annual incidence of symptomatic anemia needing treatment (50,000 per million)
        disabilityWeight: 0.06, // moderate for symptomatic anemia
        meanAgeOfInfection: 15, // bimodal (young children, women of reproductive age)
        muI: 0.05, // some response to dietary changes or informal iron (5% weekly improvement)
        muU: 0.01, // minimal spontaneous improvement without any iron intake (1% per week)
        mu0: 0.15, // CHW providing iron supplements (15% weekly improvement to target Hb)
        mu1: 0.20, // primary care diagnosis, iron supplementation, basic investigation (20% weekly improvement)
        mu2: 0.25, // district hospital for severe anemia/non-response, investigation, transfusion (25% weekly improvement/stabilization)
        mu3: 0.30, // tertiary for complex cases, severe underlying causes (30% weekly improvement/stabilization)
        deltaI: 0.0005, // low mortality for mild/moderate IDA (0.05% weekly)
        deltaU: 0.001, // slightly higher if completely unmanaged (0.1% weekly)
        delta0: 0.0003, // very low mortality with CHW iron (0.03% weekly)
        delta1: 0.0002, // very low mortality with primary care (0.02% weekly)
        delta2: 0.001, // low, relates to complications of severe anemia or underlying cause (0.1% weekly)
        delta3: 0.0008, // low, similar to L2 (0.08% weekly)
        rho0: 0.40, // moderate CHW referral for symptomatic/severe cases or non-response (40%)
        rho1: 0.30, // moderate primary referral for investigation or severe cases (30%)
        rho2: 0.15, // lower district referral for highly specialized investigation (15%)
        // Capacity and competition parameters
        capacityShare: 0.04, // Anemia uses ~4% of health system capacity
        competitionSensitivity: 0.8, // Less affected by congestion (chronic condition)
        clinicalPriority: 0.5, // Lower priority (rarely acute)
        // Queue-specific parameters
        queueAbandonmentRate: 0.10, // 10% - Chronic condition, less urgent feeling
        queueBypassRate: 0.12, // 12% - Traditional iron-rich foods/herbs
        queueClearanceRate: 0.35, // 35% - Blood test + iron supplementation
    },
    hiv_management_chronic: {
        lambda: 0.01, // 1% annual new diagnoses needing linkage to chronic ART care (South Africa context)
        disabilityWeight: 0.078, // low for stable HIV on ART
        meanAgeOfInfection: 30, // typical age of diagnosis
        muI: 0, // No spontaneous viral suppression with self-management 
        muU: 0, // No spontaneous viral suppression if untreated 
        mu0: 0.05, // CHW support for linkage, adherence (5% weekly to stable on ART)
        mu1: 0.10, // primary care initiating ART, counseling, monitoring (10% weekly to stable initial phase)
        mu2: 0.12, // district hospital for complex starts or managing side effects (12% weekly to stable)
        mu3: 0.15, // tertiary for very complex cases, salvage regimens (15% weekly to stable)
        deltaI: 0.0065, // mortality if diagnosed but not linked (0.2% weekly, ~10-year survival)
        deltaU: 0.007, // untreated mortality (0.2% weekly, ~10-year survival)
        delta0: 0.004, // mortality during CHW linkage/support (0.15% weekly)
        delta1: 0.002, // very low mortality on effective ART at primary care (0.01% weekly)
        delta2: 0.0015, // slightly higher for complex cases at district level (0.05% weekly)
        delta3: 0.001, // high mortality for advanced disease at tertiary (2% weekly)
        rho0: 0.90, // high CHW referral for ART initiation (90%)
        rho1: 0.18, // low primary referral if stable, higher if complications (18%)
        rho2: 0.5, // moderate secondary to tertiary referral (50%)
        // Capacity and competition parameters
        capacityShare: 0.06, // HIV chronic care uses ~6% of health system capacity
        competitionSensitivity: 0.7, // Less affected by congestion (scheduled appointments)
        clinicalPriority: 0.7, // Moderate priority (stable chronic care)
        // Queue-specific parameters
        queueAbandonmentRate: 0.02, // 2% - Patients committed to chronic care
        queueBypassRate: 0.02, // 2% - Patients understand need for formal care
        queueClearanceRate: 0.30, // 30% - Standard chronic care visits
    },
    high_risk_pregnancy_low_anc: {
        lambda: 0.02, // 2% of women of reproductive age annually experience this (very rough estimate)
        disabilityWeight: 0.30, // high average disability during complicated HRP
        meanAgeOfInfection: 28, // typical reproductive age
        muI: 0.01, // spontaneous favorable outcome despite HRP & low ANC (very low, 1% weekly)
        muU: 0.005, // extremely low favorable spontaneous outcome with no care (0.5% per week)
        mu0: 0.02, // CHW identifies risk, encourages facility visits (2% weekly improved outcome by CHW alone)
        mu1: 0.10, // primary care (if accessed) basic ANC, identifies major issues (10% weekly successful management of some risks)
        mu2: 0.50, // district hospital managing complications, C-sections (50% weekly resolution of acute complication/delivery)
        mu3: 0.60, // tertiary for severe maternal/fetal complications (60% weekly resolution/delivery)
        deltaI: 0.015, // high mortality/morbidity if HRP managed informally/no ANC (1.5% weekly risk of severe adverse outcome/death)
        deltaU: 0.02, // very high mortality/morbidity if completely unmanaged (2% weekly)
        delta0: 0.01, // high mortality at CHW level (limited intervention for true HRP) (1% weekly)
        delta1: 0.005, // moderate mortality at primary care (can manage some HRP issues) (0.5% weekly)
        delta2: 0.002, // lower mortality at district with C-section, blood (0.2% weekly)
        delta3: 0.001, // lowest mortality at tertiary (0.1% weekly)
        rho0: 0.90, // very high CHW referral for any HRP sign (90%)
        rho1: 0.70, // high primary referral for actual complications (70%)
        rho2: 0.40, // moderate district to tertiary for most severe (40%)
        // Capacity and competition parameters
        capacityShare: 0.03, // High-risk pregnancy uses ~3% of health system capacity
        competitionSensitivity: 2.0, // Extremely affected by congestion (obstetric emergencies)
        clinicalPriority: 0.95, // Very high priority (maternal/fetal emergencies)
        // Queue-specific parameters
        queueAbandonmentRate: 0.01, // 1% - Life-threatening urgency, unlikely to abandon
        queueBypassRate: 0.02, // 2% - Limited safe traditional options
        queueClearanceRate: 0.15, // 15% - Complex obstetric assessments
    },
    urti: {
        lambda: 0.80, // high incidence (800,000 episodes per million population)
        disabilityWeight: 0.01, // very low disability
        meanAgeOfInfection: 10, // affects all ages, common in children
        muI: 0.70, // high spontaneous resolution (70% per week)
        muU: 0.65, // very high spontaneous resolution even without any care (65% per week)
        mu0: 0.75, // CHW (reassurance, symptomatic advice) - similar to spontaneous (75% per week)
        mu1: 0.80, // primary care (similar, rule out more serious) (80% per week)
        mu2: 0.85, // rarely reaches hospital unless misdiagnosed/severe complication (85% per week)
        mu3: 0.90, // (90% per week)
        deltaI: 0.00001, // extremely low mortality (0.001% weekly)
        deltaU: 0.00002, // extremely low mortality (0.002% weekly)
        delta0: 0.00001, // extremely low mortality at CHW level (0.001% weekly)
        delta1: 0.000005, // extremely low mortality at primary care (0.0005% weekly)
        delta2: 0.000001, // negligible, likely related to other severe underlying conditions if at this level (0.0001% weekly)
        delta3: 0.000001, // negligible (0.0001% weekly)
        rho0: 0.05, // low CHW referral, only if danger signs or prolonged (5%)
        rho1: 0.02, // very low primary referral, only if atypical/severe (2%)
        rho2: 0.01, // very low district referral (1%)
        // Capacity and competition parameters
        capacityShare: 0.20, // URTIs use ~20% of health system capacity (very high volume)
        competitionSensitivity: 0.6, // Less affected by congestion (can wait)
        clinicalPriority: 0.3, // Low priority (self-limiting)
        // Queue-specific parameters
        queueAbandonmentRate: 0.15, // 15% - Patients know it's minor, likely to leave
        queueBypassRate: 0.20, // 20% - Many home remedies
        queueClearanceRate: 0.50, // 50% - Quick consultations
    },
    hiv_opportunistic: {
        lambda: 0.005, // Population-adjusted incidence (5,000 cases per million annually)
        disabilityWeight: 0.582, // high disability during acute OI episode
        meanAgeOfInfection: 32, // typical age for HIV-related OIs
        muI: 0, // No spontaneous resolution with informal care
        muU: 0, // No spontaneous resolution without any care
        mu0: 0.08, // Limited CHW role in OI management (8% per week)
        mu1: 0.30, // Primary care with antibiotics/antifungals for some OIs (30% per week)
        mu2: 0.55, // District hospital with IV treatment, diagnostics (55% per week)
        mu3: 0.70, // Tertiary with advanced diagnostics/treatment (70% per week)
        deltaI: 0.002, // Mortality with informal care (0.2% weekly, ~10-year survival)
        deltaU: 0.002, // Untreated mortality (0.2% weekly, ~10-year survival)
        delta0: 0.0015, // Mortality with CHW support (0.15% weekly)
        delta1: 0.0001, // Very low mortality with effective ART & OI treatment at primary care (0.01% weekly)
        delta2: 0.0005, // Slightly higher mortality at district level (0.05% weekly)
        delta3: 0.02, // High mortality for advanced disease at tertiary (2% weekly)
        rho0: 0.90, // Very high CHW referral for OIs (90%)
        rho1: 0.60, // High primary referral for severe/complex OIs (60%)
        rho2: 0.5, // Moderate district to tertiary referral (50%)
        // Capacity and competition parameters
        capacityShare: 0.04, // HIV OIs use ~4% of health system capacity
        competitionSensitivity: 1.6, // Highly affected by congestion (immunocompromised)
        clinicalPriority: 0.9, // Very high priority (life-threatening infections)
        // Queue-specific parameters
        queueAbandonmentRate: 0.01, // 1% - Extremely sick patients, won't leave
        queueBypassRate: 0.01, // 1% - Too sick, need urgent formal care
        queueClearanceRate: 0.15, // 15% - Complex diagnosis and treatment
    }
};
// Default AI cost parameters - based on LMIC pilot and scale-up data
// Fixed costs include infrastructure (connectivity, devices, training)
// Variable costs reflect per-episode marginal costs at scale
exports.defaultAICostParameters = {
    triageAI: {
        fixed: 200000, // Software dev/licensing, tablets, networking, training for ~20 hospitals
        variable: 2.5 // Per-patient cost at scale (server, maintenance)
    },
    chwAI: {
        fixed: 150000, // Devices for CHWs, training programs, supervision setup
        variable: 1.5 // Per-consultation cost (data, cloud services) - drops significantly at scale
    },
    diagnosticAI: {
        fixed: 300000, // Software licensing, integration, equipment upgrades (e.g., digital X-ray)
        variable: 1.0 // Per-test cost at high volume (e.g., CAD4TB at scale ~$0.25-1.00)
    },
    bedManagementAI: {
        fixed: 250000, // IT system setup in major hospitals, staff training
        variable: 1.5 // Per-admission managed (mostly server/support costs)
    },
    hospitalDecisionAI: {
        fixed: 400000, // EHR integration, clinical decision support systems across hospitals
        variable: 3.0 // Per-decision/alert (complex integration, ongoing updates)
    },
    selfCareAI: {
        fixed: 100000, // App development, localization, initial marketing
        variable: 0.5 // Per-user per-year at scale (based on Rwanda Babylon experience)
    }
};
// Default AI uptake parameters - differentiated by user type
exports.defaultAIUptakeParameters = {
    globalUptake: 1.0, // Global multiplier (default 100% - use individual rates)
    // Patient-facing AI interventions (lower uptake due to digital literacy barriers)
    triageAI: 0.33, // 33% - AI Health Advisor (patient-facing)
    selfCareAI: 0.33, // 33% - AI Self-Care Platform (patient-facing)
    // Provider-facing AI interventions (higher uptake due to professional training)
    chwAI: 0.66, // 66% - CHW Decision Support (provider-facing)
    diagnosticAI: 0.66, // 66% - Diagnostic AI (provider-facing)
    bedManagementAI: 0.66, // 66% - Bed Management AI (provider-facing)
    hospitalDecisionAI: 0.66, // 66% - Hospital Decision Support (provider-facing)
    // Setting-specific multipliers
    urbanMultiplier: 1.2, // 20% higher uptake in urban areas
    ruralMultiplier: 0.7 // 30% lower uptake in rural areas
};
// Default AI base effects
exports.defaultAIBaseEffects = {
    triageAI: {
        phi0Effect: 0.15, // 15% increase in formal care seeking (transformative awareness)
        sigmaIEffect: 1.25, // 25% increase in informal to formal transition (transformative routing)
        queuePreventionRate: 0.35, // 35% prevention of inappropriate visits (highly transformative)
        smartRoutingRate: 0.45 // 45% direct routing to correct level (near-optimal triage)
    },
    chwAI: {
        mu0Effect: 0.15, // 15% increase in resolution at CHW level (protocol adherence)
        delta0Effect: 0.97, // 3% reduction in mortality (very conservative)
        rho0Effect: 0.70, // 30% reduction in unnecessary referrals (highly transformative)
        resolutionBoost: 0.20, // 20% additional resolution at L0 (better protocols)
        referralOptimization: 0.40 // 40% further reduction in unnecessary referrals (optimal triage)
    },
    diagnosticAI: {
        mu1Effect: 0.18, // 18% increase in resolution at primary care (accurate diagnosis)
        delta1Effect: 0.97, // 3% reduction in mortality (very conservative)
        rho1Effect: 0.65, // 35% reduction in referrals (transformative diagnostic confidence)
        mu2Effect: 0.12, // 12% increase in resolution at district hospitals
        delta2Effect: 0.98, // 2% reduction in mortality (extremely conservative)
        rho2Effect: 0.75, // 25% reduction in referrals (better case management)
        pointOfCareResolution: 0.35, // 35% additional resolution at L1 (highly transformative)
        referralPrecision: 0.45 // 45% further reduction in referrals (near-perfect triage)
    },
    bedManagementAI: {
        mu2Effect: 0.10, // 10% increase in throughput at district hospitals (better flow)
        mu3Effect: 0.10, // 10% increase in throughput at tertiary hospitals
        lengthOfStayReduction: 0.35, // 35% reduction in length of stay (highly transformative)
        dischargeOptimization: 0.40 // 40% faster discharge processing (near-optimal)
    },
    hospitalDecisionAI: {
        delta2Effect: 0.97, // 3% reduction in mortality (very conservative)
        delta3Effect: 0.97, // 3% reduction in mortality (very conservative)
        treatmentEfficiency: 0.30, // 30% faster recovery (protocol optimization)
        resourceUtilization: 0.40 // 40% better bed utilization (highly transformative)
    },
    selfCareAI: {
        // Health advisor functionality (included in comprehensive platform)
        phi0Effect: 0.12, // 12% increase in formal care seeking (was 0.05 - more transformative)
        sigmaIEffect: 1.20, // 20% increase in informal to formal transition (was 1.10 - transformative routing)
        queuePreventionRate: 0.40, // 40% prevention of inappropriate visits (was 0.30 - highly transformative)
        smartRoutingRate: 0.45, // 45% direct routing to correct level (was 0.35 - near-optimal)
        // Self-care specific functionality
        muIEffect: 0.15, // 15% increase in resolution in informal care (was 0.06 - protocol guidance)
        deltaIEffect: 0.96, // 4% reduction in mortality (was 0.92 - more conservative)
        visitReductionEffect: 0.20, // 20% reduction in unnecessary visits (more realistic)
        routingImprovementEffect: 0.25 // 25% improvement in direct routing (realistic)
    }
};
// Disease-specific AI effect rationales
exports.diseaseAIRationales = {
    childhood_pneumonia: "AI provides exceptional chest X-ray interpretation with 90%+ accuracy, enabling 30% higher resolution rates at primary care. CHW AI dramatically improves respiratory rate counting accuracy and danger sign recognition, achieving 20% higher resolution rates. Effects are larger than adult pneumonia due to critical importance of early detection in children.",
    malaria: "AI microscopy and RDT interpretation achieve 95%+ accuracy, enabling 25-30% higher resolution rates through confident diagnosis and ACT dosing. CHW AI reduces unnecessary referrals by 25% while improving treatment success. Represents ideal use case for point-of-care diagnostic AI.",
    diarrhea: "Self-care AI excels at ORS preparation guidance with 30% mortality reduction. CHW AI improves dehydration assessment through visual cue interpretation, achieving 20% higher resolution. Diagnostic AI provides 25% improvement through electrolyte and severity assessment.",
    tuberculosis: "CAD4TB X-ray AI enables 35% higher resolution at primary care through confident diagnosis. CHW AI focuses on identifying suspects for X-ray screening (25% increase in appropriate referrals). Largest AI diagnostic improvement reflects exceptional technology-disease match.",
    high_risk_pregnancy_low_anc: "CHW AI has limited resolution role (8% improvement) but increases referrals 30% for complications. Ultrasound AI at primary care achieves 20% higher resolution while increasing referrals 20% for specialist care. Conservative CHW approach reflects scope limitations for pregnancy complications.",
    congestive_heart_failure: "Conservative AI effects reflect need for medical management - only 3-5% resolution improvements. However, AI increases referrals 15-25% by identifying decompensation requiring escalation. Self-care AI provides no resolution benefit (0%) as CHF cannot be managed at home.",
    hiv_management_chronic: "Adherence-focused AI achieves 20% higher CHW resolution and 15% higher primary care resolution through personalized medication reminders and side effect management. CHW AI increases referrals 10% for appropriate escalation while diagnostic AI reduces referrals 15% through confident management.",
    urti: "AI provides high confidence for 'do not refer' decisions - 30% referral reduction at both CHW and primary levels. Modest resolution improvements (5-8%) reflect self-limiting nature. AI excels at distinguishing viral URTIs from serious bacterial infections.",
    fever: "AI differential diagnosis achieves 12-15% resolution improvements through better identification of underlying causes. Moderate referral reduction (15%) reflects variable complexity. CHW AI helps with initial assessment while diagnostic AI improves syndrome classification.",
    anemia: "Point-of-care hemoglobin testing AI enables 15-20% resolution improvements through accurate diagnosis and iron supplementation guidance. Baseline 20% referral reduction reflects diagnostic confidence. CHW AI particularly effective for iron deficiency management protocols.",
    hiv_opportunistic: "Uses weighted average approach for mixed simple/complex OI cases. CHW AI helps with cotrimoxazole adherence and simple OIs but increases referrals 35% for complex cases. Diagnostic AI achieves 30% higher resolution through better OI differentiation while increasing referrals 20% for specialist care needs."
};
// Disease-specific AI effects
exports.diseaseSpecificAIEffects = {
    // Childhood pneumonia - diagnostic AI highly effective for X-ray interpretation
    childhood_pneumonia: {
        diagnosticAI: {
            mu1Effect: 0.30, // 30% increase in resolution (X-ray AI confidence)
            delta1Effect: 0.85, // 15% mortality reduction (early treatment)
            rho1Effect: 0.75, // 25% reduction in referrals (confident diagnosis)
            mu2Effect: 0.15, // 15% increase at L2 (advanced chest imaging)
            delta2Effect: 0.88, // 12% mortality reduction at L2
            rho2Effect: 0.85 // 15% reduction in L2 referrals
        },
        chwAI: {
            mu0Effect: 0.20, // 20% increase (respiratory rate counting + protocols)
            delta0Effect: 0.85, // 15% mortality reduction (danger sign recognition)
            rho0Effect: 0.80 // 20% referral reduction
        },
        selfCareAI: {
            muIEffect: 0.02, // 2% - limited self-care impact for pneumonia
            deltaIEffect: 0.98 // 2% mortality reduction (more conservative)
        }
    },
    // Malaria - excellent for RDT interpretation and treatment guidance
    malaria: {
        diagnosticAI: {
            mu1Effect: 0.30, // 30% increase (AI microscopy, RDT reading)
            delta1Effect: 0.80, // 20% mortality reduction
            rho1Effect: 0.75, // 25% referral reduction
            mu2Effect: 0.12, // 12% increase at L2 (severe malaria management)
            delta2Effect: 0.85, // 15% mortality reduction at L2
            rho2Effect: 0.90 // 10% reduction in L2 referrals
        },
        chwAI: {
            mu0Effect: 0.25, // 25% increase (RDT guidance, ACT dosing)
            delta0Effect: 0.85, // 15% mortality reduction
            rho0Effect: 0.75 // 25% referral reduction
        },
        selfCareAI: {
            muIEffect: 0.05, // 5% - moderate impact (prevention education)
            deltaIEffect: 0.95 // 5% mortality reduction (more conservative)
        }
    },
    // Diarrhea - self-care AI very effective for ORS preparation
    diarrhea: {
        selfCareAI: {
            muIEffect: 0.25, // 25% increase (ORS preparation guidance - highly effective)
            deltaIEffect: 0.92 // 8% mortality reduction (more conservative)
        },
        chwAI: {
            mu0Effect: 0.20, // 20% increase (dehydration assessment)
            delta0Effect: 0.80, // 20% mortality reduction
            rho0Effect: 0.80 // 20% referral reduction
        },
        diagnosticAI: {
            mu1Effect: 0.25, // 25% increase (dehydration + electrolyte assessment)
            delta1Effect: 0.85, // 15% mortality reduction
            rho1Effect: 0.80, // 20% referral reduction
            mu2Effect: 0.10, // 10% increase at L2 (severe dehydration management)
            delta2Effect: 0.90, // 10% mortality reduction at L2
            rho2Effect: 0.92 // 8% reduction in L2 referrals
        },
        triageAI: {
            phi0Effect: 0.12, // 12% increase in care seeking (danger signs)
            sigmaIEffect: 1.25 // 25% faster transition to formal care
        }
    },
    // TB - diagnostic AI excellent for chest X-ray screening
    tuberculosis: {
        chwAI: {
            mu0Effect: 0.08, // 8% increase (limited - DOTS support only)
            delta0Effect: 0.90, // 10% mortality reduction
            rho0Effect: 1.25 // 25% increase referrals (identify suspects needing X-ray)
        },
        diagnosticAI: {
            mu1Effect: 0.35, // 35% increase (CAD4TB X-ray screening)
            delta1Effect: 0.75, // 25% mortality reduction (early detection)
            rho1Effect: 0.75, // 25% referral reduction (X-ray confidence)
            mu2Effect: 0.20, // 20% increase at L2 (drug resistance prediction)
            delta2Effect: 0.80, // 20% mortality reduction at L2
            rho2Effect: 0.80 // 20% reduction in L2 referrals
        },
        hospitalDecisionAI: {
            delta2Effect: 0.85, // 15% mortality reduction (MDR-TB detection)
            delta3Effect: 0.85 // 15% mortality reduction
        },
        selfCareAI: {
            muIEffect: 0.20, // 20% increase (adherence support highly effective)
            deltaIEffect: 0.92 // 8% mortality reduction (more conservative)
        }
    },
    // Maternal health - comprehensive AI support
    high_risk_pregnancy_low_anc: {
        chwAI: {
            mu0Effect: 0.08, // 8% increase (limited CHW role for complications)
            delta0Effect: 0.90, // 10% mortality reduction
            rho0Effect: 1.30 // 30% increase referrals (complications need specialist care)
        },
        diagnosticAI: {
            mu1Effect: 0.15, // 15% increase (ultrasound AI - more conservative)
            delta1Effect: 0.90, // 10% mortality reduction (conservative)
            rho1Effect: 1.25, // 25% increase in appropriate referrals (transformative for high-risk identification)
            mu2Effect: 0.12, // 12% increase at L2 (fetal monitoring AI)
            delta2Effect: 0.92, // 8% mortality reduction at L2 (conservative)
            rho2Effect: 1.15 // 15% increase in L2 referrals (better triage)
        },
        triageAI: {
            phi0Effect: 0.20, // 20% increase in facility delivery
            sigmaIEffect: 1.30 // 30% faster transition
        },
        hospitalDecisionAI: {
            delta2Effect: 0.85, // 15% mortality reduction (more realistic for hemorrhage protocols)
            delta3Effect: 0.85 // 15% mortality reduction (still significant but more conservative)
        },
        selfCareAI: {
            muIEffect: 0.15, // 15% increase (pregnancy monitoring and education)
            deltaIEffect: 0.90 // 10% mortality reduction (more conservative)
        }
    },
    // Congestive heart failure - limited AI impact
    congestive_heart_failure: {
        selfCareAI: {
            muIEffect: 0.00, // 0% - no resolution in informal care
            deltaIEffect: 1.0 // No mortality reduction (needs medical care)
        },
        triageAI: {
            phi0Effect: 0.15, // 15% increase in care seeking
            sigmaIEffect: 1.20 // 20% faster transition (referral guidance)
        },
        chwAI: {
            mu0Effect: 0.02, // 2% increase (limited CHW role)
            delta0Effect: 0.95, // 5% mortality reduction
            rho0Effect: 1.15 // 15% increase in referrals (AI identifies decompensation)
        },
        diagnosticAI: {
            mu1Effect: 0.03, // 3% increase (basic assessment)
            delta1Effect: 0.90, // 10% mortality reduction
            rho1Effect: 1.10, // 10% increase in referrals (complex cases need specialist care)
            mu2Effect: 0.08, // 8% increase at L2 (echocardiogram AI, fluid management)
            delta2Effect: 0.85, // 15% mortality reduction at L2
            rho2Effect: 1.05 // 5% increase in L2 referrals
        },
        bedManagementAI: {
            mu2Effect: 0.05, // 5% increase (optimal fluid management)
            mu3Effect: 0.05 // 5% increase
        }
    },
    // HIV management - adherence focus
    hiv_management_chronic: {
        selfCareAI: {
            muIEffect: 0.30, // 30% increase (adherence is critical - highly effective)
            deltaIEffect: 0.92 // 8% mortality reduction (more conservative)
        },
        chwAI: {
            mu0Effect: 0.15, // 15% increase (adherence counseling)
            delta0Effect: 0.85, // 15% mortality reduction
            rho0Effect: 1.05 // 5% increase in referrals (appropriate escalation)
        },
        diagnosticAI: {
            mu1Effect: 0.10, // 10% increase (viral load prediction)
            delta1Effect: 0.85, // 15% mortality reduction
            rho1Effect: 0.90, // 10% referral reduction
            mu2Effect: 0.12, // 12% increase at L2 (resistance testing AI)
            delta2Effect: 0.82, // 18% mortality reduction at L2
            rho2Effect: 0.88 // 12% reduction in L2 referrals
        }
    },
    // Simple conditions - minimal AI impact
    urti: {
        chwAI: {
            mu0Effect: 0.08, // 8% increase (symptom assessment)
            delta0Effect: 0.98, // 2% mortality reduction
            rho0Effect: 0.70 // 30% referral reduction (high confidence benign)
        },
        diagnosticAI: {
            mu1Effect: 0.05, // 5% increase (rule out serious causes)
            delta1Effect: 0.98, // 2% mortality reduction
            rho1Effect: 0.70, // 30% referral reduction (high confidence benign)
            mu2Effect: 0.03, // 3% increase at L2 (minimal complexity)
            delta2Effect: 0.98, // 2% mortality reduction at L2
            rho2Effect: 0.75 // 25% reduction in L2 referrals
        },
        selfCareAI: {
            muIEffect: 0.08, // 8% - minor improvement (increased process effect)
            deltaIEffect: 0.97 // 3% mortality reduction (more conservative)
        }
    },
    // Fever - moderate AI benefit
    fever: {
        chwAI: {
            mu0Effect: 0.12, // 12% increase (symptom evaluation)
            delta0Effect: 0.90, // 10% mortality reduction
            rho0Effect: 0.85 // 15% referral reduction
        },
        diagnosticAI: {
            mu1Effect: 0.15, // 15% increase (better differential diagnosis)
            delta1Effect: 0.88, // 12% mortality reduction
            rho1Effect: 0.85, // 15% referral reduction
            mu2Effect: 0.10, // 10% increase at L2 (advanced diagnostic workup)
            delta2Effect: 0.90, // 10% mortality reduction at L2
            rho2Effect: 0.87 // 13% reduction in L2 referrals
        },
        triageAI: {
            phi0Effect: 0.10, // 10% increase in care seeking (identify serious causes)
            sigmaIEffect: 1.20 // 20% faster transition
        },
        selfCareAI: {
            muIEffect: 0.10, // 10% increase (symptomatic care guidance - increased)
            deltaIEffect: 0.96 // 4% mortality reduction (more conservative)
        }
    },
    // Anemia - targeted AI benefits
    anemia: {
        chwAI: {
            mu0Effect: 0.15, // 15% increase (iron supplementation guidance)
            delta0Effect: 0.95, // 5% mortality reduction
            rho0Effect: 0.80 // 20% referral reduction
        },
        diagnosticAI: {
            mu1Effect: 0.20, // 20% increase (point-of-care hemoglobin testing)
            delta1Effect: 0.90, // 10% mortality reduction
            rho1Effect: 0.80, // 20% referral reduction
            mu2Effect: 0.15, // 15% increase at L2 (comprehensive workup for severe anemia)
            delta2Effect: 0.85, // 15% mortality reduction at L2
            rho2Effect: 0.82 // 18% reduction in L2 referrals
        },
        selfCareAI: {
            muIEffect: 0.08, // 8% increase (dietary guidance - increased process effect)
            deltaIEffect: 0.99 // 1% mortality reduction (even more conservative)
        }
    },
    // HIV opportunistic infections - weighted average for mixed complexity
    hiv_opportunistic: {
        chwAI: {
            mu0Effect: 0.08, // 8% increase (cotrimoxazole adherence + simple OI management)
            delta0Effect: 0.90, // 10% mortality reduction
            rho0Effect: 1.35 // 35% increase referrals (complex cases outweigh simple ones)
        },
        diagnosticAI: {
            mu1Effect: 0.30, // 30% increase (better OI recognition and differentiation)
            delta1Effect: 0.85, // 15% mortality reduction
            rho1Effect: 1.20, // 20% increase referrals (complex OIs need specialist care)
            mu2Effect: 0.25, // 25% increase at L2 (complex OI management protocols)
            delta2Effect: 0.80, // 20% mortality reduction at L2
            rho2Effect: 1.10 // 10% increase in L2 referrals (very complex cases)
        },
        triageAI: {
            phi0Effect: 0.15, // 15% increase in care seeking (symptom recognition)
            sigmaIEffect: 1.30 // 30% faster transition (urgent OI symptoms)
        },
        hospitalDecisionAI: {
            delta2Effect: 0.85, // 15% mortality reduction (complex OI management)
            delta3Effect: 0.80 // 20% mortality reduction
        }
    },
    // Congestive Heart Failure - very low self-care amenability, high hospital AI impact
    congestive_heart_failure: {
        selfCareAI: {
            // Multiply base effects by 0.1 (Very Low amenability)
            muIEffect: 0.015, // 1.5% - minimal self-care impact (only medication tracking)
            deltaIEffect: 0.996, // 0.4% mortality reduction (very limited)
            visitReductionEffect: 0.02, // 2% visit reduction (minimal)
            routingImprovementEffect: 0.025 // 2.5% routing improvement
        },
        triageAI: {
            // High effectiveness (0.9 multiplier)
            queuePreventionRate: 0.36, // 36% prevention (0.4 * 0.9)
            smartRoutingRate: 0.405, // 40.5% routing (0.45 * 0.9)
            phi0Effect: 0.108, // 10.8% increase in care seeking
            sigmaIEffect: 1.18 // 18% increase in transition
        },
        chwAI: {
            // Low effectiveness (0.3 multiplier) - CHF needs specialist care
            mu0Effect: 0.045, // 4.5% increase (0.15 * 0.3)
            delta0Effect: 0.97, // 3% mortality reduction (limited CHW capability)
            rho0Effect: 1.06 // Actually increase referrals by 6% (complexity recognition)
        },
        diagnosticAI: {
            // Moderate effectiveness (0.7 multiplier)
            mu1Effect: 0.14, // 14% increase (0.20 * 0.7)
            delta1Effect: 0.91, // 9% mortality reduction
            rho1Effect: 0.86, // 14% referral reduction
            mu2Effect: 0.105, // 10.5% increase at L2
            delta2Effect: 0.895, // 10.5% mortality reduction at L2
            rho2Effect: 0.93 // 7% reduction in L2 referrals
        },
        bedManagementAI: {
            // High effectiveness (0.9 multiplier) - critical for CHF
            lengthOfStayReduction: 0.18, // 18% reduction (0.20 * 0.9)
            dischargeOptimization: 0.135 // 13.5% improvement (0.15 * 0.9)
        },
        hospitalDecisionAI: {
            // High effectiveness (0.9 multiplier) - complex decisions
            treatmentEfficiency: 0.225, // 22.5% improvement (0.25 * 0.9)
            resourceUtilization: 0.27, // 27% improvement (0.30 * 0.9)
            delta2Effect: 0.82, // 18% mortality reduction (high impact)
            delta3Effect: 0.77 // 23% mortality reduction
        }
    },
    // Default for any disease not specifically configured
    default: exports.defaultAIBaseEffects
};
// Apply AI intervention effects to parameters
const applyAIInterventions = (baseParams, interventions, effectMagnitudes = {}, costParams = exports.defaultAICostParameters, baseEffects = exports.defaultAIBaseEffects, disease, uptakeParams = exports.defaultAIUptakeParameters, isUrban = true) => {
    console.log('🔧 DEBUG applyAIInterventions called with interventions:', interventions);
    console.log('🔧 DEBUG selfCareAI state:', interventions.selfCareAI);
    console.log('🔧 DEBUG uptake parameters:', uptakeParams);
    console.log('🔧 DEBUG isUrban:', isUrban);
    const modifiedParams = { ...baseParams };
    // Reset aiFixedCost and aiVariableCost to 0 before applying interventions
    modifiedParams.aiFixedCost = 0;
    modifiedParams.aiVariableCost = 0;
    // Initialize all AI activation flags to false
    modifiedParams.selfCareAIActive = false;
    // Get disease-specific effects or use defaults
    const getDiseaseEffects = (interventionType) => {
        if (disease && exports.diseaseSpecificAIEffects[disease] && exports.diseaseSpecificAIEffects[disease][interventionType]) {
            // Merge disease-specific effects with base effects to ensure all properties are available
            return {
                ...baseEffects[interventionType],
                ...exports.diseaseSpecificAIEffects[disease][interventionType]
            };
        }
        return baseEffects[interventionType];
    };
    // Calculate setting-specific multiplier
    const settingMultiplier = isUrban ? uptakeParams.urbanMultiplier : uptakeParams.ruralMultiplier;
    // Helper function to get effective uptake for an intervention
    const getEffectiveUptake = (interventionType) => {
        const baseUptake = uptakeParams[interventionType] || 0;
        const effectiveUptake = baseUptake * uptakeParams.globalUptake * settingMultiplier;
        // Ensure uptake stays within bounds [0, 1]
        return Math.max(0, Math.min(1, effectiveUptake));
    };
    // Helper function to apply magnitude and uptake to an effect
    const applyMagnitude = (key, baseEffect, isMultiplier = false, interventionType) => {
        const magnitude = effectMagnitudes[key] !== undefined ? effectMagnitudes[key] : 1;
        // Get uptake for this intervention if specified
        const uptake = interventionType ? getEffectiveUptake(interventionType) : 1.0;
        // If magnitude is 0 or uptake is 0, return a value that results in no effect
        if (magnitude === 0 || uptake === 0) {
            return isMultiplier ? 1.0 : 0.0;
        }
        if (isMultiplier) {
            // For multipliers (like 0.85 for reduction), we need to adjust differently
            // Scale the effect by uptake
            if (baseEffect < 1) {
                // For reduction multipliers (e.g., 0.85 means 15% reduction)
                const reduction = (1 - baseEffect) * magnitude * uptake;
                return 1 - reduction;
            }
            else {
                // For increase multipliers (e.g., 1.15 means 15% increase)
                const increase = (baseEffect - 1) * magnitude * uptake;
                return 1 + increase;
            }
        }
        else {
            // For additive effects, multiply by magnitude and uptake
            return baseEffect * magnitude * uptake;
        }
    };
    if (interventions.triageAI) {
        // Triage AI improves formal care seeking and transitions from informal care
        const triageEffects = getDiseaseEffects('triageAI');
        const uptake = getEffectiveUptake('triageAI');
        modifiedParams.phi0 += applyMagnitude('triageAI_φ₀', triageEffects.phi0Effect, false, 'triageAI');
        modifiedParams.sigmaI *= applyMagnitude('triageAI_σI', triageEffects.sigmaIEffect, true, 'triageAI');
        // Add queue-reduction effects
        if (triageEffects.queuePreventionRate !== undefined) {
            modifiedParams.queuePreventionRate = applyMagnitude('triageAI_queuePrevention', triageEffects.queuePreventionRate, false, 'triageAI');
        }
        if (triageEffects.smartRoutingRate !== undefined) {
            modifiedParams.smartRoutingRate = applyMagnitude('triageAI_smartRouting', triageEffects.smartRoutingRate, false, 'triageAI');
        }
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.triageAI.fixed;
        modifiedParams.aiVariableCost += costParams.triageAI.variable * uptake;
    }
    if (interventions.chwAI) {
        const chwEffects = getDiseaseEffects('chwAI');
        const uptake = getEffectiveUptake('chwAI');
        modifiedParams.mu0 += applyMagnitude('chwAI_μ₀', chwEffects.mu0Effect, false, 'chwAI');
        modifiedParams.delta0 *= applyMagnitude('chwAI_δ₀', chwEffects.delta0Effect, true, 'chwAI');
        modifiedParams.rho0 *= applyMagnitude('chwAI_ρ₀', chwEffects.rho0Effect, true, 'chwAI');
        // Add queue-reduction effects
        if (chwEffects.resolutionBoost !== undefined) {
            modifiedParams.resolutionBoost = applyMagnitude('chwAI_resolutionBoost', chwEffects.resolutionBoost, false, 'chwAI');
        }
        if (chwEffects.referralOptimization !== undefined) {
            modifiedParams.referralOptimization = applyMagnitude('chwAI_referralOptimization', chwEffects.referralOptimization, false, 'chwAI');
        }
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.chwAI.fixed;
        modifiedParams.aiVariableCost += costParams.chwAI.variable * uptake;
    }
    if (interventions.diagnosticAI) {
        const diagnosticEffects = getDiseaseEffects('diagnosticAI');
        const uptake = getEffectiveUptake('diagnosticAI');
        // L1 (Primary Care) effects
        modifiedParams.mu1 += applyMagnitude('diagnosticAI_μ₁', diagnosticEffects.mu1Effect, false, 'diagnosticAI');
        modifiedParams.delta1 *= applyMagnitude('diagnosticAI_δ₁', diagnosticEffects.delta1Effect, true, 'diagnosticAI');
        modifiedParams.rho1 *= applyMagnitude('diagnosticAI_ρ₁', diagnosticEffects.rho1Effect, true, 'diagnosticAI');
        // L2 (District Hospital) effects
        if (diagnosticEffects.mu2Effect !== undefined) {
            modifiedParams.mu2 += applyMagnitude('diagnosticAI_μ₂', diagnosticEffects.mu2Effect, false, 'diagnosticAI');
        }
        if (diagnosticEffects.delta2Effect !== undefined) {
            modifiedParams.delta2 *= applyMagnitude('diagnosticAI_δ₂', diagnosticEffects.delta2Effect, true, 'diagnosticAI');
        }
        if (diagnosticEffects.rho2Effect !== undefined) {
            modifiedParams.rho2 *= applyMagnitude('diagnosticAI_ρ₂', diagnosticEffects.rho2Effect, true, 'diagnosticAI');
        }
        // Add queue-reduction effects
        if (diagnosticEffects.pointOfCareResolution !== undefined) {
            modifiedParams.pointOfCareResolution = applyMagnitude('diagnosticAI_pointOfCareResolution', diagnosticEffects.pointOfCareResolution, false, 'diagnosticAI');
        }
        if (diagnosticEffects.referralPrecision !== undefined) {
            modifiedParams.referralPrecision = applyMagnitude('diagnosticAI_referralPrecision', diagnosticEffects.referralPrecision, false, 'diagnosticAI');
        }
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.diagnosticAI.fixed;
        modifiedParams.aiVariableCost += costParams.diagnosticAI.variable * uptake;
    }
    if (interventions.bedManagementAI) {
        const bedMgmtEffects = getDiseaseEffects('bedManagementAI');
        const uptake = getEffectiveUptake('bedManagementAI');
        modifiedParams.mu2 += applyMagnitude('bedManagementAI_μ₂', bedMgmtEffects.mu2Effect, false, 'bedManagementAI');
        modifiedParams.mu3 += applyMagnitude('bedManagementAI_μ₃', bedMgmtEffects.mu3Effect, false, 'bedManagementAI');
        // Add queue-reduction effects
        if (bedMgmtEffects.lengthOfStayReduction !== undefined) {
            modifiedParams.lengthOfStayReduction = applyMagnitude('bedManagementAI_lengthOfStay', bedMgmtEffects.lengthOfStayReduction, false, 'bedManagementAI');
        }
        if (bedMgmtEffects.dischargeOptimization !== undefined) {
            modifiedParams.dischargeOptimization = applyMagnitude('bedManagementAI_discharge', bedMgmtEffects.dischargeOptimization, false, 'bedManagementAI');
        }
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.bedManagementAI.fixed;
        modifiedParams.aiVariableCost += costParams.bedManagementAI.variable * uptake;
    }
    if (interventions.hospitalDecisionAI) {
        const hospitalEffects = getDiseaseEffects('hospitalDecisionAI');
        const uptake = getEffectiveUptake('hospitalDecisionAI');
        modifiedParams.delta2 *= applyMagnitude('hospitalDecisionAI_δ₂', hospitalEffects.delta2Effect, true, 'hospitalDecisionAI');
        modifiedParams.delta3 *= applyMagnitude('hospitalDecisionAI_δ₃', hospitalEffects.delta3Effect, true, 'hospitalDecisionAI');
        // Add queue-reduction effects
        if (hospitalEffects.treatmentEfficiency !== undefined) {
            modifiedParams.treatmentEfficiency = applyMagnitude('hospitalDecisionAI_treatment', hospitalEffects.treatmentEfficiency, false, 'hospitalDecisionAI');
        }
        if (hospitalEffects.resourceUtilization !== undefined) {
            modifiedParams.resourceUtilization = applyMagnitude('hospitalDecisionAI_resource', hospitalEffects.resourceUtilization, false, 'hospitalDecisionAI');
        }
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.hospitalDecisionAI.fixed;
        modifiedParams.aiVariableCost += costParams.hospitalDecisionAI.variable * uptake;
    }
    // Store self-care AI effects that need to be applied after parameter capping
    let selfCareVisitReductionEffect;
    let selfCareRoutingImprovementEffect;
    let selfCareUptake = 0;
    if (interventions.selfCareAI) {
        const selfCareEffects = getDiseaseEffects('selfCareAI');
        const uptake = getEffectiveUptake('selfCareAI');
        selfCareUptake = uptake;
        console.log('🔧 DEBUG selfCareAI effects:', selfCareEffects);
        console.log('🔧 DEBUG selfCareAI uptake:', uptake);
        console.log('🔧 DEBUG phi0Effect:', selfCareEffects.phi0Effect);
        console.log('🔧 DEBUG sigmaIEffect:', selfCareEffects.sigmaIEffect);
        // Health advisor functionality (included in comprehensive platform)
        if (selfCareEffects.phi0Effect !== undefined) {
            const oldPhi0 = modifiedParams.phi0;
            modifiedParams.phi0 += applyMagnitude('selfCareAI_φ₀', selfCareEffects.phi0Effect, false, 'selfCareAI');
            console.log('🔧 DEBUG phi0 changed from', oldPhi0, 'to', modifiedParams.phi0);
        }
        else {
            console.log('🔧 DEBUG phi0Effect is undefined!');
        }
        if (selfCareEffects.sigmaIEffect !== undefined) {
            const oldSigmaI = modifiedParams.sigmaI;
            modifiedParams.sigmaI *= applyMagnitude('selfCareAI_σI', selfCareEffects.sigmaIEffect, true, 'selfCareAI');
            console.log('🔧 DEBUG sigmaI changed from', oldSigmaI, 'to', modifiedParams.sigmaI);
        }
        else {
            console.log('🔧 DEBUG sigmaIEffect is undefined!');
        }
        if (selfCareEffects.queuePreventionRate !== undefined) {
            modifiedParams.queuePreventionRate = applyMagnitude('selfCareAI_queuePrevention', selfCareEffects.queuePreventionRate, false, 'selfCareAI');
        }
        if (selfCareEffects.smartRoutingRate !== undefined) {
            modifiedParams.smartRoutingRate = applyMagnitude('selfCareAI_smartRouting', selfCareEffects.smartRoutingRate, false, 'selfCareAI');
        }
        // Self-care specific functionality
        modifiedParams.muI += applyMagnitude('selfCareAI_μI', selfCareEffects.muIEffect, false, 'selfCareAI');
        modifiedParams.deltaI *= applyMagnitude('selfCareAI_δI', selfCareEffects.deltaIEffect, true, 'selfCareAI');
        // Store visit reduction and routing effects to be applied after parameter capping
        selfCareVisitReductionEffect = selfCareEffects.visitReductionEffect;
        selfCareRoutingImprovementEffect = selfCareEffects.routingImprovementEffect;
        // Scale costs by uptake
        modifiedParams.aiFixedCost += costParams.selfCareAI.fixed;
        modifiedParams.aiVariableCost += costParams.selfCareAI.variable * uptake;
        modifiedParams.selfCareAIActive = true; // Set the flag indicating self-care AI is active
    }
    // Ensure all probability parameters stay within valid bounds (0 to 1) after AI effects are applied
    const probabilityParams = [
        'muI', 'mu0', 'mu1', 'mu2', 'mu3',
        'deltaU', 'deltaI', 'delta0', 'delta1', 'delta2', 'delta3',
        'rho0', 'rho1', 'rho2',
        'phi0', 'sigmaI'
    ];
    for (const param of probabilityParams) {
        if (modifiedParams[param] > 1) {
            console.warn(`AI intervention caused ${param} to exceed 1.0 (${modifiedParams[param]}), capping at 1.0`);
            modifiedParams[param] = 1;
        }
        if (modifiedParams[param] < 0) {
            console.warn(`AI intervention caused ${param} to go below 0 (${modifiedParams[param]}), setting to 0`);
            modifiedParams[param] = 0;
        }
    }
    // Apply self-care AI visit reduction and routing improvements AFTER parameter capping
    if (interventions.selfCareAI) {
        // Helper function to apply magnitude and uptake to an effect
        const applyMagnitude = (key, baseEffect, isMultiplier = false, interventionType) => {
            const magnitude = effectMagnitudes[key] !== undefined ? effectMagnitudes[key] : 1;
            const uptake = interventionType ? selfCareUptake : 1.0;
            if (isMultiplier) {
                const scaledEffect = 1 + (baseEffect - 1) * magnitude * uptake;
                return scaledEffect;
            }
            else {
                const scaledEffect = baseEffect * magnitude * uptake;
                return scaledEffect;
            }
        };
        // Add routing improvements for congestion management
        // CRITICAL: Scale visit reduction by actual informal care usage
        // Self-care apps only prevent visits from those who would use informal care
        if (selfCareVisitReductionEffect !== undefined) {
            const informalCareUsage = (1 - modifiedParams.phi0) * (1 - modifiedParams.informalCareRatio);
            const scaledVisitReduction = selfCareVisitReductionEffect * informalCareUsage;
            modifiedParams.visitReduction = applyMagnitude('selfCareAI_visitReduction', scaledVisitReduction, false, 'selfCareAI');
            console.log(`Self-care AI visit reduction scaled by informal usage: ${selfCareVisitReductionEffect} * ${informalCareUsage} = ${scaledVisitReduction}`);
        }
        if (selfCareRoutingImprovementEffect !== undefined) {
            modifiedParams.directRoutingImprovement = applyMagnitude('selfCareAI_directRoutingImprovement', selfCareRoutingImprovementEffect, false, 'selfCareAI');
        }
    }
    return modifiedParams;
};
exports.applyAIInterventions = applyAIInterventions;
// Default baseline parameters
const getDefaultParameters = () => ({
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
    deltaI: 0.012,
    deltaU: 0.015,
    muU: 0.05, // Default: 5% weekly chance of spontaneous resolution for untreated patients
    mu0: 0.50,
    delta0: 0.008,
    rho0: 0.75,
    mu1: 0.60,
    delta1: 0.005,
    rho1: 0.25,
    mu2: 0.70,
    delta2: 0.003,
    rho2: 0.15,
    mu3: 0.80,
    delta3: 0.002,
    // AI effectiveness parameters - conservative estimates
    selfCareAIEffectMuI: 0.08, // 8% improvement in resolution from self-care AI (reduced from 15%)
    selfCareAIEffectDeltaI: 0.85, // 15% reduction in mortality from self-care AI (reduced from 30%)
    selfCareAIActive: false, // Default to inactive
    // Economic parameters - validated against recent LMIC data (2019-2024)
    perDiemCosts: {
        I: 10, // informal care (traditional healers, pharmacies, self-medication)
        F: 20, // formal care entry point cost (triage, registration, initial assessment)
        L0: 15, // community health workers (basic supplies, stipends) - lower than originally estimated
        L1: 35, // primary care facilities (staff, basic diagnostics, drugs) - aligned with India/Kenya data
        L2: 100, // district hospitals (inpatient care, surgery, specialists) - reduced based on research
        L3: 200, // tertiary hospitals (ICU, complex procedures, subspecialists) - adjusted to LMIC reality
    },
    aiFixedCost: 0,
    aiVariableCost: 0,
    discountRate: 0,
    yearsOfLifeLost: 30,
    regionalLifeExpectancy: 70,
    // System capacity parameters
    systemCongestion: 0, // Default: no congestion
    // Queue dynamics parameters
    queueAbandonmentRate: 0.15, // Default: 15% abandon per week (increased from 5%)
    queueBypassRate: 0.20, // Default: 20% seek alternative care per week (increased from 10%)
    queueClearanceRate: 0.3, // Default: 30% of queue can be cleared per week
    queueSelfResolveRate: 0.10, // Default: 10% self-resolve per week (new parameter)
});
exports.getDefaultParameters = getDefaultParameters;
const sanitizeModelParameters = (params) => {
    const sanitizedParams = { ...params };
    for (const key in sanitizedParams) {
        if (Object.prototype.hasOwnProperty.call(sanitizedParams, key)) {
            const paramKey = key;
            const value = sanitizedParams[paramKey];
            if (typeof value === 'number') {
                if (isNaN(value)) {
                    console.warn(`Sanitizing NaN for parameter ${paramKey}, defaulting to 0.`);
                    sanitizedParams[paramKey] = 0;
                }
                else if (!isFinite(value)) {
                    console.warn(`Sanitizing Infinity for parameter ${paramKey}, clamping.`);
                    sanitizedParams[paramKey] = value > 0 ? Number.MAX_VALUE : -Number.MAX_VALUE;
                }
            }
            else if (typeof value === 'object' && value !== null && paramKey === 'perDiemCosts') {
                // Sanitize nested perDiemCosts
                const sanitizedPerDiemCosts = { ...value };
                for (const costKey in sanitizedPerDiemCosts) {
                    if (Object.prototype.hasOwnProperty.call(sanitizedPerDiemCosts, costKey)) {
                        const perDiemKey = costKey;
                        const costValue = sanitizedPerDiemCosts[perDiemKey];
                        if (isNaN(costValue)) {
                            console.warn(`Sanitizing NaN for perDiemCosts.${perDiemKey}, defaulting to 0.`);
                            sanitizedPerDiemCosts[perDiemKey] = 0;
                        }
                        else if (!isFinite(costValue)) {
                            console.warn(`Sanitizing Infinity for perDiemCosts.${perDiemKey}, clamping.`);
                            sanitizedPerDiemCosts[perDiemKey] = costValue > 0 ? Number.MAX_VALUE : -Number.MAX_VALUE;
                        }
                    }
                }
                sanitizedParams[paramKey] = sanitizedPerDiemCosts;
            }
        }
    }
    return sanitizedParams;
};
exports.sanitizeModelParameters = sanitizeModelParameters;
