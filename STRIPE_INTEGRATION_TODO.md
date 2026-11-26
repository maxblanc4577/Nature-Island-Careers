# Stripe Checkout Integration Guide

This repository uses Stripe Checkout with `ui_mode: "form"` on Stripe API version `2026-03-25.dahlia` and the Dahlia Checkout Form SDK (`https://js.stripe.com/dahlia/stripe.js`). This file is the single source of truth for completing your configuration before going live.

## Values to Replace

The following values are placeholders or mode-dependent defaults and should be updated for your production Stripe account before going live.

**Files containing placeholders or defaults to verify:**
- [.env.example](.env.example)
- [server.ts](server.ts)
- [src/components/StripePaymentModal.tsx](src/components/StripePaymentModal.tsx)

| Field / Variable | Current Value | What to Set |
|------------------|--------------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_sample` (fallback: `pk_test_51MockDominicaNatureIslandCareersKey2026`) | Your Stripe Publishable Key from the [Stripe Dashboard API Keys](https://dashboard.stripe.com/test/apikeys) (`pk_test_...` for testing, `pk_live_...` for production). |
| `STRIPE_SECRET_KEY` | `sk_test_sample` | Your server-side Stripe Secret Key from the [Stripe Dashboard API Keys](https://dashboard.stripe.com/test/apikeys) (kept exclusively on the server). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_sample` | Your webhook signing secret from the [Stripe Workbench / Webhooks](https://dashboard.stripe.com/workbench/webhooks) or `stripe listen` CLI output. |
| `mode` | `'payment'` | Set to `'payment'` for one-time job listing charges (current default) or `'subscription'` when passing recurring Stripe Price IDs for monthly employer plans. (`payment_method_collection: 'always'` is automatically included when `mode === 'subscription'`). |
| `line_items` | Dynamic `price_data` (or `price` param) | Currently calculates USD-pegged `price_data` from `priceXCD`. If switching to fixed Stripe catalog products or subscriptions, pass actual `price_...` IDs from the [Stripe Dashboard Products](https://dashboard.stripe.com/prices). |

## Configured Parameters

These parameters were configured in Checkout Studio and are set in the Checkout Session creation call.

**Files containing these parameters:**
- [server.ts](server.ts)
- [index.html](index.html)
- [src/components/PaymentForm.tsx](src/components/PaymentForm.tsx)

| Parameter | Value | Notes |
|-----------|-------|-------|
| `ui_mode` | `"form"` | Embedded Checkout Form SDK (`2026-03-25.dahlia`) |
| `billing_address_collection` | `"auto"` | Configured via Checkout Studio |
| `phone_number_collection` | `{ enabled: false }` | Configured via Checkout Studio |
| `automatic_tax` | `{ enabled: false }` | Configured via Checkout Studio |
| `payment_method_collection` | `"always"` | Automatically included only when `mode === "subscription"` |
| `submit_type` | `"auto"` | Configured via Checkout Studio |
| `integration_identifier` | `"custom_embedded_web_0001"` | Configured via Checkout Studio |
| Client `appearance` | `theme: "stripe"`, `labels: "auto"`, `inputs: "spaced"` | Passed to `stripe.initCheckoutFormSdk({ clientSecret, appearance })` |

## Setup and Next Steps

### 1. Environment Variables & Dependencies

1. Ensure server and client environment secrets are configured in your runtime environment (matching [.env.example](.env.example)):
   - `VITE_STRIPE_PUBLISHABLE_KEY` (browser-safe publishable key, prefixed with `VITE_` for Vite)
   - `STRIPE_SECRET_KEY` (server-only secret key, never prefixed with `VITE_`)
   - `STRIPE_WEBHOOK_SECRET` (server-only webhook verification secret)
2. Verify dependencies are installed (`stripe@^23.0.0` is already listed in [package.json](package.json)):
   ```bash
   npm install
   ```
3. In [index.html](index.html), Stripe.js is loaded directly from `https://js.stripe.com/dahlia/stripe.js` (never self-host or bundle Stripe.js).

### 2. Files Updated in This Integration

- [index.html](index.html) — Upgraded Stripe.js `<script>` tag to `https://js.stripe.com/dahlia/stripe.js`.
- [server.ts](server.ts) — Updated `getStripe()` to `apiVersion: '2026-03-25.dahlia'` and aligned `stripe.checkout.sessions.create(...)` inside `handleCreateCheckoutSession` with the Checkout Studio parameters.
- [src/components/StripePaymentModal.tsx](src/components/StripePaymentModal.tsx) — Switched live checkout initialization from legacy `Elements` to passing `useCheckoutFormSdk` and session `client_secret` to `PaymentForm`.
- [src/components/PaymentForm.tsx](src/components/PaymentForm.tsx) — Added `DahliaCheckoutFormSection` calling `stripe.initCheckoutFormSdk({ clientSecret, appearance })`, `checkout.createForm({ layout: 'expanded' })`, `form.mount('#checkout-form')`, `checkout.loadActions()`, and `form.on('confirm', ...)`.
- [.env.example](.env.example) — Documented `STRIPE_WEBHOOK_SECRET` alongside `VITE_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

### 3. How the Integration Works (Flow Overview)

1. **Session Creation**: When an employer opens the checkout modal in [src/components/StripePaymentModal.tsx](src/components/StripePaymentModal.tsx), the client sends a `POST` request to `/api/stripe/create-checkout-session`.
2. **Server Checkout Session**: [server.ts](server.ts) initializes Stripe with API version `2026-03-25.dahlia`, computes the XCD-to-USD pegged amount, creates a Checkout Session with `ui_mode: 'form'` and the configured parameters, and returns JSON `{ client_secret: session.client_secret }`. (When `STRIPE_SECRET_KEY` is unset in local preview, it returns a sandbox simulator session.)
3. **Client Embedded Form**: In live mode with a real publishable key (`VITE_STRIPE_PUBLISHABLE_KEY`), [src/components/PaymentForm.tsx](src/components/PaymentForm.tsx) initializes `Stripe(publishableKey).initCheckoutFormSdk({ clientSecret, appearance })`, mounts the expanded form into `#checkout-form`, loads checkout actions, and confirms payment on the `confirm` event via `loadActionsResult.actions.confirm({ formConfirmEvent: event })`.
4. **Webhook Fulfillment**: [server.ts](server.ts) listens on `POST /api/stripe/webhook` with `req.rawBody` verification via `stripe.webhooks.constructEvent`, syncing paid job listings and employer invoices on `checkout.session.completed` (when `payment_status !== 'unpaid'`).

### 4. Testing Credit Card Numbers & Modes

- **Local Preview / Sandbox Mode**: Without live/test Stripe keys configured (or when Stripe mode in Admin Portal Settings is set to `sandbox`), `StripePaymentModal` runs against the local sandbox simulator and supports testing success, decline, cancel, timeout, and network error backoff flows.
- **Stripe Test Mode with Dahlia**: Set real `pk_test_...` (`VITE_STRIPE_PUBLISHABLE_KEY`) and `sk_test_...` (`STRIPE_SECRET_KEY`) keys and switch Stripe mode to `live` in the Admin Portal to mount the live Stripe Test Checkout Form (`https://js.stripe.com/dahlia/stripe.js`).
- **Standard Stripe Test Cards**:
  - **Success (Visa)**: `4242 4242 4242 4242` (any future expiry, any 3-digit CVC)
  - **3D Secure Challenge**: `4000 0025 0000 3155`
  - **Generic Decline**: `4000 0000 0000 0002`
  - **Insufficient Funds**: `4000 0000 0000 9995`
- **Local Webhook Testing**:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

### 5. Next Steps

- Create recurring and one-time Products/Prices in the [Stripe Dashboard](https://dashboard.stripe.com/prices) if you want fixed Price IDs instead of dynamic `price_data`, and pass `mode: 'subscription'` when charging recurring monthly employer tiers.
- Configure your production webhook endpoint (`https://<your-domain>/api/stripe/webhook`) in Stripe Workbench to receive `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`.
- Replace test API keys with live keys (`pk_live_...`, `sk_live_...`, `whsec_...`) in your secret manager before launch.

### Resources

- Stripe Support: https://support.stripe.com
- Stripe MCP & Documentation: https://docs.stripe.com/mcp
