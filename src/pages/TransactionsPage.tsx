import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, cn } from '../lib/utils'
import { 
  ArrowLeftRight, Download, Plus, Search, 
  Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Label } from '../components/ui/label'
import { CategoryBadge } from '../components/CategoryBadge'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import type { Transaction } from '../lib/types'

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other']

export const TransactionsPage = () => {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'Other',
      amount: ''
    }
  })

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    const { data } = await query
    setTransactions(data || [])
    setLoading(false)
  }

  const onSubmit = async (values: TransactionFormValues) => {
    const { error } = await supabase.from('transactions').insert([{
      ...values,
      amount: Number(values.amount),
      user_id: user?.id
    }])

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Transaction added!')
      reset()
      setShowAddForm(false)
      fetchTransactions()
    }
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Transaction deleted')
      fetchTransactions()
    }
  }

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory
    const matchesSearch = !search || (t.description || '').toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesCategory && matchesSearch
  })

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount']
    const rows = filteredTransactions.map(t => [t.date, t.description || '', t.category, t.type, t.amount])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extra-bold font-syne tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Keep track of every rupee you spend or earn.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-2 font-bold h-10 px-4">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="shadow-lg h-10 px-4 font-bold">
            <Plus className="h-4 w-4 mr-2" /> Add Transaction
          </Button>
        </div>
      </div>

      {showAddForm && (
        <Card className="bg-card/40 backdrop-blur-md border-primary/20 border-2">
          <CardHeader>
            <CardTitle className="font-syne text-xl">New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" step="0.01" placeholder="0.00" {...register('amount')} className="bg-muted/50" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select defaultValue="expense" onValueChange={(v: string) => setValue('type', v as 'income' | 'expense')}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="md:col-span-2 space-y-2">
                <Label>Description</Label>
                <Input placeholder="What was this for?" {...register('description')} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...register('date')} className="bg-muted/50" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" className="font-bold px-8">Save Transaction</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/20 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9 bg-muted/40" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px] bg-muted/40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px] bg-muted/40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center animate-pulse font-syne text-lg">Updating transactions...</div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border/50 text-muted-foreground text-xs uppercase tracking-widest font-bold">
                    <th className="pb-4 pt-2 px-4">Date</th>
                    <th className="pb-4 pt-2 px-4">Description</th>
                    <th className="pb-4 pt-2 px-4">Category</th>
                    <th className="pb-4 pt-2 px-4">Amount</th>
                    <th className="pb-4 pt-2 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-muted/10 transition-colors">
                      <td className="py-4 px-4 text-sm">{tx.date}</td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium">{tx.description || '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <CategoryBadge category={tx.category} />
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn("text-sm font-bold font-syne", tx.type === 'income' ? "text-green-500" : "text-red-500")}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTransaction(tx.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <ArrowLeftRight className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No transactions found</p>
              <p className="text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
