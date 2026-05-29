'use client'

import { useEffect, useState } from 'react'
import { PERGUNTAS_NPS_CULTURAL } from '@/lib/scoring'

type Pessoa = { id: string; nome: string; funcao: string | null; tipo: string; setor: string }
type AvaliacaoInfo = {
  id: string; token: string; status: string
  avaliador: Pessoa; avaliado: Pessoa
}

const SETOR_LABELS: Record<string, string> = { lideranca: 'Liderança', suprimento: 'Suprimento', orcamento: 'Orçamento' }
const LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom']

export default function GrupoPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [noData, setNoData] = useState(false)
  const [selecionado, setSelecionado] = useState<AvaliacaoInfo | null>(null)
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      fetch(`/api/grupo/${p.token}`)
        .then(r => r.json())
        .then(data => {
          if (data.error) { setNoData(true); setLoading(false); return }
          setAvaliacoes(data)
          setLoading(false)
        })
        .catch(() => { setNoData(true); setLoading(false) })
    })
  }, [params])

  function selecionar(av: AvaliacaoInfo) {
    if (av.status === 'concluida') return
    setSelecionado(av)
    setRespostas({})
    setEnviado(false)
  }

  async function enviar() {
    if (!selecionado) return
    const total = PERGUNTAS_NPS_CULTURAL.length
    if (Object.keys(respostas).length < total) {
      alert('Por favor responda todas as perguntas antes de enviar.')
      return
    }
    setEnviando(true)
    const body: Record<string, number> = {}
    PERGUNTAS_NPS_CULTURAL.forEach(p => { body[p.id] = respostas[p.id] })
    const res = await fetch(`/api/avaliar/${selecionado.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setEnviado(true)
      setAvaliacoes(prev =>
        prev.map(a => a.id === selecionado.id ? { ...a, status: 'concluida' } : a)
      )
    } else {
      const d = await res.json()
      alert(d.error ?? 'Erro ao enviar.')
    }
    setEnviando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Carregando...</p>
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

  const avaliado = avaliacoes[0]?.avaliado
  const pendentes = avaliacoes.filter(a => a.status === 'pendente')
  const concluidas = avaliacoes.filter(a => a.status === 'concluida')

  // === Enviado com sucesso ===
  if (enviado && selecionado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-2xl font-bold text-gray-800 mb-2">Obrigado, {selecionado.avaliador.nome}!</p>
          <p className="text-gray-500">
            Sua avaliação de <strong>{avaliado?.nome}</strong> foi registrada.
          </p>
        </div>
      </div>
    )
  }

  // === Formulário (após identificação) ===
  if (selecionado) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Avaliação 360°</p>
            <h1 className="text-2xl font-bold text-gray-900">Avaliando {avaliado?.nome}</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Avaliador: <strong>{selecionado.avaliador.nome}</strong>
              {selecionado.avaliador.tipo === 'diretor'
                ? ' · Diretor'
                : ` · ${SETOR_LABELS[selecionado.avaliador.setor] ?? selecionado.avaliador.setor}`}
            </p>
            <button
              onClick={() => setSelecionado(null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              ← Não sou eu, voltar
            </button>
          </div>

          <div className="space-y-6">
            {PERGUNTAS_NPS_CULTURAL.map((pergunta, idx) => (
              <div key={pergunta.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Pergunta {idx + 1} de {PERGUNTAS_NPS_CULTURAL.length}
                </p>
                <p className="font-semibold text-gray-800 mb-1">{pergunta.titulo}</p>
                <p className="text-sm text-gray-500 mb-4">{pergunta.descricao}</p>
                <div className="flex gap-3 flex-wrap">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      onClick={() => setRespostas(prev => ({ ...prev, [pergunta.id]: val }))}
                      className={`flex-1 min-w-[52px] py-3 rounded-lg border-2 font-bold text-sm transition-all ${
                        respostas[pergunta.id] === val
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {val}
                      <span className="block text-xs font-normal mt-0.5 leading-tight">{LABELS[val - 1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={enviar}
            disabled={enviando || Object.keys(respostas).length < PERGUNTAS_NPS_CULTURAL.length}
            className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-lg"
          >
            {enviando ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </div>
    )
  }

  // === Tela de identificação ===
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Avaliação 360°</p>
          <h1 className="text-2xl font-bold text-gray-900">Avaliando {avaliado?.nome}</h1>
          <p className="text-gray-500 mt-2 text-sm">Selecione seu nome para começar a avaliação.</p>
        </div>

        <div className="space-y-3">
          {pendentes.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-green-700 font-semibold">Todas as avaliações deste grupo foram concluídas.</p>
            </div>
          ) : (
            pendentes.map(av => (
              <button
                key={av.id}
                onClick={() => selecionar(av)}
                className="w-full text-left bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-5 py-4 transition-all"
              >
                <p className="font-semibold text-gray-800">{av.avaliador.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {av.avaliador.tipo === 'diretor'
                    ? 'Diretor'
                    : SETOR_LABELS[av.avaliador.setor] ?? av.avaliador.setor}
                  {av.avaliador.funcao && ` · ${av.avaliador.funcao}`}
                </p>
              </button>
            ))
          )}

          {concluidas.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Já respondeu</p>
              {concluidas.map(av => (
                <div key={av.id} className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-400 mb-1">
                  <span className="text-green-500">✓</span>
                  <span>{av.avaliador.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
