'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    // Check if there's a saved email in localStorage
    const savedEmail = localStorage.getItem('crm_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('crm_remembered_email', email)
      } else {
        localStorage.removeItem('crm_remembered_email')
      }

      // Bypass login - aceita adm@fullia.com / 123456
      if (email === 'adm@fullia.com' && password === '123456') {
        // Salvar no localStorage para manter sessão
        localStorage.setItem('crm_user', JSON.stringify({
          id: 'admin-001',
          email: 'adm@fullia.com',
          name: 'Admin'
        }))
        router.push('/dashboard')
        return
      }

      // Tentar Supabase para outros usuários
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError('Email ou senha incorretos')
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl" />

      <main className="w-full max-w-md glass-strong rounded-3xl shadow-glass-lg p-8 flex flex-col gap-8 relative z-10">
        <header className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-400 text-white rounded-3xl flex items-center justify-center shadow-glow">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">CRM AI</h1>
            <p className="text-text-muted mt-1">Acesse sua conta para continuar</p>
          </div>
        </header>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="pl-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="#" className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
              Lembrar-me
            </Label>
          </div>

          <div className="flex flex-col gap-4 pt-2">
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12"
              isLoading={isLoading}
            >
              {isLoading ? 'Entrando...' : 'ENTRAR'}
            </Button>

            <div className="text-center text-text-muted">
              Não tem conta?{' '}
              <Link href="/signup" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
                Cadastre-se
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
