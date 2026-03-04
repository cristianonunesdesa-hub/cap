export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  cnpj?: string;
  phone: string;
  email?: string;
  lastPurchaseDate: string; // ISO string YYYY-MM-DD
  ownerType: 'me' | 'other'; // 'me' = Minha Carteira, 'other' = Acompanhamento (Outros Vendedores)
  retentionLimit?: number; // Default 75 if undefined
}

export enum PortfolioStatus {
  ACTIVE = 'ACTIVE',         // > 15 days remaining
  AT_RISK = 'AT_RISK',       // <= 15 days remaining
  PROSPECTING = 'PROSPECTING' // 0 days remaining (expired)
}

export interface CustomerStatusData {
  status: PortfolioStatus;
  daysSinceLastPurchase: number;
  daysRemaining: number;
  retentionLimit: number;
}

export type TabView = 'portfolio' | 'risk' | 'prospecting' | 'monitoring';