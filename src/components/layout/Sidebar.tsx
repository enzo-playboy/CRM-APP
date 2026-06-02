'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  FolderOpen, 
  DollarSign, 
  Settings,
  Zap,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prospection', label: 'Prospecção', icon: TrendingUp },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/messages', label: 'Mensagens', icon: MessageSquare },
  { href: '/projects', label: 'Projetos', icon: FolderOpen },
  { href: '/goals', label: 'Metas', icon: Target },
  {
    href: '/financial',
    label: 'Financeiro',
    icon: DollarSign,
    children: [
      { href: '/financial', label: 'Visão Geral', icon: LayoutDashboard },
      { href: '/financial/revenue', label: 'Receitas', icon: TrendingUp },
      { href: '/financial/expenses', label: 'Despesas', icon: DollarSign },
    ]
  },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isFinancialOpen, setIsFinancialOpen] = useState(false)

  const isFinancialActive = pathname.startsWith('/financial')

  useEffect(() => {
    if (isFinancialActive) {
      setIsFinancialOpen(true)
    }
  }, [pathname, isFinancialActive])

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full z-[60] py-6 glass-strong w-72 rounded-r-3xl shadow-glass-lg">
      <div className="px-6 pb-4 mb-4 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-400 text-white rounded-2xl flex items-center justify-center shadow-glow">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gradient">CRM AI</span>
            <span className="text-sm text-text-muted">Full IA</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 px-4 gap-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          const hasChildren = item.children && item.children.length > 0
          const isExpanded = hasChildren && isFinancialOpen
          const Icon = item.icon

          return (
            <div key={item.href}>
              {/* Item principal */}
              {hasChildren ? (
                <button
                  onClick={() => setIsFinancialOpen(!isFinancialOpen)}
                  className={`w-full flex items-center gap-4 py-3 px-4 transition-all duration-200 rounded-2xl ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-glow'
                      : 'text-text-secondary hover:bg-white/50 hover:text-primary-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-primary-400'}`} />
                  <span className={`font-semibold flex-1 text-left ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 py-3 px-4 transition-all duration-200 rounded-2xl ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-glow'
                      : 'text-text-secondary hover:bg-white/50 hover:text-primary-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-primary-400'}`} />
                  <span className={`font-semibold ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              )}

              {/* Sub-itens */}
              {hasChildren && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    const ChildIcon = child.icon
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 py-2 px-3 transition-all duration-200 rounded-xl text-sm ${
                          isChildActive
                            ? 'bg-primary-100 text-primary-700 font-semibold'
                            : 'text-text-muted hover:bg-white/30 hover:text-primary-500'
                        }`}
                      >
                        <ChildIcon className={`w-4 h-4 ${isChildActive ? 'text-primary-500' : ''}`} />
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="px-6 py-4 border-t border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-300 to-primary-200 flex items-center justify-center text-primary-700 font-bold">
            U
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-primary">Usuário</span>
            <span className="text-xs text-text-muted">user@fullia.com</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
