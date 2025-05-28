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
export const estimateTimeToScale = (aiInterventions: Record<string, boolean> | any): number => {
  const activeInterventions = Object.entries(aiInterventions)
    .filter(([_, isActive]) => isActive)
    .map(([name]) => name);
  
  // Updated realistic time estimates reflecting the rapid advancement of LLMs and AI tools
  // Scale: 0 = 3+ years, 0.25 = 2 years, 0.5 = 1 year, 0.75 = 3-6 months, 1 = immediate
  const timeEstimates: Record<string, number> = {
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
  
  if (activeInterventions.length === 0) return 0.5;
  
  // Calculate weighted average time based on active interventions
  const avgTime = activeInterventions.reduce((sum, intervention) => {
    return sum + (timeEstimates[intervention] || 0.6);
  }, 0) / activeInterventions.length;
  
  // Reduced complexity penalty since LLMs make integration easier
  const complexityPenalty = Math.min(0.10, activeInterventions.length * 0.02);
  
  return Math.max(0.1, avgTime - complexityPenalty);
}; 