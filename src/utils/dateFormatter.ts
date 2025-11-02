import { TFunction } from 'react-i18next';

/**
 * Format date using translation keys for months
 * Returns format: Jan.05.2025
 */
export const formatDate = (date: Date, t: TFunction): string => {
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                     'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = t(`calendar.months.${monthKeys[date.getMonth()]}`);
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}.${day}.${year}`;
};

/**
 * Format date for display with space separators
 * Returns format: Jan 05, 2025
 */
export const formatDateWithSpaces = (date: Date, t: TFunction): string => {
  const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                     'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = t(`calendar.months.${monthKeys[date.getMonth()]}`);
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};