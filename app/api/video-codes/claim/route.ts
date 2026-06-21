import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const HASH_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I — avoid visual confusion
const EXPIRY_DAYS = 10

function generateHash(): string {
  const bytes = randomBytes(5)
  return 'BUNS-' + Array.from(bytes, (b) => HASH_CHARS[b % HASH_CHARS.length]).join('')
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const code   = body?.code?.trim()
  const name   = body?.name?.trim()
  const phone  = body?.phone?.trim()

  if (!code || !name || !phone) {
    return NextResponse.json({ error: 'Código, nome e telemóvel são obrigatórios.' }, { status: 400 })
  }

  // 1. Find the code record
  const { data: videoCode, error: findErr } = await supabaseAdmin
    .from('video_codes')
    .select('id, episode_title, prize, status')
    .eq('code', code)
    .single()

  if (findErr || !videoCode) {
    return NextResponse.json(
      { error: 'Código não encontrado. Verifica bem os dígitos — podes rever o episódio.' },
      { status: 404 },
    )
  }

  if (videoCode.status === 'redeemed') {
    return NextResponse.json({ error: 'Este prémio já foi levantado na loja.' }, { status: 409 })
  }

  // 2. If pending, check whether the active claim has expired
  if (videoCode.status === 'pending') {
    const { data: activeClaim } = await supabaseAdmin
      .from('video_code_claims')
      .select('expires_at')
      .eq('code_id', videoCode.id)
      .is('redeemed_at', null)
      .order('claimed_at', { ascending: false })
      .limit(1)
      .single()

    if (activeClaim && new Date(activeClaim.expires_at) > new Date()) {
      return NextResponse.json(
        { error: 'Este prémio já foi reclamado por outra pessoa. Se não for levantado no prazo de 10 dias, voltará a estar disponível.' },
        { status: 409 },
      )
    }
    // Claim expired — reset to available so the lock below can succeed
    await supabaseAdmin.from('video_codes').update({ status: 'available' }).eq('id', videoCode.id)
  }

  // 3. Atomic lock: only update if still 'available' (guards against race conditions)
  const { data: locked } = await supabaseAdmin
    .from('video_codes')
    .update({ status: 'pending' })
    .eq('id', videoCode.id)
    .eq('status', 'available')
    .select('id')

  if (!locked || locked.length === 0) {
    return NextResponse.json(
      { error: 'Este prémio já foi reclamado por outra pessoa.' },
      { status: 409 },
    )
  }

  // 4. Insert claim record
  const claimHash = generateHash()
  const claimedAt = new Date()
  const expiresAt = new Date(claimedAt.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const { error: insertErr } = await supabaseAdmin
    .from('video_code_claims')
    .insert({
      code_id:       videoCode.id,
      claim_hash:    claimHash,
      claimer_name:  name,
      claimer_phone: phone,
      claimed_at:    claimedAt.toISOString(),
      expires_at:    expiresAt.toISOString(),
    })

  if (insertErr) {
    // Best-effort rollback
    await supabaseAdmin.from('video_codes').update({ status: 'available' }).eq('id', videoCode.id)
    return NextResponse.json({ error: 'Erro ao registar o prémio. Tenta novamente.' }, { status: 500 })
  }

  return NextResponse.json({
    hash:          claimHash,
    prize:         videoCode.prize,
    episode_title: videoCode.episode_title,
    expires_at:    expiresAt.toISOString(),
  }, { status: 201 })
}
