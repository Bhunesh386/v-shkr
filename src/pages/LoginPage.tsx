import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { toast } from 'sonner'
import { TrendingUp, Sparkles, Shield, Rocket, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Signed in successfully')
      navigate('/')
    }
    setLoading(false)
  }

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
      },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Verification email sent! Please check your inbox.')
    }
    setLoading(false)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col bg-muted p-10 text-white lg:flex dark:border-r border-border/10 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-purple-600/30" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--sidebar-primary)_0%,_transparent_70%)] opacity-20" />
        
        <div className="relative z-20 flex items-center text-lg font-bold gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-syne text-2xl tracking-tighter">FinTrack</span>
        </div>

        <div className="relative z-20 mt-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl font-extra-bold font-syne leading-tight tracking-tight">
              Master your money with<br />AI-powered clarity.
            </h1>
            <div className="grid gap-4">
              {[
                { icon: Sparkles, text: "AI-driven spending insights & predictions." },
                { icon: Shield, text: "Enterprise-grade security for your data." },
                { icon: Rocket, text: "Lightning fast transaction tracking." },
                { icon: Smartphone, text: "Seamless experience on all devices." },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-center gap-3 text-zinc-400 group"
                >
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto w-full max-w-[400px] space-y-6"
        >
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-extra-bold font-syne tracking-tight">Welcome to FinTrack</h2>
            <p className="text-muted-foreground text-sm">Enter your credentials to access your dashboard</p>
          </div>

          <Card className="border-border/50 bg-zinc-900/50 backdrop-blur-md shadow-2xl">
            <CardContent className="pt-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/40 p-1 h-12 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-bold">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all font-bold">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" placeholder="name@example.com" className="bg-black/50 border-white/5 h-11" {...loginForm.register('email')} />
                      {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button type="button" className="text-xs text-primary hover:underline underline-offset-4 font-bold">Forgot?</button>
                      </div>
                      <Input id="login-password" type="password" className="bg-black/50 border-white/5 h-11" {...loginForm.register('password')} />
                      {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full h-12 font-bold shadow-xl shadow-primary/10" disabled={loading}>
                      {loading ? 'Authenticating...' : 'Continue to Dashboard'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" type="text" placeholder="John Doe" className="bg-black/50 border-white/5 h-11" {...signupForm.register('name')} />
                      {signupForm.formState.errors.name && <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="name@example.com" className="bg-black/50 border-white/5 h-11" {...signupForm.register('email')} />
                      {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" className="bg-black/50 border-white/5 h-11" {...signupForm.register('password')} />
                      {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full h-12 font-bold shadow-xl shadow-primary/10" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 border-t border-white/5 pt-6 bg-black/20 rounded-b-xl">
              <p>Secure authentication via Supabase Shield</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
