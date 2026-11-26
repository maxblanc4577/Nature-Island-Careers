import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STRIPE_CHECKOUT_FORM_APPEARANCE } from '../components/PaymentForm';

describe('Stripe Dahlia Checkout Form SDK Integration', () => {
  it('loads Stripe.js directly from https://js.stripe.com/dahlia/stripe.js in index.html', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('https://js.stripe.com/dahlia/stripe.js');
    expect(html).not.toContain('https://js.stripe.com/v3/');
  });

  it('configures server.ts with 2026-03-25.dahlia and exact Checkout Studio SessionCreateParams', () => {
    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    expect(serverSrc).toContain("apiVersion: '2026-03-25.dahlia'");
    expect(serverSrc).toContain("ui_mode: 'form'");
    expect(serverSrc).toContain("billing_address_collection: 'auto'");
    expect(serverSrc).toContain('phone_number_collection: { enabled: false }');
    expect(serverSrc).toContain('automatic_tax: { enabled: false }');
    expect(serverSrc).toContain("submit_type: 'auto'");
    expect(serverSrc).toContain("integration_identifier: 'custom_embedded_web_0001'");
    expect(serverSrc).toContain("mode === 'subscription' ? { payment_method_collection: 'always'");
    expect(serverSrc).not.toContain('sessionParams.return_url');
    expect(serverSrc).not.toContain('sessionParams.success_url');
    expect(serverSrc).not.toContain('sessionParams.cancel_url');
  });

  it('wires initCheckoutFormSdk, appearance, expanded layout, #checkout-form mount, and confirm handler in PaymentForm', () => {
    expect(STRIPE_CHECKOUT_FORM_APPEARANCE).toEqual({
      theme: 'stripe',
      labels: 'auto',
      inputs: 'spaced',
      variables: {
        borderRadius: '4px',
        colorBackground: '#ffffff',
        colorDanger: '#df1b41',
        colorPrimary: '#0570de',
        colorSuccess: '#00c853',
        colorText: '#30313d',
        fontFamily: 'default',
        fontSizeBase: '16px',
        spacingUnit: '4px',
      },
    });

    const formSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/PaymentForm.tsx'), 'utf8');
    expect(formSrc).toContain('initCheckoutFormSdk');
    expect(formSrc).toContain("createForm({ layout: 'expanded' })");
    expect(formSrc).toContain("form.mount('#checkout-form')");
    expect(formSrc).toContain('checkout.loadActions()');
    expect(formSrc).toContain("form.on('confirm'");
    expect(formSrc).toContain('loadActionsResult.actions.confirm');
  });

  it('keeps Vite/server Stripe environment variables consistent and provides STRIPE_INTEGRATION_TODO.md', () => {
    const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf8');
    expect(envExample).toContain('VITE_STRIPE_PUBLISHABLE_KEY=');
    expect(envExample).toContain('STRIPE_SECRET_KEY=');
    expect(envExample).toContain('STRIPE_WEBHOOK_SECRET=');
    expect(envExample).not.toContain('VITE_STRIPE_SECRET_KEY');

    const todo = fs.readFileSync(path.resolve(process.cwd(), 'STRIPE_INTEGRATION_TODO.md'), 'utf8');
    expect(todo).toContain('## Values to Replace');
    expect(todo).toContain('## Configured Parameters');
    expect(todo).toContain('https://support.stripe.com');
    expect(todo).toContain('https://docs.stripe.com/mcp');
  });
});
