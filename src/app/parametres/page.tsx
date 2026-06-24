'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/components/Sidebar'
import { Settings, Upload, Trash2, Check, X, Image } from 'lucide-react'

export default function ParametresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const fileRef = useRef<HTMLInputElement>(null)

  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/')
    }
  }, [status, isAdmin, router])

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetch('/api/settings/logo')
        .then(r => r.json())
        .then(d => setLogo(d.logo || null))
        .catch(() => {})
        .finally(() => setLoading(false))
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
      </main>
    </div>
  )
}
