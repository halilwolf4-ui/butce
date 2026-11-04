export interface Transaction {
  id: string;
  amount: number;
  desc: string;
  date: string;
  timestamp?: number;
}

export interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  transactions: Transaction[];
  linkedRecurringId?: string;
  targetAmount?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  amount: number;
  transactions: Transaction[];
  sliderLocked?: boolean;
  linkedDebtId?: string;
  linkedRecurringId?: string;
  targetAmount?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  items: CategoryItem[];
  isDebtCategory?: boolean;
  isRecurringCategory?: boolean;
}

export interface MonthData {
  id: string; // format: "YYYY-M" (M is 0-indexed: 0..11)
  name: string;
  monthIdx: number;
  income: number;
  expense: number;
  remaining: number;
  incomes: IncomeItem[];
  categories: Category[];
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  installments: number;
  installmentAmount: number;
}

export interface RecurringItem {
  id: string;
  type: 'income' | 'expense';
  name: string;
  amount: number;
  paymentDay?: number; // 1-31
  isSubscription?: boolean; // Subscription (Netflix, Spotify, Gym, Fiber etc.)
  categoryTag?: string;
}

export interface GoalJar {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category?: 'Tatil' | 'Teknoloji' | 'Araba' | 'Acil Durum' | 'Ev' | 'Kişisel' | 'Diğer';
  color?: string;
  note?: string;
  createdAt?: string;
}

export type SavingsCategoryType = 'fon' | 'altin' | 'vadeli' | 'borsa' | 'kripto' | 'doviz' | 'diger';

export interface SavingsHistoryEntry {
  date: string;
  timestamp: number;
  amount: number;
}

export interface SavingsItem {
  id: string;
  name: string;
  type: SavingsCategoryType;
  amount: number;
  initialAmount?: number; // First purchase or cost amount for profit/loss calculation
  targetAmount?: number;
  note?: string;
  updatedAt?: string;
  lastUpdatedTimestamp?: number;
  history?: SavingsHistoryEntry[];
}

export interface AppSettings {
  cycleStartDay: number; // default 1
}

export interface AppData {
  months: MonthData[];
  settings: AppSettings;
  debts: Debt[];
  recurring: RecurringItem[];
  savings: SavingsItem[];
  goalJars?: GoalJar[];
}

export const SAVINGS_CATEGORIES: {
  type: SavingsCategoryType;
  label: string;
  color: string;
  iconName: string;
}[] = [
  { type: 'fon', label: 'Yatırım Fonu (TEFAS)', color: '#06b6d4', iconName: 'PieChart' },
  { type: 'altin', label: 'Altın & Değerli Maden', color: '#f59e0b', iconName: 'Sparkles' },
  { type: 'vadeli', label: 'Vadeli Mevduat', color: '#10b981', iconName: 'Percent' },
  { type: 'borsa', label: 'Borsa & Hisse', color: '#3b82f6', iconName: 'TrendingUp' },
  { type: 'kripto', label: 'Kripto Varlıklar', color: '#8b5cf6', iconName: 'Zap' },
  { type: 'doviz', label: 'Döviz & Yabancı Para', color: '#ec4899', iconName: 'DollarSign' },
  { type: 'diger', label: 'Diğer Birikimler', color: '#14b8a6', iconName: 'Wallet' },
];

export const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const TR_MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
];

export function formatMoney(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(rounded) + " ₺";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36).substring(4);
}

export function getCycleString(monthIndex: number, cycleStartDay: number = 1): string {
  if (cycleStartDay === 1) {
    return TR_MONTHS[monthIndex];
  }
  const nextIdx = (monthIndex + 1) % 12;
  const endDay = cycleStartDay - 1 === 0 ? 30 : cycleStartDay - 1;
  return `${cycleStartDay} ${TR_MONTHS_SHORT[monthIndex]} - ${endDay} ${TR_MONTHS_SHORT[nextIdx]}`;
}
