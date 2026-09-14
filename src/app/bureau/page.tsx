'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Search, Trash2, User, X, Crown, Phone, MapPin, BookOpen, Scale, ChevronUp, ChevronDown, Download, FileText, Sparkles, GitBranch, Map, Edit3 } from 'lucide-react'
import SmartSearch, { SmartFilter } from '@/components/SmartSearch'

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
  const [showOrganigramme, setShowOrganigramme] = useState(false)
  const [filterCat, setFilterCat] = useState<string | null>(null)

  // Zone delegates state
  const [zones, setZones] = useState<any[]>([])
  const [showAddZone, setShowAddZone] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneQuartiers, setNewZoneQuartiers] = useState('')
  const [editingZone, setEditingZone] = useState<any>(null)
  const [showAddDelegue, setShowAddDelegue] = useState<string | null>(null)
  const [delegueSearch, setDelegueSearch] = useState('')
  const [delegueRole, setDelegueRole] = useState('Délégué')

  const exportBureauPDF = () => {
    const allMembres = [...getMembresForCat('executif'), ...getMembresForCat('religieux'), ...getMembresForCat('conseiller')]
    const target = filterCat ? allMembres.filter(m => (filterCat === 'executif' ? (!m.categorie || m.categorie === 'executif') : m.categorie === filterCat)) : allMembres
    const catLabel = filterCat ? CATEGORIES.find(c => c.value === filterCat)?.label || 'Bureau' : 'Bureau complet'
    const catLabelAr: Record<string, string> = { 'Bureau exécutif': 'المكتب التنفيذي', 'Commission religieuse': 'اللجنة الدينية', 'Conseillers': 'المستشارون', 'Bureau complet': 'المكتب الكامل' }
    const catAr = catLabelAr[catLabel] || 'المكتب'
    const dateFr = new Date().toLocaleDateString('fr-FR')
    const dateAr = new Date().toLocaleDateString('ar-SA')
    const fonctionAr: Record<string, string> = {
      'Président': 'الرئيس', 'Vice-Président': 'نائب الرئيس',
      'Secrétaire Général': 'الأمين العام', 'Secrétaire Général Adjoint': 'نائب الأمين العام',
      'Trésorier': 'أمين الصندوق', 'Trésorier Adjoint': 'نائب أمين الصندوق',
      'Commissaire aux comptes': 'مفتش الحسابات',
      'Chargé de communication': 'مسؤول الاتصال', 'Chargé du service informatique': 'مسؤول تكنولوجيا المعلومات',
      'Membre': 'عضو', 'Adjoint 1': 'النائب الأول', 'Adjoint 2': 'النائب الثاني',
      'Conseiller Principal': 'المستشار الرئيسي', 'Conseiller': 'مستشار',
      'Conseiller Juridique': 'مستشار قانوني',
      'Conseiller aux Affaires Sociales': 'مستشار الشؤون الاجتماعية',
      'Conseiller à la Jeunesse': 'مستشار شؤون الشباب',
      'Conseiller aux Relations Extérieures': 'مستشار العلاقات الخارجية',
    }

    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Madimi+One&family=Noto+Naskh+Arabic:wght@400;700&display=swap" rel="stylesheet">
      <title>${catLabel} / ${catAr}</title><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
      h1{color:#002664;border-bottom:3px solid #FECB00;padding-bottom:8px}
      .ar{font-family:'Noto Naskh Arabic','Arabic Typesetting',Tahoma,sans-serif;direction:rtl;text-align:right}
      .dual{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th{background:#002664;color:white;padding:10px;text-align:left;font-size:12px}
      th .ar-th{display:block;font-family:'Noto Naskh Arabic',sans-serif;font-size:11px;font-weight:normal;opacity:0.85;direction:rtl}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;vertical-align:middle}
      tr:nth-child(even){background:#f8f9fa}
      .photo{width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb}
      .no-photo{width:40px;height:40px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-weight:bold;font-size:14px}
      .footer{margin-top:20px;text-align:center;color:#999;font-size:11px}
      .fonction-ar{font-family:'Noto Naskh Arabic',sans-serif;direction:rtl;color:#666;font-size:12px;margin-top:2px}
    </style></head><body>
      <div class="dual"><h1>🇹🇩 ${catLabel} — Colonie Tchadienne</h1><h1 class="ar">${catAr} — الجالية التشادية</h1></div>
      <div class="dual">
        <p style="color:#666;font-size:13px">Généré le ${dateFr} — ${target.length} membre${target.length > 1 ? 's' : ''}</p>
        <p class="ar" style="color:#666;font-size:13px">تاريخ الإصدار ${dateAr} — ${target.length} عضو</p>
      </div>
      <table><thead><tr><th>N°<span class="ar-th">رقم</span></th><th>Photo<span class="ar-th">صورة</span></th><th>Nom & Prénom<span class="ar-th">الاسم واللقب</span></th><th>Fonction<span class="ar-th">الوظيفة</span></th><th>Téléphone<span class="ar-th">الهاتف</span></th><th>Ville<span class="ar-th">المدينة</span></th></tr></thead><tbody>
      ${target.map((m, i) => {
        const fAr = fonctionAr[m.fonction] || m.fonction
        return `<tr><td>${i + 1}</td><td>${m.citoyen.photo ? `<img src="${m.citoyen.photo}" class="photo"/>` : `<div class="no-photo">${m.citoyen.prenom[0]}${m.citoyen.nom[0]}</div>`}</td><td><strong>${m.citoyen.nom} ${m.citoyen.prenom}</strong></td><td>${m.fonction}<div class="fonction-ar">${fAr}</div></td><td>${m.citoyen.telephone || '—'}</td><td>${m.citoyen.ville}</td></tr>`
      }).join('')}
      </tbody></table>
      <div class="footer"><div>Colonie Tchadienne de la Lebombi-Leyou — Document généré automatiquement</div><div class="ar">الجالية التشادية في لبومبي-ليو — وثيقة صادرة تلقائيًا</div></div>
    </body></html>`)
    w.document.close()
    w.print()
  }

  const exportBureauCSV = () => {
    const allMembres = [...getMembresForCat('executif'), ...getMembresForCat('religieux'), ...getMembresForCat('conseiller')]
    const target = filterCat ? allMembres.filter(m => (filterCat === 'executif' ? (!m.categorie || m.categorie === 'executif') : m.categorie === filterCat)) : allMembres
    const csv = 'Nom,Prénom,Fonction,Catégorie,Téléphone,Ville\n' +
      target.map(m => `${m.citoyen.nom},${m.citoyen.prenom},${m.fonction},${CATEGORIES.find(c => c.value === (m.categorie || 'executif'))?.label || ''},${m.citoyen.telephone || ''},${m.citoyen.ville}`).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bureau-colonie-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const fetchZones = useCallback(async () => {
    const res = await fetch('/api/zones')
    const data = await res.json()
    setZones(data.zones || [])
  }, [])

  const handleAddZone = async () => {
    if (!newZoneName.trim()) return
    const quartiers = newZoneQuartiers.split(',').map(q => q.trim()).filter(Boolean)
    await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: newZoneName, quartiers }),
    })
    setNewZoneName('')
    setNewZoneQuartiers('')
    setShowAddZone(false)
    fetchZones()
  }

  const handleEditZone = async (zone: any) => {
    const quartiers = editingZone.quartiersText.split(',').map((q: string) => q.trim()).filter(Boolean)
    await fetch(`/api/zones/${zone.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: editingZone.nom, quartiers }),
    })
    setEditingZone(null)
    fetchZones()
  }

  const handleDeleteZone = async (id: string) => {
    if (!confirm('Supprimer cette zone et tous ses délégués ?')) return
    await fetch(`/api/zones/${id}`, { method: 'DELETE' })
    fetchZones()
  }

  const handleAddDelegue = async (zoneId: string, citoyenId: string) => {
    await fetch(`/api/zones/${zoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-delegue', citoyenId, role: delegueRole }),
    })
    setShowAddDelegue(null)
    setDelegueSearch('')
    setDelegueRole('Délégué')
    fetchZones()
  }

  const handleRemoveDelegue = async (zoneId: string, citoyenId: string) => {
    if (!confirm('Retirer ce délégué de la zone ?')) return
    await fetch(`/api/zones/${zoneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove-delegue', citoyenId }),
    })
    fetchZones()
  }

  const exportDeleguesPDF = () => {
    const dateFr = new Date().toLocaleDateString('fr-FR')
    let totalDelegues = 0
    zones.forEach(z => { totalDelegues += z.delegues?.length || 0 })

    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><meta charset="utf-8">
      <title>Délégués par Zone</title><style>
      body{font-family:Arial,sans-serif;padding:30px;color:#1a1a1a}
      h1{color:#002664;border-bottom:3px solid #FECB00;padding-bottom:8px}
      h2{color:#002664;margin-top:30px;padding:8px 12px;background:#f0f4ff;border-left:4px solid #002664;font-size:16px}
      .zone-info{color:#666;font-size:12px;margin:4px 0 12px 16px}
      table{width:100%;border-collapse:collapse;margin-bottom:20px}
      th{background:#002664;color:white;padding:10px;text-align:left;font-size:12px}
      td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px;vertical-align:middle}
      tr:nth-child(even){background:#f8f9fa}
      .photo{width:45px;height:45px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb}
      .no-photo{width:45px;height:45px;border-radius:50%;background:#e5e7eb;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-weight:bold;font-size:16px}
      .footer{margin-top:30px;text-align:center;color:#999;font-size:11px;border-top:1px solid #eee;padding-top:10px}
      .badge{display:inline-block;background:#FECB00;color:#002664;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold}
    </style></head><body>
      <h1>🇹🇩 Délégués par Zone — Colonie Tchadienne</h1>
      <p style="color:#666;font-size:13px">Généré le ${dateFr} — ${zones.length} zone${zones.length > 1 ? 's' : ''}, ${totalDelegues} délégué${totalDelegues > 1 ? 's' : ''}</p>
      ${zones.map(zone => {
        const quartiers = JSON.parse(zone.quartiers || '[]')
        return `
          <h2>📍 ${zone.nom}</h2>
          <div class="zone-info">Quartiers : ${quartiers.length > 0 ? quartiers.join(', ') : 'Aucun quartier défini'}</div>
          ${zone.delegues?.length > 0 ? `
            <table><thead><tr><th>N°</th><th>Photo</th><th>Nom & Prénom</th><th>Rôle</th><th>Téléphone</th><th>Ville / Quartier</th></tr></thead><tbody>
            ${zone.delegues.map((d: any, i: number) => `
              <tr><td>${i + 1}</td><td>${d.citoyen.photo ? `<img src="${d.citoyen.photo}" class="photo"/>` : `<div class="no-photo">${d.citoyen.prenom[0]}${d.citoyen.nom[0]}</div>`}</td><td><strong>${d.citoyen.nom} ${d.citoyen.prenom}</strong></td><td><span class="badge">${d.role}</span></td><td>${d.citoyen.telephone || '—'}</td><td>${d.citoyen.ville}${d.citoyen.quartier ? ' — ' + d.citoyen.quartier : ''}</td></tr>
            `).join('')}
            </tbody></table>
          ` : '<p style="color:#999;font-size:13px;margin-left:16px">Aucun délégué assigné</p>'}
        `
      }).join('')}
      <div class="footer">Colonie Tchadienne de la Lebombi-Leyou — Document généré automatiquement</div>
    </body></html>`)
    w.document.close()
    w.print()
  }

  const bureauSmartFilters: SmartFilter[] = [
    { label: 'Bureau exécutif complet', description: 'Afficher uniquement les membres du bureau exécutif', params: { cat: 'executif' } },
    { label: 'Conseil religieux', description: 'Afficher uniquement les membres du conseil religieux', params: { cat: 'religieux' } },
    { label: 'Conseillers', description: 'Afficher uniquement les conseillers', params: { cat: 'conseiller' } },
    { label: 'Tous les membres du bureau', description: 'Afficher toutes les catégories', params: { cat: '' } },
    { label: 'Organigramme', description: 'Afficher l\'organigramme hiérarchique du bureau', params: { view: 'organigramme' } },
  ]

  const handleSmartFilter = (params: Record<string, string>) => {
    if (params.view === 'organigramme') {
      setShowOrganigramme(true)
      setFilterCat(null)
    } else {
      setFilterCat(params.cat || null)
      setShowOrganigramme(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    const bureauRes = await fetch('/api/bureau')
    const bureauData = await bureauRes.json()
    setMembres(bureauData.membres || [])
  }, [])

  const fetchCitoyens = useCallback(async () => {
    if (citoyens.length > 0) return
    const citRes = await fetch('/api/citoyens?limit=2000&fields=minimal')
    const citData = await citRes.json()
    setCitoyens(citData.citoyens || [])
  }, [citoyens.length])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
      fetchZones()
    }
  }, [status, fetchData, fetchZones])

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
    fetchCitoyens()
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
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <>
                <SmartSearch
                  filters={bureauSmartFilters}
                  onApplyFilter={handleSmartFilter}
                  onExportCSV={exportBureauCSV}
                  onExportPDF={exportBureauPDF}
                  placeholder="Ex: bureau exécutif, conseillers..."
                />
                <button
                  onClick={() => setShowOrganigramme(!showOrganigramme)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    showOrganigramme ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <GitBranch size={16} />
                  Organigramme
                </button>
                <button onClick={exportBureauPDF} className="btn-secondary flex items-center gap-2 text-sm">
                  <FileText size={16} /> PDF
                </button>
                <button onClick={exportBureauCSV} className="btn-secondary flex items-center gap-2 text-sm">
                  <Download size={16} /> CSV
                </button>
                <button
                  onClick={() => { setCategorie('executif'); setFonction(FONCTIONS.executif[0]); setShowAdd(true); fetchCitoyens() }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter indicator */}
        {filterCat && (
          <div className="mb-4 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
            <Sparkles size={14} className="text-purple-500" />
            <span className="text-sm text-purple-700 font-medium">
              Filtre actif : {CATEGORIES.find(c => c.value === filterCat)?.label}
            </span>
            <button onClick={() => setFilterCat(null)} className="ml-auto text-purple-400 hover:text-purple-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Organigramme */}
        {showOrganigramme && (
          <div className="card mb-8 overflow-x-auto">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <GitBranch size={20} className="text-tchad-blue" />
              Organigramme — Colonie Tchadienne de la Lebombi-Leyou
            </h2>
            <OrgChart executif={membresExecutif} religieux={membresReligieux} conseillers={membresConseiller} />
          </div>
        )}

        {/* Bureau Exécutif */}
        {(!filterCat || filterCat === 'executif') && <SectionHeader icon={Crown} title="Bureau Exécutif" count={membresExecutif.length} color="bg-[#002664]" isAdmin={isAdmin} onAdd={() => openAddForCategory('executif')} />}
        {(!filterCat || filterCat === 'executif') && (membresExecutif.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('executif')} label="bureau exécutif" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresExecutif.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresExecutif.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('executif', i, dir)} accentColor="tchad-blue" firstLabel="PRÉSIDENT" />
            ))}
          </div>
        ))}

        {/* Conseil Religieux */}
        {(!filterCat || filterCat === 'religieux') && <SectionHeader icon={BookOpen} title="Conseil Religieux" count={membresReligieux.length} color="bg-emerald-600" isAdmin={isAdmin} onAdd={() => openAddForCategory('religieux')} />}
        {(!filterCat || filterCat === 'religieux') && (membresReligieux.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('religieux')} label="conseil religieux" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresReligieux.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresReligieux.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('religieux', i, dir)} accentColor="emerald-600" firstLabel="IMAM" />
            ))}
          </div>
        ))}

        {/* Conseillers */}
        {(!filterCat || filterCat === 'conseiller') && <SectionHeader icon={Scale} title="Conseillers" count={membresConseiller.length} color="bg-amber-600" isAdmin={isAdmin} onAdd={() => openAddForCategory('conseiller')} />}
        {(!filterCat || filterCat === 'conseiller') && (membresConseiller.length === 0 ? (
          <EmptyState isAdmin={isAdmin} onAdd={() => openAddForCategory('conseiller')} label="conseillers" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {membresConseiller.map((m, i) => (
              <MembreCard key={m.id} membre={m} index={i} total={membresConseiller.length} isFirst={i === 0} isAdmin={isAdmin} onDelete={handleDelete} onMove={(dir) => moveItem('conseiller', i, dir)} accentColor="amber-600" firstLabel="CONSEILLER PRINCIPAL" />
            ))}
          </div>
        ))}
        {/* Délégués par Zone */}
        {!filterCat && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <Map size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Délégués par Zone</h2>
                  <p className="text-xs text-gray-400">{zones.length} zone{zones.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {zones.length > 0 && (
                  <button onClick={exportDeleguesPDF} className="btn-secondary flex items-center gap-2 text-sm">
                    <FileText size={16} /> PDF Délégués
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setShowAddZone(true)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>

            {zones.length === 0 ? (
              <div className="card text-center py-8 mb-8">
                <Map size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Aucune zone définie</p>
                {isAdmin && <button onClick={() => setShowAddZone(true)} className="btn-primary mt-3 text-sm">Créer une zone</button>}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {zones.map((zone) => {
                  const quartiers = JSON.parse(zone.quartiers || '[]')
                  return (
                    <div key={zone.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin size={16} className="text-indigo-600" />
                            {editingZone?.id === zone.id ? (
                              <input type="text" value={editingZone.nom} onChange={e => setEditingZone({ ...editingZone, nom: e.target.value })} className="input-field py-1 px-2 text-sm w-48" />
                            ) : zone.nom}
                          </h3>
                          {editingZone?.id === zone.id ? (
                            <div className="mt-2">
                              <input type="text" value={editingZone.quartiersText} onChange={e => setEditingZone({ ...editingZone, quartiersText: e.target.value })} placeholder="Quartiers séparés par des virgules" className="input-field py-1 px-2 text-sm w-full" />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleEditZone(zone)} className="btn-primary text-xs px-3 py-1">Enregistrer</button>
                                <button onClick={() => setEditingZone(null)} className="btn-secondary text-xs px-3 py-1">Annuler</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {quartiers.map((q: string) => (
                                <span key={q} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{q}</span>
                              ))}
                              {quartiers.length === 0 && <span className="text-xs text-gray-400">Aucun quartier</span>}
                            </div>
                          )}
                        </div>
                        {isAdmin && !editingZone && (
                          <div className="flex gap-1">
                            <button onClick={() => setEditingZone({ id: zone.id, nom: zone.nom, quartiersText: quartiers.join(', ') })} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title="Modifier">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDeleteZone(zone.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Delegues list */}
                      {zone.delegues?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                          {zone.delegues.map((d: any) => (
                            <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                                {d.citoyen.photo ? (
                                  <img src={d.citoyen.photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User size={20} className="text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">{d.citoyen.nom} {d.citoyen.prenom}</p>
                                <p className="text-xs text-indigo-600 font-medium">{d.role}</p>
                                {d.citoyen.telephone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{d.citoyen.telephone}</p>}
                              </div>
                              {isAdmin && (
                                <button onClick={() => handleRemoveDelegue(zone.id, d.citoyenId)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 flex-shrink-0">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-3">
                          {showAddDelegue === zone.id ? (
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                              <div className="flex gap-2 mb-2">
                                <select value={delegueRole} onChange={e => setDelegueRole(e.target.value)} className="select-field text-sm py-1.5">
                                  <option>Délégué</option>
                                  <option>Chef de zone</option>
                                  <option>Adjoint</option>
                                  <option>Secrétaire</option>
                                </select>
                                <button onClick={() => { setShowAddDelegue(null); setDelegueSearch('') }} className="text-gray-400 hover:text-gray-600 p-1">
                                  <X size={16} />
                                </button>
                              </div>
                              <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Rechercher un membre..." value={delegueSearch} onChange={e => { setDelegueSearch(e.target.value); fetchCitoyens() }} className="input-field pl-8 text-sm py-1.5" />
                                {delegueSearch.length >= 2 && (
                                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                                    {citoyens.filter(c =>
                                      delegueSearch.length >= 2 &&
                                      !zone.delegues?.some((d: any) => d.citoyenId === c.id) &&
                                      (c.nom.toLowerCase().includes(delegueSearch.toLowerCase()) || c.prenom.toLowerCase().includes(delegueSearch.toLowerCase()))
                                    ).slice(0, 10).map(c => (
                                      <button key={c.id} onClick={() => handleAddDelegue(zone.id, c.id)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2">
                                        <User size={14} className="text-gray-400" />
                                        <span className="font-medium">{c.nom} {c.prenom}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setShowAddDelegue(zone.id); fetchCitoyens() }} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
                              <Plus size={14} /> Ajouter un délégué
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal ajout zone */}
      {showAddZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Créer une zone</h3>
              <button onClick={() => setShowAddZone(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-field">Nom de la zone *</label>
                <input type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="Ex: Zone 1 - Centre" className="input-field" />
              </div>
              <div>
                <label className="label-field">Quartiers (séparés par des virgules)</label>
                <input type="text" value={newZoneQuartiers} onChange={e => setNewZoneQuartiers(e.target.value)} placeholder="Ex: Centre-ville, Marché, Gare" className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Saisissez les noms des quartiers séparés par des virgules</p>
              </div>
              <button onClick={handleAddZone} disabled={!newZoneName.trim()} className="btn-primary w-full py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                <Plus size={18} /> Créer la zone
              </button>
            </div>
          </div>
        </div>
      )}

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

function OrgChart({ executif, religieux, conseillers }: { executif: any[]; religieux: any[]; conseillers: any[] }) {
  const OrgNode = ({ name, role, color, highlight }: { name: string; role: string; color: string; highlight?: boolean }) => (
    <div className={`inline-flex flex-col items-center px-4 py-3 rounded-xl border-2 ${highlight ? 'border-[#FECB00] bg-[#FECB00]/5' : `border-${color}/20 bg-white`} shadow-sm min-w-[140px]`}>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{role}</span>
      <span className="text-sm font-semibold text-gray-900 mt-0.5 text-center">{name}</span>
    </div>
  )

  const president = executif[0]
  const vp = executif.find(m => m.fonction === 'Vice-Président')
  const sg = executif.find(m => m.fonction === 'Secrétaire Général')
  const tresorier = executif.find(m => m.fonction === 'Trésorier')
  const others = executif.filter(m => m !== president && m !== vp && m !== sg && m !== tresorier)

  const imamPrincipal = religieux[0]
  const conseillerPrincipal = conseillers[0]

  if (executif.length === 0 && religieux.length === 0 && conseillers.length === 0) {
    return <p className="text-center text-gray-400 py-8">Ajoutez des membres au bureau pour voir l'organigramme</p>
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* President */}
      {president && (
        <>
          <OrgNode name={`${president.citoyen.nom} ${president.citoyen.prenom}`} role="Président" color="[#002664]" highlight />
          <div className="w-0.5 h-6 bg-gray-300" />
        </>
      )}

      {/* VP + SG + Trésorier */}
      <div className="flex flex-wrap justify-center gap-4 relative">
        {vp && <OrgNode name={`${vp.citoyen.nom} ${vp.citoyen.prenom}`} role="Vice-Président" color="[#002664]" />}
        {sg && <OrgNode name={`${sg.citoyen.nom} ${sg.citoyen.prenom}`} role="Secrétaire Général" color="[#002664]" />}
        {tresorier && <OrgNode name={`${tresorier.citoyen.nom} ${tresorier.citoyen.prenom}`} role="Trésorier" color="[#002664]" />}
      </div>

      {/* Other executif members */}
      {others.length > 0 && (
        <>
          <div className="w-0.5 h-4 bg-gray-200" />
          <div className="flex flex-wrap justify-center gap-3">
            {others.map(m => (
              <OrgNode key={m.id} name={`${m.citoyen.nom} ${m.citoyen.prenom}`} role={m.fonction} color="[#002664]" />
            ))}
          </div>
        </>
      )}

      {/* Horizontal separator */}
      {(religieux.length > 0 || conseillers.length > 0) && (
        <div className="w-full border-t-2 border-dashed border-gray-200 my-2" />
      )}

      {/* Religieux + Conseillers side by side */}
      <div className="flex flex-wrap justify-center gap-12">
        {religieux.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full">Conseil Religieux</span>
            {imamPrincipal && <OrgNode name={`${imamPrincipal.citoyen.nom} ${imamPrincipal.citoyen.prenom}`} role={imamPrincipal.fonction} color="emerald-600" highlight />}
            {religieux.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2">
                {religieux.slice(1).map(m => (
                  <OrgNode key={m.id} name={`${m.citoyen.nom} ${m.citoyen.prenom}`} role={m.fonction} color="emerald-600" />
                ))}
              </div>
            )}
          </div>
        )}

        {conseillers.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full">Conseillers</span>
            {conseillerPrincipal && <OrgNode name={`${conseillerPrincipal.citoyen.nom} ${conseillerPrincipal.citoyen.prenom}`} role={conseillerPrincipal.fonction} color="amber-600" highlight />}
            {conseillers.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2">
                {conseillers.slice(1).map(m => (
                  <OrgNode key={m.id} name={`${m.citoyen.nom} ${m.citoyen.prenom}`} role={m.fonction} color="amber-600" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
