import { AITimeToScaleParameters } from './store';

/**
 * Formats a number with commas as thousands separators
 * @param value The number to format
 * @returns A formatted string
 */
export const formatNumber = (num: number | undefined | null, precision: number = 0): string => {
  if (num === undefined || num === null) return 'N/A';
  if (isNaN(num)) return 'Invalid Number';

  if (Math.abs(num) < 1 && num !== 0) {
    // For very small numbers, use more precision or scientific notation if needed
    if (Math.abs(num) < 0.001) {
      return num.toExponential(2);
    }
    return num.toFixed(Math.max(precision, 2)); // Show at least 2 decimal places for small numbers
  }
  
  return num.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

/**
 * Formats a number in a compact way for display in small spaces
 * @param value The number to format
 * @returns A compact formatted string (like 1.2K, 2.5M, etc.)
 */
export const formatCompactNumber = (value: number): string => {
  if (value === 0) return "0";
  
  if (Math.abs(value) < 1000) {
    return Math.round(value).toString();
  }
  
  const suffixes = ["", "K", "M", "B", "T"];
  const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
  const shortValue = value / Math.pow(10, suffixIndex * 3);
  
  // Return with 1 decimal place for values < 100, otherwise round to whole number
  if (Math.abs(shortValue) < 10) {
    return `${shortValue.toFixed(1)}${suffixes[suffixIndex]}`;
  }
  return `${Math.round(shortValue)}${suffixes[suffixIndex]}`;
};

/**
 * Formats a number as currency
 * @param value The number to format
 * @param currency The currency symbol (default: $)
 * @returns A formatted currency string
 */
export const formatCurrency = (value: number, currency: string = '$'): string => {
  return `${currency}${new Intl.NumberFormat().format(Math.round(value))}`;
};

/**
 * Formats a number with specified decimal places
 * @param value The number to format
 * @param decimalPlaces Number of decimal places (default: 2)
 * @returns A formatted string with specified decimal places
 */
export const formatDecimal = (value: number, decimalPlaces: number = 2): string => {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
};

export const calculateSuggestedFeasibility = (activeInterventionsCount: number): number => {
  // Base feasibility starts at 0.5
  let feasibility = 0.5;
  
  // Adjust based on number of active interventions
  if (activeInterventionsCount === 0) {
    feasibility = 0.9; // No AI = closer to current state
  } else if (activeInterventionsCount === 1) {
    feasibility = 0.7; // Single intervention is easier
  } else if (activeInterventionsCount === 2) {
    feasibility = 0.5; // Two interventions moderate
  } else {
    feasibility = 0.3 - (activeInterventionsCount - 3) * 0.05; // Multiple interventions harder
  }
  
  return Math.max(0.1, Math.min(0.9, feasibility));
};

// More realistic time-to-scale estimates based on AI intervention type
export const estimateTimeToScale = (
  aiInterventions: Record<string, boolean> | any, 
  timeToScaleParams?: AITimeToScaleParameters | Record<string, number>
): number => {
  const activeInterventions = Object.entries(aiInterventions)
    .filter(([_, isActive]) => isActive)
    .map(([name]) => name);
  
  // Updated realistic time estimates reflecting the rapid advancement of LLMs and AI tools
  // Scale: 0 = 3+ years, 0.25 = 2 years, 0.5 = 1 year, 0.75 = 3-6 months, 1 = immediate
  const defaultTimeEstimates: Record<string, number> = {
    // Self-care apps can now be built very quickly with LLM APIs (1-3 months)
    selfCareAI: 0.85,
    
    // Triage AI can leverage existing LLM APIs and be deployed rapidly (3-6 months)
    triageAI: 0.75,
    
    // CHW decision support can use mobile apps with LLM backends (6-9 months)
    chwAI: 0.65,
    
    // Diagnostic AI still needs some validation but LLMs accelerate development (6-12 months)
    diagnosticAI: 0.60,
    
    // Bed management can use existing hospital systems with AI overlays (6-9 months)
    bedManagementAI: 0.65,
    
    // Hospital decision support can leverage LLM APIs for rapid prototyping (9-12 months)
    hospitalDecisionAI: 0.55,
  };
  
  // Use provided parameters or fall back to defaults
  const timeEstimates = timeToScaleParams ? 
    (timeToScaleParams as Record<string, number>) : 
    defaultTimeEstimates;
  
  if (activeInterventions.length === 0) return 0.5;
  
  // Calculate weighted average time based on active interventions
  const avgTime = activeInterventions.reduce((sum, intervention) => {
    return sum + (timeEstimates[intervention] || 0.6);
  }, 0) / activeInterventions.length;
  
  // Reduced complexity penalty since LLMs make integration easier
  const complexityPenalty = Math.min(0.10, activeInterventions.length * 0.02);
  
  return Math.max(0.1, avgTime - complexityPenalty);
};

// Calculate appropriate system congestion based on disease burden
export const calculateDefaultCongestion = (
  totalIncidence: number, 
  numberOfDiseases: number, 
  healthSystemStrength: string
): number => {
  // Base congestion calculation
  // Higher incidence = more congestion
  // More diseases = more congestion (competing for same resources)
  // Weaker health systems = more congestion
  
  // Health system capacity multipliers
  const systemCapacityMultipliers: Record<string, number> = {
    'weak_rural_system': 2.0,           // Double congestion in weak systems
    'fragile_conflict_system': 2.5,     // Highest congestion in conflict areas
    'moderate_urban_system': 1.2,       // Moderate increase
    'strong_urban_system': 0.8,         // Better capacity
    'well_functioning_system': 0.6      // Best capacity, lowest congestion
  };
  
  const capacityMultiplier = systemCapacityMultipliers[healthSystemStrength] || 1.0;
  
  // Base congestion from total incidence
  // Using logarithmic scale to prevent extreme values
  // Normal single disease incidence: 0.2-2.0, multi-disease could be 3-6+
  let baseCongestion = Math.min(0.8, Math.log10(totalIncidence + 1) * 0.3);
  
  // Multi-disease complexity multiplier
  // Each additional disease adds coordination complexity
  const diseaseComplexityMultiplier = numberOfDiseases > 1 ? 
    1.0 + (numberOfDiseases - 1) * 0.15 : 1.0; // +15% per additional disease
  
  // Calculate final congestion
  let finalCongestion = baseCongestion * capacityMultiplier * diseaseComplexityMultiplier;
  
  console.log('calculateDefaultCongestion details:', {
    totalIncidence,
    numberOfDiseases,
    healthSystemStrength,
    capacityMultiplier,
    baseCongestion,
    diseaseComplexityMultiplier,
    finalCongestion: finalCongestion,
    finalCongestionBeforeRounding: finalCongestion
  });
  
  // Ensure reasonable bounds (0-0.9, never fully congested by default)
  finalCongestion = Math.max(0.0, Math.min(0.9, finalCongestion));
  
  // Round to reasonable precision
  const rounded = Math.round(finalCongestion * 100) / 100;
  console.log('Final congestion after bounds and rounding:', rounded);
  
  return rounded;
};

// Get congestion level description
export const getCongestionDescription = (congestion: number): string => {
  if (congestion < 0.1) return 'Minimal';
  if (congestion < 0.3) return 'Low';
  if (congestion < 0.5) return 'Moderate';
  if (congestion < 0.7) return 'High';
  if (congestion < 0.9) return 'Severe';
  return 'Critical';
}; 