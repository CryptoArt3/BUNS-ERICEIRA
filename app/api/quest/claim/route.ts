import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { QUEST_REWARDS } from '@/lib/quest/config'

export const dynamic = 'force-dynamic'

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const rewardType: string | undefined = body?.reward_type
  if (!rewardType) {
    return NextResponse.json({ error: 'Missing reward_type' }, { status: 400 })
  }

  const rewardConfig = QUEST_REWARDS.find(
    (r) => r.label.toLowerCase().replace(/\s+/g, '_') === rewardType
  )
  if (!rewardConfig) {
    return NextResponse.json({ error: 'Invalid reward_type' }, { status: 400 })
  }

  // Upsert quest_rewards — UNIQUE(user_id, reward_type) prevents duplicates
  const { data: reward, error: rewardError } = await supabase
    .from('quest_rewards')
    .upsert(
      { user_id: user.id, reward_type: rewardType, claimed_at: new Date().toISOString() },
      { onConflict: 'user_id,reward_type', ignoreDuplicates: false }
    )
    .select('id, reward_type, claimed_at, redeemed_at')
    .single()

  if (rewardError) return NextResponse.json({ error: rewardError.message }, { status: 500 })

  if (reward.redeemed_at) {
    return NextResponse.json({ error: 'Recompensa já foi entregue' }, { status: 409 })
  }

  // Generate unique code — retry up to 3x on collision (code 23505)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  let codeData = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('quest_codes')
      .insert({
        code: generateCode(),
        user_id: user.id,
        reward_id: reward.id,
        expires_at: expiresAt,
      })
      .select('code, expires_at')
      .single()

    if (!error) { codeData = data; break }
    if (error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (!codeData) {
    return NextResponse.json({ error: 'Erro ao gerar código. Tenta novamente.' }, { status: 500 })
  }

  return NextResponse.json({
    code: codeData.code,
    expires_at: codeData.expires_at,
    reward_label: rewardConfig.label,
  })
}
