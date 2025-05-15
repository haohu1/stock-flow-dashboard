/**
 * Formats a number with commas as thousands separators
 * @param value The number to format
 * @returns A formatted string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(Math.round(value));
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