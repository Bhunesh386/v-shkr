import { Badge } from './ui/badge'
import { getCategoryColor } from '../lib/utils'
import { cn } from '../lib/utils'

export const CategoryBadge = ({ category }: { category: string }) => {
  return (
    <Badge variant="outline" className={cn("font-medium", getCategoryColor(category))}>
      {category}
    </Badge>
  )
}
