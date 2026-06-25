'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import { Download, Search, User, Printer, Maximize2, X, Settings, RotateCcw } from 'lucide-react'

const CARTE_W = 793
const CARTE_H = 510

interface FieldPos {
  left: string
  top: string
  width: string
  height: string
  fontSize: string
}

interface CardLayout {
  photo: { left: string; top: string; width: string; height: string }
  numero: { left: string; top: string; width: string; fontSize: string }
  nom: FieldPos
  prenom: FieldPos
  dateNaissance: FieldPos
  lieuNaissance: FieldPos
  sexe: FieldPos
  ville: FieldPos
  profession: FieldPos
  telephone: FieldPos
  validite: FieldPos
}

const defaultLayout: CardLayout = {
  photo: { left: '9.5', top: '35', width: '16', height: '31' },
  numero: { left: '77.5', top: '33', width: '20', fontSize: '11' },
  nom: { left: '33', top: '32.77', width: '30', height: '4', fontSize: '13' },
  prenom: { left: '33', top: '37.57', width: '30', height: '4', fontSize: '13' },
  dateNaissance: { left: '33', top: '42.37', width: '30', height: '4', fontSize: '13' },
  lieuNaissance: { left: '33', top: '47.17', width: '30', height: '4', fontSize: '13' },
  sexe: { left: '33', top: '51.97', width: '30', height: '4', fontSize: '13' },
  ville: { left: '33', top: '56.77', width: '30', height: '4', fontSize: '13' },
  profession: { left: '33', top: '61.57', width: '30', height: '4', fontSize: '13' },
  telephone: { left: '33', top: '66.37', width: '30', height: '4', fontSize: '13' },
  validite: { left: '33', top: '71.17', width: '30', height: '4', fontSize: '13' },
}

const LAYOUT_KEY = 'carte-layout-v1'

function loadLayout(): CardLayout {
  if (typeof window === 'undefined') return defaultLayout
  try {
    const saved = localStorage.getItem(LAYOUT_KEY)
    if (saved) return { ...defaultLayout, ...JSON.parse(saved) }
  } catch {}
  return defaultLayout
}

function generateCardNumber(selected: any): string {
  if (selected?.numeroCarte) return selected.numeroCarte
  if (selected?.carteColonieNumero) return selected.carteColonieNumero
  return 'CT-MM-000'
}

function getValiditeDate(createdAt?: string): string {
  const base = createdAt ? new Date(createdAt) : new Date()
  const end = new Date(base)
  end.setFullYear(end.getFullYear() + 2)
  return end.toLocaleDateString('fr-FR')
}

function CarteContent({ selected, layout }: { selected: any; layout: CardLayout }) {
  const numCarte = selected ? generateCardNumber(selected) : ''

  const fieldStyle = (f: FieldPos): React.CSSProperties => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#111111',
    fontSize: `${f.fontSize}px`,
    fontFamily: "'Inter', Arial, sans-serif",
    letterSpacing: '0.3px',
    left: `${f.left}%`,
    top: `${f.top}%`,
    width: `${f.width}%`,
    height: `${f.height}%`,
  })

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
          left: `${layout.photo.left}%`,
          top: `${layout.photo.top}%`,
          width: `${layout.photo.width}%`,
          height: `${layout.photo.height}%`,
          borderRadius: '6px',
          background: '#fff',
          border: '3px solid #ffffff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        {selected?.photo ? (
          <img src={selected.photo} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <User size={40} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Numéro de carte */}
      <div style={{
        position: 'absolute',
        left: `${layout.numero.left}%`,
        top: `${layout.numero.top}%`,
        width: `${layout.numero.width}%`,
        textAlign: 'center',
        fontWeight: 800,
        color: '#C60C30',
        fontSize: `${layout.numero.fontSize}px`,
        fontFamily: "'Inter', Arial, sans-serif",
        letterSpacing: '1px',
      }}>
        N° {numCarte}
      </div>

      {/* Champs */}
      <div style={fieldStyle(layout.nom)}>{selected?.nom?.toUpperCase() || ''}</div>
      <div style={fieldStyle(layout.prenom)}>{selected?.prenom?.toUpperCase() || ''}</div>
      <div style={fieldStyle(layout.dateNaissance)}>
        {selected?.dateNaissance ? new Date(selected.dateNaissance).toLocaleDateString('fr-FR') : ''}
      </div>
      <div style={fieldStyle(layout.lieuNaissance)}>{selected?.lieuNaissance?.toUpperCase() || ''}</div>
      <div style={fieldStyle(layout.sexe)}>
        {selected?.sexe === 'M' ? 'MASCULIN' : selected?.sexe === 'F' ? 'FÉMININ' : ''}
      </div>
      <div style={fieldStyle(layout.ville)}>{selected?.ville?.toUpperCase() || ''}</div>
      <div style={fieldStyle(layout.profession)}>{selected?.profession?.toUpperCase() || ''}</div>
      <div style={fieldStyle(layout.telephone)}>{selected?.telephone || ''}</div>
      <div style={fieldStyle(layout.validite)}>
        {selected ? getValiditeDate(selected.createdAt) : ''}
      </div>
    </>
  )
}

function FieldEditor({ label, field, layout, setLayout }: {
  label: string
  field: keyof CardLayout
  layout: CardLayout
  setLayout: (l: CardLayout) => void
}) {
  const val = layout[field] as any
  const update = (key: string, v: string) => {
    setLayout({ ...layout, [field]: { ...val, [key]: v } })
  }

  return (
    <div className="border-b border-gray-100 pb-2 mb-2">
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 w-5">L%</span>
          <input type="number" step="0.5" value={val.left} onChange={(e) => update('left', e.target.value)}
            className="w-full text-xs border rounded px-1.5 py-0.5" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 w-5">T%</span>
          <input type="number" step="0.5" value={val.top} onChange={(e) => update('top', e.target.value)}
            className="w-full text-xs border rounded px-1.5 py-0.5" />
        </div>
        {'width' in val && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-5">W%</span>
            <input type="number" step="0.5" value={val.width} onChange={(e) => update('width', e.target.value)}
              className="w-full text-xs border rounded px-1.5 py-0.5" />
          </div>
        )}
        {'height' in val && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-5">H%</span>
            <input type="number" step="0.5" value={val.height} onChange={(e) => update('height', e.target.value)}
              className="w-full text-xs border rounded px-1.5 py-0.5" />
          </div>
        )}
        {'fontSize' in val && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 w-5">Px</span>
            <input type="number" step="1" value={val.fontSize} onChange={(e) => update('fontSize', e.target.value)}
              className="w-full text-xs border rounded px-1.5 py-0.5" />
          </div>
        )}
      </div>
    </div>
  )
}

function CarteGeneratorContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const carteRef = useRef<HTMLDivElement>(null)
  const isAdmin = (session?.user as any)?.role === 'admin'

  const [citoyens, setCitoyens] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [layout, setLayout] = useState<CardLayout>(defaultLayout)

  useEffect(() => { setLayout(loadLayout()) }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && !isAdmin) {
      router.push('/')
    }
  }, [status, session, router, isAdmin])

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

  const saveLayout = (l: CardLayout) => {
    setLayout(l)
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(l))
  }

  const resetLayout = () => {
    setLayout(defaultLayout)
    localStorage.removeItem(LAYOUT_KEY)
  }

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })

  const handleExport = async () => {
    if (!selected) return
    setExporting(true)

    try {
      const scale = 4
      const w = CARTE_W * scale
      const h = CARTE_H * scale
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)

      // Draw template background
      try {
        const templateImg = await loadImage('/carte-template.png')
        ctx.drawImage(templateImg, 0, 0, CARTE_W, CARTE_H)
      } catch {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, CARTE_W, CARTE_H)
      }

      // Draw photo
      const px = (CARTE_W * parseFloat(layout.photo.left)) / 100
      const py = (CARTE_H * parseFloat(layout.photo.top)) / 100
      const pw = (CARTE_W * parseFloat(layout.photo.width)) / 100
      const ph = (CARTE_H * parseFloat(layout.photo.height)) / 100
      const r = 6
      const borderW = 3

      const roundedRect = (x: number, y: number, w: number, h: number, radius: number) => {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + w - radius, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
        ctx.lineTo(x + w, y + h - radius)
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
        ctx.lineTo(x + radius, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }

      // White border
      ctx.save()
      roundedRect(px - borderW, py - borderW, pw + borderW * 2, ph + borderW * 2, r + borderW)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      if (selected.photo) {
        try {
          const photoImg = await loadImage(selected.photo)
          ctx.save()
          roundedRect(px, py, pw, ph, r)
          ctx.clip()
          const imgRatio = photoImg.width / photoImg.height
          const boxRatio = pw / ph
          let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height
          if (imgRatio > boxRatio) {
            sw = photoImg.height * boxRatio
            sx = (photoImg.width - sw) / 2
          } else {
            sh = photoImg.width / boxRatio
            sy = (photoImg.height - sh) / 2
          }
          ctx.drawImage(photoImg, sx, sy, sw, sh, px, py, pw, ph)
          ctx.restore()
        } catch {
          ctx.fillStyle = '#f9fafb'
          roundedRect(px, py, pw, ph, r)
          ctx.fill()
        }
      } else {
        ctx.fillStyle = '#f9fafb'
        roundedRect(px, py, pw, ph, r)
        ctx.fill()
      }

      // Draw card number
      const numX = (CARTE_W * parseFloat(layout.numero.left)) / 100 + (CARTE_W * parseFloat(layout.numero.width)) / 200
      const numY = (CARTE_H * parseFloat(layout.numero.top)) / 100
      ctx.fillStyle = '#C60C30'
      ctx.font = `800 ${layout.numero.fontSize}px Inter, Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(`N° ${generateCardNumber(selected)}`, numX, numY)

      // Draw text fields
      const drawField = (f: FieldPos, text: string) => {
        if (!text) return
        const fx = (CARTE_W * parseFloat(f.left)) / 100
        const fy = (CARTE_H * parseFloat(f.top)) / 100
        const fw = (CARTE_W * parseFloat(f.width)) / 100
        const fh = (CARTE_H * parseFloat(f.height)) / 100
        ctx.fillStyle = '#111111'
        ctx.font = `700 ${f.fontSize}px Inter, Arial, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, fx + fw / 2, fy + fh / 2, fw)
      }

      drawField(layout.nom, selected.nom?.toUpperCase() || '')
      drawField(layout.prenom, selected.prenom?.toUpperCase() || '')
      drawField(layout.dateNaissance, selected.dateNaissance ? new Date(selected.dateNaissance).toLocaleDateString('fr-FR') : '')
      drawField(layout.lieuNaissance, selected.lieuNaissance?.toUpperCase() || '')
      drawField(layout.sexe, selected.sexe === 'M' ? 'MASCULIN' : selected.sexe === 'F' ? 'FÉMININ' : '')
      drawField(layout.ville, selected.ville?.toUpperCase() || '')
      drawField(layout.profession, selected.profession?.toUpperCase() || '')
      drawField(layout.telephone, selected.telephone || '')
      drawField(layout.validite, getValiditeDate(selected.createdAt))

      const link = document.createElement('a')
      link.download = `carte-colonie-${selected.nom}-${selected.prenom}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export error:', err)
    }
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
            <h2 className="font-semibold text-gray-800 mb-3">Sélectionner un membre</h2>
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
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => setShowEditor(!showEditor)}
                      className={`flex items-center gap-1.5 text-sm transition-colors font-medium ${
                        showEditor ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Settings size={16} />
                      Ajuster
                    </button>
                  )}
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
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="flex justify-center" style={{ minWidth: `${CARTE_W}px` }}>
                  <div
                    ref={carteRef}
                    className="relative"
                    style={{ width: `${CARTE_W}px`, height: `${CARTE_H}px` }}
                  >
                    <CarteContent selected={selected} layout={layout} />
                  </div>
                </div>
              </div>

              {!selected && (
                <p className="text-center text-gray-400 mt-4 text-sm">
                  Sélectionnez un membre dans la liste pour prévisualiser sa carte
                </p>
              )}
            </div>

            {/* Layout editor */}
            {showEditor && isAdmin && (
              <div className="card mb-4 border-2 border-amber-200 bg-amber-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                    <Settings size={14} />
                    Ajuster les positions (L=gauche, T=haut, W=largeur, Px=taille texte)
                  </h3>
                  <button onClick={resetLayout} className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1">
                    <RotateCcw size={12} /> Réinitialiser
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <FieldEditor label="Photo" field="photo" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="N° Carte" field="numero" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Nom" field="nom" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Prénom" field="prenom" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Date naissance" field="dateNaissance" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Lieu naissance" field="lieuNaissance" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Sexe" field="sexe" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Ville" field="ville" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Profession" field="profession" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Téléphone" field="telephone" layout={layout} setLayout={saveLayout} />
                  <FieldEditor label="Date validité" field="validite" layout={layout} setLayout={saveLayout} />
                </div>
              </div>
            )}

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
                <CarteContent selected={selected} layout={layout} />
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
