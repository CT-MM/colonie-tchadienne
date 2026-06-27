'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  DollarSign, Plus, Search, Trash2, TrendingUp, TrendingDown,
  Wallet, FileText, ArrowUpCircle, ArrowDownCircle, Calendar,
  Download, X,
} from 'lucide-react'

function formatMontant(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

export default function TresoreriePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [tab, setTab] = useState<'contributions' | 'depenses'>('contributions')
  const [contributions, setContributions] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [totals, setTotals] = useState({ contributions: 0, depenses: 0, solde: 0 })
  const [citoyens, setCitoyens] = useState<any[]>([])

  // Form states
  const [showAddContrib, setShowAddContrib] = useState(false)
  const [showAddDepense, setShowAddDepense] = useState(false)
  const [showRapport, setShowRapport] = useState(false)
  const [searchCitoyen, setSearchCitoyen] = useState('')
  const [selectedCitoyen, setSelectedCitoyen] = useState<any>(null)
  const [montant, setMontant] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [motif, setMotif] = useState('')
  const [saving, setSaving] = useState(false)

  // Rapport states
  const [rapportDateDebut, setRapportDateDebut] = useState('')
  const [rapportDateFin, setRapportDateFin] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchData = useCallback(async () => {
    const [contribRes, depRes, citRes] = await Promise.all([
      fetch('/api/contributions?limit=200'),
      fetch('/api/depenses?limit=200'),
      fetch('/api/citoyens?limit=2000'),
    ])
    const contribData = await contribRes.json()
    const depData = await depRes.json()
    const citData = await citRes.json()

    setContributions(contribData.contributions || [])
    setDepenses(depData.depenses || [])
    setCitoyens(citData.citoyens || [])
    setTotals({
      contributions: contribData.totalMontant || 0,
      depenses: depData.totalMontant || 0,
      solde: (contribData.totalMontant || 0) - (depData.totalMontant || 0),
    })
  }, [])

  useEffect(() => {
    if (status === 'authenticated') fetchData()
  }, [status, fetchData])

  const filteredCitoyens = citoyens.filter(
    (c) =>
      searchCitoyen.length >= 2 &&
      (c.nom.toLowerCase().includes(searchCitoyen.toLowerCase()) ||
        c.prenom.toLowerCase().includes(searchCitoyen.toLowerCase()))
  )

  const handleAddContribution = async () => {
    if (!selectedCitoyen || !montant) return
    setSaving(true)
    await fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        citoyenId: selectedCitoyen.id,
        montant: parseFloat(montant),
        date,
        description,
      }),
    })
    setSaving(false)
    setShowAddContrib(false)
    setSelectedCitoyen(null)
    setSearchCitoyen('')
    setMontant('')
    setDescription('')
    fetchData()
  }

  const handleAddDepense = async () => {
    if (!montant || !motif) return
    setSaving(true)
    await fetch('/api/depenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        montant: parseFloat(montant),
        date,
        motif,
        description,
      }),
    })
    setSaving(false)
    setShowAddDepense(false)
    setMontant('')
    setMotif('')
    setDescription('')
    fetchData()
  }

  const handleDelete = async (type: 'contributions' | 'depenses', id: string) => {
    if (!confirm('Supprimer cet enregistrement ?')) return
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleGenerateRapport = async () => {
    setGenerating(true)
    const params = new URLSearchParams()
    if (rapportDateDebut) params.set('dateDebut', rapportDateDebut)
    if (rapportDateFin) params.set('dateFin', rapportDateFin)

    const [contribRes, depRes] = await Promise.all([
      fetch(`/api/rapports?type=contributions&${params}`),
      fetch(`/api/rapports?type=depenses&${params}`),
    ])
    const contribs = await contribRes.json()
    const deps = await depRes.json()

    const periode = rapportDateDebut && rapportDateFin
      ? `du ${new Date(rapportDateDebut).toLocaleDateString('fr-FR')} au ${new Date(rapportDateFin).toLocaleDateString('fr-FR')}`
      : 'Toutes périodes'

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport Trésorerie</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      h1 { color: #002664; border-bottom: 3px solid #FECB00; padding-bottom: 10px; }
      h2 { color: #002664; margin-top: 30px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th { background: #002664; color: white; padding: 10px; text-align: left; }
      td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
      tr:nth-child(even) { background: #f9f9f9; }
      .total { font-weight: bold; font-size: 18px; color: #002664; margin: 10px 0; }
      .solde { font-size: 22px; font-weight: bold; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
      .positif { background: #d4edda; color: #155724; }
      .negatif { background: #f8d7da; color: #721c24; }
      .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <h1>RAPPORT DE TRÉSORERIE — COLONIE TCHADIENNE</h1>
    <p><strong>Période :</strong> ${periode}</p>
    <p><strong>Généré le :</strong> ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>`

    html += `<h2>CONTRIBUTIONS (${contribs.count} entrées)</h2>`
    if (contribs.data.length > 0) {
      html += `<table><tr><th>Date</th><th>Membre</th><th>Ville</th><th>Montant</th><th>Description</th></tr>`
      for (const c of contribs.data) {
        html += `<tr><td>${new Date(c.date).toLocaleDateString('fr-FR')}</td><td>${c.citoyen.nom} ${c.citoyen.prenom}</td><td>${c.citoyen.ville}</td><td>${formatMontant(c.montant)}</td><td>${c.description || '-'}</td></tr>`
      }
      html += `</table><p class="total">Total contributions : ${formatMontant(contribs.total)}</p>`
    } else {
      html += `<p>Aucune contribution sur cette période.</p>`
    }

    html += `<h2>DÉPENSES (${deps.count} sorties)</h2>`
    if (deps.data.length > 0) {
      html += `<table><tr><th>Date</th><th>Motif</th><th>Montant</th><th>Description</th></tr>`
      for (const d of deps.data) {
        html += `<tr><td>${new Date(d.date).toLocaleDateString('fr-FR')}</td><td>${d.motif}</td><td>${formatMontant(d.montant)}</td><td>${d.description || '-'}</td></tr>`
      }
      html += `</table><p class="total">Total dépenses : ${formatMontant(deps.total)}</p>`
    } else {
      html += `<p>Aucune dépense sur cette période.</p>`
    }

    const solde = contribs.total - deps.total
    html += `<div class="solde ${solde >= 0 ? 'positif' : 'negatif'}">SOLDE : ${formatMontant(solde)}</div>`
    html += `<div class="footer">Colonie Tchadienne de la Lebombi-Leyou — Rapport généré automatiquement</div></body></html>`

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
    setGenerating(false)
  }

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trésorerie</h1>
            <p className="text-gray-500">Gestion des contributions et dépenses</p>
          </div>
          <button
            onClick={() => setShowRapport(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText size={18} />
            Générer un rapport
          </button>
        </div>

        {/* Solde cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total contributions</p>
              <p className="text-xl font-bold text-green-600">{formatMontant(totals.contributions)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total dépenses</p>
              <p className="text-xl font-bold text-red-500">{formatMontant(totals.depenses)}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totals.solde >= 0 ? 'bg-tchad-blue/10' : 'bg-red-50'}`}>
              <Wallet size={24} className={totals.solde >= 0 ? 'text-tchad-blue' : 'text-red-500'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Solde de la caisse</p>
              <p className={`text-xl font-bold ${totals.solde >= 0 ? 'text-tchad-blue' : 'text-red-500'}`}>
                {formatMontant(totals.solde)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('contributions')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === 'contributions' ? 'bg-tchad-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowDownCircle size={16} />
            Contributions ({contributions.length})
          </button>
          <button
            onClick={() => setTab('depenses')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === 'depenses' ? 'bg-tchad-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ArrowUpCircle size={16} />
            Dépenses ({depenses.length})
          </button>
          {isAdmin && (
            <div className="flex-1 flex justify-end gap-2">
              <button
                onClick={() => { setShowAddContrib(true); setMontant(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]) }}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Contribution
              </button>
              <button
                onClick={() => { setShowAddDepense(true); setMontant(''); setMotif(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]) }}
                className="btn-secondary flex items-center gap-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
              >
                <Plus size={16} />
                Dépense
              </button>
            </div>
          )}
        </div>

        {/* Liste */}
        <div className="card">
          {tab === 'contributions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Membre</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Ville</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Montant</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Description</th>
                    {isAdmin && <th className="py-3 px-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-green-500" />
                          {c.citoyen.nom} {c.citoyen.prenom}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">{c.citoyen.ville}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-green-600">
                        {formatMontant(c.montant)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">{c.description || '-'}</td>
                      {isAdmin && (
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleDelete('contributions', c.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {contributions.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune contribution enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'depenses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Motif</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-600">Montant</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">Description</th>
                    {isAdmin && <th className="py-3 px-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {depenses.map((d) => (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2.5 px-3">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2.5 px-3 font-medium">{d.motif}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-red-500">
                        -{formatMontant(d.montant)}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">{d.description || '-'}</td>
                      {isAdmin && (
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleDelete('depenses', d.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {depenses.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune dépense enregistrée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal ajout contribution */}
      {showAddContrib && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle contribution</h3>
              <button onClick={() => setShowAddContrib(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-field">Rechercher un membre *</label>
                {selectedCitoyen ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-medium text-green-800">
                      {selectedCitoyen.nom} {selectedCitoyen.prenom}
                    </span>
                    <span className="text-sm text-green-600">({selectedCitoyen.ville})</span>
                    <button onClick={() => { setSelectedCitoyen(null); setSearchCitoyen('') }} className="ml-auto text-green-400 hover:text-green-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tapez un nom ou prénom..."
                      value={searchCitoyen}
                      onChange={(e) => setSearchCitoyen(e.target.value)}
                      className="input-field pl-9"
                    />
                    {filteredCitoyens.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {filteredCitoyens.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCitoyen(c); setSearchCitoyen('') }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                          >
                            <span className="font-medium">{c.nom} {c.prenom}</span>
                            <span className="text-gray-400">— {c.ville}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Montant (FCFA) *</label>
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="25000"
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label-field">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Description (optionnel)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cotisation annuelle, frais de carte..."
                  className="input-field"
                />
              </div>

              <button
                onClick={handleAddContribution}
                disabled={!selectedCitoyen || !montant || saving}
                className="btn-primary w-full py-2.5 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer la contribution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout dépense */}
      {showAddDepense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Nouvelle dépense</h3>
              <button onClick={() => setShowAddDepense(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-field">Motif *</label>
                <input
                  type="text"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Achat fournitures, location salle..."
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Montant (FCFA) *</label>
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="50000"
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label-field">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Description (optionnel)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails supplémentaires..."
                  className="input-field"
                />
              </div>

              <button
                onClick={handleAddDepense}
                disabled={!motif || !montant || saving}
                className="w-full py-2.5 disabled:opacity-50 flex items-center justify-center gap-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <Plus size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer la dépense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rapport */}
      {showRapport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Générer un rapport</h3>
              <button onClick={() => setShowRapport(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Sélectionnez une période pour générer un rapport des contributions et dépenses.
                Laissez vide pour toutes les périodes.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Date début</label>
                  <input
                    type="date"
                    value={rapportDateDebut}
                    onChange={(e) => setRapportDateDebut(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Date fin</label>
                  <input
                    type="date"
                    value={rapportDateFin}
                    onChange={(e) => setRapportDateFin(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateRapport}
                disabled={generating}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                {generating ? 'Génération...' : 'Générer le rapport'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
