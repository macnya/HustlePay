# HustlePay 🇰🇪

Chama savings for Kenya: create chamas, track contributions and pay with **M-PESA STK Push**, in **KES**, with **mobile-number (OTP) sign-in**.

- **Frontend + API:** Next.js 15 (App Router) → deployed on **Vercel**
- **Database + Auth:** **Supabase** (Postgres, Row Level Security, phone OTP)
- **Payments:** Safaricom M-PESA Daraja (Lipa na M-PESA Online)

---

## 1. Supabase setup

1. Create a project at [database.new](https://database.new) (region: **Africa (Cape Town)** is closest to Kenya).
2. Open **SQL Editor** and run the whole file [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). It creates the tables, RLS policies, the profile-on-signup trigger and the totals triggers.
3. **Auth → Providers → Phone**: enabled by default. To actually deliver SMS you must attach an SMS provider (**Auth → Providers → Phone → Enable SMS provider**): Twilio, Vonage, or **Africa's Talking** all work in Kenya. Set the OTP length/expiry under **Auth → Settings** if you want (default: 6 digits, 1 hour).
4. **Auth → URL configuration**: add your Vercel domain (and `http://localhost:3000` for local dev) to *Site URL* and *Redirect URLs*.
5. Grab **Project Settings → API**: `Project URL`, `anon` key, `service_role` key.

## 2. M-PESA (Daraja) setup

1. Create an app at [developer.safaricom.co.ke](https://developer.safaricom.co.ke) → get **Consumer Key** and **Consumer Secret**.
2. **Sandbox testing:** use the test Paybill shortcode `174379` and its sandbox passkey (shown on the M-Pesa Express / STK Push page of the portal).
3. **Production:** you need your own Paybill/Till with the *Lipa na M-PESA* product enabled, plus its production shortcode and passkey, then set `MPESA_ENV=production`.
4. `MPESA_CALLBACK_URL` must be a public **HTTPS** URL — on Vercel it defaults to `https://<your-deployment>.vercel.app/api/mpesa/callback`, so you normally don't set it locally. Set it explicitly for a custom domain.

## 3. Run locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase + Daraja values
npm run dev                  # http://localhost:9002
```

Environment variables (see [`.env.example`](.env.example)):

| Variable | Where it's used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server (Supabase project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server (anon key, RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** — M-PESA callback writes |
| `MPESA_ENV` | `sandbox` or `production` |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | Daraja OAuth |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | STK Push credentials |
| `MPESA_CALLBACK_URL` | optional override of the Daraja callback URL |

> Never put the service-role key or any Daraja secret in `NEXT_PUBLIC_*`, client code or `.dev.vars`.

## 4. Deploy to Vercel

1. Push this repo to GitHub, then **Vercel → New Project → Import**.
2. Framework preset: **Next.js** (no extra config needed).
3. Add every variable from `.env.example` in **Project Settings → Environment Variables** (Production + Preview). Set `MPESA_ENV=production` only when your live shortcode is ready.
4. Deploy. After the first deploy, set `MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback` if you use a custom domain, and add that domain to Supabase **Auth → URL configuration**.

## 5. How the M-PESA flow works

1. Contributions page → **Pay with M-PESA** → `POST /api/mpesa/stkpush` inserts a *pending* contribution and triggers an STK push to the payer's phone.
2. The member approves with their M-PESA PIN.
3. Safaricom POSTs the result to `POST /api/mpesa/callback` (service-role key, amount verified, idempotent) → contribution becomes **paid** and a ledger transaction is written.
4. The browser polls the contribution for up to ~90 s and shows the M-PESA receipt.

Manual (cash/bank) contributions still work and are recorded with the status you pick.

## Kenya-specific details

- Currency formatting: `formatKES()` (`KES 125,000`)
- Phone numbers normalised to `2547XXXXXXXX` / `2541XXXXXXXX` (accepts `07…`, `7…`, `+254…`)
- All dates render in **Africa/Nairobi** (`formatKENDateTime`, `EAT`)
- Members are matched to contributions by `user_id` (registered members) or by name (roster members added by the admin)

## Scripts

```bash
npm run dev        # dev server on port 9002
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

> Note: the leftover Firebase Studio files (`firebase.json`, `dataconnect/`, `functions/`, `apphosting.yaml`, …) are unused by this app — the backend is Supabase. They can be deleted safely once you no longer need the Firebase project.