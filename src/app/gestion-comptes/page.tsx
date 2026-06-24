'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  KeyRound, UserPlus, RotateCcw, Trash2, Shield, Eye, EyeOff,
  Check, X, Users, Crown,
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function GestionComptesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'viewer' })

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/')
    }
  }, [status, isAdmin, router])

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) fetchUsers()
  }, [status, isAdmin])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 4) {
      showMsg('error', 'Le mot de passe doit contenir au moins 4 caractères')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (res.ok) {
      showMsg('success', 'Mot de passe réinitialisé avec succès')
      setResetId(null)
      setNewPassword('')
    } else {
      const data = await res.json()
      showMsg('error', data.error || 'Erreur lors de la réinitialisation')
    }
    setSaving(false)
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      showMsg('success', 'Rôle mis à jour')
      fetchUsers()
    } else {
      showMsg('error', 'Erreur lors de la mise à jour du rôle')
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Supprimer le compte de ${userName} ? Cette action est irréversible.`)) return
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      showMsg('success', 'Compte supprimé')
      fetchUsers()
    } else {
      const data = await res.json()
      showMsg('error', data.error || 'Erreur lors de la suppression')
    }
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      showMsg('error', 'Tous les champs sont requis')
      return
    }
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    })
    if (res.ok) {
      showMsg('success', 'Compte créé avec succès')
      setShowCreate(false)
      setCreateForm({ name: '', email: '', password: '', role: 'viewer' })
      fetchUsers()
    } else {
      const data = await res.json()
      showMsg('error', data.error || 'Erreur lors de la création')
    }
    setSaving(false)
  }

  const roleBadge = (role: string) => {
    if (role === 'admin') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <Shield size={12} /> Administrateur
      </span>
    )
    if (role === 'bureau') return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
        <Crown size={12} /> Bureau
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        <Users size={12} /> Membre
      </span>
    )
  }

  if (status === 'loading' || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <KeyRound size={24} className="text-tchad-blue" />
              Gestion des comptes
            </h1>
            <p className="text-gray-500">{users.length} comptes utilisateur</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary flex items-center gap-2 w-fit mt-3 sm:mt-0"
          >
            <UserPlus size={18} />
            Nouveau compte
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {message.text}
          </div>
        )}

        {/* Create form */}
        {showCreate && (
          <div className="card mb-6 border-2 border-tchad-blue/10">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <UserPlus size={16} />
              Créer un nouveau compte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nom complet</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-field"
                  placeholder="jean@exemple.com"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mot de passe</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="input-field"
                  placeholder="Mot de passe"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Rôle</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="select-field"
                >
                  <option value="viewer">Membre</option>
                  <option value="bureau">Bureau</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tchad-blue/5 border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-700">Utilisateur</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Rôle</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Date de création</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="p-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.map((user) => {
                  const isSelf = user.email === (session?.user as any)?.email
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-tchad-blue/10 rounded-full flex items-center justify-center">
                            <span className="text-tchad-blue font-semibold text-sm">
                              {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{user.name}</span>
                            {isSelf && <span className="ml-2 text-[10px] bg-tchad-yellow/20 text-tchad-blue-dark px-1.5 py-0.5 rounded font-medium">Vous</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        {isSelf ? roleBadge(user.role) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-white"
                          >
                            <option value="viewer">Membre</option>
                            <option value="bureau">Bureau</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {resetId === user.id ? (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Nouveau mot de passe"
                                  className="input-field text-sm pr-8 w-48"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                disabled={saving}
                                className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                                title="Confirmer"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => { setResetId(null); setNewPassword('') }}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                                title="Annuler"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => { setResetId(user.id); setNewPassword(''); setShowPassword(false) }}
                                className="p-2 hover:bg-tchad-yellow/20 rounded-lg text-tchad-blue transition-colors"
                                title="Réinitialiser le mot de passe"
                              >
                                <RotateCcw size={16} />
                              </button>
                              {!isSelf && (
                                <button
                                  onClick={() => handleDelete(user.id, user.name)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                  title="Supprimer le compte"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
