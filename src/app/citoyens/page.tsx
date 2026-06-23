'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from 'lucide-react'

interface Citoyen {
  id: string
  nom: string
  prenom: string
  sexe: string
  ville: string
  telephone?: string
  profession?: string
  carteSejour: string
  carteColonie: string
  situationRegularite: string
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
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  const fetchCitoyens = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (ville) params.set('ville', ville)
    if (statut) params.set('statut', statut)
    params.set('page', page.toString())

    const res = await fetch(`/api/citoyens?${params}`)
    const data = await res.json()
    setCitoyens(data.citoyens)
    setTotal(data.total)
    setPages(data.pages)
    setLoading(false)
  }, [search, ville, statut, page])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchCitoyens()
  }, [status, fetchCitoyens])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce membre ?')) return
    await fetch(`/api/citoyens/${id}`, { method: 'DELETE' })
    fetchCitoyens()
  }

  const statusBadge = (val: string) => {
    const styles: Record<string, string> = {
      'Oui': 'bg-green-100 text-green-700',
      'Ok': 'bg-green-100 text-green-700',
      'Régulier': 'bg-green-100 text-green-700',
      'Encours': 'bg-yellow-100 text-yellow-700',
      'En cours': 'bg-yellow-100 text-yellow-700',
      'Non': 'bg-red-100 text-red-700',
      'Irrégulier': 'bg-red-100 text-red-700',
    }
    const icons: Record<string, any> = {
      'Oui': CheckCircle,
      'Ok': CheckCircle,
      'Régulier': CheckCircle,
      'Encours': Clock,
      'En cours': Clock,
      'Non': XCircle,
      'Irrégulier': XCircle,
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
          {isAdmin && (
            <Link href="/citoyens/nouveau" className="btn-primary flex items-center gap-2 mt-3 sm:mt-0 w-fit">
              <UserPlus size={18} />
              Nouveau membre
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="card mb-6">
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
            <select
              value={ville}
              onChange={(e) => { setVille(e.target.value); setPage(1) }}
              className="select-field"
            >
              <option value="">Toutes les villes</option>
              <option value="Moanda">Moanda</option>
              <option value="Mounana">Mounana</option>
            </select>
            <select
              value={statut}
              onChange={(e) => { setStatut(e.target.value); setPage(1) }}
              className="select-field"
            >
              <option value="">Tous les statuts</option>
              <option value="Régulier">Régulier</option>
              <option value="Irrégulier">Irrégulier</option>
              <option value="En cours">En cours</option>
            </select>
          </div>
        </div>

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
                  citoyens.map((c) => (
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
                        <span className="text-xs text-gray-400">{c.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                      </td>
                      <td className="p-4 text-gray-600">{c.ville}</td>
                      <td className="p-4 text-gray-600">{c.telephone || '—'}</td>
                      <td className="p-4">{statusBadge(c.carteSejour)}</td>
                      <td className="p-4">{statusBadge(c.carteColonie)}</td>
                      <td className="p-4">{statusBadge(c.situationRegularite)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/citoyens/${c.id}`}
                            className="p-2 hover:bg-tchad-blue/10 rounded-lg text-tchad-blue transition-colors"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                href={`/citoyens/${c.id}?edit=true`}
                                className="p-2 hover:bg-tchad-yellow/20 rounded-lg text-tchad-blue-dark transition-colors"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-2 hover:bg-red-50 rounded-lg text-tchad-red transition-colors"
                                title="Supprimer"
                              >
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
