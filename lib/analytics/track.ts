import { supabase } from '@/lib/supabase/client'
import { isStandalone } from '@/lib/pwa'

/* ── Session ID (per browser tab, persisted in sessionStorage) ── */
function sid(): string {
  try {
    let id = sessionStorage.getItem('buns_sid')
    if (!id) {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      sessionStorage.setItem('buns_sid', id)
    }
    return id
  } catch { return '' }
}

/* ── Cached auth user id ── */
let _uid: string | null | undefined = undefined

function getUid(): Promise<string | null> {
  if (_uid !== undefined) return Promise.resolve(_uid)
  return supabase.auth.getSession().then(({ data }) => {
    _uid = data?.session?.user?.id ?? null
    return _uid
  }).catch(() => null)
}

// Update cache on auth state changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_evt, session) => {
    _uid = session?.user?.id ?? null
  })
}

function getLang(): string {
  try { return localStorage.getItem('buns_lang') || 'pt' } catch { return 'pt' }
}

/* ── Public API ── */
export type TrackPayload = {
  event_name: string
  path?: string
  product_id?: string
  cart_total?: number
  order_id?: string
  metadata?: Record<string, unknown>
}

export function track(p: TrackPayload): void {
  void (async () => {
    try {
      await supabase.from('analytics_events').insert({
        event_name: p.event_name,
        path: p.path ?? (typeof window !== 'undefined' ? window.location.pathname : null),
        product_id: p.product_id ?? null,
        cart_total: p.cart_total ?? null,
        order_id: p.order_id ?? null,
        language: getLang(),
        is_pwa: typeof window !== 'undefined' ? isStandalone() : false,
        user_id: await getUid(),
        session_id: sid(),
        metadata: p.metadata ?? null,
      })
    } catch {
      // never block — analytics is best-effort
    }
  })()
}
