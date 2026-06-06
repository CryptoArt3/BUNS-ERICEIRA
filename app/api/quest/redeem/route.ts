import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { QUEST_REWARDS } from '@/lib/quest/config'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin identity via user token
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const email = user.email?.toLowerCase() ?? ''
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const code: string | undefined = body?.code
  if (!code || !/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Find code — supabaseAdmin bypasses RLS (code belongs to a customer)
  const { data: codeRecord, error: codeError } = await supabaseAdmin
    .from('quest_codes')
    .select('id, reward_id, user_id, expires_at, used_at')
    .eq('code', code)
    .single()

  if (codeError || !codeRecord) {
    return NextResponse.json({ error: 'Código não encontrado' }, { status: 404 })
  }

  if (codeRecord.used_at) {
    return NextResponse.json({ error: 'Código já utilizado' }, { status: 409 })
  }

  if (codeRecord.expires_at < now) {
    return NextResponse.json({ error: 'Código expirado' }, { status: 410 })
  }

  // Fetch reward record
  const { data: rewardRecord, error: rewardError } = await supabaseAdmin
    .from('quest_rewards')
    .select('id, reward_type, redeemed_at')
    .eq('id', codeRecord.reward_id)
    .single()

  if (rewardError || !rewardRecord) {
    return NextResponse.json({ error: 'Recompensa não encontrada' }, { status: 404 })
  }

  if (rewardRecord.redeemed_at) {
    return NextResponse.json({ error: 'Recompensa já entregue' }, { status: 409 })
  }

  // Mark code as used and reward as redeemed
  await Promise.all([
    supabaseAdmin
      .from('quest_codes')
      .update({ used_at: now })
      .eq('id', codeRecord.id),

    supabaseAdmin
      .from('quest_rewards')
      .update({ redeemed_at: now, redeemed_by: email })
      .eq('id', rewardRecord.id),
  ])

  const rewardConfig = QUEST_REWARDS.find(
    (r) => r.label.toLowerCase().replace(/\s+/g, '_') === rewardRecord.reward_type
  )

  return NextResponse.json({
    success: true,
    reward_type: rewardRecord.reward_type,
    reward_label: rewardConfig?.label ?? rewardRecord.reward_type,
    user_id: codeRecord.user_id,
  })
}
