# BUNS Ericeira — Site Audit (Pre-V2)

**Date:** 2026-05-18  
**Auditor:** Claude Code  
**Branch:** main  
**Build status:** ❌ FAILS (see §Build)

---

## 1. Architecture Map

```
buns.ericeira.pt (Next.js 14.2.5, App Router)
│
├── Frontend (React, Tailwind CSS 3.4, Framer Motion)
│   ├── Customer flow: / → /menu → /cart → /checkout → /obrigado
│   ├── Account: /login → /account
│   └── Admin: /admin/login → /admin/orders
│
├── State
│   ├── Cart: React Context + localStorage ('cart')
│   ├── Auth: Supabase session (onAuthStateChange)
│   └── Theme/Mode: body classList + localStorage
│
├── Backend
│   ├── Supabase (PostgreSQL + Auth + Realtime)
│   │   ├── Table: orders (main business data)
│   │   ├── Table: freestyle_signups (event sign-ups)
│   │   └── Auth: Supabase Auth (magic link + email/password)
│   └── Next.js API Routes (/app/api/*)
│
└── Deployment: Vercel (inferred)
```

### Supabase Clients (three exist — fragmentation risk)

| File | Purpose | Session | Key used |
|---|---|---|---|
| `lib/supabase/client.ts` | Client-side | Persisted | anon |
| `lib/supabasePublic.ts` | Stateless client | None | anon |
| `lib/supabase/admin.ts` | Server-side only | None | service_role |

---

## 2. Route Inventory

### Customer Routes

| Route | Type | Notes |
|---|---|---|
| `/` | Client | Homepage: hero, location, team, footer |
| `/menu` | Client | Product grid + category filters |
| `/cart` | Client | Cart review + per-item options |
| `/checkout` | Client | Order form — **takeaway only** |
| `/obrigado` | Client | Order confirmation (order ID from querystring) |
| `/login` | Client | Magic-link OTP (passwordless) |
| `/account` | Client | User order history + realtime status |
| `/ar` | Client | 3D AR burger viewer (Google Model Viewer) |
| `/como-usar` | Client | 7-step carousel tutorial |
| `/wall-of-fame` | Client | Eating challenge leaderboard |
| `/eventos` | Client | Event listing |
| `/freestyle` | Client | Freestyle event page |
| `/lp/bacon-bun-menu-poll` | Client | Landing page / poll |
| `/lp/best-burger` | Client | Landing page |
| `/lp/buns-world-ranking` | Client | Landing page / ranking poll |
| `/privacidade` | Static | Privacy policy |
| `/termos` | Static | Terms of service |
| `/cookies` | Static | Cookie policy |

### Admin Routes

| Route | Auth method | Notes |
|---|---|---|
| `/admin/login` | Email + password | Uses Supabase `signInWithPassword` |
| `/admin/orders` | AdminGuard (email whitelist) | Main ops dashboard |
| `/admin/ping` | AdminGuard | Supabase connectivity test |

### Secondary Admin (separate system)

| Route | Auth method | Notes |
|---|---|---|
| `/ericeira/login` | Cookie-based | Sets `ericeira_admin=1` cookie |
| `/ericeira` | Middleware cookie check | Separate panel — not fully audited |

### Screen / Duel (internal)

| Route | Notes |
|---|---|
| `/screen` | TV/display page |
| `/duel` | 2-player mini-game (memory flash) |
| `/duel/join` | Join game room |
| `/financas` | Finance page |

### API Routes

| Route | Method | Purpose | Issue |
|---|---|---|---|
| `/api/duel/game` | GET, POST | Active game type management | — |
| `/api/duel/action` | — | Game actions | — |
| `/api/duel/events` | — | Event stream | — |
| `/api/duel/room` | — | Room management | — |
| `/api/freestyle/signup` | POST | Event sign-up | — |
| `/api/freestyle/signup/signups` | GET | List sign-ups | **❌ BUILD BREAKER** |
| `/api/poll/vote` | POST | Submit poll vote | — |
| `/api/poll/results` | GET | Poll results | — |
| `/api/screen` | — | TV display endpoint | — |

---

## 3. Component Inventory

### Customer

| Component | File | Status |
|---|---|---|
| CartProvider | `components/cart/CartContext.tsx` | ✅ Solid |
| CartItemOptions | `components/cart/CartItemOptions.tsx` | ✅ Functional |
| StickyCartBar | `components/cart/StickyCartBar.tsx` | ✅ Mobile only |
| MenuGrid | `components/menu/MenuGrid.tsx` | ✅ Solid |
| ProductCard | `components/menu/ProductCard.tsx` | ✅ Has 3D tilt |
| Menu data | `components/menu/data.ts` | ✅ 27 products |
| Header | `components/ui/Header.tsx` | ✅ Responsive |
| MobileNav | `components/ui/MobileNav.tsx` | ✅ Drawer |
| WelcomeModal | `components/ui/WelcomeModal.tsx` | ⚠️ Video assumed present |
| Sizzle | `components/ui/Sizzle.tsx` | ⚠️ Cosmetic only |
| ModeToggle | `components/ui/ModeToggle.tsx` | ✅ |
| ThemeToggle | `components/ui/ThemeToggle.tsx` | ✅ |

### Admin

| Component | File | Status |
|---|---|---|
| AdminGuard | `components/AdminGuard.tsx` | ⚠️ Redirects to wrong login |
| AdminHeader | `components/AdminHeader.tsx` | ✅ |
| useOrderSounds | `components/admin/useOrderSounds.ts` | ✅ V2 (just updated) |
| SoundToggle | `components/admin/SoundToggle.tsx` | 🔴 Dead code — not used |

---

## 4. Data Flow

### Customer Order Flow

```
Customer → /menu → adds item to CartContext (localStorage)
         → /cart → reviews items, sets per-item options/notes
         → /checkout
             ├── getSession() → requires logged-in user
             ├── form: name, phone, zone (TAKEAWAY only), payment
             └── INSERT into supabase.orders {
                   status: 'pending',
                   acknowledged: false,
                   user_id, items[], subtotal, delivery_fee, total,
                   payment_method, order_type, zone, delivery_type,
                   name, phone, address
                 }
         → /obrigado?order={id}
         → /account → SELECT orders WHERE user_id = me
                     + realtime subscription for status updates
```

### Admin Order Flow

```
Admin → /admin/login (email+password)
      → /admin/orders
          ├── SELECT * FROM orders ORDER BY created_at DESC LIMIT 200
          ├── Supabase realtime channel 'orders-rt'
          │   ├── INSERT → add to list, shake animation 8s, sound alert
          │   └── UPDATE/DELETE → update list, remove from alert set
          ├── Poll fallback: fetchOrders() every 5s if no event for 15s
          ├── Sound: useOrderSounds(hasAlerts) — plays new-order.wav
          │   repeating every 8s while pending unacknowledged orders exist
          ├── markSeen(id) → UPDATE orders SET acknowledged=true
          └── updateStatus(id, status) → UPDATE orders SET status=?,
                                         acknowledged=true (if not pending)
```

### Auth Flow

```
Customer:  /login → signInWithOtp (magic link) → email → callback → session
Admin:     /admin/login → signInWithPassword → session
                       → AdminGuard checks email in NEXT_PUBLIC_ADMIN_EMAILS
Ericeira:  /ericeira/login → (unknown mechanism) → sets cookie 'ericeira_admin=1'
                          → middleware checks cookie on /ericeira/*
```

---

## 5. What Is Good

- **Real-time order dashboard**: Supabase Postgres Changes wired correctly with polling fallback (15s threshold). Solid reliability pattern.
- **Cart persistence**: localStorage + React Context with functional updates. Clean and correct.
- **Checkout validation**: Server-side session re-check before INSERT, RLS error surfaced to user.
- **V2 sound alert system** (just implemented): WAV files, repeating alarm, soundBlocked detection, localStorage preference, browser unlock on user gesture.
- **Realtime order cards**: Red ring + glow, "NOVO PEDIDO" badge, time-limited shake, auto-acknowledge on status change. Clear restaurant UX.
- **Order type handling**: `TAKEAWAY` vs `DELIVERY` properly stored, admin distinguishes on card.
- **Theme system**: Day/Night + 3 colour themes, persisted to localStorage, CSS variables. Maintainable.
- **Mobile nav**: Drawer with body lock, close on backdrop click. Correct.
- **Account page realtime**: Filters by `user_id` server-side (not client-side). Correct RLS usage.
- **TypeScript**: Strict mode. Types are consistent across cart, order, and admin.
- **Product data**: Clean typed catalogue (`data.ts`). Easy to edit, no magic strings.
- **`AdminGuard`**: Auth state watch via `onAuthStateChange`. Doesn't flicker on refresh.
- **Delivery fee logic**: `calcFeeAndMeta` is clean — zone → fee mapping, single source of truth.

---

## 6. What Is Broken / Fragile

### 🔴 Critical — Breaks Production Build

#### B1 — Build fails on `/api/freestyle/signup/signups`
**File:** `app/api/freestyle/signup/signups/route.ts:9`  
**Cause:** `createClient(url, serviceRoleKey!)` runs at module evaluation time. During `next build`, `SUPABASE_SERVICE_ROLE_KEY` is not available → crash.  
**Fix:** Add `export const dynamic = 'force-dynamic'` to the route. One line.

### 🟠 High — Functional Problems

#### H1 — AdminGuard redirects to wrong login page
**File:** `components/AdminGuard.tsx`  
The guard redirects unauthorized users to `/login?next=...` — which is the customer magic-link page. Admin login is at `/admin/login` (email+password). A staff member who gets logged out will be sent to the customer login and have no password form to enter.

#### H2 — Cart variant bug: same product ID, different variant = qty bump
**File:** `components/cart/CartContext.tsx:71`  
`add()` matches only on `id`. Adding "Classic Bun" as burger then "Classic Bun" as menu increments qty rather than creating a second entry. Staff ordering a Burger + a Menu of the same product gets wrong results.

#### H3 — `OperatingHours` hour check is fragile
**File:** `app/page.tsx:348-355`  
Uses `Intl.DateTimeFormat('en-GB', ...).formatToParts(now)` to extract the hour, then `Number(parts.find(p => p.type === 'hour')?.value)`. This relies on browser locale string format. The `hour12: false` with `'en-GB'` normally works, but is one browser quirk away from returning `24` for midnight or `NaN`.  
**Fix:** Use `new Date().toLocaleString('en-GB', { timeZone, hour: 'numeric', ... })` or compute directly with UTC offset.

#### H4 — `SoundToggle.tsx` is dead code, not connected
**File:** `components/admin/SoundToggle.tsx`  
Not imported anywhere. The admin orders page now manages sound inline via `useOrderSounds`. This creates confusion for future developers.

#### H5 — Admin login page styling doesn't match the site
**File:** `app/admin/login/page.tsx:25`  
Uses hardcoded `bg-black` full-screen layout. The rest of admin uses the dark theme background + `AdminGuard` wrapping. The login page bypasses `AdminGuard` (correctly) but looks visually disconnected and has no `AdminHeader`.

#### H6 — Checkout allows empty cart submit (UX only)
**File:** `app/checkout/page.tsx:65`  
Validation happens only on form submit (`items.length === 0 → setErr`). A user with an empty cart sees a checkout form, fills it out, and only after clicking "Confirmar" gets an error. The "Confirmar pedido" button should be disabled when cart is empty.

### 🟡 Medium — Fragility / Technical Debt

#### M1 — Two parallel admin auth systems with no cross-linking
`/admin/*` uses Supabase auth + email whitelist (`NEXT_PUBLIC_ADMIN_EMAILS`).  
`/ericeira/*` uses a bare cookie `ericeira_admin=1` checked in `middleware.ts`.  
No code in the visible codebase sets this cookie. The `/ericeira/login` page exists but its mechanism is unknown. These are two separate security perimeters with no documentation.

#### M2 — Duplicate field names in checkout payload
**File:** `app/checkout/page.tsx:79-103`  
Payload sends both `delivery_type` and `order_type` (same value), and both `delivery_fee` and `fee` (same value). Implies the schema evolved and old field names were never cleaned up. Admin orders page reads `order_type`, which works, but the schema has dead columns.

#### M3 — Admin orders page only shows last 200 orders
**File:** `app/admin/orders/page.tsx:75`  
`.limit(200)` with no pagination. A busy restaurant day with >200 orders will silently lose older ones from the view.

#### M4 — No rate limiting on order creation
**File:** `app/checkout/page.tsx`  
Any logged-in user can INSERT unlimited orders in rapid succession. No debounce, no server-side limit. The `loading` state prevents double-submit from the same form interaction, but not programmatic requests.

#### M5 — Operating hours hardcoded
**File:** `app/page.tsx:347`  
`isOpen: h >= 11 && h < 23`. No day-of-week awareness (open every day?). No way for staff to change hours without a code deployment.

#### M6 — `NEXT_PUBLIC_ADMIN_EMAILS` is public
**File:** `.env.local / AdminGuard.tsx`  
Admin email addresses are in a public env var, readable by any browser. Anyone can inspect which emails have admin access.

#### M7 — No order detail page for customers
After `/obrigado`, the customer can only check `/account` for a status list. There's no `/order/[id]` page with full details. The commented-out link in `account/page.tsx:121` confirms this was planned but not built.

#### M8 — `caniuse-lite` 7 months out of date
Build warns every time. Not blocking but adds noise.

#### M9 — Images use `<img>` not `<Image>` 
**Files:** `app/page.tsx` (team photos, banner), `app/admin/login/page.tsx`  
Next.js `<Image>` is not used. No lazy loading, no automatic WebP conversion, no blur placeholder. For a menu-heavy page this is a meaningful performance gap.

#### M10 — Cart `dec()` bottoms at 1, not 0
**File:** `components/cart/CartContext.tsx:117`  
`setQty(id, Math.max(1, item.qty - 1))` — decrement stops at 1. The cart page has a separate remove button, but this means tapping "−" repeatedly never removes the item. On mobile this is confusing.

#### M11 — No product out-of-stock mechanism
Products are a static array in `data.ts`. There's no way for staff to mark an item as unavailable without a code deploy. A 86'd product stays on the menu.

#### M12 — Welcome modal video file assumed present
**File:** `components/ui/WelcomeModal.tsx`  
The `<video>` element has no `onError` handler. If the video file is missing, the modal shows an empty video element with no fallback.

#### M13 — Delivery disabled but code paths exist
All delivery zones in checkout are `disabled`. However `calcFeeAndMeta` handles them and the admin orders page renders "A caminho" status. Enabling delivery requires removing the `disabled` attribute — but there's no documentation, no operational plan, and no courier integration.

---

## 7. Urgent Fixes (do before V2)

Priority order:

| # | Fix | File | Effort |
|---|---|---|---|
| 1 | Add `export const dynamic = 'force-dynamic'` | `app/api/freestyle/signup/signups/route.ts` | 1 min |
| 2 | Fix `AdminGuard` redirect → `/admin/login` | `components/AdminGuard.tsx` | 2 min |
| 3 | Fix cart `add()` to key on `id + variant` | `components/cart/CartContext.tsx` | 10 min |
| 4 | Delete `SoundToggle.tsx` (dead code) | `components/admin/SoundToggle.tsx` | 1 min |
| 5 | Disable checkout submit when cart empty | `app/checkout/page.tsx` | 2 min |
| 6 | Fix `OperatingHours` hour extraction | `app/page.tsx` | 5 min |

---

## 8. V2 Upgrade Opportunities

### UX / Customer

| Opportunity | Priority | Notes |
|---|---|---|
| Order detail page `/order/[id]` | High | Customer can track live status. Already planned (commented link in `/account`). |
| Order status push notification | Medium | Supabase Edge Functions + Web Push API |
| Order confirmation email | High | Supabase Trigger + Resend/Postmark |
| Guest checkout (no login required) | Medium | Removes friction. Store contact info locally. |
| Product images optimized | Medium | Migrate all `<img>` to Next.js `<Image>` |
| Out-of-stock mechanism | High | Mark items unavailable from admin without deploy |
| Allergen / dietary info | Low | Already partially there with `tags: ['veg', 'spicy']` |
| EN language option | Low | Ericeira has international tourists |

### Admin / Operations

| Opportunity | Priority | Notes |
|---|---|---|
| Admin orders pagination | Medium | Beyond 200 orders limit |
| Print receipt / ticket | High | Kitchen ticket printing is standard restaurant ops |
| Orders by type filter | Medium | Quick filter: Takeaway only vs Delivery |
| Opening hours management | Medium | Admin panel to set open/closed without deploy |
| Daily sales summary | Low | Simple aggregate on orders table |
| Staff PIN login (tablet) | Medium | Faster than email/password on kitchen screen |
| Bulk acknowledge (all pending) | Low | "Accept all" button for busy periods |

### Technical

| Opportunity | Priority | Notes |
|---|---|---|
| Unify admin auth (single system) | High | Remove `/ericeira/*` vs `/admin/*` confusion |
| Enable delivery zones | Medium | Operational, not technical. Remove `disabled` + add courier workflow |
| Next.js upgrade to 15 | Low | After stabilizing V2 |
| Move admin emails to private env | Medium | Remove `NEXT_PUBLIC_` prefix, check server-side only |
| Cart keyed on `id + variant` | High | Bug fix (listed in urgent) |
| Supabase Edge Functions for emails | Medium | Server-side email on order INSERT |
| Image CDN / public folder audit | Medium | Verify all product images exist |

---

## 9. Recommended V2 Roadmap

### Phase 1 — Stabilize (1–2 days)
These are bug fixes and cleanup that should happen before any redesign.

1. Fix build: add `dynamic = 'force-dynamic'` to the signups route
2. Fix AdminGuard redirect to `/admin/login`
3. Fix cart variant key (`id + variant`)
4. Fix operating hours hour parsing
5. Remove `SoundToggle.tsx` dead code
6. Add disabled submit when cart empty
7. Audit `/public/menu/` — confirm all product images exist (27 products)

### Phase 2 — Core V2 Features (1–2 weeks)

8. Order detail page `/order/[id]` — live status tracker for customer
9. Order confirmation email (Supabase trigger + email provider)
10. Product availability management (admin panel toggle per product)
11. Kitchen ticket / print view (`/admin/orders?print=id`)
12. Admin orders: pagination beyond 200
13. Operating hours admin control

### Phase 3 — Growth Features (2–4 weeks)

14. Enable delivery — remove `disabled`, add courier status tracking
15. Guest checkout option
16. Next.js `<Image>` migration for all product photos
17. Push notifications for order status changes
18. Daily revenue dashboard in admin
19. Staff PIN login for tablet

### Phase 4 — Polish & Scale

20. EN language option
21. Out-of-stock menu item management
22. Unify admin auth systems (single login, cookie + session)
23. Admin email → private env var (server-side only)
24. Next.js 15 upgrade

---

## 10. Files to Change First

In exact order:

```
1. app/api/freestyle/signup/signups/route.ts   — add dynamic = 'force-dynamic'
2. components/AdminGuard.tsx                    — fix redirect path
3. components/cart/CartContext.tsx              — fix add() key
4. app/page.tsx                                 — fix OperatingHours hour parsing
5. components/admin/SoundToggle.tsx             — delete file
6. app/checkout/page.tsx                        — disable submit when cart empty
```

After those 6 fixes the build passes and the critical bugs are gone. V2 redesign can begin on a stable foundation.

---

## Appendix A — localStorage Keys

| Key | Set by | Value | Purpose |
|---|---|---|---|
| `cart` | CartContext | JSON CartState | Cart persistence |
| `checkout_phone` | checkout page | string | Pre-fill phone on return |
| `buns_admin_sound` | useOrderSounds | `'1'` or `'0'` | Sound alert preference |
| `buns_welcome_seen_at` | WelcomeModal | timestamp string | Suppress welcome video |
| `buns_mode` | ModeToggle | `'day'` or `'night'` | UI mode |
| `buns_theme` | ThemeToggle | `'default'` / `'surf'` / `'graffiti'` | Colour theme |

---

## Appendix B — Order Status State Machine

```
INSERT → pending (acknowledged: false)
       ↓ admin clicks "ACEITAR PEDIDO"
         acknowledged: true (stays pending)
       ↓ admin clicks "Em preparação"
         preparing, acknowledged: true
       ↓ admin clicks "A caminho"
         delivering, acknowledged: true
       ↓ admin clicks "Entregue"
         done, acknowledged: true

Note: "Pending" button allows reverting to pending — sets acknowledged=false? No,
updateStatus() only sets acknowledged=true when status != 'pending'. Reverting
to pending does NOT reset acknowledged, so reverted orders won't re-trigger alerts.
```

---

## Appendix C — Product Catalogue Summary

| Category | Count | Price range |
|---|---|---|
| Burgers | 4 | €8.90–€10.90 (€12.90–€14.90 as menu) |
| Batatas | 2 | €2.50 |
| Bebidas | 11 | €1.00–€3.50 |
| Extras | 3 | €1.00–€2.00 |
| Molhos | 4 | €1.00 |
| Sobremesas | 4 | €3.00 |
| **Total** | **28** | — |

---

*End of audit. V2 redesign should not begin until Phase 1 fixes are complete.*
