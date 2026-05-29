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
  id: string; token: string; status: string; grupoToken: string | null
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

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 20,
      fontSize: 12, fontWeight: 500, background: bg, color,
    }}>
      {children}
    </span>
  )
}

function ScoreCard({ label, pts, max, highlight }: { label: string; pts: number; max?: number; highlight?: boolean }) {
  return (
    <div style={{
      borderRadius: 10, padding: '12px 8px', textAlign: 'center',
      background: highlight
        ? 'linear-gradient(135deg, var(--teal), var(--blue))'
        : 'rgba(42,185,176,0.07)',
      border: highlight ? 'none' : '1px solid rgba(42,185,176,0.15)',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: highlight ? 'white' : 'var(--teal)' }}>{pts}</div>
      <div style={{ fontSize: 11, marginTop: 2, color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--muted)' }}>{label}</div>
      {max && <div style={{ fontSize: 11, color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--muted)' }}>máx {max}</div>}
    </div>
  )
}

export default function ObraPage() {
  const params  = useParams()
  const id      = params.id as string
  const router  = useRouter()
  const [obra,      setObra]      = useState<Obra | null>(null)
  const [tab,       setTab]       = useState<Tab>('pessoas')
  const [loading,   setLoading]   = useState(true)
  const [editando,  setEditando]  = useState(false)
  const [salvando,  setSalvando]  = useState(false)
  const [editForm,  setEditForm]  = useState({
    nome: '', valorContrato: '', custosTotais: '',
    prazoOpcao: '', custoOpcao: '', clienteMedia: '', segurancaOk: false,
  })

  const reload = useCallback(async () => {
    const res = await fetch(`/api/obras/${id}`)
    if (!res.ok) { setObra(null); setLoading(false); return }
    setObra(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { reload() }, [reload])

  function abrirEdicao() {
    if (!obra) return
    setEditForm({
      nome:          obra.nome,
      valorContrato: String(obra.valorContrato),
      custosTotais:  String(obra.custosTotais),
      prazoOpcao:    obra.prazoOpcao,
      custoOpcao:    obra.custoOpcao,
      clienteMedia:  String(obra.clienteMedia),
      segurancaOk:   obra.segurancaOk,
    })
    setEditando(true)
  }

  async function salvarObra() {
    setSalvando(true)
    await fetch(`/api/obras/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome:          editForm.nome,
        valorContrato: editForm.valorContrato,
        custosTotais:  editForm.custosTotais,
        prazoOpcao:    editForm.prazoOpcao,
        custoOpcao:    editForm.custoOpcao,
        clienteMedia:  editForm.clienteMedia,
        segurancaOk:   editForm.segurancaOk,
      }),
    })
    await reload()
    setEditando(false)
    setSalvando(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>Carregando...</div>
  if (!obra)   return <div style={{ textAlign: 'center', padding: '48px 0', color: '#EF4444', fontSize: 14 }}>Obra não encontrada.</div>

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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button
            onClick={() => router.push('/')}
            style={{ marginTop: 2, color: 'var(--muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >←</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>{obra.nome}</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{formatarMoeda(obra.valorContrato)}</p>
          </div>
        </div>
        <button onClick={abrirEdicao} className="btn-ghost" style={{ marginTop: 2, fontSize: 12 }}>
          Editar dados
        </button>
      </div>

      {/* Edit panel */}
      {editando && (
        <div className="card" style={{ marginBottom: 20, padding: 20, borderColor: 'rgba(42,185,176,0.3)' }}>
          <h2 style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 16, fontSize: 14 }}>Editar dados da obra</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Nome da obra</label>
              <input value={editForm.nome}
                onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Valor do contrato (R$)</label>
              <input type="number" step="0.01" value={editForm.valorContrato}
                onChange={e => setEditForm(f => ({ ...f, valorContrato: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Custos totais (R$)</label>
              <input type="number" step="0.01" value={editForm.custosTotais}
                onChange={e => setEditForm(f => ({ ...f, custosTotais: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Prazo</label>
              <select value={editForm.prazoOpcao}
                onChange={e => setEditForm(f => ({ ...f, prazoOpcao: e.target.value }))}>
                {Object.entries(PRAZO_OPCOES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({v.pontos} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Custo</label>
              <select value={editForm.custoOpcao}
                onChange={e => setEditForm(f => ({ ...f, custoOpcao: e.target.value }))}>
                {Object.entries(CUSTO_OPCOES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({v.pontos} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>NPS Cliente (média 0–5)</label>
              <input type="number" step="0.1" min="0" max="5" value={editForm.clienteMedia}
                onChange={e => setEditForm(f => ({ ...f, clienteMedia: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--fg)' }}>
                <input type="checkbox" checked={editForm.segurancaOk}
                  onChange={e => setEditForm(f => ({ ...f, segurancaOk: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--teal)' }} />
                Segurança OK (15 pts)
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={salvarObra} disabled={salvando} className="btn-primary">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setEditando(false)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Score panel */}
      <div style={{
        marginBottom: 20, padding: 16, borderRadius: 12,
        border: `1px solid ${scoreBase.eliminatorio ? 'rgba(239,68,68,0.3)' : 'rgba(42,185,176,0.2)'}`,
        background: scoreBase.eliminatorio ? 'rgba(239,68,68,0.05)' : 'rgba(42,185,176,0.06)',
      }}>
        {scoreBase.eliminatorio ? (
          <p style={{ color: '#DC2626', fontWeight: 600, fontSize: 14 }}>⚠️ Bonificação ELIMINADA — desvio de custo superior a 5%</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            <ScoreCard label="Prazo"      pts={prazoPts}         max={35} />
            <ScoreCard label="Custo"      pts={custoPts}         max={35} />
            <ScoreCard label="Cliente"    pts={clientePts}       max={15} />
            <ScoreCard label="Segurança"  pts={segPts}           max={15} />
            <ScoreCard label="Score base" pts={scoreBase.pontos} highlight />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {tabs.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 14,
            fontWeight: tab === t ? 600 : 400,
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            borderBottom: `2px solid ${tab === t ? 'var(--teal)' : 'transparent'}`,
            marginBottom: -1,
            color: tab === t ? 'var(--teal)' : 'var(--muted)',
            background: 'none', cursor: 'pointer', transition: 'color 0.15s',
          }}>
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

  const diretores     = obra.pessoas.filter(p => p.tipo === 'diretor')
  const colaboradores = obra.pessoas.filter(p => p.tipo !== 'diretor')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Add form */}
      <form onSubmit={add} className="card" style={{ padding: 16 }}>
        <h3 style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 12, fontSize: 14 }}>Adicionar pessoa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nome *</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Nome completo" required />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Função</label>
            <input value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))}
              placeholder="Ex: Engenheiro" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Tipo *</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              <option value="colaborador">Colaborador (recebe bonificação)</option>
              <option value="diretor">Diretor (só avalia, sem bonificação)</option>
            </select>
          </div>
        </div>

        {!isDiretor && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Setor *</label>
              <select value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value }))}>
                <option value="lideranca">Liderança (73%)</option>
                <option value="suprimento">Suprimento (7%)</option>
                <option value="orcamento">Orçamento (20%)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>% do pool do setor</label>
              <input type="number" min="0" max="100" step="0.01" value={form.percentual}
                onChange={e => setForm(f => ({ ...f, percentual: e.target.value }))}
                placeholder="Ex: 50 para 50%" />
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Salvando...' : '+ Adicionar'}
        </button>
      </form>

      {/* Directors */}
      {diretores.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <h3 style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 14 }}>Diretores</h3>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>(avaliam mas não recebem bonificação)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {diretores.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: 10, padding: '10px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, color: 'var(--fg)', fontSize: 14 }}>{p.nome}</span>
                  {p.funcao && <span style={{ color: 'var(--muted)', fontSize: 12 }}>· {p.funcao}</span>}
                  <Badge bg="rgba(124,58,237,0.1)" color="#7C3AED">Diretor</Badge>
                </div>
                <button onClick={() => remove(p.id)}
                  style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                  remover
                </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 14 }}>{SETOR_LABELS[setor]}</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>({Math.round(pools[setor] * 100)}% da bonificação)</span>
              {pessoas.length > 0 && (
                <span style={{
                  fontSize: 12, fontWeight: 500, marginLeft: 'auto',
                  color: Math.abs(soma - 1) < 0.001 ? '#16A34A' : '#D97706',
                }}>
                  Soma: {Math.round(soma * 100)}%
                </span>
              )}
            </div>
            {pessoas.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Nenhum colaborador neste setor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pessoas.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'white', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 16px',
                  }}>
                    <div>
                      <span style={{ fontWeight: 500, color: 'var(--fg)', fontSize: 14 }}>{p.nome}</span>
                      {p.funcao && <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>· {p.funcao}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {p.percentual != null
                        ? <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)' }}>{Math.round(p.percentual * 10000) / 100}%</span>
                        : <span style={{ fontSize: 12, color: '#D97706', fontStyle: 'italic' }}>sem %</span>
                      }
                      <button onClick={() => remove(p.id)}
                        style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                        remover
                      </button>
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
  const [copied,            setCopied]            = useState<string | null>(null)
  const [grupoAvaliado,     setGrupoAvaliado]     = useState('')
  const [grupoSelecionados, setGrupoSelecionados] = useState<string[]>([])
  const [savingGrupo,       setSavingGrupo]       = useState(false)
  const [erroGrupo,         setErroGrupo]         = useState('')
  const [clienteLabel,      setClienteLabel]      = useState('')
  const [savingCliente,     setSavingCliente]     = useState(false)

  function copy(token: string, path = 'avaliar') {
    navigator.clipboard.writeText(`${window.location.origin}/${path}/${token}`)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  function toggleAvaliador(id: string) {
    setGrupoSelecionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function criarGrupo(e: React.FormEvent) {
    e.preventDefault()
    setErroGrupo('')
    const avaliadores = grupoSelecionados.filter(id => id !== grupoAvaliado)
    if (!grupoAvaliado) { setErroGrupo('Selecione quem será avaliado.'); return }
    if (avaliadores.length < 1) { setErroGrupo('Selecione pelo menos 1 avaliador (diferente do avaliado).'); return }
    setSavingGrupo(true)
    const res = await fetch(`/api/obras/${obra.id}/avaliacoes/grupo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avaliadoId: grupoAvaliado, avaliadorIds: avaliadores }),
    })
    const d = await res.json()
    if (!res.ok) { setErroGrupo(d.error ?? 'Erro.') }
    else { setGrupoAvaliado(''); setGrupoSelecionados([]) }
    setSavingGrupo(false)
    onReload()
  }

  async function remove(id: string, concluida = false) {
    const msg = concluida
      ? 'Esta avaliação já foi respondida. Remover mesmo assim?'
      : 'Remover esta avaliação?'
    if (!confirm(msg)) return
    await fetch(`/api/obras/${obra.id}/avaliacoes?avaliacaoId=${id}`, { method: 'DELETE' })
    onReload()
  }

  async function removeGrupo(grupoToken: string, temConcluidas: boolean) {
    const msg = temConcluidas
      ? 'Este grupo tem avaliações já respondidas. Remover todas mesmo assim?'
      : 'Remover todas as avaliações deste link compartilhado?'
    if (!confirm(msg)) return
    await fetch(`/api/obras/${obra.id}/avaliacoes?grupoToken=${grupoToken}`, { method: 'DELETE' })
    onReload()
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

  const avaliadosMap = new Map<string, {
    avaliado: Pessoa
    grupos: Map<string, Avaliacao[]>
    individuais: Avaliacao[]
  }>()

  for (const a of obra.avaliacoes) {
    const aid = a.avaliado.id
    if (!avaliadosMap.has(aid)) {
      avaliadosMap.set(aid, { avaliado: a.avaliado, grupos: new Map(), individuais: [] })
    }
    const entry = avaliadosMap.get(aid)!
    if (a.grupoToken) {
      const grupo = entry.grupos.get(a.grupoToken) ?? []
      grupo.push(a)
      entry.grupos.set(a.grupoToken, grupo)
    } else {
      entry.individuais.push(a)
    }
  }

  const concluidas = obra.avaliacoes.filter(a => a.status === 'concluida').length
  const total      = obra.avaliacoes.length

  const diretores     = obra.pessoas.filter(p => p.tipo === 'diretor')
  const colaboradores = obra.pessoas.filter(p => p.tipo !== 'diretor')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {obra.pessoas.length < 2 && (
        <div style={{
          background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)',
          borderRadius: 12, padding: 16, fontSize: 14, color: '#92400E',
        }}>
          Adicione pelo menos 2 pessoas na aba <strong>Pessoas</strong> para gerar avaliações.
        </div>
      )}

      {/* ── Link Compartilhado ── */}
      <form onSubmit={criarGrupo} className="card" style={{ padding: 16 }}>
        <h3 style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 4, fontSize: 14 }}>Link Compartilhado 360°</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Um único link para 2–5 avaliadores. Cada um se identifica ao clicar e preenche sua própria avaliação.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Quem será avaliado?</label>
          <select value={grupoAvaliado}
            onChange={e => { setGrupoAvaliado(e.target.value); setGrupoSelecionados(prev => prev.filter(id => id !== e.target.value)) }}
            required>
            <option value="">Selecione o avaliado...</option>
            {colaboradores.map(p => (
              <option key={p.id} value={p.id}>{p.nome} · {SETOR_LABELS[p.setor] ?? p.setor}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8, fontWeight: 500 }}>Quem vai avaliar? (marque 1 a 5)</label>

          {diretores.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diretores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {diretores.map(p => {
                  const disabled = p.id === grupoAvaliado
                  const selected = grupoSelecionados.includes(p.id)
                  return (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '8px 12px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.4 : 1,
                      background: selected ? 'rgba(124,58,237,0.06)' : 'white',
                      border: `1px solid ${selected ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                      transition: 'border-color 0.15s',
                    }}>
                      <input type="checkbox" checked={selected}
                        disabled={disabled}
                        onChange={() => !disabled && toggleAvaliador(p.id)}
                        style={{ accentColor: '#7C3AED', width: 'auto' }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', flex: 1 }}>{p.nome}</span>
                      <span style={{ fontSize: 12, color: '#7C3AED' }}>Diretor</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {colaboradores.map(p => {
              const disabled = p.id === grupoAvaliado
              const selected = grupoSelecionados.includes(p.id)
              return (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  background: selected ? 'rgba(42,185,176,0.07)' : 'white',
                  border: `1px solid ${selected ? 'rgba(42,185,176,0.35)' : 'var(--border)'}`,
                  transition: 'border-color 0.15s',
                }}>
                  <input type="checkbox" checked={selected}
                    disabled={disabled}
                    onChange={() => !disabled && toggleAvaliador(p.id)}
                    style={{ accentColor: 'var(--teal)', width: 'auto' }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', flex: 1 }}>{p.nome}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{SETOR_LABELS[p.setor] ?? p.setor}</span>
                </label>
              )
            })}
          </div>
        </div>

        {erroGrupo && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{erroGrupo}</p>}
        <button type="submit"
          disabled={savingGrupo || grupoSelecionados.filter(id => id !== grupoAvaliado).length === 0}
          className="btn-primary">
          {savingGrupo ? 'Gerando...' : `Gerar Link Compartilhado (${grupoSelecionados.filter(id => id !== grupoAvaliado).length} avaliadores)`}
        </button>
      </form>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <span style={{ color: 'var(--fg)', whiteSpace: 'nowrap' }}>{concluidas}/{total} concluídas</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--teal)', borderRadius: 3, transition: 'width 0.3s',
              width: `${(concluidas / total) * 100}%`,
            }} />
          </div>
        </div>
      )}

      {/* Grouped by avaliado */}
      {avaliadosMap.size === 0 ? (
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', padding: '16px 0', fontStyle: 'italic' }}>
          Nenhuma avaliação 360° gerada ainda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from(avaliadosMap.values()).map(({ avaliado, grupos, individuais }) => {
            const todasAv = [...Array.from(grupos.values()).flat(), ...individuais]
            const conc = todasAv.filter(a => a.status === 'concluida').length
            return (
              <div key={avaliado.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 14 }}>{avaliado.nome}</span>
                    {avaliado.tipo === 'diretor'
                      ? <Badge bg="rgba(124,58,237,0.1)" color="#7C3AED">Diretor</Badge>
                      : <Badge bg="rgba(42,185,176,0.1)" color="var(--teal)">{SETOR_LABELS[avaliado.setor] ?? avaliado.setor}</Badge>
                    }
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{conc}/{todasAv.length} concluídas</span>
                </div>

                {/* Group links */}
                {Array.from(grupos.entries()).map(([grupoToken, avs]) => {
                  const gConc = avs.filter(a => a.status === 'concluida').length
                  return (
                    <div key={grupoToken} style={{ borderBottom: '1px solid var(--bg)' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 16px', background: 'rgba(42,185,176,0.06)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>Link compartilhado</span>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{gConc}/{avs.length}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <button onClick={() => copy(grupoToken, 'avaliar/grupo')}
                            style={{ color: 'var(--teal)', fontSize: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                            {copied === grupoToken ? '✓ Copiado!' : 'Copiar link'}
                          </button>
                          <button onClick={() => removeGrupo(grupoToken, gConc > 0)}
                            style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                            remover grupo
                          </button>
                        </div>
                      </div>
                      <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                        <tbody>
                          {avs.map(a => (
                            <tr key={a.id} style={{ borderTop: '1px solid var(--bg)' }}>
                              <td style={{ padding: '8px 24px', color: 'var(--fg)' }}>
                                <span>{a.avaliador.nome}</span>
                                {a.avaliador.tipo === 'diretor' && (
                                  <span style={{ color: '#7C3AED', fontSize: 12, marginLeft: 6 }}>(Diretor)</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                <Badge
                                  bg={a.status === 'concluida' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)'}
                                  color={a.status === 'concluida' ? '#16A34A' : '#D97706'}>
                                  {a.status === 'concluida' ? '✓ Concluída' : 'Pendente'}
                                </Badge>
                              </td>
                              <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                                <button onClick={() => remove(a.id, a.status === 'concluida')}
                                  style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                                  remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}

                {/* Individual links */}
                {individuais.length > 0 && (
                  <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                    <tbody>
                      {individuais.map(a => (
                        <tr key={a.id} style={{ borderTop: '1px solid var(--bg)' }}>
                          <td style={{ padding: '10px 16px', color: 'var(--fg)' }}>
                            <span style={{ fontWeight: 500 }}>{a.avaliador.nome}</span>
                            {a.avaliador.tipo === 'diretor' && (
                              <span style={{ color: '#7C3AED', fontSize: 12, marginLeft: 6 }}>(Diretor)</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <Badge
                              bg={a.status === 'concluida' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)'}
                              color={a.status === 'concluida' ? '#16A34A' : '#D97706'}>
                              {a.status === 'concluida' ? '✓ Concluída' : 'Pendente'}
                            </Badge>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {a.status === 'pendente' && (
                              <button onClick={() => copy(a.token)}
                                style={{ color: 'var(--teal)', fontSize: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {copied === a.token ? '✓ Copiado!' : 'Copiar link'}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <button onClick={() => remove(a.id, a.status === 'concluida')}
                              style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                              remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── NPS Cliente ── */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <h3 style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 4, fontSize: 14 }}>NPS Cliente</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Gere links para clientes avaliarem a obra (4 perguntas). A média substituirá o valor manual de NPS Cliente.
        </p>
        <form onSubmit={addCliente} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={clienteLabel} onChange={e => setClienteLabel(e.target.value)}
            placeholder="Identificação do cliente (opcional)"
            style={{ flex: 1, minWidth: 0 }} />
          <button type="submit" disabled={savingCliente} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {savingCliente ? 'Gerando...' : '+ Link Cliente'}
          </button>
        </form>
        {obra.avaliacoesCliente.map(ac => (
          <div key={ac.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'white', border: '1px solid var(--border)', borderRadius: 10,
            padding: '10px 16px', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, color: 'var(--fg)' }}>{ac.label ?? 'Cliente sem nome'}</span>
              <Badge
                bg={ac.status === 'concluida' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)'}
                color={ac.status === 'concluida' ? '#16A34A' : '#D97706'}>
                {ac.status === 'concluida' ? '✓ Respondida' : 'Aguardando'}
              </Badge>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {ac.status === 'pendente' && (
                <button onClick={() => copy(ac.token, 'cliente')}
                  style={{ color: 'var(--teal)', fontSize: 12, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {copied === ac.token ? '✓ Copiado!' : 'Copiar link'}
                </button>
              )}
              {ac.status === 'pendente' && (
                <button onClick={() => removeCliente(ac.id)}
                  style={{ color: '#EF4444', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                  remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TAB RESULTADOS ───────────────────────────────────────────────────────────
function TabResultados({ obraId }: { obraId: string }) {
  const [data,      setData]      = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/obras/${obraId}/resultados`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [obraId])

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>Calculando...</div>

  if (data?.eliminatorio) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#DC2626', fontWeight: 700, fontSize: 18 }}>Bonificação Eliminada</p>
        <p style={{ color: '#EF4444', fontSize: 14, marginTop: 4 }}>Desvio de custo superior a 5% cancela toda a bonificação desta obra.</p>
      </div>
    )
  }

  if (!data) return null

  const setores = ['lideranca', 'suprimento', 'orcamento'] as const
  const { pilares } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Financial summary */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontWeight: 600, color: 'var(--fg)', marginBottom: 16, fontSize: 15 }}>Cálculo Financeiro</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Resultado Operacional</p>
            <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 16 }}>{formatarMoeda(data.resultado)}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Contrato − Custos − 7% TAC</p>
          </div>
          <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>% aplicado ao contrato</p>
            <p style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 16 }}>{Math.round(data.pctContrato * 100)}%</p>
          </div>
          <div style={{
            textAlign: 'center', padding: 12, borderRadius: 10,
            background: 'rgba(42,185,176,0.08)', border: '1px solid rgba(42,185,176,0.2)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 4 }}>Bonificação Total</p>
            <p style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 20 }}>{formatarMoeda(data.bonificacaoTotal)}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {setores.map(s => (
            <div key={s} style={{ textAlign: 'center', padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>{SETOR_LABELS[s]}</p>
              <p style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 14 }}>{formatarMoeda(data.poolPorSetor?.[s] ?? 0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown table — grouped by sector */}
      {setores.map(setor => {
        const pessoas = (data.pessoas ?? []).filter((p: any) => p.setor === setor)
        if (pessoas.length === 0) return null
        return (
          <div key={setor} className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ fontWeight: 600, color: 'var(--fg)', fontSize: 15 }}>{SETOR_LABELS[setor]}</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatarMoeda(data.poolPorSetor?.[setor] ?? 0)} no pool</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                <thead style={{ borderBottom: '1px solid var(--border)' }}>
                  <tr style={{ background: 'var(--bg)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left',   fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Nome</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Prazo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Custo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>NPS Cultural</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Cliente</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Segurança</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Score</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>%</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Pool</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right',  fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Valor Final</th>
                  </tr>
                </thead>
                <tbody>
                  {pessoas.map((p: any) => {
                    const aberto = expandido === p.id
                    return (
                      <>
                        <tr key={p.id} style={{
                          borderTop: '1px solid var(--border)',
                          background: aberto ? 'rgba(42,185,176,0.04)' : 'white',
                        }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: 500, color: 'var(--fg)', fontSize: 14 }}>{p.nome}</p>
                            {p.funcao && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{p.funcao}</p>}
                            {p.avaliacoesTotal > 0 && (
                              <button onClick={() => setExpandido(aberto ? null : p.id)}
                                style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {aberto ? '▲ ocultar' : `▼ ${p.avaliacoesConcluidas}/${p.avaliacoesTotal} avaliadores`}
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--fg)', fontWeight: 500 }}>{pilares.prazo}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--fg)', fontWeight: 500 }}>{pilares.custo}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {p.mediaNpsCultural != null ? (
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{p.npsCulturalPts}</span>
                                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>média {p.mediaNpsCultural.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 6px', borderRadius: 20 }}>
                                {p.avaliacoesTotal === 0 ? 'sem aval.' : `${p.avaliacoesPendentes} pend.`}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--fg)', fontWeight: 500 }}>{pilares.cliente}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'var(--fg)', fontWeight: 500 }}>{pilares.seguranca}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--fg)', fontSize: 16 }}>{p.scoreIndividual ?? '—'}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {p.percentualScore != null ? (
                              <span style={{
                                display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                                fontSize: 12, fontWeight: 700,
                                ...(p.percentualScore >= 1.2
                                  ? { background: 'rgba(22,163,74,0.1)',  color: '#16A34A' }
                                  : p.percentualScore >= 1.0
                                  ? { background: 'rgba(42,185,176,0.1)', color: 'var(--teal)' }
                                  : p.percentualScore >= 0.8
                                  ? { background: 'rgba(234,179,8,0.1)',  color: '#CA8A04' }
                                  : p.percentualScore > 0
                                  ? { background: 'rgba(249,115,22,0.1)', color: '#EA580C' }
                                  : { background: 'rgba(239,68,68,0.1)',  color: '#DC2626' }
                                ),
                              }}>
                                {scoreParaLabel(p.scoreIndividual)}
                              </span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--muted)', fontSize: 12 }}>
                            {p.valorPool != null ? formatarMoeda(p.valorPool) : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--fg)' }}>
                            {p.valorFinal != null ? formatarMoeda(p.valorFinal) : '—'}
                          </td>
                        </tr>

                        {/* Avaliadores expandido */}
                        {aberto && p.avaliadores?.length > 0 && (
                          <tr key={`${p.id}-avaliadores`}>
                            <td colSpan={10} style={{ padding: 0, borderTop: '1px solid rgba(42,185,176,0.15)' }}>
                              <div style={{ background: 'rgba(42,185,176,0.05)', padding: '12px 24px' }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quem avaliou</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {p.avaliadores.map((av: any, idx: number) => (
                                    <div key={idx} style={{
                                      display: 'flex', alignItems: 'center', gap: 12,
                                      background: 'white', borderRadius: 8, padding: '8px 12px',
                                      border: '1px solid rgba(42,185,176,0.12)',
                                    }}>
                                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', flex: 1 }}>{av.nome}</span>
                                      {av.tipo === 'diretor' && (
                                        <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 500 }}>Diretor</span>
                                      )}
                                      {av.status === 'concluida' ? (
                                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                                          média <strong style={{ color: 'var(--fg)' }}>{av.media?.toFixed(2) ?? '—'}</strong>
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: 12, color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                                          Pendente
                                        </span>
                                      )}
                                      <Badge
                                        bg={av.status === 'concluida' ? 'rgba(22,163,74,0.1)' : 'rgba(107,114,128,0.1)'}
                                        color={av.status === 'concluida' ? '#16A34A' : 'var(--muted)'}>
                                        {av.status === 'concluida' ? '✓' : '○'}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
