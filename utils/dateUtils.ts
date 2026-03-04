import { CustomerStatusData, PortfolioStatus } from '../types';

export const DEFAULT_PORTFOLIO_LIMIT_DAYS = 75;
const RISK_THRESHOLD_DAYS = 15;

// Standardize a date object to local Noon (12:00:00)
// This avoids DST issues where midnight might shift to previous day 23:00
const normalizeDate = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
};

// Parse YYYY-MM-DD to a Date object set to local Noon
const parseDateString = (dateString: string): Date => {
  if (!dateString) return normalizeDate(new Date());
  const [year, month, day] = dateString.split('-').map(Number);
  // Note: month is 0-indexed in JS Date
  // Create date using local time components
  const d = new Date(year, month - 1, day);
  return normalizeDate(d);
};

export const calculateDaysDifference = (dateString: string): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  
  const purchaseDate = parseDateString(dateString);
  const today = normalizeDate(new Date());

  const diffTime = today.getTime() - purchaseDate.getTime();
  const diffDays = Math.round(diffTime / oneDay);
  
  return Math.max(0, diffDays);
};

export const getCustomerStatus = (lastPurchaseDate: string, customLimit?: number): CustomerStatusData => {
  const limit = customLimit || DEFAULT_PORTFOLIO_LIMIT_DAYS;

  // If no date is provided (new lead), treat as high days
  if (!lastPurchaseDate) {
     return {
      status: PortfolioStatus.PROSPECTING,
      daysSinceLastPurchase: 999,
      daysRemaining: 0,
      retentionLimit: limit
    };
  }

  const daysSince = calculateDaysDifference(lastPurchaseDate);
  const daysRemaining = limit - daysSince;

  let status: PortfolioStatus;

  if (daysRemaining <= 0) {
    status = PortfolioStatus.PROSPECTING;
  } else if (daysRemaining <= RISK_THRESHOLD_DAYS) {
    status = PortfolioStatus.AT_RISK;
  } else {
    status = PortfolioStatus.ACTIVE;
  }

  return {
    status,
    daysSinceLastPurchase: daysSince,
    daysRemaining: Math.max(0, daysRemaining),
    retentionLimit: limit
  };
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Sem data';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const getTodayISO = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};