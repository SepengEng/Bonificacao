import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const obra = await prisma.obra.findUnique({
    where: { id },
    include: {
      pessoas: { orderBy: { setor: 'asc' } },
      avaliacoes: {
        include: { avaliador: true, avaliado: true },
        orderBy: { createdAt: 'asc' },
      },
      avaliacoesCliente: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!obra) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(obra)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.obra.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
