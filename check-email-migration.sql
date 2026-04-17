-- ============================================================
-- check-email-migration.sql — Farmer Marketplace
-- Adds a safe RPC to check if an email is already registered
-- and which provider (google / email / etc.) they used.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- Security note: SECURITY DEFINER lets this run with elevated
-- privileges to read auth.users, but it only exposes a boolean
-- (exists) and the provider string — never the user's ID or PII.
CREATE OR REPLACE FUNCTION public.check_email_provider(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_provider TEXT;
BEGIN
  SELECT COALESCE(raw_app_meta_data->>'provider', 'email')
  INTO   v_provider
  FROM   auth.users
  WHERE  email = lower(trim(p_email))
  LIMIT  1;

  IF FOUND THEN
    RETURN jsonb_build_object('exists', TRUE, 'provider', v_provider);
  END IF;

  RETURN jsonb_build_object('exists', FALSE, 'provider', NULL);
END;
$$;

-- Allow any authenticated OR anonymous caller to invoke this RPC
-- (needed so signup page can check before the user logs in)
GRANT EXECUTE ON FUNCTION public.check_email_provider(TEXT) TO anon, authenticated;
