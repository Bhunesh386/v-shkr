import { Card, CardContent } from './ui/card'
import { cn, formatCurrency } from '../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number | string
    isUp: boolean
  }
  accentColor: string
}

export const StatCard = ({ label, value, icon: Icon, trend, accentColor }: StatCardProps) => {
  const formattedValue = typeof value === 'number' ? formatCurrency(value) : value

  return (
    <Card className="overflow-hidden border-none bg-card/40 backdrop-blur-md hover:bg-card/60 transition-colors group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", accentColor)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              trend.isUp ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
            )}>
              {trend.isUp ? '+' : '-'}{trend.value}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold font-syne mt-1 tracking-tight">{formattedValue}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
