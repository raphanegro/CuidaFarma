'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Check } from 'lucide-react'

interface CapturafotoProps {
  medicamentoId: string
  onFotoCapturada?: (foto: string) => void
  fotoAtual?: string
}

export function CapturafotoMedicamento({ medicamentoId, onFotoCapturada, fotoAtual }: CapturafotoProps) {
  const [mostrando, setMostrando] = useState(false)
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(fotoAtual || null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraAcessada, setCameraAcessada] = useState(false)

  const iniciarCamera = async () => {
    try {
      setErro(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Câmera traseira em dispositivos móveis
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraAcessada(true)
      }
    } catch (err) {
      setErro('Não foi possível acessar a câmera. Verifique as permissões.')
      console.error('Erro ao acessar câmera:', err)
    }
  }

  const pararCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      setCameraAcessada(false)
    }
  }

  const tirarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const fotoBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8)
        setFotoCapturada(fotoBase64)
        pararCamera()
      }
    }
  }

  const salvarFoto = async () => {
    if (!fotoCapturada) return

    setCarregando(true)
    setErro(null)

    try {
      const response = await fetch('/api/medicamentos-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicamentoId,
          foto: fotoCapturada,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar foto')
      }

      onFotoCapturada?.(fotoCapturada)
      setMostrando(false)
      setFotoCapturada(null)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar foto')
    } finally {
      setCarregando(false)
    }
  }

  const descartarFoto = () => {
    setFotoCapturada(null)
    if (!cameraAcessada) {
      iniciarCamera()
    }
  }

  const fechar = () => {
    pararCamera()
    setMostrando(false)
    setFotoCapturada(null)
    setErro(null)
  }

  return (
    <div>
      {!mostrando ? (
        <button
          onClick={() => {
            setMostrando(true)
            setTimeout(iniciarCamera, 100)
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Camera size={16} />
          Tirar Foto do Medicamento
        </button>
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Fotografar Medicamento</h3>
              <button
                onClick={fechar}
                className="text-gray-500 hover:text-gray-700"
                disabled={carregando}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {erro && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{erro}</div>
              )}

              {!fotoCapturada ? (
                <div className="space-y-3">
                  <div className="bg-black rounded-lg overflow-hidden aspect-square">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={tirarFoto}
                    disabled={!cameraAcessada || carregando}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Capturar Foto
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
                    <img src={fotoCapturada} alt="Foto capturada" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={descartarFoto}
                      disabled={carregando}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={salvarFoto}
                      disabled={carregando}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      {carregando ? 'Salvando...' : 'Salvar Foto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
