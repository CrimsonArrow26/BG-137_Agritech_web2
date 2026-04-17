// ============================================================
// supabase.js — Farmer Marketplace
// Supabase backend integration
// ============================================================

// Use CONFIG from config.js (load config.js before this file)
const SUPABASE_URL = window.CONFIG?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.CONFIG?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Create Supabase client instance
// Note: window.supabase is the constructor from the CDN
// We create the client and assign it to window.supabaseClient
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Also make it available as 'supabase' for convenience (but check if not already defined)
if (typeof window.supabase === 'undefined' || window.supabase.createClient) {
  // The CDN loaded supabase as the constructor, so we can safely override with the client
  // after we've used the constructor
  window.supabase = window.supabaseClient;
}
