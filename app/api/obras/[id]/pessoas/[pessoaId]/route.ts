import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_req: Request, { params }: { params: Promise<{ pessoaId: string }> }) {
  const { pessoaId } = await params
  await prisma.avaliacao.deleteMany({
    where: { OR: [{ avaliadorId: pessoaId }, { avaliadoId: pessoaId }] },
  })
  await prisma.pessoa.delete({ where: { id: pessoaId } })
  return NextResponse.json({ ok: true })
}
