import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { grupoToken: token },
    include: { avaliador: true, avaliado: true },
    orderBy: { createdAt: 'asc' },
  })
  if (avaliacoes.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(avaliacoes)
}
