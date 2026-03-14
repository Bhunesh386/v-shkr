import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateInsights } from '../lib/openrouter'
import type { Transaction, Budget } from '../lib/types'
import { Sparkles, Brain, Lightbulb, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, getCurrentMonthRange } from '../lib/utils'

export const InsightsPage = () => {
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const getAIAdvice = async () => {
    setLoading(true)
    const { start, end } = getCurrentMonthRange()

    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', start)
      .lte('date', end)
    
    const { data: b } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', new Date().getMonth() + 1)
      .eq('year', new Date().getFullYear())

    const budgetsWithSpent: Budget[] = (b || []).map(budget => ({
      ...budget,
      spent: (tx as Transaction[] || [])
        .filter(t => t.category === budget.category && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
    }))

    const result = await generateInsights(tx as Transaction[] || [], budgetsWithSpent)
    setInsights(result)
    setLoading(false)
  }

  const icons: Record<string, any> = {
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    tip: <Lightbulb className="h-5 w-5 text-blue-500" />,
  }

  const bgColors: Record<string, string> = {
    warning: "bg-amber-500/5 border-amber-500/20",
    success: "bg-green-500/5 border-green-500/20",
    tip: "bg-blue-500/5 border-blue-500/20",
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extra-bold font-syne tracking-tight">AI Insights</h2>
          <p className="text-muted-foreground">Personalized financial advice powered by Gemini.</p>
        </div>
        <Button 
          onClick={getAIAdvice} 
          disabled={loading}
          className="shadow-xl h-12 px-6 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> Generate Insights
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {insights.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {insights.map((insight, i) => (
                <motion.div
                  key={insight.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={cn("h-full backdrop-blur-sm border-2 transition-all hover:scale-[1.02]", bgColors[insight.type] || "bg-card")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        {icons[insight.type] || <Sparkles className="h-5 w-5 text-primary" />}
                        <CardTitle className="font-syne text-lg">{insight.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{insight.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <div className="relative inline-block mb-6">
                <Brain className="h-20 w-20 text-muted-foreground opacity-10" />
                <Sparkles className="h-8 w-8 text-primary absolute -right-2 -top-2 animate-pulse" />
              </div>
              <h3 className="text-2xl font-syne font-bold text-foreground">Ready for your analysis?</h3>
              <p className="max-w-md mx-auto mt-2 mb-8 text-muted-foreground">
                Click the button above to have our AI analyze your spending patterns and budgets for this month.
              </p>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={getAIAdvice}
                className="font-bold border-2 rounded-xl h-14 px-10 hover:bg-muted/50 transition-all shadow-lg"
              >
                Scan My Finances
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-40 bg-muted/20 border-border/50 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
