import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

  const [{ data: rewards, error: rewardsError }, { data: activeCodes, error: codesError }] =
    await Promise.all([
      supabase
        .from('quest_rewards')
        .select('id, reward_type, unlocked_at, claimed_at, redeemed_at, redeemed_by')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: true }),

      supabase
        .from('quest_codes')
        .select('reward_id, code, expires_at')
        .eq('user_id', user.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString()),
    ])

  if (rewardsError) return NextResponse.json({ error: rewardsError.message }, { status: 500 })
  if (codesError)   return NextResponse.json({ error: codesError.message  }, { status: 500 })

  const result = (rewards ?? []).map((r) => ({
    ...r,
    activeCode: (activeCodes ?? []).find((c) => c.reward_id === r.id) ?? null,
  }))

  return NextResponse.json({ rewards: result })
}
