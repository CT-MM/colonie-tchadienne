'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import {
  Search, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  UserPlus, CheckCircle, Clock, XCircle, DollarSign,
  ArrowUpAZ, ArrowDownZA, Download, ChevronDown, X, FileText, Send, Copy, SkipForward,
} from 'lucide-react'
import SmartSearch, { SmartFilter } from '@/components/SmartSearch'

interface Citoyen {
  id: string
  nom: string
  prenom: string
  sexe: string
  ville: string
  quartier?: string
  telephone?: string
  profession?: string
  carteSejour: string
  carteColonie: string
  situationRegularite: string
  situationFamiliale?: string
  familleAuGabon?: boolean
  estEmploye: boolean
  photo?: string
  groupeInvite?: boolean
  createdAt: string
}

function CitoyensContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [citoyens, setCitoyens] = useState<Citoyen[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [ville, setVille] = useState(searchParams.get('ville') || '')
  const [statut, setStatut] = useState(searchParams.get('statut') || '')
  const [quartier, setQuartier] = useState('')
  const [situationFamiliale, setSituationFamiliale] = useState('')
  const [familleAuGabon, setFamilleAuGabon] = useState('')
  const [carteColonie, setCarteColonie] = useState('')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [sortOrder, setSortOrder] = useState<'default' | 'az' | 'za'>('default')
  const [showFilters, setShowFilters] = useState(false)
  const [quartiers, setQuartiers] = useState<Record<string, string[]>>({})
  const [exporting, setExporting] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [groupLink, setGroupLink] = useState('')
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastMembers, setBroadcastMembers] = useState<Citoyen[]>([])
  const [loadingBroadcast, setLoadingBroadcast] = useState(false)
  const [copied, setCopied] = useState(false)
  const [broadcastIndex, setBroadcastIndex] = useState(-1)
  const [broadcastSent, setBroadcastSent] = useState<Set<number>>(new Set())
  const [skipInvited, setSkipInvited] = useState(true)

  const membresSmartFilters: SmartFilter[] = [
    { label: 'Membres sans carte de séjour', description: 'Tous les membres n\'ayant pas de carte de séjour', params: { statut: '', carteColonie: '', carteSejour: 'Non' } },
    { label: 'Membres irréguliers', description: 'Membres en situation irrégulière', params: { statut: 'Irrégulier', carteColonie: '', carteSejour: '' } },
    { label: 'Membres sans carte de colonie', description: 'Membres n\'ayant pas encore leur carte', params: { statut: '', carteColonie: 'Non', carteSejour: '' } },
    { label: 'Cartes de colonie en cours', description: 'Membres dont la carte est en cours de fabrication', params: { statut: '', carteColonie: 'Encours', carteSejour: '' } },
    { label: 'Membres de Moanda', description: 'Tous les membres résidant à Moanda', params: { ville: 'Moanda', statut: '', carteColonie: '', carteSejour: '' } },
    { label: 'Membres de Mounana', description: 'Tous les membres résidant à Mounana', params: { ville: 'Mounana', statut: '', carteColonie: '', carteSejour: '' } },
    { label: 'Hommes', description: 'Tous les membres masculins', params: { sexe: 'M', statut: '', carteColonie: '', carteSejour: '' } },
    { label: 'Femmes', description: 'Toutes les membres féminines', params: { sexe: 'F', statut: '', carteColonie: '', carteSejour: '' } },
    { label: 'Membres réguliers', description: 'Membres en situation régulière', params: { statut: 'Régulier', carteColonie: '', carteSejour: '' } },
    { label: 'Tous les membres', description: 'Réinitialiser tous les filtres', params: { ville: '', statut: '', carteColonie: '', carteSejour: '', quartier: '', situationFamiliale: '', familleAuGabon: '' } },
  ]

  const handleSmartFilter = (params: Record<string, string>) => {
    if (params.ville !== undefined) setVille(params.ville)
    if (params.statut !== undefined) setStatut(params.statut)
    if (params.carteColonie !== undefined) setCarteColonie(params.carteColonie)
    if (params.quartier !== undefined) setQuartier(params.quartier)
    if (params.situationFamiliale !== undefined) setSituationFamiliale(params.situationFamiliale)
    if (params.familleAuGabon !== undefined) setFamilleAuGabon(params.familleAuGabon)
    setPage(1)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/citoyens/quartiers').then((r) => r.json()).then(setQuartiers)
      fetch('/api/settings/group-link').then((r) => r.json()).then(d => setGroupLink(d.link || ''))
    }
  }, [status])

  const activeFilterCount = [statut, quartier, situationFamiliale, familleAuGabon, carteColonie].filter(Boolean).length

  const buildParams = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (ville) params.set('ville', ville)
    if (statut) params.set('statut', statut)
    if (quartier) params.set('quartier', quartier)
    if (situationFamiliale) params.set('situationFamiliale', situationFamiliale)
    if (familleAuGabon) params.set('familleAuGabon', familleAuGabon)
    if (carteColonie) params.set('carteColonie', carteColonie)
    return params
  }, [search, ville, statut, quartier, situationFamiliale, familleAuGabon, carteColonie])

  const fetchCitoyens = useCallback(async () => {
    setLoading(true)
    const params = buildParams()
    params.set('page', page.toString())
    const res = await fetch(`/api/citoyens?${params}`)
    const data = await res.json()
    setCitoyens(data.citoyens)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [buildParams, page])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchCitoyens()
  }, [status, fetchCitoyens])

  useEffect(() => {
    if (ville) {
      setQuartier('')
    }
  }, [ville])

  const handleExport = async () => {
    setExporting(true)
    const params = buildParams()
    const res = await fetch(`/api/citoyens/export?${params}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `membres-colonie-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleExportPDF = async () => {
    setExporting(true)
    const params = buildParams()
    params.set('limit', '2000')
    const res = await fetch(`/api/citoyens?${params}`)
    const data = await res.json()
    const list = data.citoyens || []

    const sorted = [...list].sort((a: any, b: any) => a.nom.localeCompare(b.nom))

    const win = window.open('', '_blank')
    if (!win) { setExporting(false); return }

    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const filterDesc = [
      ville && `Ville: ${ville}`,
      quartier && `Quartier: ${quartier}`,
      carteColonie && `Carte: ${carteColonie}`,
      situationFamiliale && `Famille: ${situationFamiliale}`,
      familleAuGabon && `Famille au Gabon: ${familleAuGabon === 'true' ? 'Oui' : 'Non'}`,
      statut && `Régularité: ${statut}`,
    ].filter(Boolean).join(' | ')

    const rows = sorted.map((c: any, i: number) => `
      <tr>
        <td style="text-align:center;font-weight:600;color:#666">${i + 1}</td>
        <td style="text-align:center">
          ${c.photo
            ? `<img src="${c.photo}" style="width:45px;height:45px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb" />`
            : `<div style="width:45px;height:45px;border-radius:50%;background:#f3f4f6;display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#002664;font-size:14px;border:2px solid #e5e7eb">${c.prenom[0]}${c.nom[0]}</div>`
          }
        </td>
        <td><strong>${c.nom} ${c.prenom}</strong><br/><span style="color:#888;font-size:11px">${c.sexe === 'M' ? 'Homme' : 'Femme'}${c.ville ? ' — ' + c.ville : ''}</span></td>
        <td style="font-family:monospace;font-size:13px">${c.telephone || '—'}</td>
        <td style="font-family:monospace;font-weight:600;color:#002664;font-size:13px">${c.numeroCarte || '—'}</td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;${
            c.carteColonie === 'Ok' ? 'background:#dcfce7;color:#15803d' :
            c.carteColonie === 'Encours' ? 'background:#fef9c3;color:#a16207' :
            'background:#fee2e2;color:#dc2626'
          }">${c.carteColonie}</span>
        </td>
      </tr>
    `).join('')

    win.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Liste des membres - Colonie Tchadienne</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color:#1f2937; font-size:13px; }
  .header { background: linear-gradient(135deg, #002664 0%, #001a4d 100%); color:white; padding:20px 30px; display:flex; align-items:center; justify-content:space-between; border-radius:8px; margin-bottom:16px; }
  .header h1 { font-size:22px; margin:0; }
  .header .sub { opacity:0.7; font-size:13px; margin-top:2px; }
  .header .right { text-align:right; }
  .header .count { font-size:28px; font-weight:800; color:#FECB00; }
  .filters { font-size:11px; color:#666; margin-bottom:10px; padding:0 4px; }
  table { width:100%; border-collapse:collapse; }
  thead th { background:#f8fafc; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; border-bottom:2px solid #e2e8f0; }
  tbody td { padding:8px 12px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
  tbody tr:hover { background:#f8fafc; }
  .footer { text-align:center; margin-top:16px; font-size:10px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px; }
  .logo { width:48px; height:48px; margin-right:14px; flex-shrink:0; }
</style>
</head><body>
<div class="header">
  <div style="display:flex;align-items:center">
    <svg class="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="c"><circle cx="50" cy="50" r="50"/></clipPath></defs>
      <g clip-path="url(#c)">
        <rect x="0" y="0" width="34" height="100" fill="#002664"/>
        <rect x="34" y="0" width="32" height="100" fill="#FECB00"/>
        <rect x="66" y="0" width="34" height="100" fill="#C60C30"/>
      </g>
    </svg>
    <div>
      <h1>Colonie Tchadienne — Lebombi-Leyou</h1>
      <div class="sub">Liste des membres au ${today}</div>
    </div>
  </div>
  <div class="right">
    <div class="count">${sorted.length}</div>
    <div style="font-size:11px;opacity:0.7">membres</div>
  </div>
</div>
${filterDesc ? `<div class="filters">Filtres: ${filterDesc}</div>` : ''}
<table>
  <thead>
    <tr>
      <th style="width:40px;text-align:center">N°</th>
      <th style="width:65px;text-align:center">Photo</th>
      <th>Nom & Prénom</th>
      <th style="width:130px">Téléphone</th>
      <th style="width:120px">N° Carte</th>
      <th style="width:90px;text-align:center">Carte</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Colonie Tchadienne de la Lebombi-Leyou — Document généré le ${today}</div>
<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 500); }
</script>
</body></html>`)
    win.document.close()
    setExporting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce membre ?')) return
    await fetch(`/api/citoyens/${id}`, { method: 'DELETE' })
    fetchCitoyens()
  }

  const handleValidateCarte = async (id: string) => {
    setValidatingId(id)
    await fetch(`/api/citoyens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carteColonie: 'Ok' }),
    })
    setCitoyens(prev => prev.map(c => c.id === id ? { ...c, carteColonie: 'Ok' } : c))
    setValidatingId(null)
  }

  const formatPhone = (tel: string) => {
    let num = tel.replace(/[\s\-\.\(\)]/g, '')
    if (num.startsWith('0')) num = '241' + num.slice(1)
    if (!num.startsWith('+') && !num.startsWith('241')) num = '241' + num
    num = num.replace('+', '')
    return num
  }

  const sendGroupLink = (tel: string, prenom: string, citoyenId?: string) => {
    if (!groupLink || !tel) return
    const phone = formatPhone(tel)
    const msg = `Bonjour ${prenom}, bienvenue dans la Colonie Tchadienne de la Lebombi-Leyou ! Rejoignez notre groupe ici : ${groupLink}`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
    if (citoyenId) {
      fetch(`/api/citoyens/${citoyenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupeInvite: true }),
      })
      setCitoyens(prev => prev.map(c => c.id === citoyenId ? { ...c, groupeInvite: true } : c))
      setBroadcastMembers(prev => prev.map(c => c.id === citoyenId ? { ...c, groupeInvite: true } : c))
    }
  }

  const openBroadcast = async () => {
    setShowBroadcast(true)
    setBroadcastIndex(-1)
    setBroadcastSent(new Set())
    setCopied(false)
    setLoadingBroadcast(true)
    const res = await fetch('/api/citoyens?limit=5000')
    const data = await res.json()
    setBroadcastMembers((data.citoyens || []).filter((c: Citoyen) => c.telephone))
    setLoadingBroadcast(false)
  }

  const filteredBroadcastMembers = skipInvited
    ? broadcastMembers.filter(c => !c.groupeInvite)
    : broadcastMembers

  const invitedCount = broadcastMembers.filter(c => c.groupeInvite).length

  const copyAllNumbers = () => {
    const numbers = filteredBroadcastMembers.map(c => '+' + formatPhone(c.telephone!)).join('\n')
    navigator.clipboard.writeText(numbers)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const startSequentialSend = () => {
    setBroadcastIndex(0)
    const c = filteredBroadcastMembers[0]
    if (c) sendGroupLink(c.telephone!, c.prenom, c.id)
  }

  const sendNext = () => {
    setBroadcastSent(prev => new Set(prev).add(broadcastIndex))
    const next = broadcastIndex + 1
    if (next >= filteredBroadcastMembers.length) {
      setBroadcastIndex(-2)
      return
    }
    setBroadcastIndex(next)
    const c = filteredBroadcastMembers[next]
    sendGroupLink(c.telephone!, c.prenom, c.id)
  }

  const skipCurrent = () => {
    const next = broadcastIndex + 1
    if (next >= filteredBroadcastMembers.length) {
      setBroadcastIndex(-2)
      return
    }
    setBroadcastIndex(next)
    const c = filteredBroadcastMembers[next]
    sendGroupLink(c.telephone!, c.prenom, c.id)
  }

  const clearFilters = () => {
    setStatut('')
    setQuartier('')
    setSituationFamiliale('')
    setFamilleAuGabon('')
    setCarteColonie('')
    setPage(1)
  }

  const statusBadge = (val: string) => {
    const styles: Record<string, string> = {
      'Oui': 'bg-green-100 text-green-700', 'Ok': 'bg-green-100 text-green-700', 'Régulier': 'bg-green-100 text-green-700',
      'Encours': 'bg-yellow-100 text-yellow-700', 'En cours': 'bg-yellow-100 text-yellow-700',
      'Non': 'bg-red-100 text-red-700', 'Irrégulier': 'bg-red-100 text-red-700',
    }
    const icons: Record<string, any> = {
      'Oui': CheckCircle, 'Ok': CheckCircle, 'Régulier': CheckCircle,
      'Encours': Clock, 'En cours': Clock,
      'Non': XCircle, 'Irrégulier': XCircle,
    }
    const Icon = icons[val] || XCircle
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[val] || 'bg-gray-100 text-gray-600'}`}>
        <Icon size={12} />
        {val}
      </span>
    )
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  const availableQuartiers = ville ? (quartiers[ville] || []) : Object.values(quartiers).flat().filter((v, i, a) => a.indexOf(v) === i).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
            <p className="text-gray-500">{total} membres enregistrés</p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0 flex-wrap">
            {isAdmin && (
              <SmartSearch
                filters={membresSmartFilters}
                onApplyFilter={handleSmartFilter}
                onExportCSV={handleExport}
                onExportPDF={handleExportPDF}
                placeholder="Ex: irréguliers, sans carte, Moanda..."
              />
            )}
            {isAdmin && groupLink && (
              <button
                onClick={openBroadcast}
                disabled={loadingBroadcast}
                className="flex items-center gap-2 text-sm px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Send size={16} />
                {loadingBroadcast ? 'Chargement...' : 'Diffuser le lien'}
              </button>
            )}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Download size={16} />
              CSV
            </button>
            {isAdmin && (
              <Link href="/citoyens/nouveau" className="btn-primary flex items-center gap-2 w-fit">
                <UserPlus size={18} />
                Nouveau membre
              </Link>
            )}
          </div>
        </div>

        {/* Search + quick filters */}
        <div className="card mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, téléphone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="input-field pl-10"
              />
            </div>
            <select value={ville} onChange={(e) => { setVille(e.target.value); setPage(1) }} className="select-field">
              <option value="">Toutes les villes</option>
              <option value="Moanda">Moanda</option>
              <option value="Mounana">Mounana</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'az' ? 'za' : sortOrder === 'za' ? 'default' : 'az')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  sortOrder !== 'default' ? 'border-tchad-blue bg-tchad-blue/5 text-tchad-blue' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {sortOrder === 'za' ? <ArrowDownZA size={16} /> : <ArrowUpAZ size={16} />}
                {sortOrder === 'az' ? 'A→Z' : sortOrder === 'za' ? 'Z→A' : 'Trier'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0 ? 'border-tchad-blue bg-tchad-blue/5 text-tchad-blue' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Filter size={16} />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="bg-tchad-blue text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>
                )}
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="card mb-4 border-2 border-tchad-blue/10 bg-tchad-blue/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                <Filter size={14} />
                Filtres avancés
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-tchad-blue hover:underline flex items-center gap-1">
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Situation familiale</label>
                <select value={situationFamiliale} onChange={(e) => { setSituationFamiliale(e.target.value); setPage(1) }} className="select-field text-sm">
                  <option value="">Toutes</option>
                  <option value="Marié(e)">Marié(e)</option>
                  <option value="Célibataire">Célibataire</option>
                  <option value="Divorcé(e)">Divorcé(e)</option>
                  <option value="Veuf/Veuve">Veuf/Veuve</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Famille au Gabon</label>
                <select value={familleAuGabon} onChange={(e) => { setFamilleAuGabon(e.target.value); setPage(1) }} className="select-field text-sm">
                  <option value="">Tous</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Carte de colonie</label>
                <select value={carteColonie} onChange={(e) => { setCarteColonie(e.target.value); setPage(1) }} className="select-field text-sm">
                  <option value="">Toutes</option>
                  <option value="Ok">Ok</option>
                  <option value="Encours">En cours</option>
                  <option value="Non">Non</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Régularité</label>
                <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1) }} className="select-field text-sm">
                  <option value="">Tous</option>
                  <option value="Régulier">Régulier</option>
                  <option value="Irrégulier">Irrégulier</option>
                  <option value="En cours">En cours</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Quartier</label>
                <select value={quartier} onChange={(e) => { setQuartier(e.target.value); setPage(1) }} className="select-field text-sm">
                  <option value="">Tous</option>
                  {availableQuartiers.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tchad-blue/5 border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-700">Photo</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Nom & Prénom</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Ville</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Téléphone</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Carte séjour</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Carte colonie</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Régularité</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="p-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : citoyens.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">
                      Aucun membre trouvé
                    </td>
                  </tr>
                ) : (
                  [...citoyens].sort((a, b) => {
                    if (sortOrder === 'az') return a.nom.localeCompare(b.nom)
                    if (sortOrder === 'za') return b.nom.localeCompare(a.nom)
                    return 0
                  }).map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="p-4">
                        <div className="w-10 h-10 bg-tchad-blue/10 rounded-full overflow-hidden flex items-center justify-center">
                          {c.photo ? (
                            <img src={c.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-tchad-blue font-semibold text-sm">
                              {c.prenom[0]}{c.nom[0]}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900">{c.nom} {c.prenom}</span>
                          {(c as any).aContribue && (
                            <span title="A contribué"><DollarSign size={15} className="text-green-500" /></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{c.sexe === 'M' ? 'Homme' : 'Femme'}{c.quartier ? ` — ${c.quartier}` : ''}</span>
                      </td>
                      <td className="p-4 text-gray-600">{c.ville}</td>
                      <td className="p-4 text-gray-600">{c.telephone || '—'}</td>
                      <td className="p-4">{statusBadge(c.carteSejour)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {statusBadge(c.carteColonie)}
                          {isAdmin && c.carteColonie !== 'Ok' && (
                            <button
                              onClick={() => handleValidateCarte(c.id)}
                              disabled={validatingId === c.id}
                              className="p-1 hover:bg-green-50 rounded text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                              title="Valider la carte"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{statusBadge(c.situationRegularite)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/citoyens/${c.id}`} className="p-2 hover:bg-tchad-blue/10 rounded-lg text-tchad-blue transition-colors" title="Voir">
                            <Eye size={16} />
                          </Link>
                          {isAdmin && groupLink && c.telephone && (
                            <button
                              onClick={() => sendGroupLink(c.telephone!, c.prenom, c.id)}
                              className={`p-2 rounded-lg transition-colors ${c.groupeInvite ? 'text-green-300 hover:bg-green-50' : 'text-green-600 hover:bg-green-50'}`}
                              title={c.groupeInvite ? 'Déjà invité — Renvoyer le lien' : 'Envoyer le lien du groupe'}
                            >
                              {c.groupeInvite ? <CheckCircle size={16} /> : <Send size={16} />}
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <Link href={`/citoyens/${c.id}?edit=true`} className="p-2 hover:bg-tchad-yellow/20 rounded-lg text-tchad-blue-dark transition-colors" title="Modifier">
                                <Edit size={16} />
                              </Link>
                              <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg text-tchad-red transition-colors" title="Supprimer">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {pages} ({total} résultats)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Broadcast modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { if (broadcastIndex < 0) setShowBroadcast(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Send size={20} className="text-green-600" />
                  Diffusion du lien du groupe
                </h2>
                <p className="text-sm text-gray-500">
                  {loadingBroadcast ? 'Chargement des membres...' : `${filteredBroadcastMembers.length} membre${filteredBroadcastMembers.length > 1 ? 's' : ''} à contacter`}
                  {!loadingBroadcast && invitedCount > 0 && skipInvited && (
                    <span className="text-green-600"> ({invitedCount} déjà invité{invitedCount > 1 ? 's' : ''})</span>
                  )}
                </p>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {loadingBroadcast ? (
              <div className="p-10 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
              </div>
            ) : broadcastIndex === -2 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Diffusion terminée !</h3>
                <p className="text-sm text-gray-500 mb-4">{broadcastSent.size} message{broadcastSent.size > 1 ? 's' : ''} envoyé{broadcastSent.size > 1 ? 's' : ''} sur {filteredBroadcastMembers.length}</p>
                <button onClick={() => setShowBroadcast(false)} className="btn-primary">Fermer</button>
              </div>
            ) : broadcastIndex >= 0 ? (
              <div className="p-5">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Envoi en cours</span>
                    <span className="text-green-600 font-bold">{broadcastSent.size + 1} / {filteredBroadcastMembers.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${((broadcastSent.size + 1) / filteredBroadcastMembers.length) * 100}%` }} />
                  </div>
                </div>

                {/* Current member */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Membre actuel :</p>
                  <p className="text-lg font-bold text-gray-900">{filteredBroadcastMembers[broadcastIndex]?.nom} {filteredBroadcastMembers[broadcastIndex]?.prenom}</p>
                  <p className="text-sm text-gray-500">{filteredBroadcastMembers[broadcastIndex]?.telephone}</p>
                </div>

                <p className="text-xs text-gray-400 mb-4 text-center">
                  WhatsApp s'est ouvert avec le message pré-rempli. Envoyez le message, puis revenez ici et cliquez sur « Suivant ».
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setShowBroadcast(false)} className="btn-secondary flex-1 text-sm">
                    Arrêter
                  </button>
                  <button onClick={skipCurrent} className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors text-sm">
                    <SkipForward size={16} />
                    Passer
                  </button>
                  <button onClick={sendNext} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm">
                    <Send size={16} />
                    {broadcastSent.size + 1 >= filteredBroadcastMembers.length ? 'Terminer' : 'Suivant'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5">
                {/* Skip toggle */}
                {invitedCount > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Sauter les déjà invités</p>
                      <p className="text-xs text-blue-600">{invitedCount} membre{invitedCount > 1 ? 's' : ''} déjà invité{invitedCount > 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => setSkipInvited(!skipInvited)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${skipInvited ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${skipInvited ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Option 1: Copy all numbers */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Option 1 — Copier tous les numéros</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Copiez les numéros, ouvrez WhatsApp &rarr; Nouvelle diffusion &rarr; ajoutez les contacts, puis envoyez votre message à tous en une seule fois.
                  </p>
                  <button
                    onClick={copyAllNumbers}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                      copied ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {copied ? <><CheckCircle size={16} /> {filteredBroadcastMembers.length} numéros copiés !</> : <><Copy size={16} /> Copier les {filteredBroadcastMembers.length} numéros</>}
                  </button>
                </div>

                {/* Option 2: Sequential send */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Option 2 — Envoi séquentiel</h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Envoie le message un par un via WhatsApp. Chaque membre s'ouvre dans WhatsApp, vous envoyez, puis cliquez « Suivant ».
                  </p>
                  <button
                    onClick={startSequentialSend}
                    disabled={filteredBroadcastMembers.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors w-full justify-center bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                  >
                    <Send size={16} /> Commencer l'envoi ({filteredBroadcastMembers.length} membres)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CitoyensPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" /></div>}>
      <CitoyensContent />
    </Suspense>
  )
}
