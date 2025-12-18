/**
 * Format date from ISO string (YYYY-MM-DD) to dd/mm/yyyy format
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format date from Date object to dd/mm/yyyy format
 * @param date - Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export const formatDateFromDate = (date: Date): string => {
  try {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toString();
  }
};

/**
 * Get current date in dd/mm/yyyy format
 * @returns Current date formatted as dd/mm/yyyy
 */
export const getCurrentDateFormatted = (): string => {
  return formatDateFromDate(new Date());
};

/**
 * Get current date in YYYY-MM-DD format (for HTML date input)
 * @returns Current date formatted as YYYY-MM-DD
 */
export const getCurrentDateISO = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};