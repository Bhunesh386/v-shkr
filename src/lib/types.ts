export interface Transaction {
  id: string
  created_at: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description?: string
  date: string
}

export interface Budget {
  id: string
  created_at: string
  user_id: string
  category: string
  monthly_limit: number
  month: number
  year: number
  spent?: number
}

export type Category = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Other'
