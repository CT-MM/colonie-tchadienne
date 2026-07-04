'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Upload, User } from 'lucide-react'
import PhotoCropper from './PhotoCropper'

interface CitoyenData {
  id?: string
  nom: string
  prenom: string
  dateNaissance: string
  lieuNaissance: string
  sexe: string
  nationalite: string
  telephone: string
  email: string
  photo: string
  ville: string
  quartier: string
  adresse: string
  profession: string
  employeur: string
  estEmploye: boolean
  situationFamiliale: string
  nombreEnfants: number
  familleAuGabon: boolean
  carteSejour: string
  carteSejourNumero: string
  carteSejourExpiration: string
  carteColonie: string
  carteColonieNumero: string
  carteColonieMontant: number
  situationRegularite: string
  passeport: string
  passeportNumero: string
  passeportExpiration: string
  observations: string
}

const defaultData: CitoyenData = {
  nom: '',
  prenom: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: 'M',
  nationalite: 'Tchadienne',
  telephone: '',
  email: '',
  photo: '',
  ville: 'Moanda',
  quartier: '',
  adresse: '',
  profession: '',
  employeur: '',
  estEmploye: false,
  situationFamiliale: 'Célibataire',
  nombreEnfants: 0,
  familleAuGabon: false,
  carteSejour: 'Non',
  carteSejourNumero: '',
  carteSejourExpiration: '',
  carteColonie: 'Non',
  carteColonieNumero: '',
  carteColonieMontant: 0,
  situationRegularite: 'Irrégulier',
  passeport: 'Non',
  passeportNumero: '',
  passeportExpiration: '',
  observations: '',
}

export default function CitoyenForm({ initial, isEdit }: { initial?: CitoyenData; isEdit?: boolean }) {
  const router = useRouter()
  const [data, setData] = useState<CitoyenData>(initial || defaultData)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rawPhoto, setRawPhoto] = useState<string | null>(null)

  const set = (key: keyof CitoyenData, value: any) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCropSave = async (croppedDataUrl: string) => {
    setRawPhoto(null)
    setUploading(true)
    const blob = await (await fetch(croppedDataUrl)).blob()
    const formData = new FormData()
    formData.append('photo', blob, 'photo.jpg')
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const { path } = await res.json()
    set('photo', path)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const url = isEdit ? `/api/citoyens/${data.id}` : '/api/citoyens'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = await res.json()
      router.push(`/citoyens/${result.id}`)
    } else {
      alert('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo + Identity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User size={20} className="text-tchad-blue" />
          Informations personnelles
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Photo upload */}
          <div className="lg:row-span-3 flex flex-col items-center">
            <div className="w-32 h-40 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
              {data.photo ? (
                <img src={data.photo} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-gray-300" />
              )}
            </div>
            <label className="btn-secondary text-sm cursor-pointer flex items-center gap-1">
              <Upload size={14} />
              {uploading ? 'Envoi...' : 'Photo'}
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
          </div>

          <div>
            <label className="label-field">Nom *</label>
            <input
              value={data.nom}
              onChange={(e) => set('nom', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Prénom *</label>
            <input
              value={data.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Sexe *</label>
            <select value={data.sexe} onChange={(e) => set('sexe', e.target.value)} className="select-field">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="label-field">Date de naissance *</label>
            <input
              type="date"
              value={data.dateNaissance}
              onChange={(e) => set('dateNaissance', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Lieu de naissance *</label>
            <input
              value={data.lieuNaissance}
              onChange={(e) => set('lieuNaissance', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="label-field">Nationalité</label>
            <input
              value={data.nationalite}
              onChange={(e) => set('nationalite', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Téléphone</label>
            <input
              value={data.telephone}
              onChange={(e) => set('telephone', e.target.value)}
              className="input-field"
              placeholder="+241..."
            />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Localisation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Localisation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Ville *</label>
            <select value={data.ville} onChange={(e) => set('ville', e.target.value)} className="select-field">
              <option value="Moanda">Moanda</option>
              <option value="Mounana">Mounana</option>
            </select>
          </div>
          <div>
            <label className="label-field">Quartier</label>
            <input
              value={data.quartier}
              onChange={(e) => set('quartier', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Adresse</label>
            <input
              value={data.adresse}
              onChange={(e) => set('adresse', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Situation professionnelle */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Situation professionnelle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Profession</label>
            <input
              value={data.profession}
              onChange={(e) => set('profession', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Employeur</label>
            <input
              value={data.employeur}
              onChange={(e) => set('employeur', e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={data.estEmploye}
                onChange={(e) => set('estEmploye', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-tchad-blue focus:ring-tchad-blue"
              />
              <span className="font-medium text-gray-700">Actuellement employé</span>
            </label>
          </div>
        </div>
      </div>

      {/* Situation familiale */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Situation familiale</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Situation familiale</label>
            <select
              value={data.situationFamiliale}
              onChange={(e) => set('situationFamiliale', e.target.value)}
              className="select-field"
            >
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
            </select>
          </div>
          <div>
            <label className="label-field">Nombre d&apos;enfants</label>
            <input
              type="number"
              min={0}
              value={data.nombreEnfants}
              onChange={(e) => set('nombreEnfants', parseInt(e.target.value) || 0)}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={data.familleAuGabon}
                onChange={(e) => set('familleAuGabon', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-tchad-blue focus:ring-tchad-blue"
              />
              <span className="font-medium text-gray-700">Famille au Gabon</span>
            </label>
          </div>
        </div>
      </div>

      {/* Documents & Validation */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Documents & Validations</h2>

        {/* Carte de séjour */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Carte de séjour</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Statut</label>
              <select
                value={data.carteSejour}
                onChange={(e) => {
                  const val = e.target.value
                  set('carteSejour', val)
                  if (val === 'Oui') set('situationRegularite', 'Régulier')
                }}
                className="select-field"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            {data.carteSejour === 'Oui' && (
              <>
                <div>
                  <label className="label-field">Numéro</label>
                  <input
                    value={data.carteSejourNumero}
                    onChange={(e) => set('carteSejourNumero', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Date d&apos;expiration</label>
                  <input
                    type="date"
                    value={data.carteSejourExpiration}
                    onChange={(e) => set('carteSejourExpiration', e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Carte de colonie */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Carte de colonie</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Statut</label>
              <select
                value={data.carteColonie}
                onChange={(e) => set('carteColonie', e.target.value)}
                className="select-field"
              >
                <option value="Non">Non</option>
                <option value="Encours">En cours</option>
                <option value="Ok">OK</option>
              </select>
            </div>
            {data.carteColonie !== 'Non' && (
              <>
                <div>
                  <label className="label-field">Numéro</label>
                  <input
                    value={data.carteColonieNumero}
                    onChange={(e) => set('carteColonieNumero', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Montant (FCFA)</label>
                  <input
                    type="number"
                    min={0}
                    value={data.carteColonieMontant}
                    onChange={(e) => set('carteColonieMontant', parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Situation régularité */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Situation de régularité</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Statut</label>
              <select
                value={data.situationRegularite}
                onChange={(e) => set('situationRegularite', e.target.value)}
                className="select-field"
              >
                <option value="Régulier">Régulier</option>
                <option value="Irrégulier">Irrégulier</option>
                <option value="En cours">En cours de régularisation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Passeport */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">Passeport</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Statut</label>
              <select
                value={data.passeport}
                onChange={(e) => set('passeport', e.target.value)}
                className="select-field"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            {data.passeport === 'Oui' && (
              <>
                <div>
                  <label className="label-field">Numéro</label>
                  <input
                    value={data.passeportNumero}
                    onChange={(e) => set('passeportNumero', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Date d&apos;expiration</label>
                  <input
                    type="date"
                    value={data.passeportExpiration}
                    onChange={(e) => set('passeportExpiration', e.target.value)}
                    className="input-field"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Observations */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Observations</h2>
        <textarea
          value={data.observations}
          onChange={(e) => set('observations', e.target.value)}
          className="input-field min-h-[100px]"
          placeholder="Notes complémentaires..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
    {rawPhoto && (
      <PhotoCropper
        imageSrc={rawPhoto}
        onSave={handleCropSave}
        onCancel={() => setRawPhoto(null)}
      />
    )}
    </>
  )
}
