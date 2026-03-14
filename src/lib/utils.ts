import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number) =>
  `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    Food: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Transport: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Shopping: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    Bills: 'bg-red-500/20 text-red-400 border-red-500/30',
    Entertainment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Health: 'bg-green-500/20 text-green-400 border-green-500/30',
    Other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return colors[category] ?? colors.Other
}

export const getWarningLevel = (spent: number, limit: number): 'safe' | 'warning' | 'danger' => {
  const pct = (spent / limit) * 100
  if (pct >= 100) return 'danger'
  if (pct >= 80) return 'warning'
  return 'safe'
}

export const getCurrentMonthRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}
