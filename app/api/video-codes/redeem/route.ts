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

async function getClaimByHash(hash: string) {
  return supabaseAdmin
    .from('video_code_claims')
    .select(`
      id, claim_hash, claimer_name, claimer_phone,
      claimed_at, expires_at, redeemed_at,
      video_codes ( id, episode_title, prize, status )
    `)
    .eq('claim_hash', hash.toUpperCase())
    .single()
}

/* ── GET — verify hash without mutating (admin only) ── */
export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hash = req.nextUrl.searchParams.get('hash')?.trim()
  if (!hash) return NextResponse.json({ error: 'Hash obrigatório.' }, { status: 400 })

  const { data: claim, error } = await getClaimByHash(hash)
  if (error || !claim) {
    return NextResponse.json({ error: 'Hash não encontrado. Verifica se está correcto.' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (claim as any).video_codes
  const now  = new Date()

  if (claim.redeemed_at) {
    return NextResponse.json({
      state: 'already_redeemed',
      error: 'Este prémio já foi levantado anteriormente.',
      claimer_name:  claim.claimer_name,
      prize:         code.prize,
      episode_title: code.episode_title,
      redeemed_at:   claim.redeemed_at,
    }, { status: 409 })
  }

  if (new Date(claim.expires_at) < now) {
    return NextResponse.json({
      state: 'expired',
      error: 'Este hash expirou. O código voltará a estar disponível.',
      expires_at: claim.expires_at,
    }, { status: 410 })
  }

  return NextResponse.json({
    state:         'valid',
    claim_hash:    claim.claim_hash,
    claimer_name:  claim.claimer_name,
    claimer_phone: claim.claimer_phone,
    prize:         code.prize,
    episode_title: code.episode_title,
    claimed_at:    claim.claimed_at,
    expires_at:    claim.expires_at,
  })
}

/* ── POST — confirm and mark as redeemed (admin only) ── */
export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const hash = body?.hash?.trim()
  if (!hash) return NextResponse.json({ error: 'Hash obrigatório.' }, { status: 400 })

  const { data: claim, error } = await getClaimByHash(hash)
  if (error || !claim) {
    return NextResponse.json({ error: 'Hash não encontrado.' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = (claim as any).video_codes

  if (claim.redeemed_at) {
    return NextResponse.json({
      error:         'Este prémio já foi levantado.',
      claimer_name:  claim.claimer_name,
      prize:         code.prize,
      episode_title: code.episode_title,
      redeemed_at:   claim.redeemed_at,
    }, { status: 409 })
  }

  if (new Date(claim.expires_at) < new Date()) {
    await supabaseAdmin.from('video_codes').update({ status: 'available' }).eq('id', code.id)
    return NextResponse.json({
      error:      'Este hash expirou. O código voltou a estar disponível para nova tentativa.',
      expires_at: claim.expires_at,
    }, { status: 410 })
  }

  const redeemedAt = new Date().toISOString()
  await supabaseAdmin.from('video_code_claims').update({ redeemed_at: redeemedAt }).eq('id', claim.id)
  await supabaseAdmin.from('video_codes').update({ status: 'redeemed' }).eq('id', code.id)

  return NextResponse.json({
    success:       true,
    claimer_name:  claim.claimer_name,
    claimer_phone: claim.claimer_phone,
    prize:         code.prize,
    episode_title: code.episode_title,
    claim_hash:    claim.claim_hash,
    claimed_at:    claim.claimed_at,
    redeemed_at:   redeemedAt,
  })
}
