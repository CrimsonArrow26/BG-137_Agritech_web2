-- ============================================================
-- Razorpay Payment Integration — DB Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add Razorpay columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id    TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id  TEXT,
  ADD COLUMN IF NOT EXISTS payment_status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refund_initiated', 'refunded', 'refund_failed'));

-- 2. Index for fast webhook lookups by razorpay_order_id
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- 3. Index for lookups by razorpay_payment_id
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id
  ON public.orders (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
