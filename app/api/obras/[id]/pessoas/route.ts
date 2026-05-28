import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const pessoa = await prisma.pessoa.create({
    data: {
      nome:       body.nome,
      funcao:     body.funcao ?? null,
      setor:      body.setor,
      tipo:       body.tipo ?? 'colaborador',
      percentual: body.tipo === 'diretor' ? null : (body.percentual ?? null),
      obraId:     id,
    },
  })
  return NextResponse.json(pessoa)
}
