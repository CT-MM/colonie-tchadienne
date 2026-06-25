'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Search, Trash2, User, X, Crown, Phone, MapPin, BookOpen, Scale, ChevronUp, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { value: 'executif', label: 'Bureau Exécutif', icon: Crown, color: 'tchad-blue' },
  { value: 'religieux', label: 'Conseil Religieux', icon: BookOpen, color: 'emerald-600' },
  { value: 'conseiller', label: 'Conseillers', icon: Scale, color: 'amber-600' },
]

const FONCTIONS: Record<string, string[]> = {
  executif: [
    'Président', 'Vice-Président', 'Secrétaire Général', 'Secrétaire Général Adjoint',
    'Trésorier', 'Trésorier Adjoint', 'Commissaire aux comptes',
    'Chargé de communication', 'Chargé du service informatique', 'Membre',
  ],
  religieux: ['Président', 'Vice-Président', 'Adjoint 1', 'Adjoint 2', 'Secrétaire Général'],
  conseiller: [
    'Conseiller Principal', 'Conseiller', 'Conseiller Juridique',
    'Conseiller aux Affaires Sociales', 'Conseiller à la Jeunesse', 'Conseiller aux Relations Extérieures',
  ],
}

export default function BureauPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [membres, setMembres] = useState<any[]>([])
  const [citoyens, setCitoyens] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [searchCitoyen, setSearchCitoyen] = useState('')
  const [selectedCitoyen, setSelectedCitoyen] = useState<any>(null)
  const [categorie, setCategorie] = useState('executif')
  const [fonction, setFonction] = useState('Membre')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    const [bureauRes, citRes] = await Promise.all([
      fetch('/api/bureau'),
      fetch('/api/citoyens?limit=2000'),
    ])
    const bureauData = await bureauRes.json()
    const citData = await citRes.json()
    setMembres(bureauData.membres || [])
    setCitoyens(citData.citoyens || [])
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  }, [status, fetchData])

  const membreIds = new Set(membres.map((m) => m.citoyenId))
  const filteredCitoyens = citoyens.filter(
    (c) =>
      searchCitoyen.length >= 2 &&
      !membreIds.has(c.id) &&
      (c.nom.toLowerCase().includes(searchCitoyen.toLowerCase()) ||
        c.prenom.toLowerCase().includes(searchCitoyen.toLowerCase()))
  )

  const handleAdd = async () => {
    if (!selectedCitoyen || !fonction) return
    setSaving(true)
    await fetch('/api/bureau', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ citoyenId: selectedCitoyen.id, fonction, categorie }),
    })
    setSaving(false)
    setShowAdd(false)
    setSelectedCitoyen(null)
    setSearchCitoyen('')
    setCategorie('executif')
    setFonction('Membre')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Retirer ce membre du bureau ?')) return
    await fetch(`/api/bureau/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const moveItem = async (cat: string, index: number, direction: 'up' | 'down') => {
    const catMembres = getMembresForCat(cat)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= catMembres.length) return

    const reordered = [...catMembres]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    const newMembres = membres.map((m) => {
      const idx = reordered.findIndex((r) => r.id === m.id)
      if (idx >= 0) return { ...m, ordre: idx }
      return m
    })
    setMembres(newMembres)

    await fetch('/api/bureau/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: reordered.map((r) => r.id) }),
    })
  }

  const getMembresForCat = (cat: string) =>
    membres.filter((m) => cat === 'executif' ? (!m.categorie || m.categorie === 'executif') : m.categorie === cat)
      .sort((a, b) => a.ordre - b.ordre)

  const openAddForCategory = (cat: string) => {
    setCategorie(cat)
    setFonction(FONCTIONS[cat][0])
    setShowAdd(true)
  }

  if (status !== 'authenticated') return null

  const membresExecutif = getMembresForCat('executif')
  const membresReligieux = getMembresForCat('religieux')
  const membresConseiller = getMembresForCat('conseiller')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bureau exécutif</h1>
            <p className="text-gray-500">Membres du bureau de la Colonie Tchadienne</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setCategorie('executif'); setFonction(FONCTIONS.executif[0]); setShowAdd(true) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Ajouter un membre
            </button>
          )}
        </div>

        {/* Bureau Exécutif */}
        <SectionHeader icon={Crown} title="Bureau Exécutif" count={membresExecutif.length} color="bg-[#002664]" isAdmin={isAdmin} onAdd={() => openAddForCategory('executif')} />
        {membresExecutif.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('executif')} label="bureau exécutif" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresExecutif.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresExecutif.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('executif', i, dir)} accentColor="tchad-blue" firstLabel="PRÉSIDENT" />
            ))}
          </div>
        )}

        {/* Conseil Religieux */}
        <SectionHeader icon={BookOpen} title="Conseil Religieux" count={membresReligieux.length} color="bg-emerald-600" isAdmin={isAdmin} onAdd={() => openAddForCategory('religieux')} />
        {membresReligieux.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('religieux')} label="conseil religieux" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresReligieux.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresReligieux.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('religieux', i, dir)} accentColor="emerald-600" firstLabel="IMAM" />
            ))}
          </div>
        )}

        {/* Conseillers */}
        <SectionHeader icon={Scale} title="Conseillers" count={membresConseiller.length} color="bg-amber-600" isAdmin={isAdmin} onAdd={() => openAddForCategory('conseiller')} />
        {membresConseiller.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('conseiller')} label="conseillers" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresConseiller.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresConseiller.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('conseiller', i, dir)} accentColor="amber-600" firstLabel="CONSEILLER PRINCIPAL" />
            ))}
          </div>
        )}
      </main>

      {/* Modal ajout membre */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Ajouter un membre</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-field">Section *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setCategorie(cat.value); setFonction(FONCTIONS[cat.value][0]) }}
                      className={`p-2.5 rounded-xl text-center text-xs font-semibold border-2 transition-all ${
                        categorie === cat.value
                          ? 'border-[#002664] bg-[#002664]/5 text-[#002664]'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <cat.icon size={18} className="mx-auto mb-1" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-field">Rechercher un membre *</label>
                {selectedCitoyen ? (
                  <div className="flex items-center gap-2 p-3 bg-[#002664]/5 rounded-lg border border-[#002664]/20">
                    <User size={16} className="text-[#002664]" />
                    <span className="font-medium">{selectedCitoyen.nom} {selectedCitoyen.prenom}</span>
                    <span className="text-sm text-gray-500">({selectedCitoyen.ville})</span>
                    <button onClick={() => { setSelectedCitoyen(null); setSearchCitoyen('') }} className="ml-auto text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Tapez un nom ou prénom..." value={searchCitoyen} onChange={(e) => setSearchCitoyen(e.target.value)} className="input-field pl-9" />
                    {filteredCitoyens.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredCitoyens.map((c) => (
                          <button key={c.id} onClick={() => { setSelectedCitoyen(c); setSearchCitoyen('') }} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                            <span className="font-medium">{c.nom} {c.prenom}</span>
                            <span className="text-gray-400">— {c.ville}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="label-field">Fonction *</label>
                <select value={fonction} onChange={(e) => setFonction(e.target.value)} className="select-field">
                  {FONCTIONS[categorie].map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              </div>

              <button onClick={handleAdd} disabled={!selectedCitoyen || saving} className="btn-primary w-full py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus size={18} />
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, count, color, isAdmin, onAdd }: {
  icon: any; title: string; count: number; color: string; isAdmin: boolean; onAdd: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-4 mt-2">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{count} membre{count > 1 ? 's' : ''}</p>
        </div>
      </div>
      {isAdmin && (
        <button onClick={onAdd} className="text-[#002664] hover:bg-[#002664]/5 p-2 rounded-lg transition">
          <Plus size={20} />
        </button>
      )}
    </div>
  )
}

function EmptyState({ isAdmin, onAdd, label }: { isAdmin: boolean; onAdd: () => void; label: string }) {
  return (
    <div className="card text-center py-8 mb-8">
      <Users size={40} className="mx-auto text-gray-300 mb-2" />
      <p className="text-gray-400 text-sm">Aucun membre dans le {label}</p>
      {isAdmin && <button onClick={onAdd} className="btn-primary mt-3 text-sm">Ajouter un membre</button>}
    </div>
  )
}

function MembreCard({ membre: m, index, total, isFirst, isAdmin, onDelete, onMove, accentColor, firstLabel }: {
  membre: any; index: number; total: number; isFirst: boolean; isAdmin: boolean; onDelete: (id: string) => void; onMove: (dir: 'up' | 'down') => void; accentColor: string; firstLabel: string
}) {
  return (
    <div className={`card relative overflow-hidden ${isFirst ? 'border-2 border-[#FECB00]' : ''}`}>
      {isFirst && (
        <div className={`absolute top-0 right-0 ${
          accentColor === 'tchad-blue' ? 'bg-[#FECB00] text-[#002664]' :
          accentColor === 'emerald-600' ? 'bg-emerald-100 text-emerald-700' :
          'bg-amber-100 text-amber-700'
        } px-3 py-1 rounded-bl-lg text-[10px] font-bold`}>
          {firstLabel}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
          {m.citoyen.photo ? (
            <img src={m.citoyen.photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={28} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900">{m.citoyen.nom} {m.citoyen.prenom}</h3>
          <p className={`font-semibold text-sm ${
            accentColor === 'tchad-blue' ? 'text-[#002664]' :
            accentColor === 'emerald-600' ? 'text-emerald-600' : 'text-amber-600'
          }`}>{m.fonction}</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            {m.citoyen.telephone && <p className="flex items-center gap-1"><Phone size={12} />{m.citoyen.telephone}</p>}
            <p className="flex items-center gap-1"><MapPin size={12} />{m.citoyen.ville}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button onClick={() => onMove('up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Monter">
              <ChevronUp size={14} />
            </button>
            <button onClick={() => onMove('down')} disabled={index === total - 1} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20" title="Descendre">
              <ChevronDown size={14} />
            </button>
            <button onClick={() => onDelete(m.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 mt-1" title="Retirer">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
