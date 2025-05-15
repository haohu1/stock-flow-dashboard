/**
 * Formats a number with commas as thousands separators
 * @param value The number to format
 * @returns A formatted string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(Math.round(value));
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