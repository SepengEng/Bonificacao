'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PERGUNTAS_NPS_CULTURAL } from '@/lib/scoring'

interface AvaliacaoData {
  id: string
  token: string
  status: string
  avaliador: { nome: string }
  avaliado:  { nome: string }
  obra:      { nome: string }
}

function RatingButton({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-11 rounded-full text-sm font-bold transition-all border-2 ${
        selected
          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {value}
    </button>
  )
}

export default function AvaliarPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<AvaliacaoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [respostas, setRespostas] = useState<Record<string, number | null>>({
    q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null,
  })

  useEffect(() => {
    fetch(`/api/avaliar/${token}`)
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
        if (d.status === 'concluida') setSubmitted(true)
      })
      .catch(() => setLoading(false))
  }, [token])

  function setResposta(id: string, valor: number) {
    setRespostas(r => ({ ...r, [id]: valor }))
  }

  const todasRespondidas = PERGUNTAS_NPS_CULTURAL.every(p => respostas[p.id] !== null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!todasRespondidas) return
    setSubmitting(true)
    await fetch(`/api/avaliar/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(respostas),
    })
    setSubmitted(true)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-400">Carregando avaliação...</p>
      </div>
    )
  }

  if (!data || (data as any).error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-gray-700">Link inválido ou expirado.</p>
          <p className="text-sm text-gray-400 mt-1">Verifique o link recebido.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Avaliação enviada!</h2>
          <p className="text-gray-500 text-sm">
            Obrigado pela sua avaliação de <strong>{data.avaliado.nome}</strong>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-12">
      {/* Header info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{data.obra.nome}</p>
        <h2 className="text-lg font-bold text-gray-900">
          Avaliação de <span className="text-blue-600">{data.avaliado.nome}</span>
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Avaliador: {data.avaliador.nome}</p>
      </div>

      {/* Scale legend */}
      <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
        <span>0 = Nunca / Muito fraco</span>
        <span>5 = Sempre / Excelente</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {PERGUNTAS_NPS_CULTURAL.map((pergunta, i) => (
          <div key={pergunta.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex gap-3 mb-4">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{pergunta.titulo}</p>
                <p className="text-gray-500 text-sm mt-0.5">{pergunta.descricao}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <RatingButton
                  key={n}
                  value={n}
                  selected={respostas[pergunta.id] === n}
                  onClick={() => setResposta(pergunta.id, n)}
                />
              ))}
            </div>
          </div>
        ))}

        {!todasRespondidas && (
          <p className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg py-2">
            Responda todas as {PERGUNTAS_NPS_CULTURAL.length} perguntas para enviar.
          </p>
        )}

        <button
          type="submit"
          disabled={!todasRespondidas || submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Enviando...' : 'Enviar Avaliação'}
        </button>
      </form>
    </div>
  )
}
