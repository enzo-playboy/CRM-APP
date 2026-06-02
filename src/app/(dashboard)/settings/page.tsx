'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { User, Bell, Shield, Palette, Save, LogOut } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    company: '',
    phone: '',
  })

  const [notifications, setNotifications] = useState({
    emailLead: true,
    emailMessage: true,
    emailReport: false,
    browserNotifications: true,
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      setProfile({
        name: user.user_metadata?.name || '',
        company: user.user_metadata?.company || '',
        phone: user.user_metadata?.phone || '',
      })
    }
    setIsLoading(false)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          company: profile.company,
          phone: profile.phone,
        }
      })
      if (error) throw error
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }
    if (passwords.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      })
      if (error) throw error
      toast.success('Senha alterada com sucesso!')
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Erro ao alterar senha')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('crm_user')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Configurações</h1>
        <p className="text-text-muted mt-1">Gerencie sua conta e preferências</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* Tab: Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Escolha como deseja ser notificado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Novo lead por e-mail</Label>
                  <p className="text-sm text-text-muted">Receba e-mail quando um novo lead for cadastrado</p>
                </div>
                <Switch
                  checked={notifications.emailLead}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailLead: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Nova mensagem por e-mail</Label>
                  <p className="text-sm text-text-muted">Receba e-mail quando receber uma nova mensagem</p>
                </div>
                <Switch
                  checked={notifications.emailMessage}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailMessage: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Relatório semanal</Label>
                  <p className="text-sm text-text-muted">Receba um resumo semanal das atividades</p>
                </div>
                <Switch
                  checked={notifications.emailReport}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailReport: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações no navegador</Label>
                  <p className="text-sm text-text-muted">Receba notificações push no navegador</p>
                </div>
                <Switch
                  checked={notifications.browserNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, browserNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Mantenha sua conta segura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Confirme a nova senha"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} isLoading={isSaving}>
                  <Shield className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Aparência */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base">Tema</Label>
                <p className="text-sm text-text-muted">Escolha o tema do sistema</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    theme === 'light'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-white/50 bg-white/70 hover:border-primary-200'
                  }`}
                >
                  <div className="w-full h-20 bg-white rounded-xl mb-2 border border-gray-200"></div>
                  <p className="font-semibold text-sm">Claro</p>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    theme === 'dark'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-white/50 bg-white/70 hover:border-primary-200'
                  }`}
                >
                  <div className="w-full h-20 bg-gray-800 rounded-xl mb-2 border border-gray-700"></div>
                  <p className="font-semibold text-sm">Escuro</p>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    theme === 'system'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-white/50 bg-white/70 hover:border-primary-200'
                  }`}
                >
                  <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 rounded-xl mb-2 border border-gray-200"></div>
                  <p className="font-semibold text-sm">Sistema</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
