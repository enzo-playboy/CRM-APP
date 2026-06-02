'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Bell,
  LayoutDashboard,
  Users,
  FolderOpen,
  Settings,
  Zap,
  TrendingUp,
  Target,
  LogOut,
  User,
  MessageSquare,
} from 'lucide-react'

export function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(3)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('crm_user')
    router.push('/login')
  }

  const getInitials = (email: string) => {
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 glass-strong rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-400 text-white rounded-2xl flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-gradient">CRM AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {notifications}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex fixed top-0 left-72 right-0 z-40 h-16 items-center justify-between px-8 glass-strong border-b border-white/30">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Buscar contatos, mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {notifications}
              </Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-300 text-primary-700">
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{user?.user_metadata?.name || 'Usuário'}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center glass-strong px-2 pb-safe h-20 rounded-t-3xl">
        <a href="/dashboard" className="flex flex-col items-center justify-center text-text-muted hover:text-primary-500 transition-colors duration-200 p-2">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Dashboard</span>
        </a>
        <a href="/prospection" className="flex flex-col items-center justify-center text-text-muted hover:text-primary-500 transition-colors duration-200 p-2">
          <TrendingUp className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Prospecção</span>
        </a>
        <a href="/contacts" className="flex flex-col items-center justify-center text-primary-500 font-bold bg-primary-500/10 rounded-2xl px-4 py-2 transition-all duration-200">
          <Users className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Contatos</span>
        </a>
        <a href="/goals" className="flex flex-col items-center justify-center text-text-muted hover:text-primary-500 transition-colors duration-200 p-2">
          <Target className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Metas</span>
        </a>
        <a href="/settings" className="flex flex-col items-center justify-center text-text-muted hover:text-primary-500 transition-colors duration-200 p-2">
          <Settings className="w-6 h-6" />
          <span className="text-xs font-medium mt-1">Config</span>
        </a>
      </nav>

      {/* Mobile Search Sheet */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="top" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Buscar</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Input
              placeholder="Buscar contatos, mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
