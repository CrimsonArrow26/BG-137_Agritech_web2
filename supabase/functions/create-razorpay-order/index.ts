// ============================================================
// create-razorpay-order/index.ts — Farmer Marketplace
// Supabase Edge Function: Creates a Razorpay order server-side
// Deploy: supabase functions deploy create-razorpay-order
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // 1. Verify caller is an authenticated Supabase user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonError('Missing authorization header', 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonError('Unauthorized', 401);
    }

    // 2. Parse request body
    const { amount } = await req.json(); // amount in INR (float)

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return jsonError('Invalid amount', 400);
    }

    // 3. Create Razorpay order via Razorpay Orders API
    const RAZORPAY_KEY_ID     = Deno.env.get('RAZORPAY_KEY_ID')!;
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        amount:   Math.round(amount * 100), // convert INR → paise
        currency: 'INR',
        receipt:  `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          source:  'farmer_marketplace',
        },
      }),
    });

    if (!rzpResponse.ok) {
      const err = await rzpResponse.json();
      const msg = err?.error?.description || 'Failed to create payment order';
      return jsonError(msg, 502);
    }

    const rzpOrder = await rzpResponse.json();

    // 4. Return order details to frontend (key_id is public, never key_secret)
    return jsonOk({
      order_id: rzpOrder.id,
      amount:   rzpOrder.amount,   // in paise
      currency: rzpOrder.currency,
      key_id:   RAZORPAY_KEY_ID,   // needed by Razorpay Checkout SDK on frontend
    });

  } catch (err) {
    console.error('[create-razorpay-order] Error:', err.message);
    return jsonError('Internal server error', 500);
  }
});

// ── Helpers ──────────────────────────────────────────────────
function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
