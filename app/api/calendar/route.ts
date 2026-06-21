import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) return null

  const email = user.email?.toLowerCase() ?? ''
  return ADMIN_EMAILS.includes(email) ? email : null
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .select('id, title, description, status, event_date, recurring, recurring_start_date, created_at, updated_at')
    .order('event_date', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: 'Erro ao carregar eventos' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const email = await verifyAdmin(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { title, description, status, event_date, recurring, recurring_start_date } = body ?? {}

  if (!title?.trim() || !status) {
    return NextResponse.json({ error: 'Título e status são obrigatórios' }, { status: 400 })
  }

  const VALID_STATUSES = ['confirmed', 'planned', 'pending', 'deciding', 'exploring']
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .insert({
      title: title.trim(),
      description: description?.trim() ?? null,
      status,
      event_date: event_date || null,
      recurring: recurring || null,
      recurring_start_date: recurring ? (recurring_start_date || null) : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const email = await verifyAdmin(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { id, title, description, status, event_date, recurring, recurring_start_date } = body ?? {}

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: 'Título não pode ser vazio' }, { status: 400 })
  }

  const VALID_STATUSES = ['confirmed', 'planned', 'pending', 'deciding', 'exploring']
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined)               patch.title               = title.trim()
  if (description !== undefined)         patch.description         = description?.trim() ?? null
  if (status !== undefined)              patch.status              = status
  if (event_date !== undefined)          patch.event_date          = event_date || null
  if (recurring !== undefined)           patch.recurring           = recurring || null
  if (recurring_start_date !== undefined) patch.recurring_start_date = recurring ? (recurring_start_date || null) : null

  const { data, error } = await supabaseAdmin
    .from('calendar_events')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao actualizar evento' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const email = await verifyAdmin(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const id = body?.id

  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('calendar_events')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao apagar evento' }, { status: 500 })
  return NextResponse.json({ success: true })
}
