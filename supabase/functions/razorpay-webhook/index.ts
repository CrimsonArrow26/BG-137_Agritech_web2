// ============================================================
// razorpay-webhook/index.ts — Farmer Marketplace
// Supabase Edge Function: Handles Razorpay webhook events
// Deploy: supabase functions deploy razorpay-webhook
//
// Configure in Razorpay Dashboard → Webhooks:
//   URL: https://<project>.supabase.co/functions/v1/razorpay-webhook
//   Secret: <your RAZORPAY_WEBHOOK_SECRET>
//   Events to subscribe:
//     ✓ payment.captured
//     ✓ payment.failed
//     ✓ order.paid
//     ✓ refund.created
//     ✓ refund.processed
//     ✓ refund.failed
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Event → (order status, payment_status) mapping ──────────
const EVENT_HANDLERS: Record<string, {
  orderStatus?:   string;
  paymentStatus:  string;
}> = {
  'payment.captured':  { orderStatus: 'confirmed',  paymentStatus: 'paid'             },
  'payment.failed':    { orderStatus: 'cancelled',  paymentStatus: 'failed'           },
  'order.paid':        {                             paymentStatus: 'paid'             },
  'refund.created':    {                             paymentStatus: 'refund_initiated' },
  'refund.processed':  { orderStatus: 'cancelled',  paymentStatus: 'refunded'         },
  'refund.failed':     {                             paymentStatus: 'refund_failed'    },
};

serve(async (req: Request) => {
  // Webhooks always arrive as POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 1. Read raw body for signature verification (must be done BEFORE .json())
  const rawBody      = await req.text();
  const rzpSignature = req.headers.get('x-razorpay-signature');

  if (!rzpSignature) {
    console.warn('[razorpay-webhook] Missing signature header');
    return new Response('Missing signature', { status: 400 });
  }

  // 2. Verify webhook signature using WEBHOOK_SECRET (different from key_secret)
  const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
  const isValid        = await verifyWebhookSignature(rawBody, rzpSignature, WEBHOOK_SECRET);

  if (!isValid) {
    console.warn('[razorpay-webhook] Invalid webhook signature');
    return new Response('Invalid signature', { status: 401 });
  }

  // 3. Parse and route the event
  const event = JSON.parse(rawBody);
  const eventType: string = event.event;

  console.log(`[razorpay-webhook] Received event: ${eventType}`);

  const handler = EVENT_HANDLERS[eventType];
  if (!handler) {
    // Unknown event — acknowledge receipt (Razorpay retries on non-2xx)
    console.log(`[razorpay-webhook] Unhandled event type: ${eventType}`);
    return new Response('OK', { status: 200 });
  }

  // 4. Extract identifiers from payload
  // Razorpay sends entity data under event.payload.<entity>.entity
  const payment = event.payload?.payment?.entity;
  const order   = event.payload?.order?.entity;
  const refund  = event.payload?.refund?.entity;

  const razorpayOrderId   = payment?.order_id ?? order?.id;
  const razorpayPaymentId = payment?.id ?? refund?.payment_id;

  if (!razorpayOrderId) {
    console.warn(`[razorpay-webhook] Could not extract order_id from event: ${eventType}`);
    return new Response('Missing order reference', { status: 400 });
  }

  // 5. Update order in Supabase using service role (bypasses RLS — correct for webhook)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const updates: Record<string, string> = {
    payment_status: handler.paymentStatus,
    updated_at:     new Date().toISOString(),
  };

  if (handler.orderStatus)  updates.status              = handler.orderStatus;
  if (razorpayPaymentId)    updates.razorpay_payment_id = razorpayPaymentId;

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('razorpay_order_id', razorpayOrderId);

  if (error) {
    console.error(`[razorpay-webhook] DB update failed for ${razorpayOrderId}:`, error.message);
    // Return 500 so Razorpay retries the webhook
    return new Response('DB update failed', { status: 500 });
  }

  console.log(`[razorpay-webhook] ✓ Order ${razorpayOrderId} updated → status: ${handler.orderStatus ?? 'unchanged'}, payment: ${handler.paymentStatus}`);
  return new Response('OK', { status: 200 });
});

// ── Webhook Signature Verification ──────────────────────────
// Razorpay signs the raw body with HMAC-SHA256 using the webhook secret
async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const enc  = new TextEncoder();
    const key  = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig     = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
    const hexSig  = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hexSig === signature;
  } catch {
    return false;
  }
}
