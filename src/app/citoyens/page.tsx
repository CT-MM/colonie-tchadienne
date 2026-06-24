'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import {
  Search, Filter, Eye, Edit, Trash2, ChevronLeft, ChevronRight,
  UserPlus, CheckCircle, Clock, XCircle, DollarSign,
  ArrowUpAZ, ArrowDownZA, Download, ChevronDown, X, FileText,
} from 'lucide-react'

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

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/citoyens/quartiers').then((r) => r.json()).then(setQuartiers)
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
  .flag { display:inline-flex; gap:0; margin-right:12px; }
  .flag div { width:8px; height:30px; }
</style>
</head><body>
<div class="header">
  <div style="display:flex;align-items:center">
    <div class="flag"><div style="background:#002664;border-radius:3px 0 0 3px"></div><div style="background:#FECB00"></div><div style="background:#C60C30;border-radius:0 3px 3px 0"></div></div>
    <div>
      <h1>Colonie Tchadienne — Moanda & Mounana</h1>
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
<div class="footer">Colonie Tchadienne de Moanda & Mounana — Document généré le ${today}</div>
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
                      <td className="p-4">{statusBadge(c.carteColonie)}</td>
                      <td className="p-4">{statusBadge(c.situationRegularite)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/citoyens/${c.id}`} className="p-2 hover:bg-tchad-blue/10 rounded-lg text-tchad-blue transition-colors" title="Voir">
                            <Eye size={16} />
                          </Link>
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
