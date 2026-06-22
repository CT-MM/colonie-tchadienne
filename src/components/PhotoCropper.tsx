'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react'

interface PhotoCropperProps {
  imageSrc: string
  onSave: (croppedDataUrl: string) => void
  onCancel: () => void
}

export default function PhotoCropper({ imageSrc, onSave, onCancel }: PhotoCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  const FRAME_W = 300
  const FRAME_H = 380
  const OUTPUT_W = 300
  const OUTPUT_H = 380

  useEffect(() => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      setImg(image)
      const scaleToFit = Math.max(FRAME_W / image.width, FRAME_H / image.height)
      setZoom(scaleToFit)
    }
    image.src = imageSrc
  }, [imageSrc])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, FRAME_W, FRAME_H)

    const w = img.width * zoom
    const h = img.height * zoom
    const x = (FRAME_W - w) / 2 + offset.x
    const y = (FRAME_H - h) / 2 + offset.y

    ctx.drawImage(img, x, y, w, h)
  }, [img, zoom, offset])

  useEffect(() => { draw() }, [draw])

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setDragging(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    setDragging(true)
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return
    const t = e.touches[0]
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y })
  }

  const handleSave = () => {
    const outCanvas = document.createElement('canvas')
    outCanvas.width = OUTPUT_W
    outCanvas.height = OUTPUT_H
    const ctx = outCanvas.getContext('2d')!

    if (img) {
      const w = img.width * zoom
      const h = img.height * zoom
      const x = (FRAME_W - w) / 2 + offset.x
      const y = (FRAME_H - h) / 2 + offset.y
      ctx.drawImage(img, x, y, w, h)
    }

    onSave(outCanvas.toDataURL('image/jpeg', 0.92))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Ajuster la photo
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4 flex items-center justify-center gap-1">
          <Move size={14} />
          Glissez pour repositionner
        </p>

        {/* Crop area */}
        <div className="flex justify-center mb-4">
          <div
            className="relative border-2 border-tchad-blue rounded-lg overflow-hidden"
            style={{ width: FRAME_W, height: FRAME_H, cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <canvas
              ref={canvasRef}
              width={FRAME_W}
              height={FRAME_H}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="block"
            />
            {/* Frame overlay */}
            <div className="absolute inset-0 pointer-events-none border-4 border-tchad-blue/30 rounded-lg" />
          </div>
        </div>

        {/* Zoom control */}
        <div className="flex items-center gap-3 mb-6 px-4">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.05))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomOut size={20} className="text-gray-600" />
          </button>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-tchad-blue"
          />
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.05))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ZoomIn size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={18} />
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
