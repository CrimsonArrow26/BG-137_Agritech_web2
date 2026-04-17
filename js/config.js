// ============================================================
// config.js — Farmer Marketplace
// Centralized configuration - Replace with your actual credentials
// IMPORTANT: For production, load these from environment variables
// ============================================================

// Supabase Configuration
// Get these from: https://app.supabase.com/project/_/settings/api
const CONFIG = {
    SUPABASE_URL: 'https://zgpbezargiwzgxcdbnmq.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncGJlemFyZ2l3emd4Y2Ribm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTc0NzUsImV4cCI6MjA5MTk3MzQ3NX0.mKQfp1vFD2S_RhnCneKmLO0XcVKKMb0R_VT4p7U50HY',
    
    // EmailJS Configuration
    // Get these from: https://dashboard.emailjs.com/admin
    EMAILJS_PUBLIC_KEY: 'RjiiQTUOszK2DIkAi',
    EMAILJS_SERVICE_ID: 'service_s8z32yn',
    EMAILJS_TEMPLATE_ID: 'template_ncd1wpf',
    EMAILJS_CONFIRMATION_TEMPLATE_ID: 'template_p4aeu2g',
    EMAILJS_TO_EMAIL: 'support@farmconnect.com'
};

// Make available globally
window.CONFIG = CONFIG;
