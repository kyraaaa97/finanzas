// Tipos compartidos de la aplicación.

export type TxType = "income" | "expense";
export type Frequency = "weekly" | "monthly" | "yearly";

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;
  monthly_budget: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  description: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
  category?: Category | null;
}

export interface RecurringTransaction {
  id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  description: string | null;
  frequency: Frequency;
  next_date: string; // YYYY-MM-DD
  active: boolean;
  created_at: string;
  category?: Category | null;
}

export interface BudgetItem {
  id: string;
  category_id: string;
  name: string;
  amount: number;
  created_at: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  color: string;
  created_at: string;
}
