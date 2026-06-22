'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { Calendar, Plus, Trash2, MapPin, Clock, X } from 'lucide-react'

const TYPES = [
  { value: 'reunion', label: 'Réunion' },
  { value: 'fete', label: 'Fête' },
  { value: 'assemblee', label: 'Assemblée générale' },
  { value: 'autre', label: 'Autre' },
]

export default function EvenementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [evenements, setEvenements] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const [lieu, setLieu] = useState('')
  const [type, setType] = useState('reunion')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/evenements')
    const data = await res.json()
    setEvenements(data.evenements || [])
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  }, [status, fetchData])

  const handleAdd = async () => {
    if (!titre || !date) return
    setSaving(true)
    await fetch('/api/evenements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titre, description, date, heure, lieu, type }),
    })
    setSaving(false)
    setShowAdd(false)
    setTitre('')
    setDescription('')
    setDate('')
    setHeure('')
    setLieu('')
    setType('reunion')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    await fetch(`/api/evenements/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const now = new Date().toISOString().split('T')[0]

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
            <p className="text-gray-500">Calendrier des activités de la colonie</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Nouvel événement
            </button>
          )}
        </div>

        {/* À venir */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">À venir</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {evenements.filter((e) => e.date >= now).length === 0 && (
            <div className="card col-span-full text-center py-8 text-gray-400">
              <Calendar size={40} className="mx-auto mb-2 opacity-30" />
              Aucun événement à venir
            </div>
          )}
          {evenements
            .filter((e) => e.date >= now)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((ev) => (
              <div key={ev.id} className="card relative">
                {isAdmin && (
                  <button onClick={() => handleDelete(ev.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-tchad-blue/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-tchad-blue leading-none">
                      {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                    </span>
                    <span className="text-xs text-tchad-blue/70 uppercase mt-0.5">
                      {new Date(ev.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{ev.titre}</h3>
                    {ev.description && <p className="text-sm text-gray-500 mt-1">{ev.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {ev.heure && <span className="flex items-center gap-1"><Clock size={12} />{ev.heure}</span>}
                      {ev.lieu && <span className="flex items-center gap-1"><MapPin size={12} />{ev.lieu}</span>}
                      <span className="px-2 py-0.5 bg-tchad-blue/10 text-tchad-blue rounded-full text-[10px] uppercase font-bold">
                        {TYPES.find((t) => t.value === ev.type)?.label || ev.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Passés */}
        {evenements.filter((e) => e.date < now).length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Passés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evenements
                .filter((e) => e.date < now)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((ev) => (
                  <div key={ev.id} className="card opacity-60 relative">
                    {isAdmin && (
                      <button onClick={() => handleDelete(ev.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-gray-500 leading-none">
                          {new Date(ev.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                        </span>
                        <span className="text-xs text-gray-400 uppercase mt-0.5">
                          {new Date(ev.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-700">{ev.titre}</h3>
                        {ev.description && <p className="text-sm text-gray-400 mt-1">{ev.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </main>

      {/* Modal ajout */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Nouvel événement</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label-field">Titre *</label>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} className="input-field" placeholder="Assemblée générale..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Heure</label>
                  <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-field">Lieu</label>
                <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="input-field" placeholder="Salle communautaire..." />
              </div>
              <div>
                <label className="label-field">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="select-field">
                  {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" rows={3} placeholder="Détails..." />
              </div>
              <button onClick={handleAdd} disabled={!titre || !date || saving} className="btn-primary w-full py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus size={18} />{saving ? 'Enregistrement...' : 'Créer l\'événement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
