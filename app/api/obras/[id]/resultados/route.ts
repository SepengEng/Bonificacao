import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  calcularResultadoOperacional,
  contratoParaPercentualBonificacao,
  DISTRIBUICAO_SETORES,
  PRAZO_OPCOES,
  CUSTO_OPCOES,
  calcularScoreBase,
  npsCulturalParaPontos,
  npsClienteParaPontos,
  scoreParaPercentual,
} from '@/lib/scoring'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const obra = await prisma.obra.findUnique({
    where: { id },
    include: { pessoas: true, avaliacoes: true, avaliacoesCliente: true },
  })
  if (!obra) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Use live client evaluations if available, otherwise fall back to manual clienteMedia
  const avaliacoesClienteConcluidas = obra.avaliacoesCliente.filter(a => a.status === 'concluida')
  let clienteMediaEfetiva = obra.clienteMedia
  if (avaliacoesClienteConcluidas.length > 0) {
    const medias = avaliacoesClienteConcluidas.map(a => {
      const vals = [a.q1, a.q2, a.q3, a.q4].filter((v): v is number => v !== null)
      return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
    })
    clienteMediaEfetiva = medias.reduce((s, m) => s + m, 0) / medias.length
  }

  const obraParaScore = { ...obra, clienteMedia: clienteMediaEfetiva }
  const scoreBase = calcularScoreBase(obraParaScore)
  if (scoreBase.eliminatorio) {
    return NextResponse.json({ eliminatorio: true, scoreBase: 0, pessoas: [] })
  }

  const resultado      = calcularResultadoOperacional(obra.valorContrato, obra.custosTotais)
  const pctContrato    = contratoParaPercentualBonificacao(obra.valorContrato)
  const bonificacaoTotal = resultado * pctContrato

  const poolPorSetor = {
    lideranca:  bonificacaoTotal * DISTRIBUICAO_SETORES.lideranca,
    suprimento: bonificacaoTotal * DISTRIBUICAO_SETORES.suprimento,
    orcamento:  bonificacaoTotal * DISTRIBUICAO_SETORES.orcamento,
  }

  const pilares = {
    prazo:     PRAZO_OPCOES[obra.prazoOpcao]?.pontos    ?? 0,
    custo:     CUSTO_OPCOES[obra.custoOpcao]?.pontos    ?? 0,
    cliente:   npsClienteParaPontos(clienteMediaEfetiva),
    seguranca: obra.segurancaOk ? 15 : 0,
  }

  // Only collaborators receive bonification; directors only give evaluations
  const colaboradores = obra.pessoas.filter(p => p.tipo === 'colaborador')

  const pessoas = colaboradores.map(pessoa => {
    const recebidas  = obra.avaliacoes.filter(a => a.avaliadoId === pessoa.id)
    const concluidas = recebidas.filter(a => a.status === 'concluida')

    let mediaNpsCultural: number | null = null
    let npsCulturalPts = 0

    if (concluidas.length > 0) {
      const medias = concluidas.map(a => {
        const vals = [a.q1, a.q2, a.q3, a.q4, a.q5, a.q6, a.q7].filter((v): v is number => v !== null)
        return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
      })
      mediaNpsCultural = medias.reduce((s, m) => s + m, 0) / medias.length
      npsCulturalPts   = npsCulturalParaPontos(mediaNpsCultural)
    }

    const scoreIndividual = mediaNpsCultural !== null ? scoreBase.pontos + npsCulturalPts : null
    const percentualScore = scoreIndividual  !== null ? scoreParaPercentual(scoreIndividual) : null

    const poolSetor  = poolPorSetor[pessoa.setor as keyof typeof poolPorSetor] ?? 0
    const valorPool  = pessoa.percentual != null ? poolSetor * pessoa.percentual : null
    const valorFinal = valorPool !== null && percentualScore !== null ? valorPool * percentualScore : null

    return {
      ...pessoa,
      mediaNpsCultural,
      npsCulturalPts,
      scoreIndividual,
      percentualScore,
      valorPool,
      valorFinal,
      avaliacoesConcluidas: concluidas.length,
      avaliacoesPendentes:  recebidas.filter(a => a.status === 'pendente').length,
      avaliacoesTotal:      recebidas.length,
    }
  })

  return NextResponse.json({
    resultado,
    bonificacaoTotal,
    eliminatorio: false,
    scoreBase: scoreBase.pontos,
    pctContrato,
    poolPorSetor,
    pilares,
    pessoas,
    clienteMediaEfetiva,
    avaliacoesClienteCount: avaliacoesClienteConcluidas.length,
  })
}
