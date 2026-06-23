'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import CitoyenForm from '@/components/CitoyenForm'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  CreditCard,
  User,
  MapPin,
  Briefcase,
  Heart,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

function CitoyenDetailContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isAdmin = (session?.user as any)?.role === 'admin'
  const isEdit = searchParams.get('edit') === 'true'

  const [citoyen, setCitoyen] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && params.id) {
      fetch(`/api/citoyens/${params.id}`)
        .then((r) => r.json())
        .then(setCitoyen)
        .finally(() => setLoading(false))
    }
  }, [status, params.id])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!citoyen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Membre non trouvé</p>
      </div>
    )
  }

  if (isEdit && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="lg:ml-72 p-6 lg:p-8">
          <div className="mb-6">
            <Link
              href={`/citoyens/${params.id}`}
              className="text-tchad-blue hover:underline text-sm flex items-center gap-1 mb-2"
            >
              <ArrowLeft size={16} />
              Retour à la fiche
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Modifier — {citoyen.nom} {citoyen.prenom}
            </h1>
          </div>
          <CitoyenForm initial={citoyen} isEdit />
        </main>
      </div>
    )
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
      'Oui': CheckCircle, 'Ok': CheckCircle, 'Régulier': CheckCircle,
      'Encours': Clock, 'En cours': Clock,
      'Non': XCircle, 'Irrégulier': XCircle,
    }
    const Icon = icons[val] || XCircle
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[val] || 'bg-gray-100 text-gray-600'}`}>
        <Icon size={14} />
        {val}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/citoyens" className="text-tchad-blue hover:underline text-sm flex items-center gap-1 mb-2">
              <ArrowLeft size={16} />
              Retour à la liste
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {citoyen.nom} {citoyen.prenom}
            </h1>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Link href={`/citoyens/${params.id}?edit=true`} className="btn-primary flex items-center gap-2">
                <Edit size={16} />
                Modifier
              </Link>
            )}
            <Link href={`/carte-generator?id=${params.id}`} className="btn-secondary flex items-center gap-2">
              <CreditCard size={16} />
              Générer carte
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo & basic info */}
          <div className="card text-center">
            <div className="w-32 h-40 bg-gray-100 rounded-xl overflow-hidden mx-auto mb-4 border-2 border-gray-200">
              {citoyen.photo ? (
                <img src={citoyen.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={48} className="text-gray-300" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{citoyen.nom} {citoyen.prenom}</h2>
            <p className="text-gray-500">{citoyen.sexe === 'M' ? 'Homme' : 'Femme'} — {citoyen.nationalite}</p>
            <div className="mt-3">{statusBadge(citoyen.situationRegularite)}</div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <User size={18} className="text-tchad-blue" />
                Identité
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Né(e) le" value={citoyen.dateNaissance} />
                <InfoRow label="Lieu" value={citoyen.lieuNaissance} />
                <InfoRow label="Téléphone" value={citoyen.telephone} />
                <InfoRow label="Email" value={citoyen.email} />
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-tchad-blue" />
                Localisation
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Ville" value={citoyen.ville} />
                <InfoRow label="Quartier" value={citoyen.quartier} />
                <InfoRow label="Adresse" value={citoyen.adresse} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <Briefcase size={18} className="text-tchad-blue" />
                  Emploi
                </h3>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Profession" value={citoyen.profession} />
                  <InfoRow label="Employeur" value={citoyen.employeur} />
                  <InfoRow label="Employé" value={citoyen.estEmploye ? 'Oui' : 'Non'} />
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <Heart size={18} className="text-tchad-blue" />
                  Famille
                </h3>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Situation" value={citoyen.situationFamiliale} />
                  <InfoRow label="Enfants" value={citoyen.nombreEnfants} />
                  <InfoRow label="Famille au Gabon" value={citoyen.familleAuGabon ? 'Oui' : 'Non'} />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <FileText size={18} className="text-tchad-blue" />
                Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Carte de séjour</p>
                  {statusBadge(citoyen.carteSejour)}
                  {citoyen.carteSejourNumero && (
                    <p className="text-xs text-gray-500 mt-1">N° {citoyen.carteSejourNumero}</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Carte de colonie</p>
                  {statusBadge(citoyen.carteColonie)}
                  {citoyen.carteColonieNumero && (
                    <p className="text-xs text-gray-500 mt-1">N° {citoyen.carteColonieNumero}</p>
                  )}
                  {citoyen.carteColonieMontant > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{citoyen.carteColonieMontant.toLocaleString('fr-FR')} FCFA</p>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Passeport</p>
                  {statusBadge(citoyen.passeport)}
                  {citoyen.passeportNumero && (
                    <p className="text-xs text-gray-500 mt-1">N° {citoyen.passeportNumero}</p>
                  )}
                </div>
              </div>
            </div>

            {citoyen.observations && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-2">Observations</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{citoyen.observations}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <span className="text-gray-400">{label}:</span>{' '}
      <span className="text-gray-800 font-medium">{value || '—'}</span>
    </div>
  )
}

export default function CitoyenDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" /></div>}>
      <CitoyenDetailContent />
    </Suspense>
  )
}
