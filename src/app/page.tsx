'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import {
  Users,
  MapPin,
  CreditCard,
  Clock,
  XCircle,
  CheckCircle,
  Briefcase,
  DollarSign,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Wallet,
  Download,
  X,
  FileText,
} from 'lucide-react'

interface Stats {
  totalCitoyens: number
  parVille: { Moanda: number; Mounana: number }
  carteSejour: { oui: number; non: number }
  carteColonie: { ok: number; encours: number; non: number }
  regularite: { regulier: number; irregulier: number; enCours: number }
  emploi: { employe: number; nonEmploye: number }
  sexe: { hommes: number; femmes: number }
  montantTotal: number
  tresorerie: {
    totalContributions: number
    totalDepenses: number
    solde: number
    nbContributions: number
    nbDepenses: number
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showListeModal, setShowListeModal] = useState<'reguliers' | 'irreguliers' | null>(null)
  const [listeData, setListeData] = useState<any[]>([])
  const [listeLoading, setListeLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/stats')
        .then((r) => r.json())
        .then(setStats)
        .finally(() => setLoading(false))
    }
  }, [status])

  const handleShowListe = async (type: 'reguliers' | 'irreguliers') => {
    setShowListeModal(type)
    setListeLoading(true)
    const res = await fetch(`/api/rapports?type=${type}`)
    const data = await res.json()
    setListeData(data.data || [])
    setListeLoading(false)
  }

  const handleExportListe = (type: 'reguliers' | 'irreguliers') => {
    const titre = type === 'reguliers' ? 'PERSONNES EN SITUATION RÉGULIÈRE' : 'PERSONNES EN SITUATION IRRÉGULIÈRE'
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titre}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
      h1 { color: #002664; border-bottom: 3px solid #FECB00; padding-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin: 15px 0; }
      th { background: #002664; color: white; padding: 10px; text-align: left; }
      td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
      tr:nth-child(even) { background: #f9f9f9; }
      .count { font-size: 18px; font-weight: bold; color: #002664; margin: 10px 0; }
      .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <h1>${titre}</h1>
    <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
    <p class="count">Total : ${listeData.length} personnes</p>
    <table><tr><th>N°</th><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Ville</th><th>Téléphone</th><th>Profession</th><th>Carte séjour</th><th>Passeport</th></tr>`

    listeData.forEach((c, i) => {
      html += `<tr><td>${i + 1}</td><td>${c.nom}</td><td>${c.prenom}</td><td>${c.sexe === 'M' ? 'Homme' : 'Femme'}</td><td>${c.ville}</td><td>${c.telephone || '-'}</td><td>${c.profession || '-'}</td><td>${c.carteSejour}</td><td>${c.passeport}</td></tr>`
    })

    html += `</table><div class="footer">Colonie Tchadienne de Moanda & Mounana</div></body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">
            Vue d&apos;ensemble de la communauté tchadienne
          </p>
          <div className="mt-3 h-1 w-24 rounded-full overflow-hidden flex">
            <div className="h-full w-1/3 bg-tchad-blue" />
            <div className="h-full w-1/3 bg-tchad-yellow" />
            <div className="h-full w-1/3 bg-tchad-red" />
          </div>
        </div>

        {loading || !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Row 1 — General */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Users} label="Total membres" value={stats.totalCitoyens} color="blue" />
              <StatCard icon={MapPin} label="Moanda" value={stats.parVille.Moanda} color="yellow" />
              <StatCard icon={MapPin} label="Mounana" value={stats.parVille.Mounana} color="red" />
              <StatCard
                icon={Wallet}
                label="Solde caisse"
                value={`${stats.tresorerie.solde.toLocaleString('fr-FR')} FCFA`}
                subtitle={`${stats.tresorerie.nbContributions} entrées / ${stats.tresorerie.nbDepenses} sorties`}
                color="green"
              />
            </div>

            {/* Row 2 — Cartes */}
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Cartes & Documents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={FileCheck} label="Carte de séjour" value={stats.carteSejour.oui} subtitle={`${stats.carteSejour.non} sans carte`} color="blue" />
              <StatCard icon={CheckCircle} label="Carte colonie (OK)" value={stats.carteColonie.ok} color="green" />
              <StatCard icon={Clock} label="Carte colonie (En cours)" value={stats.carteColonie.encours} color="yellow" />
              <StatCard icon={XCircle} label="Carte colonie (Non)" value={stats.carteColonie.non} color="red" />
            </div>

            {/* Row 3 — Situation with action buttons */}
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Situation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div
                onClick={() => handleShowListe('reguliers')}
                className="stat-card cursor-pointer hover:ring-2 hover:ring-green-300 transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
                  <UserCheck size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Réguliers</p>
                  <p className="text-xl font-bold text-gray-900">{stats.regularite.regulier}</p>
                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                    <FileText size={10} /> Cliquez pour la liste
                  </p>
                </div>
              </div>
              <div
                onClick={() => handleShowListe('irreguliers')}
                className="stat-card cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-tchad-red/10 text-tchad-red">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Irréguliers</p>
                  <p className="text-xl font-bold text-gray-900">{stats.regularite.irregulier}</p>
                  <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                    <FileText size={10} /> Cliquez pour la liste
                  </p>
                </div>
              </div>
              <StatCard icon={Briefcase} label="Employés" value={stats.emploi.employe} subtitle={`${stats.emploi.nonEmploye} sans emploi`} color="blue" />
              <StatCard icon={Users} label="Sexe" value={`H: ${stats.sexe.hommes} / F: ${stats.sexe.femmes}`} color="yellow" />
            </div>

            {/* Trésorerie résumé */}
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Trésorerie</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard icon={DollarSign} label="Total contributions" value={`${stats.tresorerie.totalContributions.toLocaleString('fr-FR')} FCFA`} color="green" />
              <StatCard icon={DollarSign} label="Total dépenses" value={`${stats.tresorerie.totalDepenses.toLocaleString('fr-FR')} FCFA`} color="red" />
              <StatCard icon={DollarSign} label="Montant cartes colonie" value={`${stats.montantTotal.toLocaleString('fr-FR')} FCFA`} color="blue" />
            </div>

            {/* Progress bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Répartition par ville</h3>
                <ProgressBar label="Moanda" value={stats.parVille.Moanda} max={stats.totalCitoyens} color="bg-tchad-blue" />
                <ProgressBar label="Mounana" value={stats.parVille.Mounana} max={stats.totalCitoyens} color="bg-tchad-red" />
              </div>
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Carte de colonie</h3>
                <ProgressBar label="Obtenue" value={stats.carteColonie.ok} max={stats.totalCitoyens} color="bg-green-500" />
                <ProgressBar label="En cours" value={stats.carteColonie.encours} max={stats.totalCitoyens} color="bg-tchad-yellow" />
                <ProgressBar label="Non demandée" value={stats.carteColonie.non} max={stats.totalCitoyens} color="bg-gray-400" />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Modal liste réguliers/irréguliers */}
      {showListeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full mx-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {showListeModal === 'reguliers' ? 'Personnes en situation régulière' : 'Personnes en situation irrégulière'}
                <span className="ml-2 text-sm font-normal text-gray-500">({listeData.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportListe(showListeModal)}
                  disabled={listeLoading || listeData.length === 0}
                  className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download size={14} />
                  Exporter
                </button>
                <button onClick={() => setShowListeModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {listeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
                </div>
              ) : listeData.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucune personne trouvée</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">N°</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Nom & Prénom</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Ville</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Téléphone</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Carte séjour</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-600">Passeport</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listeData.map((c, i) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-2 font-medium">{c.nom} {c.prenom}</td>
                        <td className="py-2 px-2">{c.ville}</td>
                        <td className="py-2 px-2">{c.telephone || '-'}</td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.carteSejour === 'Oui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {c.carteSejour}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.passeport === 'Oui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {c.passeport}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: any
  label: string
  value: string | number
  subtitle?: string
  color: 'blue' | 'yellow' | 'red' | 'green'
}) {
  const colors = {
    blue: 'bg-tchad-blue/10 text-tchad-blue',
    yellow: 'bg-tchad-yellow/20 text-tchad-blue-dark',
    red: 'bg-tchad-red/10 text-tchad-red',
    green: 'bg-green-50 text-green-600',
  }

  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const percent = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {value} ({percent.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
