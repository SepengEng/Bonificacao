export const PERGUNTAS_NPS_CLIENTE = [
  { id: 'q1', titulo: 'Comunicação',               descricao: 'A equipe se comunicou de forma clara e eficiente durante a obra?' },
  { id: 'q2', titulo: 'Confiabilidade',             descricao: 'Você confia no trabalho entregue pela equipe SEPENG?' },
  { id: 'q3', titulo: 'Capacidade de Solução',      descricao: 'A equipe demonstrou capacidade de resolver problemas e imprevistos?' },
  { id: 'q4', titulo: 'Postura e Relacionamento',   descricao: 'A postura e o relacionamento da equipe com você foram profissionais?' },
]

export const PERGUNTAS_NPS_CULTURAL = [
  { id: 'q1', titulo: 'Proatividade e Sentimento de Dono',         descricao: 'Este profissional demonstra iniciativa e age com sentimento de dono?' },
  { id: 'q2', titulo: 'Planejamento e Organização',                descricao: 'Este profissional planeja bem suas atividades e organiza seu trabalho de forma eficiente?' },
  { id: 'q3', titulo: 'Segurança e Valorização da Vida',           descricao: 'Este profissional atua com responsabilidade e prioriza a segurança?' },
  { id: 'q4', titulo: 'Ética, Respeito e Conduta Profissional',    descricao: 'Este profissional age de forma ética, respeitosa e profissional?' },
  { id: 'q5', titulo: 'Comunicação e Relacionamento com o Cliente', descricao: 'Este profissional se comunica de forma clara, eficiente e profissional com clientes?' },
  { id: 'q6', titulo: 'Excelência Técnica e Responsabilidade',     descricao: 'Este profissional entrega trabalhos com excelência técnica e responsabilidade?' },
  { id: 'q7', titulo: 'Aderência aos Valores SEPENG',              descricao: 'Este profissional representa os valores da SEPENG no dia a dia?' },
]

export const PRAZO_OPCOES: Record<string, { label: string; pontos: number }> = {
  no_prazo:       { label: 'Entregue no prazo',           pontos: 25 },
  antecipacao_10: { label: 'Antecipação >10%',            pontos: 35 },
  antecipacao_5:  { label: 'Antecipação entre 5% e 10%',  pontos: 30 },
  atraso_5:       { label: 'Atraso até 5%',               pontos: 15 },
  atraso_10:      { label: 'Atraso entre 5% e 10%',       pontos: 10 },
  atraso_mais_10: { label: 'Atraso superior a 10%',        pontos: 0  },
}

export const CUSTO_OPCOES: Record<string, { label: string; pontos: number; eliminatorio?: boolean }> = {
  no_custo:      { label: 'Dentro do custo previsto',          pontos: 25 },
  economia_10:   { label: 'Economia >10%',                     pontos: 35 },
  economia_5:    { label: 'Economia entre 5% e 10%',           pontos: 30 },
  desvio_5:      { label: 'Desvio até 5%',                     pontos: 10 },
  desvio_mais_5: { label: 'Desvio acima de 5% (Eliminatório)', pontos: 0, eliminatorio: true },
}

export const SETOR_LABELS: Record<string, string> = {
  lideranca:  'Liderança',
  suprimento: 'Suprimento',
  orcamento:  'Orçamento',
}

export const DISTRIBUICAO_SETORES: Record<string, number> = {
  lideranca:  0.73,
  suprimento: 0.07,
  orcamento:  0.20,
}

export function npsCulturalParaPontos(media: number): number {
  if (media >= 4.5) return 20
  if (media >= 4.0) return 16
  if (media >= 3.5) return 12
  if (media >= 3.0) return 7
  return 0
}

export function npsClienteParaPontos(media: number): number {
  if (media >= 4.5) return 15
  if (media >= 4.0) return 12
  if (media >= 3.5) return 9
  if (media >= 3.0) return 5
  return 0
}

export function scoreParaPercentual(score: number): number {
  if (score >= 100) return 1.2
  if (score >= 90)  return 1.0
  if (score >= 80)  return 0.8
  if (score >= 70)  return 0.6
  if (score >= 60)  return 0.4
  return 0
}

export function scoreParaLabel(score: number): string {
  return `${Math.round(scoreParaPercentual(score) * 100)}%`
}

export function contratoParaPercentualBonificacao(valor: number): number {
  if (valor <= 3_000_000)  return 0.07
  if (valor <= 6_000_000)  return 0.06
  if (valor <= 10_000_000) return 0.05
  if (valor <= 15_000_000) return 0.04
  if (valor <= 25_000_000) return 0.035
  return 0.03
}

export function calcularResultadoOperacional(valorContrato: number, custosTotais: number): number {
  const tac = valorContrato * 0.07
  return valorContrato - custosTotais - tac
}

export function calcularScoreBase(obra: {
  prazoOpcao: string
  custoOpcao: string
  clienteMedia: number
  segurancaOk: boolean
}): { pontos: number; eliminatorio: boolean } {
  const custoOpcao = CUSTO_OPCOES[obra.custoOpcao]
  if (custoOpcao?.eliminatorio) return { pontos: 0, eliminatorio: true }

  const prazoPts    = PRAZO_OPCOES[obra.prazoOpcao]?.pontos ?? 0
  const custoPts    = custoOpcao?.pontos ?? 0
  const clientePts  = npsClienteParaPontos(obra.clienteMedia)
  const segurancaPts = obra.segurancaOk ? 15 : 0

  return { pontos: prazoPts + custoPts + clientePts + segurancaPts, eliminatorio: false }
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
