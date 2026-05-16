/**
 * Ethiopian Calendar Utilities
 * 
 * The Ethiopian calendar is approximately 7-8 years behind the Gregorian calendar.
 * It has 13 months: 12 months of 30 days each, and a 13th month of 5-6 days.
 */

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
}

const ETHIOPIAN_MONTHS = [
  "መስከረም", // Meskerem
  "ጥቅምት",   // Tikimt
  "ኅዳር",    // Hidar
  "ታኅሣሥ",   // Tahsas
  "ጥር",     // Tir
  "የካቲት",   // Yekatit
  "መጋቢት",   // Megabit
  "ሚያዝያ",   // Miazia
  "ግንቦት",   // Ginbot
  "ሰኔ",     // Sene
  "ሐምሌ",    // Hamle
  "ነሐሴ",    // Nehase
  "ጳጉሜን",   // Pagumen
];

/**
 * Convert Gregorian date to Ethiopian date
 */
export function gregorianToEthiopian(date: Date): EthiopianDate {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Ethiopian New Year starts on September 11 (or 12 in leap years)
  const ethNewYearDay = isGregorianLeapYear(year) ? 12 : 11;
  
  let ethYear: number;
  let ethMonth: number;
  let ethDay: number;

  // Calculate Ethiopian year
  if (month < 9 || (month === 9 && day < ethNewYearDay)) {
    ethYear = year - 8;
  } else {
    ethYear = year - 7;
  }

  // Calculate day of Ethiopian year
  const gregorianNewYear = new Date(year, 0, 1);
  const ethNewYear = new Date(year, 8, ethNewYearDay); // September 11/12
  
  let dayOfEthYear: number;
  if (date >= ethNewYear) {
    dayOfEthYear = Math.floor((date.getTime() - ethNewYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  } else {
    const prevEthNewYear = new Date(year - 1, 8, isGregorianLeapYear(year - 1) ? 12 : 11);
    dayOfEthYear = Math.floor((date.getTime() - prevEthNewYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Calculate Ethiopian month and day
  ethMonth = Math.floor((dayOfEthYear - 1) / 30) + 1;
  ethDay = ((dayOfEthYear - 1) % 30) + 1;

  // Handle 13th month (Pagumen)
  if (ethMonth > 13) {
    ethMonth = 13;
    ethDay = dayOfEthYear - 360;
  }

  return { year: ethYear, month: ethMonth, day: ethDay };
}

/**
 * Check if a Gregorian year is a leap year
 */
function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Format Ethiopian date as string
 */
export function formatEthiopianDate(
  ethDate: EthiopianDate,
  format: "short" | "long" = "short"
): string {
  const monthName = ETHIOPIAN_MONTHS[ethDate.month - 1] || "";
  
  if (format === "long") {
    return `${monthName} ${ethDate.day}, ${ethDate.year}`;
  }
  
  return `${ethDate.day} ${monthName} ${ethDate.year}`;
}

/**
 * Convert Gregorian date to formatted Ethiopian date string
 */
export function toEthiopianDateString(
  date: Date | string,
  format: "short" | "long" = "short"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const ethDate = gregorianToEthiopian(d);
  return formatEthiopianDate(ethDate, format);
}

/**
 * Format date based on language/calendar preference
 */
export function formatDate(
  date: Date | string,
  language: "en" | "am",
  options?: {
    format?: "short" | "long";
    includeTime?: boolean;
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const format = options?.format || "short";
  const includeTime = options?.includeTime || false;

  let dateStr: string;

  if (language === "am") {
    // Use Ethiopian calendar for Amharic
    dateStr = toEthiopianDateString(d, format);
  } else {
    // Use Gregorian calendar for English
    if (format === "long") {
      dateStr = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else {
      dateStr = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }

  if (includeTime) {
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} ${timeStr}`;
  }

  return dateStr;
}

/**
 * Get Ethiopian month name
 */
export function getEthiopianMonthName(month: number): string {
  return ETHIOPIAN_MONTHS[month - 1] || "";
}

/**
 * Get all Ethiopian month names
 */
export function getEthiopianMonths(): string[] {
  return [...ETHIOPIAN_MONTHS];
}
