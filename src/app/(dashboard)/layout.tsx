'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    // Check for admin bypass login
    const crmUser = localStorage.getItem('crm_user')
    if (crmUser) {
      setIsAuthenticated(true)
      return
    }

    // Check for Supabase session (if needed in future)
    // For now, redirect to login if no auth
    setIsAuthenticated(false)
    router.push('/login')
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    )
  }

  // Don't render content if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen font-body text-text-primary antialiased flex">
      <Sidebar />
      <Header />
      <main className="w-full min-h-screen pt-20 pb-24 md:pt-8 md:pb-8 md:ml-72 px-4 md:px-8 flex flex-col gap-6">
        {children}
      </main>
    </div>
  )
}
