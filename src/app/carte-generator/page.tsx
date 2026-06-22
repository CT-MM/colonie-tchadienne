'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import { Download, Search, User, Printer, Maximize2, X } from 'lucide-react'

const CARTE_W = 793
const CARTE_H = 510

const fieldStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  color: '#111111',
  fontSize: '13px',
  fontFamily: "'Inter', Arial, sans-serif",
  letterSpacing: '0.3px',
}

function generateCardNumber(selected: any, index: number): string {
  if (selected?.numeroCarte) return selected.numeroCarte
  if (selected?.carteColonieNumero) return selected.carteColonieNumero
  return `CT-MM-${String(index).padStart(3, '0')}`
}

function CarteContent({ selected, cardIndex }: { selected: any; cardIndex?: number }) {
  const numCarte = selected ? generateCardNumber(selected, cardIndex || 1) : ''

  return (
    <>
      <img
        src="/carte-template.png"
        alt="Template"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'fill' }}
        crossOrigin="anonymous"
      />

      {/* PHOTO */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: '9.5%',
          top: '35%',
          width: '16%',
          height: '31%',
          borderRadius: '6px',
          background: '#fff',
        }}
      >
        {selected?.photo ? (
          <img
            src={selected.photo}
            alt=""
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <User size={40} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Numéro de carte — au niveau des écritures arabes, centré sous le drapeau Gabon */}
      <div style={{
        position: 'absolute',
        left: '77.5%',
        top: '33%',
        width: '20%',
        textAlign: 'center',
        fontWeight: 800,
        color: '#C60C30',
        fontSize: '11px',
        fontFamily: "'Inter', Arial, sans-serif",
        letterSpacing: '1px',
      }}>
        N° {numCarte}
      </div>

      {/* Champs — montés de 0.5mm (≈0.93%) par rapport à l'original */}
      <div style={{ ...fieldStyle, left: '33%', top: '32.77%', width: '30%', height: '4%' }}>
        {selected?.nom?.toUpperCase() || ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '37.57%', width: '30%', height: '4%' }}>
        {selected?.prenom?.toUpperCase() || ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '42.37%', width: '30%', height: '4%' }}>
        {selected?.dateNaissance
          ? new Date(selected.dateNaissance).toLocaleDateString('fr-FR')
          : ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '47.17%', width: '30%', height: '4%' }}>
        {selected?.lieuNaissance?.toUpperCase() || ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '51.97%', width: '30%', height: '4%' }}>
        {selected?.sexe === 'M' ? 'MASCULIN' : selected?.sexe === 'F' ? 'FÉMININ' : ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '56.77%', width: '30%', height: '4%' }}>
        {selected?.ville?.toUpperCase() || ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '61.57%', width: '30%', height: '4%' }}>
        {selected?.profession?.toUpperCase() || ''}
      </div>
      <div style={{ ...fieldStyle, left: '33%', top: '66.37%', width: '30%', height: '4%' }}>
        {selected?.telephone || ''}
      </div>
    </>
  )
}

function CarteGeneratorContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const carteRef = useRef<HTMLDivElement>(null)

  const [citoyens, setCitoyens] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/citoyens?limit=1000')
        .then((r) => r.json())
        .then((data) => {
          setCitoyens(data.citoyens)
          const preselect = searchParams.get('id')
          if (preselect) {
            const found = data.citoyens.find((c: any) => c.id === preselect)
            if (found) setSelected(found)
          }
        })
    }
  }, [status, searchParams])

  const filteredCitoyens = citoyens.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.prenom.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = async () => {
    if (!carteRef.current || !selected) return
    setExporting(true)

    const clone = carteRef.current.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.top = '0'
    clone.style.left = '0'
    clone.style.width = `${CARTE_W}px`
    clone.style.height = `${CARTE_H}px`
    clone.style.zIndex = '-9999'
    clone.style.opacity = '1'
    clone.style.overflow = 'hidden'
    document.body.appendChild(clone)

    await new Promise((r) => setTimeout(r, 500))

    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(clone, {
      scale: 5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: CARTE_W,
      height: CARTE_H,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    })

    document.body.removeChild(clone)

    const link = document.createElement('a')
    link.download = `carte-colonie-${selected.nom}-${selected.prenom}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setExporting(false)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (status !== 'authenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-72 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Générateur de carte</h1>
          <p className="text-gray-500">Carte de Colonie Tchadienne — 84 x 54 mm</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Selector */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">Sélectionner un citoyen</h2>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou prénom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-1">
              {filteredCitoyens.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                    selected?.id === c.id
                      ? 'bg-tchad-blue text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selected?.id === c.id ? 'bg-white/20' : 'bg-tchad-blue/10 text-tchad-blue'
                  }`}>
                    {c.prenom[0]}{c.nom[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{c.nom} {c.prenom}</p>
                    <p className={`text-xs ${selected?.id === c.id ? 'text-white/60' : 'text-gray-400'}`}>
                      {c.ville} — {c.carteColonie === 'Ok' ? 'Carte OK' : c.carteColonie === 'Encours' ? 'En cours' : 'Sans carte'}
                    </p>
                  </div>
                </button>
              ))}
              {filteredCitoyens.length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">Aucun résultat</p>
              )}
            </div>
          </div>

          {/* Card preview */}
          <div className="xl:col-span-2">
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Aperçu de la carte</h2>
                {selected && (
                  <button
                    onClick={() => setFullscreen(true)}
                    className="flex items-center gap-1.5 text-sm text-tchad-blue hover:text-tchad-blue/80 transition-colors font-medium"
                  >
                    <Maximize2 size={16} />
                    Plein écran
                  </button>
                )}
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex justify-center" style={{ minWidth: `${CARTE_W}px` }}>
                  <div
                    ref={carteRef}
                    className="relative"
                    style={{ width: `${CARTE_W}px`, height: `${CARTE_H}px` }}
                  >
                    <CarteContent selected={selected} cardIndex={selected ? citoyens.findIndex((c) => c.id === selected.id) + 1 : 1} />
                  </div>
                </div>
              </div>

              {!selected && (
                <p className="text-center text-gray-400 mt-4 text-sm">
                  Sélectionnez un citoyen dans la liste pour prévisualiser sa carte
                </p>
              )}
            </div>

            {/* Export buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExport}
                disabled={!selected || exporting}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                <Download size={18} />
                {exporting ? 'Export en cours...' : 'Exporter en PNG'}
              </button>
              <button
                onClick={() => setFullscreen(true)}
                disabled={!selected}
                className="btn-secondary flex items-center justify-center gap-2 py-3 disabled:opacity-50 px-5"
              >
                <Maximize2 size={18} />
                Plein écran
              </button>
              <button
                onClick={() => {
                  if (!carteRef.current) return
                  const printWindow = window.open('', '_blank')
                  if (!printWindow) return
                  printWindow.document.write(`
                    <html><head><title>Carte - ${selected?.nom} ${selected?.prenom}</title>
                    <style>
                      @page { size: 84mm 54mm; margin: 0; }
                      body { margin: 0; padding: 0; }
                    </style></head>
                    <body onload="window.print()">
                      ${carteRef.current.innerHTML}
                    </body></html>
                  `)
                  printWindow.document.close()
                }}
                disabled={!selected}
                className="btn-secondary flex items-center justify-center gap-2 py-3 disabled:opacity-50 px-5"
              >
                <Printer size={18} />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal plein écran */}
      {fullscreen && selected && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-3 z-10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-white/60 text-sm">
              {selected.nom} {selected.prenom} — Appuyez sur Échap pour fermer
            </p>
            <div className="shadow-2xl" style={{ width: `${CARTE_W}px`, height: `${CARTE_H}px`, transform: 'scale(1.3)', transformOrigin: 'center center' }}>
              <div className="relative" style={{ width: `${CARTE_W}px`, height: `${CARTE_H}px` }}>
                <CarteContent selected={selected} cardIndex={citoyens.findIndex((c) => c.id === selected.id) + 1} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <Download size={18} />
                {exporting ? 'Export...' : 'Télécharger PNG'}
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                <X size={18} />
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CarteGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-tchad-blue border-t-transparent rounded-full" /></div>}>
      <CarteGeneratorContent />
    </Suspense>
  )
}
