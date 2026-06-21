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

  const { data, error } = await supabaseAdmin
    .from('video_codes')
    .select(`
      id, code, episode_title, prize, status, created_at,
      video_code_claims (
        claim_hash, claimer_name, claimer_phone,
        claimed_at, expires_at, redeemed_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erro ao carregar códigos.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { code, episode_title, prize } = body ?? {}

  if (!code?.trim() || !episode_title?.trim() || !prize?.trim()) {
    return NextResponse.json({ error: 'Código, episódio e prémio são obrigatórios.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('video_codes')
    .insert({ code: code.trim(), episode_title: episode_title.trim(), prize: prize.trim() })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Este código já existe.' }, { status: 409 })
    return NextResponse.json({ error: 'Erro ao criar código.' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
