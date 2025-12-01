/**
 * Calendar Utility Functions
 * Helper functions for decade/month conversions and display
 */

import { Decade, DecadeInfo, MONTH_NAMES, DECADE_PERIODS } from '../models/calendar';

/**
 * Convert decade number (1-36) to human-readable text
 * @example decadeToDisplay(1) => "début Janvier"
 * @example decadeToDisplay(9) => "fin Mars"
 */
export function decadeToDisplay(decade: Decade): string {
  const info = getDecadeInfo(decade);
  return `${info.period} ${info.monthName}`;
}

/**
 * Get detailed information about a decade
 */
export function getDecadeInfo(decade: Decade): DecadeInfo {
  if (decade < 1 || decade > 36) {
    throw new Error(`Invalid decade number: ${decade}. Must be between 1 and 36.`);
  }

  const monthIndex = Math.floor((decade - 1) / 3); // 0-11
  const periodIndex = (decade - 1) % 3; // 0-2

  return {
    decade,
    monthIndex,
    monthName: MONTH_NAMES[monthIndex],
    period: DECADE_PERIODS[periodIndex],
    displayText: `${DECADE_PERIODS[periodIndex]} ${MONTH_NAMES[monthIndex]}`,
  };
}

/**
 * Convert month and period to decade number
 * @param monthIndex 0-11 (0 = January)
 * @param periodIndex 0-2 (0 = début, 1 = mi, 2 = fin)
 */
export function monthPeriodToDecade(monthIndex: number, periodIndex: number): Decade {
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid month index: ${monthIndex}`);
  }
  if (periodIndex < 0 || periodIndex > 2) {
    throw new Error(`Invalid period index: ${periodIndex}`);
  }

  return (monthIndex * 3 + periodIndex + 1) as Decade;
}

/**
 * Format a period range for display
 * @example formatPeriodRange(7, 10) => "début Mars - début Avril"
 */
export function formatPeriodRange(startDecade: Decade, endDecade: Decade): string {
  const start = decadeToDisplay(startDecade);
  const end = decadeToDisplay(endDecade);

  if (startDecade === endDecade) {
    return start;
  }

  return `${start} - ${end}`;
}

/**
 * Get all decades for a given month
 * @param monthIndex 0-11
 */
export function getDecadesForMonth(monthIndex: number): Decade[] {
  const firstDecade = monthIndex * 3 + 1;
  return [firstDecade, firstDecade + 1, firstDecade + 2] as Decade[];
}

/**
 * Check if a decade is within a range (inclusive)
 * Handles year wrap-around (e.g., October-February)
 */
export function isDecadeInRange(decade: Decade, start: Decade, end: Decade): boolean {
  if (start <= end) {
    // Normal range (e.g., March-August)
    return decade >= start && decade <= end;
  } else {
    // Wrap-around range (e.g., October-February)
    return decade >= start || decade <= end;
  }
}

/**
 * Get month name from decade
 */
export function getMonthFromDecade(decade: Decade): string {
  const monthIndex = Math.floor((decade - 1) / 3);
  return MONTH_NAMES[monthIndex];
}

/**
 * Get all months (0-11) with their decades
 */
export function getAllMonthsWithDecades() {
  return MONTH_NAMES.map((name, index) => ({
    monthIndex: index,
    monthName: name,
    decades: getDecadesForMonth(index),
  }));
}

/**
 * Calculate approximate date from decade
 * @param decade Decade number (1-36)
 * @param year Year (default: current year)
 * @returns Date object
 */
export function decadeToApproximateDate(decade: Decade, year?: number): Date {
  const currentYear = year ?? new Date().getFullYear();
  const info = getDecadeInfo(decade);

  // Approximate day within month based on period
  const dayMap = {
    début: 5, // ~5th of month
    mi: 15, // ~15th of month
    fin: 25, // ~25th of month
  };

  return new Date(currentYear, info.monthIndex, dayMap[info.period]);
}

/**
 * Get current decade based on today's date
 */
export function getCurrentDecade(): Decade {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  let periodIndex = 0;
  if (day >= 21) periodIndex = 2; // fin
  else if (day >= 11) periodIndex = 1; // mi
  else periodIndex = 0; // début

  return monthPeriodToDecade(month, periodIndex);
}

/**
 * Generate color for calendar visualization
 * @param index Index for color variation
 */
export function generateCalendarColor(index: number): string {
  const colors = [
    '#16a34a', // green
    '#ea580c', // orange
    '#dc2626', // red
    '#2563eb', // blue
    '#9333ea', // purple
    '#ca8a04', // yellow
    '#0891b2', // cyan
    '#e11d48', // pink
    '#65a30d', // lime
    '#0284c7', // sky
    '#7c3aed', // violet
    '#059669', // emerald
  ];

  return colors[index % colors.length];
}

/**
 * Calculate days between two decades (approximate)
 */
export function daysBetweenDecades(startDecade: Decade, endDecade: Decade): number {
  const startDate = decadeToApproximateDate(startDecade);
  const endDate = decadeToApproximateDate(endDecade);

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
