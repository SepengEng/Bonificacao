import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { avaliadoId, avaliadorIds } = await req.json()

  if (!avaliadoId || !Array.isArray(avaliadorIds) || avaliadorIds.length === 0) {
    return NextResponse.json({ error: 'avaliadoId e avaliadorIds obrigatórios' }, { status: 400 })
  }

  // Check for evaluators already registered for this avaliado
  const existing = await prisma.avaliacao.findMany({
    where: { obraId: id, avaliadoId, avaliadorId: { in: avaliadorIds } },
    select: { avaliadorId: true },
  })
  const existingIds = new Set(existing.map(a => a.avaliadorId))
  const novos = avaliadorIds.filter((aid: string) => !existingIds.has(aid))

  if (novos.length === 0) {
    return NextResponse.json({ error: 'Todas as avaliações já existem' }, { status: 409 })
  }

  const grupoToken = randomBytes(8).toString('hex')
  await prisma.avaliacao.createMany({
    data: novos.map((avaliadorId: string) => ({
      token: randomBytes(6).toString('hex'),
      grupoToken,
      obraId: id,
      avaliadorId,
      avaliadoId,
    })),
  })

  return NextResponse.json({ grupoToken, skipped: existing.length })
}
