import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { StatCard } from '../components/StatCard'
import { BudgetProgressBar } from '../components/BudgetProgressBar'
import { CategoryBadge } from '../components/CategoryBadge'
import { formatCurrency, getCurrentMonthRange, cn } from '../lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Label
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

const mockMonthlyData = [
  { month: 'Oct', amount: 8200 },
  { month: 'Nov', amount: 12400 },
  { month: 'Dec', amount: 9800 },
  { month: 'Jan', amount: 15200 },
  { month: 'Feb', amount: 7600 },
  { month: 'Mar', amount: 11000 },
]

const mockCategoryData = [
  { name: 'Food', value: 4200 },
  { name: 'Transport', value: 1800 },
  { name: 'Shopping', value: 3100 },
  { name: 'Bills', value: 2400 },
  { name: 'Entertainment', value: 1200 },
]

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Bills: '#ef4444',
  Entertainment: '#a855f7',
  Health: '#22c55e',
  Other: '#6b7280',
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

      // 2. Prepare Chart Data (Last 6 Months)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        return {
          month: d.toLocaleString('en-IN', { month: 'short' }), // "Oct", "Nov" etc
          amount: 0
        }
      })

      const last6MonthsTx = tx.filter(t => t.type === 'expense');
      
      last6MonthsTx.forEach(t => {
        const date = new Date(t.date);
        const m = date.toLocaleString('en-IN', { month: 'short' });
        const monthObj = last6Months.find(d => d.month === m);
        if (monthObj) {
          monthObj.amount += Number(t.amount);
        }
      });

      const finalChartData = last6Months.some(m => m.amount > 0) ? last6Months : mockMonthlyData;
      setChartData(finalChartData);

      const catMap: Record<string, number> = {}
      tx.filter(t => t.type === 'expense').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount)
      })
      const realPieData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
      setPieData(realPieData.length > 0 ? realPieData : mockCategoryData)
    } else {
      setChartData(mockMonthlyData);
      setPieData(mockCategoryData);
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(v) => '₹' + (v/1000) + 'k'} 
                />
                <Tooltip
                  contentStyle={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => ['₹' + value.toLocaleString('en-IN'), 'Spent']}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Other} />
                    ))}
                    <Label 
                      content={({ viewBox }) => {
                        const { cx, cy } = viewBox as any;
                        const total = pieData.reduce((sum, d) => sum + d.value, 0);
                        return (
                          <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central">
                            <tspan x={cx} dy="-0.5em" fontSize="12" fill="#888">Total</tspan>
                            <tspan x={cx} dy="1.2em" fontSize="16" fontWeight="bold">₹{total.toLocaleString('en-IN')}</tspan>
                          </text>
                        );
                      }}
                    />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      borderColor: '#2a2a3a', 
                      borderRadius: '12px',
                      color: '#fff'
                    }} 
                    formatter={(value) => '₹' + Number(value).toLocaleString('en-IN')}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    formatter={(value, entry: any) => (
                      <span className="text-xs text-muted-foreground mr-2">
                        {value}: ₹{entry.payload.value.toLocaleString('en-IN')}
                      </span>
                    )}
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
