'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import { Settings, Upload, Trash2, Check, X, Image, Link2, Save, Lock, Eye, EyeOff, Monitor, Smartphone, Tablet, MapPin, Clock, LogOut } from 'lucide-react'

interface Device {
  id: string
  browser: string | null
  os: string | null
  deviceType: string | null
  ip: string | null
  city: string | null
  country: string | null
  lastActive: string
  createdAt: string
}

export default function ParametresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const fileRef = useRef<HTMLInputElement>(null)

  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [groupLink, setGroupLink] = useState('')
  const [groupLinkSaved, setGroupLinkSaved] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [loadingDevices, setLoadingDevices] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/')
    }
  }, [status, isAdmin, router])

  const fetchDevices = () => {
    fetch('/api/devices').then(r => r.json()).then(d => setDevices(d.devices || [])).catch(() => {}).finally(() => setLoadingDevices(false))
  }

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      Promise.all([
        fetch('/api/settings/logo').then(r => r.json()),
        fetch('/api/settings/group-link').then(r => r.json()),
      ]).then(([logoData, linkData]) => {
        setLogo(logoData.logo || null)
        setGroupLink(linkData.link || '')
        setGroupLinkSaved(linkData.link || '')
      }).catch(() => {}).finally(() => setLoading(false))
      fetchDevices()
    }
  }, [status, isAdmin])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showMsg('error', 'Veuillez sélectionner une image')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showMsg('error', 'L\'image ne doit pas dépasser 2 Mo')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('logo', file)

    const res = await fetch('/api/settings/logo', { method: 'PUT', body: formData })
    const data = await res.json()

    if (res.ok) {
      setLogo(data.logo)
      showMsg('success', 'Logo mis à jour avec succès. Rechargez la page pour voir le changement dans le menu.')
    } else {
      showMsg('error', data.error || 'Erreur lors de l\'upload')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer le logo personnalisé ? Le logo par défaut sera rétabli.')) return

    const res = await fetch('/api/settings/logo', { method: 'DELETE' })
    if (res.ok) {
      setLogo(null)
      showMsg('success', 'Logo supprimé. Le logo par défaut est rétabli.')
    } else {
      showMsg('error', 'Erreur lors de la suppression')
    }
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={24} className="text-tchad-blue" />
            Paramètres
          </h1>
          <p className="text-gray-500">Configuration de la plateforme</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {message.text}
          </div>
        )}

        {/* Logo section */}
        <div className="card max-w-2xl">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Image size={18} className="text-tchad-blue" />
            Logo de la plateforme
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ce logo sera affiché dans le menu latéral et comme icône de l'application installée sur smartphone.
          </p>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                {loading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-tchad-blue border-t-transparent rounded-full" />
                ) : logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-tchad-yellow rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-tchad-blue font-black text-xl">CT</span>
                    </div>
                    <span className="text-[10px] text-gray-400">Par défaut</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex-1 space-y-3">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload size={16} />
                  {uploading ? 'Envoi en cours...' : 'Changer le logo'}
                </button>
              </div>

              {logo && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Supprimer et revenir au logo par défaut
                </button>
              )}

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <p>• Formats acceptés : JPG, PNG, SVG, WebP</p>
                <p>• Taille maximale : 2 Mo</p>
                <p>• Recommandé : image carrée (ex: 512×512 px)</p>
                <p>• Cette image sera utilisée comme icône de l'application PWA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Group link section */}
        <div className="card max-w-2xl mt-6">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Link2 size={18} className="text-tchad-blue" />
            Lien du groupe communautaire
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ce lien sera envoyé par WhatsApp à chaque nouveau membre et peut être envoyé en masse aux membres existants depuis la page Membres.
          </p>

          <div className="flex gap-2">
            <input
              type="url"
              value={groupLink}
              onChange={(e) => setGroupLink(e.target.value)}
              placeholder="https://chat.whatsapp.com/... ou autre lien de groupe"
              className="input-field flex-1"
            />
            <button
              onClick={async () => {
                setSavingLink(true)
                const res = await fetch('/api/settings/group-link', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ link: groupLink }),
                })
                if (res.ok) {
                  setGroupLinkSaved(groupLink)
                  showMsg('success', groupLink ? 'Lien du groupe sauvegardé' : 'Lien du groupe supprimé')
                } else {
                  showMsg('error', 'Erreur lors de la sauvegarde')
                }
                setSavingLink(false)
              }}
              disabled={savingLink || groupLink === groupLinkSaved}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {savingLink ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          {groupLinkSaved && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <Check size={16} />
              Lien actif : <a href={groupLinkSaved} target="_blank" rel="noopener noreferrer" className="underline truncate">{groupLinkSaved}</a>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1 mt-3">
            <p>• Collez le lien d'invitation de votre groupe WhatsApp, Telegram, ou autre</p>
            <p>• Ce lien sera envoyé automatiquement aux nouveaux inscrits</p>
            <p>• Vous pouvez aussi l'envoyer en masse depuis la liste des membres</p>
          </div>
        </div>

        {/* Change password section */}
        <div className="card max-w-2xl mt-6">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Lock size={18} className="text-tchad-blue" />
            Changer le mot de passe
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Modifiez le mot de passe de votre compte administrateur.
          </p>

          <div className="space-y-3">
            <div>
              <label className="label-field">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label-field">Nouveau mot de passe</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div>
              <label className="label-field">Confirmer le nouveau mot de passe</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Répétez le nouveau mot de passe"
              />
            </div>
            <button
              onClick={async () => {
                if (newPassword.length < 6) {
                  showMsg('error', 'Le mot de passe doit contenir au moins 6 caractères')
                  return
                }
                if (newPassword !== confirmPassword) {
                  showMsg('error', 'Les mots de passe ne correspondent pas')
                  return
                }
                if (!currentPassword) {
                  showMsg('error', 'Entrez votre mot de passe actuel')
                  return
                }
                setSavingPassword(true)
                const res = await fetch('/api/change-password', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword }),
                })
                const data = await res.json()
                if (res.ok) {
                  showMsg('success', 'Mot de passe modifié. Déconnexion de tous les appareils...')
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setTimeout(() => signOut({ callbackUrl: '/login' }), 2000)
                } else {
                  showMsg('error', data.error || 'Erreur lors du changement de mot de passe')
                }
                setSavingPassword(false)
              }}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Lock size={16} />
              {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>

        {/* Connected devices section */}
        <div className="card max-w-2xl mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Monitor size={18} className="text-tchad-blue" />
              Appareils connectés
            </h2>
            {devices.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm('Déconnecter tous les appareils ? Vous serez aussi déconnecté.')) return
                  await fetch('/api/devices', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: 'all' }),
                  })
                  signOut({ callbackUrl: '/login' })
                }}
                className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                <LogOut size={14} />
                Tout déconnecter
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Historique des connexions à votre compte.
          </p>

          {loadingDevices ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-tchad-blue border-t-transparent rounded-full" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucun appareil enregistré
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((d, i) => {
                const DeviceIcon = d.deviceType === 'Mobile' ? Smartphone : d.deviceType === 'Tablette' ? Tablet : Monitor
                const isRecent = new Date(d.lastActive).getTime() > Date.now() - 1000 * 60 * 30
                return (
                  <div key={d.id} className={`flex items-center gap-4 p-4 rounded-xl border ${i === 0 ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <DeviceIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900">
                          {d.browser || 'Inconnu'} — {d.os || 'Inconnu'}
                        </p>
                        {i === 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold uppercase">
                            Actuel
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {(d.city || d.country) && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {[d.city, d.country].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {d.ip && !d.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            IP: {d.ip}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(d.lastActive).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {i > 0 && (
                      <button
                        onClick={async () => {
                          await fetch('/api/devices', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ deviceId: d.id }),
                          })
                          setDevices(prev => prev.filter(dev => dev.id !== d.id))
                          showMsg('success', 'Appareil supprimé')
                        }}
                        className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Supprimer cet appareil"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
