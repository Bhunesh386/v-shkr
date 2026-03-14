import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Target, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { BudgetProgressBar } from '../components/BudgetProgressBar'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Budget, Transaction } from '../lib/types'

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthly_limit: z.string().min(1, 'Limit is required'),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const BudgetsPage = () => {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: 'Other',
      monthly_limit: ''
    }
  })

  useEffect(() => {
    fetchBudgets()
  }, [user, selectedMonth, selectedYear])

  const fetchBudgets = async () => {
    setLoading(true)
    
    // Fetch transactions for the selected month to calculate spent
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0]
    const monthEnd = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

    const { data: txData } = await supabase
      .from('transactions')
      .select('amount, category, type')
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .eq('type', 'expense')

    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', selectedMonth)
      .eq('year', selectedYear)

    if (budgetData) {
      const merged: Budget[] = budgetData.map(b => ({
        ...b,
        spent: (txData as Transaction[] || [])
          .filter(t => t.category === b.category)
          .reduce((sum, t) => sum + Number(t.amount), 0)
      }))
      setBudgets(merged)
    }
    setLoading(false)
  }

  const onSubmit = async (values: BudgetFormValues) => {
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('category', values.category)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .single()

    let error
    if (existing) {
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ monthly_limit: Number(values.monthly_limit) })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('budgets')
        .insert([{
          category: values.category,
          monthly_limit: Number(values.monthly_limit),
          month: selectedMonth,
          year: selectedYear,
          user_id: user?.id
        }])
      error = insertError
    }

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Budget saved!')
      reset()
      setShowAddForm(false)
      fetchBudgets()
    }
  }

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Budget removed')
      fetchBudgets()
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extra-bold font-syne tracking-tight">Budgets</h2>
          <p className="text-muted-foreground">Plan your spending and save more every month.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[120px] bg-transparent border-none focus:ring-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={m} value={(i + 1).toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[90px] bg-transparent border-none focus:ring-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="shadow-lg h-10 px-4 font-bold">
            <Plus className="h-4 w-4 mr-2" /> Set Budget
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="bg-card/40 backdrop-blur-md border-primary/20 border-2">
          <CardHeader>
            <CardTitle className="font-syne text-xl">Set Category Budget</CardTitle>
            <CardDescription>Define how much you want to spend in {months[selectedMonth-1]} {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue="Other" onValueChange={(v: string) => setValue('category', v)}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('monthly_limit')} className="bg-muted/50" />
                {errors.monthly_limit && <p className="text-xs text-destructive">{errors.monthly_limit.message}</p>}
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 text-right">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" className="font-bold px-8">Save Budget</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-20 text-center animate-pulse font-syne text-xl text-muted-foreground">Analyzing your budgets...</div>
      ) : budgets.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card key={budget.id} className="bg-card/30 backdrop-blur-sm border-border/50 group hover:border-primary/30 transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-syne text-lg">{budget.category}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteBudget(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BudgetProgressBar 
                  category={budget.category} 
                  spent={Number(budget.spent)} 
                  limit={Number(budget.monthly_limit)} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center text-muted-foreground bg-muted/5 rounded-2xl border-2 border-dashed border-border/30">
          <Target className="h-16 w-16 mx-auto mb-6 opacity-10" />
          <h3 className="text-xl font-syne font-bold text-foreground">No budgets set for this month</h3>
          <p className="max-w-xs mx-auto mt-2 mb-8">Take control of your spending by setting limits for your frequent categories.</p>
          <Button onClick={() => setShowAddForm(true)} className="font-bold px-8 shadow-xl">Get Started</Button>
        </div>
      )}
    </div>
  )
}
