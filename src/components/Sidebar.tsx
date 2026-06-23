'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  LogOut,
  Shield,
  Menu,
  X,
  Wallet,
  Crown,
  Calendar,
  BookOpen,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/citoyens', label: 'Membres', icon: Users },
  { href: '/citoyens/nouveau', label: 'Nouveau membre', icon: UserPlus, adminOnly: true },
  { href: '/tresorerie', label: 'Trésorerie', icon: Wallet },
  { href: '/bureau', label: 'Bureau exécutif', icon: Crown },
  { href: '/evenements', label: 'Événements', icon: Calendar },
  { href: '/charte', label: 'Charte', icon: BookOpen },
  { href: '/carte-generator', label: 'Générateur de carte', icon: CreditCard, adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-tchad-blue text-white p-2 rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-tchad-blue text-white z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-tchad-yellow rounded-full flex items-center justify-center text-tchad-blue font-bold text-lg">
              CT
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Colonie Tchadienne</h1>
              <p className="text-xs text-white/60">Moanda & Mounana</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 bg-tchad-blue-light rounded-full overflow-hidden flex">
              <div className="h-full w-1/3 bg-blue-500" />
              <div className="h-full w-1/3 bg-tchad-yellow" />
              <div className="h-full w-1/3 bg-tchad-red" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null
              if ((item as any).bureauOnly && !isAdmin && (session?.user as any)?.role !== 'bureau') return null
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-tchad-yellow font-semibold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-tchad-yellow/20 rounded-full flex items-center justify-center">
              <Shield size={16} className="text-tchad-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-white/50">
                {isAdmin ? 'Administrateur' : (session?.user as any)?.role === 'bureau' ? 'Membre Bureau' : 'Lecteur'}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all w-full mt-2"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
