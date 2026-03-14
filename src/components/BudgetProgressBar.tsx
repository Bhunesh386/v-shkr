import { Progress } from './ui/progress'
import { cn, formatCurrency, getWarningLevel } from '../lib/utils'

interface BudgetProgressBarProps {
  category: string
  spent: number
  limit: number
}

export const BudgetProgressBar = ({ category, spent, limit }: BudgetProgressBarProps) => {
  const percentage = Math.min((spent / limit) * 100, 100)
  const remaining = limit - spent
  const warningLevel = getWarningLevel(spent, limit)

  const bgColors: Record<string, string> = {
    safe: "bg-green-500/10",
    warning: "bg-amber-500/10",
    danger: "bg-red-500/10",
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{category}</span>
        <span className="text-sm font-bold font-syne">
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={percentage} 
          className={cn("h-2.5", bgColors[warningLevel])}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold">
        <div className="flex flex-col">
          <span className="text-muted-foreground">Spent</span>
          <span>{formatCurrency(spent)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-muted-foreground">{remaining >= 0 ? 'Remaining' : 'Over Limit'}</span>
          <span className={cn(remaining < 0 ? "text-red-500" : "text-primary")}>
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>
    </div>
  )
}
