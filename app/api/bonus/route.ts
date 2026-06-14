import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

const DEFAULT_TRACKER = {
  ath_target: 0,
  current_billing: 0,
  is_achieved: false,
  month_label: '',
  updated_at: new Date().toISOString(),
}

export async function GET(req: NextRequest) {
  const includeHistory = new URL(req.url).searchParams.get('history') === '1'

  const { data, error } = await supabaseAdmin
    .from('bonus_tracker')
    .select('ath_target, current_billing, is_achieved, month_label, updated_at')
    .eq('id', 1)
    .single()

  // PGRST116 = no rows — table exists but empty (pre-seed)
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 })
  }

  const tracker = data ?? DEFAULT_TRACKER

  if (!includeHistory) {
    return NextResponse.json(tracker)
  }

  const { data: history } = await supabaseAdmin
    .from('bonus_history')
    .select('id, type, value, label, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  return NextResponse.json({ tracker, history: history ?? [] })
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const email = user.email?.toLowerCase() ?? ''
  if (!ADMIN_EMAILS.includes(email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { action, value, label } = body ?? {}

  if (!action || typeof value !== 'number' || value < 0) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  if (action === 'ath_update') {
    await supabaseAdmin.from('bonus_tracker').upsert({
      id: 1,
      ath_target: value,
      month_label: label ?? '',
      is_achieved: false,
      current_billing: 0,
      updated_at: new Date().toISOString(),
    })

    await supabaseAdmin.from('bonus_history').insert({
      type: 'ath_update',
      value,
      label: label ?? '',
    })

    return NextResponse.json({ success: true })
  }

  if (action === 'billing_update') {
    const { data: current } = await supabaseAdmin
      .from('bonus_tracker')
      .select('ath_target')
      .eq('id', 1)
      .single()

    const athTarget = current?.ath_target ?? 0
    const isAchieved = value > athTarget

    await supabaseAdmin
      .from('bonus_tracker')
      .update({
        current_billing: value,
        is_achieved: isAchieved,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    await supabaseAdmin.from('bonus_history').insert({
      type: 'billing_update',
      value,
      label: label ?? new Date().toLocaleDateString('pt-PT'),
    })

    return NextResponse.json({ success: true, is_achieved: isAchieved })
  }

  return NextResponse.json({ error: 'Acção desconhecida' }, { status: 400 })
}
