'use client'

import { useEffect, useState } from 'react'
import { PERGUNTAS_NPS_CLIENTE } from '@/lib/scoring'

type Avaliacao = {
  id: string
  status: string
  label: string | null
  obra: { nome: string }
}

const LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom']

export default function ClientePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [noData, setNoData] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      fetch(`/api/cliente/${p.token}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) { setNoData(true); return }
          setAvaliacao(data)
          if (data.status === 'concluida') setEnviado(true)
        })
        .catch(() => setNoData(true))
    })
  }, [params])

  function setResposta(id: string, valor: number) {
    setRespostas(prev => ({ ...prev, [id]: valor }))
  }

  async function enviar() {
    const total = PERGUNTAS_NPS_CLIENTE.length
    if (Object.keys(respostas).length < total) {
      alert('Por favor responda todas as perguntas antes de enviar.')
      return
    }
    setEnviando(true)
    const body = { q1: respostas.q1, q2: respostas.q2, q3: respostas.q3, q4: respostas.q4 }
    const res = await fetch(`/api/cliente/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEnviado(true)
    } else {
      alert('Erro ao enviar. Tente novamente.')
    }
    setEnviando(false)
  }

  if (!token || (!avaliacao && !noData)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (noData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-2">Link inválido</p>
          <p className="text-gray-500">Este link de avaliação não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Obrigado pela avaliação!</p>
          <p className="text-gray-500">Seu feedback sobre a obra <strong>{avaliacao?.obra.nome}</strong> foi registrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">Avaliação de Satisfação</p>
          <h1 className="text-2xl font-bold text-gray-900">{avaliacao?.obra.nome}</h1>
          {avaliacao?.label && (
            <p className="text-gray-500 mt-1">{avaliacao.label}</p>
          )}
          <p className="text-gray-500 mt-3 text-sm">
            Avalie cada aspecto de 1 (muito ruim) a 5 (muito bom).
          </p>
        </div>

        <div className="space-y-6">
          {PERGUNTAS_NPS_CLIENTE.map((pergunta, idx) => (
            <div key={pergunta.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Pergunta {idx + 1} de {PERGUNTAS_NPS_CLIENTE.length}
              </p>
              <p className="font-semibold text-gray-800 mb-1">{pergunta.titulo}</p>
              <p className="text-sm text-gray-500 mb-4">{pergunta.descricao}</p>
              <div className="flex gap-3 flex-wrap">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    key={val}
                    onClick={() => setResposta(pergunta.id, val)}
                    className={`flex-1 min-w-[52px] py-3 rounded-lg border-2 font-bold text-sm transition-all ${
                      respostas[pergunta.id] === val
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {val}
                    <span className="block text-xs font-normal mt-0.5 leading-tight">
                      {LABELS[val - 1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={enviar}
          disabled={enviando || Object.keys(respostas).length < PERGUNTAS_NPS_CLIENTE.length}
          className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
        >
          {enviando ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </div>
    </div>
  )
}
