import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.startsWith('Bearer ')
    ? req.headers.get('authorization')!.slice(7)
    : null
  if (!token) return null
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return null
  const email = user.email?.toLowerCase() ?? ''
  return ADMIN_EMAILS.includes(email) ? email : null
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ error: 'Pesquisa demasiado curta (mínimo 2 caracteres).' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('video_code_claims')
    .select(`
      claim_hash, claimer_name, claimer_phone,
      claimed_at, expires_at, redeemed_at,
      video_codes ( episode_title, prize, status )
    `)
    .or(`claimer_name.ilike.%${q}%,claimer_phone.ilike.%${q}%`)
    .order('claimed_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Erro na pesquisa.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}
