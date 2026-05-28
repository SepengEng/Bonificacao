'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PRAZO_OPCOES, CUSTO_OPCOES, SETOR_LABELS,
  formatarMoeda, calcularScoreBase, npsClienteParaPontos, scoreParaLabel,
} from '@/lib/scoring'

type Tab = 'pessoas' | 'avaliacoes' | 'resultados'

interface Pessoa {
  id: string; nome: string; funcao: string | null
  setor: string; percentual: number | null; tipo: string
}
interface Avaliacao {
  id: string; token: string; status: string
  avaliador: Pessoa; avaliado: Pessoa
}
interface AvaliacaoCliente {
  id: string; token: string; status: string; label: string | null
  respondidoEm: string | null
}
interface Obra {
  id: string; nome: string; valorContrato: number; custosTotais: number
  prazoOpcao: string; custoOpcao: string; clienteMedia: number; segurancaOk: boolean
  pessoas: Pessoa[]; avaliacoes: Avaliacao[]; avaliacoesCliente: AvaliacaoCliente[]
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{children}</span>
}

function ScoreCard({ label, pts, max, highlight }: { label: string; pts: number; max?: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-blue-600 text-white' : 'bg-white/70'}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-blue-700'}`}>{pts}</div>
      <div className={`text-xs mt-0.5 ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>{label}</div>
      {max && <div className={`text-xs ${highlight ? 'text-blue-200' : 'text-gray-400'}`}>máx {max}</div>}
    </div>
  )
}

export default function ObraPage() {
  const params  = useParams()
  const id      = params.id as string
  const router  = useRouter()
  const [obra,    setObra]    = useState<Obra | null>(null)
  const [tab,     setTab]     = useState<Tab>('pessoas')
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const res = await fetch(`/api/obras/${id}`)
    if (!res.ok) { setObra(null); setLoading(false); return }
    setObra(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { reload() }, [reload])

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>
  if (!obra)   return <div className="text-center py-12 text-red-500">Obra não encontrada.</div>

  const scoreBase  = calcularScoreBase(obra)
  const prazoPts   = PRAZO_OPCOES[obra.prazoOpcao]?.pontos ?? 0
  const custoPts   = CUSTO_OPCOES[obra.custoOpcao]?.pontos ?? 0
  const clientePts = npsClienteParaPontos(obra.clienteMedia)
  const segPts     = obra.segurancaOk ? 15 : 0

  const tabs: [Tab, string][] = [
    ['pessoas',    'Pessoas'],
    ['avaliacoes', 'Avaliações 360°'],
    ['resultados', 'Resultados'],
  ]

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex items-start gap-3 mb-5">
        <button onClick={() => router.push('/')} className="mt-1 text-gray-400 hover:text-gray-600 text-xl leading-none">←</button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{obra.nome}</h1>
          <p className="text-sm text-gray-500">{formatarMoeda(obra.valorContrato)}</p>
        </div>
      </div>

      <div className={`mb-5 p-4 rounded-xl border ${scoreBase.eliminatorio ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        {scoreBase.eliminatorio ? (
          <p className="text-red-700 font-semibold text-sm">⚠️ Bonificação ELIMINADA — desvio de custo superior a 5%</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            <ScoreCard label="Prazo"     pts={prazoPts}   max={35} />
            <ScoreCard label="Custo"     pts={custoPts}   max={35} />
            <ScoreCard label="Cliente"   pts={clientePts} max={15} />
            <ScoreCard label="Segurança" pts={segPts}     max={15} />
            <ScoreCard label="Score base" pts={scoreBase.pontos} highlight />
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'pessoas'    && <TabPessoas obra={obra} onReload={reload} />}
      {tab === 'avaliacoes' && <TabAvaliacoes obra={obra} onReload={reload} />}
      {tab === 'resultados' && <TabResultados obraId={id} />}
    </div>
  )
}

// ─── TAB PESSOAS ──────────────────────────────────────────────────────────────
function TabPessoas({ obra, onReload }: { obra: Obra; onReload: () => void }) {
  const [form, setForm] = useState({ nome: '', funcao: '', setor: 'lideranca', tipo: 'colaborador', percentual: '' })
  const [saving, setSaving] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/obras/${obra.id}/pessoas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        funcao: form.funcao || null,
        setor: form.setor,
        tipo: form.tipo,
        percentual: form.tipo === 'diretor' ? null : (form.percentual ? parseFloat(form.percentual) / 100 : null),
      }),
    })
    setForm({ nome: '', funcao: '', setor: 'lideranca', tipo: 'colaborador', percentual: '' })
    setSaving(false)
    onReload()
  }

  async function remove(pessoaId: string) {
    if (!confirm('Remover esta pessoa e suas avaliações?')) return
    await fetch(`/api/obras/${obra.id}/pessoas/${pessoaId}`, { method: 'DELETE' })
    onReload()
  }

  const isDiretor = form.tipo === 'diretor'
  const setores   = ['lideranca', 'suprimento', 'orcamento'] as const
  const pools: Record<string, number> = { lideranca: 0.73, suprimento: 0.07, orcamento: 0.20 }

  // Group pessoas
  const diretores     = obra.pessoas.filter(p => p.tipo === 'diretor')
  const colaboradores = obra.pessoas.filter(p => p.tipo !== 'diretor')

  return (
    <div className="space-y-6">
      {/* Add form */}
      <form onSubmit={add} className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-700 mb-3 text-sm">Adicionar pessoa</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nome *</label>
            <input className={inp} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Nome completo" required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Função</label>
            <input className={inp} value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))}
              placeholder="Ex: Engenheiro" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo *</label>
            <select className={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="colaborador">Colaborador (recebe bonificação)</option>
              <option value="diretor">Diretor (só avalia, sem bonificação)</option>
            </select>
          </div>
        </div>

        {!isDiretor && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Setor *</label>
              <select className={inp} value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}>
                <option value="lideranca">Liderança (73%)</option>
                <option value="suprimento">Suprimento (7%)</option>
                <option value="orcamento">Orçamento (20%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">% do pool do setor</label>
              <input className={inp} type="number" min="0" max="100" step="0.01" value={form.percentual}
                onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))}
                placeholder="Ex: 50 para 50%" />
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Salvando...' : '+ Adicionar'}
        </button>
      </form>

      {/* Directors */}
      {diretores.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Diretores</h3>
            <span className="text-xs text-gray-400">(avaliam mas não recebem bonificação)</span>
          </div>
          <div className="space-y-2">
            {diretores.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{p.nome}</span>
                  {p.funcao && <span className="text-gray-400 text-xs">· {p.funcao}</span>}
                  <Badge color="bg-purple-100 text-purple-700">Diretor</Badge>
                </div>
                <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600 text-xs">remover</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborators by sector */}
      {setores.map(setor => {
        const pessoas = colaboradores.filter(p => p.setor === setor)
        const soma    = pessoas.reduce((s, p) => s + (p.percentual ?? 0), 0)
        return (
          <div key={setor}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-700 text-sm">{SETOR_LABELS[setor]}</h3>
              <span className="text-xs text-gray-400">({Math.round(pools[setor] * 100)}% da bonificação)</span>
              {pessoas.length > 0 && (
                <span className={`text-xs ml-auto font-medium ${Math.abs(soma - 1) < 0.001 ? 'text-green-600' : 'text-amber-600'}`}>
                  Soma: {Math.round(soma * 100)}%
                </span>
              )}
            </div>
            {pessoas.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhum colaborador neste setor.</p>
            ) : (
              <div className="space-y-2">
                {pessoas.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                    <div>
                      <span className="font-medium text-gray-800 text-sm">{p.nome}</span>
                      {p.funcao && <span className="text-gray-400 text-xs ml-2">· {p.funcao}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      {p.percentual != null
                        ? <span className="text-sm font-semibold text-blue-600">{Math.round(p.percentual * 10000) / 100}%</span>
                        : <span className="text-xs text-amber-500 italic">sem %</span>
                      }
                      <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600 text-xs">remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── TAB AVALIAÇÕES ───────────────────────────────────────────────────────────
function TabAvaliacoes({ obra, onReload }: { obra: Obra; onReload: () => void }) {
  const [avaliadorId, setAvaliadorId] = useState('')
  const [avaliadoId,  setAvaliadoId]  = useState('')
  const [saving,      setSaving]      = useState(false)
  const [copied,      setCopied]      = useState<string | null>(null)
  const [error,       setError]       = useState('')
  const [clienteLabel, setClienteLabel] = useState('')
  const [savingCliente, setSavingCliente] = useState(false)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (avaliadorId === avaliadoId) { setError('Avaliador e avaliado não podem ser a mesma pessoa.'); return }
    setError('')
    setSaving(true)
    const res = await fetch(`/api/obras/${obra.id}/avaliacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avaliadorId, avaliadoId }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro.') }
    else { setAvaliadorId(''); setAvaliadoId('') }
    setSaving(false)
    onReload()
  }

  async function remove(id: string) {
    if (!confirm('Remover esta avaliação?')) return
    await fetch(`/api/obras/${obra.id}/avaliacoes?avaliacaoId=${id}`, { method: 'DELETE' })
    onReload()
  }

  function copy(token: string, path = 'avaliar') {
    navigator.clipboard.writeText(`${window.location.origin}/${path}/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  async function addCliente(e: React.FormEvent) {
    e.preventDefault()
    setSavingCliente(true)
    await fetch(`/api/obras/${obra.id}/avaliacoes-cliente`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: clienteLabel || null }),
    })
    setClienteLabel('')
    setSavingCliente(false)
    onReload()
  }

  async function removeCliente(avaliacaoId: string) {
    if (!confirm('Remover esta avaliação de cliente?')) return
    await fetch(`/api/obras/${obra.id}/avaliacoes-cliente?avaliacaoId=${avaliacaoId}`, { method: 'DELETE' })
    onReload()
  }

  function pessoaLabel(p: Pessoa) {
    const tipo = p.tipo === 'diretor' ? ' (Diretor)' : ` · ${SETOR_LABELS[p.setor] ?? p.setor}`
    return `${p.nome}${tipo}`
  }

  // Group avaliacoes by avaliado for display
  const avaliadosComAvaliacoes = Array.from(
    new Set(obra.avaliacoes.map(a => a.avaliado.id))
  ).map(avaliadoId => {
    const avaliado   = obra.pessoas.find(p => p.id === avaliadoId)!
    const avaliacoes = obra.avaliacoes.filter(a => a.avaliado.id === avaliadoId)
    return { avaliado, avaliacoes }
  })

  const concluidas = obra.avaliacoes.filter(a => a.status === 'concluida').length
  const total      = obra.avaliacoes.length

  return (
    <div className="space-y-5">
      {obra.pessoas.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Adicione pelo menos 2 pessoas na aba <strong>Pessoas</strong> para gerar avaliações.
        </div>
      )}

      {/* Add pair form */}
      <form onSubmit={add} className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-700 mb-3 text-sm">Gerar link de avaliação</h3>
        <p className="text-xs text-gray-400 mb-3">
          Você pode gerar múltiplos links para o mesmo avaliado — cada avaliador recebe seu próprio link. A média de todos é usada no cálculo.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Avaliador (quem preenche)</label>
            <select className={inp} value={avaliadorId} onChange={e => setAvaliadorId(e.target.value)} required>
              <option value="">Selecione...</option>
              {obra.pessoas.map(p => (
                <option key={p.id} value={p.id}>{pessoaLabel(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Avaliado (quem está sendo avaliado)</label>
            <select className={inp} value={avaliadoId} onChange={e => setAvaliadoId(e.target.value)} required>
              <option value="">Selecione...</option>
              {obra.pessoas.map(p => (
                <option key={p.id} value={p.id}>{pessoaLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? 'Gerando...' : 'Gerar Link'}
        </button>
      </form>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600 whitespace-nowrap">{concluidas}/{total} concluídas</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${total > 0 ? (concluidas / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* ── NPS Cliente ── */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-700 mb-1 text-sm">NPS Cliente</h3>
        <p className="text-xs text-gray-400 mb-3">
          Gere links para clientes avaliarem a obra (4 perguntas). A média substituirá o valor manual de NPS Cliente.
        </p>

        <form onSubmit={addCliente} className="flex gap-2 mb-4">
          <input
            className={`${inp} flex-1`}
            value={clienteLabel}
            onChange={e => setClienteLabel(e.target.value)}
            placeholder="Identificação do cliente (opcional)"
          />
          <button type="submit" disabled={savingCliente}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">
            {savingCliente ? 'Gerando...' : '+ Link Cliente'}
          </button>
        </form>

        {obra.avaliacoesCliente.length > 0 && (
          <div className="space-y-2">
            {obra.avaliacoesCliente.map(ac => (
              <div key={ac.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{ac.label ?? 'Cliente sem nome'}</span>
                  <Badge color={ac.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {ac.status === 'concluida' ? '✓ Respondida' : 'Aguardando'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  {ac.status === 'pendente' && (
                    <button onClick={() => copy(ac.token, 'cliente')}
                      className="text-green-600 hover:text-green-800 text-xs underline underline-offset-2">
                      {copied === ac.token ? '✓ Copiado!' : 'Copiar link'}
                    </button>
                  )}
                  {ac.status === 'pendente' && (
                    <button onClick={() => removeCliente(ac.id)} className="text-red-400 hover:text-red-600 text-xs">remover</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grouped by avaliado */}
      {avaliadosComAvaliacoes.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8 italic">Nenhuma avaliação 360° gerada ainda.</p>
      ) : (
        <div className="space-y-4">
          {avaliadosComAvaliacoes.map(({ avaliado, avaliacoes }) => {
            const conc = avaliacoes.filter(a => a.status === 'concluida').length
            return (
              <div key={avaliado.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{avaliado.nome}</span>
                    {avaliado.tipo === 'diretor'
                      ? <Badge color="bg-purple-100 text-purple-700">Diretor</Badge>
                      : <Badge color="bg-blue-50 text-blue-600">{SETOR_LABELS[avaliado.setor] ?? avaliado.setor}</Badge>
                    }
                  </div>
                  <span className="text-xs text-gray-500">{conc}/{avaliacoes.length} concluídas</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {avaliacoes.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">
                          <span className="font-medium">{a.avaliador.nome}</span>
                          {a.avaliador.tipo === 'diretor' && (
                            <span className="text-purple-500 text-xs ml-1">(Diretor)</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge color={a.status === 'concluida' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                            {a.status === 'concluida' ? '✓ Concluída' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          {a.status === 'pendente' && (
                            <button onClick={() => copy(a.token)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline underline-offset-2">
                              {copied === a.token ? '✓ Copiado!' : 'Copiar link'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {a.status === 'pendente' && (
                            <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-600 text-xs">remover</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TAB RESULTADOS ───────────────────────────────────────────────────────────
function TabResultados({ obraId }: { obraId: string }) {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/obras/${obraId}/resultados`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [obraId])

  if (loading) return <div className="text-center py-10 text-gray-400">Calculando...</div>

  if (data?.eliminatorio) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 font-bold text-lg">Bonificação Eliminada</p>
        <p className="text-red-500 text-sm mt-1">Desvio de custo superior a 5% cancela toda a bonificação desta obra.</p>
      </div>
    )
  }

  if (!data) return null

  const setores = ['lideranca', 'suprimento', 'orcamento'] as const
  const { pilares } = data

  return (
    <div className="space-y-6">
      {/* Financial summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Cálculo Financeiro</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Resultado Operacional</p>
            <p className="font-bold text-gray-900">{formatarMoeda(data.resultado)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Contrato − Custos − 7% TAC</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">% aplicado ao contrato</p>
            <p className="font-bold text-gray-900">{Math.round(data.pctContrato * 100)}%</p>
          </div>
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 mb-1">Bonificação Total</p>
            <p className="font-bold text-blue-700 text-xl">{formatarMoeda(data.bonificacaoTotal)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {setores.map(s => (
            <div key={s} className="text-center p-2.5 bg-slate-50 rounded-lg">
              <p className="text-xs text-gray-500">{SETOR_LABELS[s]}</p>
              <p className="font-semibold text-gray-800">{formatarMoeda(data.poolPorSetor?.[s] ?? 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown table — grouped by sector */}
      {setores.map(setor => {
        const pessoas = (data.pessoas ?? []).filter((p: any) => p.setor === setor)
        if (pessoas.length === 0) return null
        return (
          <div key={setor} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">{SETOR_LABELS[setor]}</h3>
              <span className="text-xs text-gray-400">{formatarMoeda(data.poolPorSetor?.[setor] ?? 0)} no pool</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Nome</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Prazo</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Custo</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">NPS Cultural</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Cliente</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500">Segurança</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700">Score</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700">%</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Pool</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">Valor Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pessoas.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.nome}</p>
                        {p.funcao && <p className="text-xs text-gray-400">{p.funcao}</p>}
                        {p.avaliacoesTotal > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.avaliacoesConcluidas}/{p.avaliacoesTotal} avaliações
                          </p>
                        )}
                      </td>
                      {/* Fixed pillar pts — same for everyone */}
                      <td className="px-3 py-3 text-center text-gray-700 font-medium">{pilares.prazo}</td>
                      <td className="px-3 py-3 text-center text-gray-700 font-medium">{pilares.custo}</td>
                      {/* Individual NPS Cultural */}
                      <td className="px-3 py-3 text-center">
                        {p.mediaNpsCultural != null ? (
                          <div>
                            <span className="font-semibold text-gray-800">{p.npsCulturalPts}</span>
                            <span className="text-xs text-gray-400 block">média {p.mediaNpsCultural.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {p.avaliacoesTotal === 0 ? 'sem aval.' : `${p.avaliacoesPendentes} pend.`}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700 font-medium">{pilares.cliente}</td>
                      <td className="px-3 py-3 text-center text-gray-700 font-medium">{pilares.seguranca}</td>
                      {/* Score */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-bold text-gray-900 text-base">{p.scoreIndividual ?? '—'}</span>
                      </td>
                      {/* % */}
                      <td className="px-3 py-3 text-center">
                        {p.percentualScore != null ? (
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            p.percentualScore >= 1.2 ? 'bg-green-100 text-green-700' :
                            p.percentualScore >= 1.0 ? 'bg-blue-100 text-blue-700'  :
                            p.percentualScore >= 0.8 ? 'bg-yellow-100 text-yellow-700' :
                            p.percentualScore >  0   ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scoreParaLabel(p.scoreIndividual)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-xs">
                        {p.valorPool != null ? formatarMoeda(p.valorPool) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {p.valorFinal != null ? formatarMoeda(p.valorFinal) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
