# Stripe Webhook Integration Guide — Nature Island Careers

This guide explains how **Nature Island Careers** verifies incoming Stripe webhook events, keeps employer payment ledgers in sync, and automatically upgrades paid job listings to **Featured / Paid** status.

---

## 1. Prerequisites & Environment Secrets

Configure the following server-side environment variables in your deployment Secrets panel (never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in client code or `VITE_*` variables):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> **Security Rule**: Always keep Stripe secret keys strictly on the Express backend (`server.ts`). Any client logging is routed through `src/utils/paymentLogger.ts`, which strips `_secret`, `sk_`, and `rk_` tokens automatically.

---

## 2. Raw Body Signature Verification (`POST /api/stripe/webhook`)

Stripe signs every webhook payload using HMAC-SHA256 in the `Stripe-Signature` header. Because parsing JSON alters whitespace, `server.ts` preserves `req.rawBody` during `express.json({ verify })`:

```ts
app.use(
  express.json({
    limit: '5mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
```

Inside `POST /api/stripe/webhook`:
1. Verifies the `Stripe-Signature` header with `stripe.webhooks.constructEvent(payload, signatureHeader, process.env.STRIPE_WEBHOOK_SECRET)`.
2. Rejects tampered or unsigned requests with HTTP `400`.
3. Deduplicates retries using `processedWebhookEventIds` (`event.id`).

---

## 3. Handled Webhook Events & Job Listing Sync

| Stripe Event | Verification Rule | Ledger & Job Status Effect |
| :--- | :--- | :--- |
| `checkout.session.completed` | Checks `session.payment_status !== 'unpaid'` | Marks order `Paid`; sets matching `jobId` in `jobListingPaymentStatuses` to `featured: true, paymentStatus: 'Paid'` |
| `checkout.session.async_payment_succeeded` | Immediate settlement for async methods | Updates order & `jobListingPaymentStatuses` to `Paid` and dispatches employer receipt |
| `payment_intent.succeeded` | Intent succeeded cleanly | Marks order `Paid`, sets `jobId` featured badge active, sends receipt & admin notification |
| `payment_intent.payment_failed` | Intent failed | Marks order `Failed`, preserves error reason, sets job payment status to `Failed` |
| `charge.refunded` | Refund issued in Stripe Dashboard | Transitions order and job listing status to `Refunded`, removes `featured` pin |

---

## 4. Passing Job Metadata When Creating Checkout / PaymentIntents

Include `jobId` in your metadata when calling `POST /api/stripe/create-payment-intent` or `POST /api/stripe/create-checkout-session`:

```json
{
  "amountXCD": 350,
  "description": "Featured Top-of-Board Pin",
  "jobId": "job-geo-1",
  "employerName": "Dominica Geothermal Development Co."
}
```

When the webhook arrives, `GET /api/jobs` automatically reflects the updated `featured` and `paymentStatus` values from the server registry.

---

## 5. Local Testing with Stripe CLI

```bash
# 1. Authenticate with Stripe CLI
stripe login

# 2. Forward live test events to Express on port 3000
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 3. Trigger payment and checkout lifecycle events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```
