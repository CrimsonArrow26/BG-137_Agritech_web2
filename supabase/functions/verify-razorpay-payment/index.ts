// ============================================================
// verify-razorpay-payment/index.ts — Farmer Marketplace
// Supabase Edge Function: Verifies Razorpay payment signature
// Deploy: supabase functions deploy verify-razorpay-payment
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonError('Missing payment fields', 400);
    }

    // 3. Verify HMAC-SHA256 signature
    // Razorpay signs: "{order_id}|{payment_id}" using key_secret
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const payload             = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature   = await hmacSha256Hex(payload, RAZORPAY_KEY_SECRET);

    if (expectedSignature !== razorpay_signature) {
      console.warn('[verify-razorpay-payment] Signature mismatch for order:', razorpay_order_id);
      return jsonError('Invalid payment signature', 400);
    }

    return jsonOk({ verified: true });

  } catch (err) {
    console.error('[verify-razorpay-payment] Error:', err.message);
    return jsonError('Internal server error', 500);
  }
});

// ── HMAC-SHA256 using Web Crypto API (built into Deno) ───────
async function hmacSha256Hex(data: string, secret: string): Promise<string> {
  const enc        = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Helpers ──────────────────────────────────────────────────
function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message, verified: false }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
