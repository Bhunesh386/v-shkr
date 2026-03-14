import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StatCard } from '../components/StatCard'
import { BudgetProgressBar } from '../components/BudgetProgressBar'
import { CategoryBadge } from '../components/CategoryBadge'
import { formatCurrency, getCurrentMonthRange, cn } from '../lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Wallet, ArrowLeftRight, CreditCard, 
  Calendar, ArrowUpRight, Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Link } from 'react-router'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import type { Transaction, Budget } from '../lib/types'
import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    count: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [chartData, setChartData] = useState<{ month: string, amount: number }[]>([])
  const [pieData, setPieData] = useState<{ name: string, value: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setLoading(true)
    const { start, end } = getCurrentMonthRange()

    // 1. Fetch Summary Stats
    const { data: tx } = await supabase
      .from('transactions')
      .select('amount, type, category, date')
      .gte('date', start)
      .lte('date', end)

    if (tx) {
      const income = tx.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
      const expenses = tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
      setStats({
        income,
        expenses,
        balance: income - expenses,
        count: tx.length
      })

      // 2. Prepare Chart Data
      const catMap: Record<string, number> = {}
      tx.filter(t => t.type === 'expense').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount)
      })
      setPieData(Object.entries(catMap).map(([name, value]) => ({ name, value })))
      
      setChartData([
        { month: 'Week 1', amount: expenses * 0.2 },
        { month: 'Week 2', amount: expenses * 0.35 },
        { month: 'Week 3', amount: expenses * 0.25 },
        { month: 'Week 4', amount: expenses * 0.2 },
      ])
    }

    // 3. Recent Transactions
    const { data: recent } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
    setRecentTransactions(recent || [])

    // 4. Budgets
    const { data: b } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', new Date().getMonth() + 1)
      .limit(3)
    
    if (b) {
      const withSpent = b.map(budget => {
        const spent = (tx || [])
          .filter(t => t.category === budget.category && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          ...budget,
          spent
        };
      })
      setBudgets(withSpent)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-20 bg-muted rounded-xl w-1/3" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extra-bold font-syne tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your money.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-full border-2 w-10 h-10 hover:bg-muted"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button asChild className="shadow-xl font-bold rounded-xl h-11 px-6">
            <Link to="/transactions">
              <ArrowUpRight className="h-4 w-4 mr-2" /> View All
            </Link>
          </Button>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <StatCard label="Total Balance" value={stats.balance} icon={Wallet} accentColor="bg-indigo-500/10 text-indigo-500" />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Monthly Income" value={stats.income} icon={TrendingUp} accentColor="bg-green-500/10 text-green-500" trend={{ value: 12, isUp: true }} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Monthly Expenses" value={stats.expenses} icon={TrendingDown} accentColor="bg-red-500/10 text-red-500" trend={{ value: 8, isUp: false }} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard label="Transactions" value={stats.count} icon={ArrowLeftRight} accentColor="bg-purple-500/10 text-purple-500" />
        </motion.div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="font-syne flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))', 
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="font-syne text-xl">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No expense data for this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-syne text-lg">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link to="/transactions">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentTransactions.length > 0 ? recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors")}>
                    <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description || 'No description'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <CategoryBadge category={tx.category} />
                    </div>
                  </div>
                </div>
                <div className={cn("text-sm font-bold font-syne", tx.type === 'income' ? "text-green-500" : "text-red-500")}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-10">No recent transactions</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-syne text-lg">Budget Status</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link to="/budgets">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {budgets.length > 0 ? budgets.map((budget) => (
              <BudgetProgressBar 
                key={budget.id}
                category={budget.category}
                spent={Number(budget.spent)}
                limit={Number(budget.monthly_limit)}
              />
            )) : (
              <div className="py-20 text-center text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-2 opacity-10" />
                <p>No active budgets set for this month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
