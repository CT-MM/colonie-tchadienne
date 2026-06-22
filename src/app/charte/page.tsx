'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { BookOpen, Save, Edit } from 'lucide-react'

export default function ChartePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [contenu, setContenu] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/charte')
        .then((r) => r.json())
        .then((data) => {
          setContenu(data.contenu || '')
          setLoaded(true)
        })
    }
  }, [status])

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/charte', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenu }),
    })
    setSaving(false)
    setEditing(false)
  }

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Charte de la Colonie</h1>
            <p className="text-gray-500">Document officiel de la Colonie Tchadienne</p>
          </div>
          {isAdmin && !editing && (
            <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
              <Edit size={18} />
              Modifier
            </button>
          )}
        </div>

        <div className="card">
          {!loaded ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
            </div>
          ) : editing ? (
            <div>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                className="w-full min-h-[500px] p-4 border border-gray-200 rounded-xl focus:border-tchad-blue focus:ring-0 outline-none text-sm leading-relaxed font-mono resize-y"
                placeholder="Écrivez la charte de la colonie ici...

Exemple de structure :

TITRE I — DISPOSITIONS GÉNÉRALES

Article 1 : La Colonie Tchadienne de Moanda et Mounana est une association...

Article 2 : Les objectifs de la colonie sont...

TITRE II — ADHÉSION ET COTISATIONS

Article 3 : Peut être membre tout citoyen tchadien résidant à Moanda ou Mounana...
"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : contenu ? (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed p-4">
              {contenu}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
              <p>La charte n&apos;a pas encore été rédigée</p>
              {isAdmin && (
                <button onClick={() => setEditing(true)} className="btn-primary mt-4">
                  Rédiger la charte
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
