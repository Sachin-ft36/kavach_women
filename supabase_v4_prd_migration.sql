-- ============================================================
-- 🛡️ KAVACH SUPABASE PRD v4.0 DATABASE MIGRATION SCRIPT
-- Paste this in Supabase SQL Editor and click Run
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE STATE VECTOR UPGRADE
-- ─────────────────────────────────────────────────────────────

-- Add dynamic user state vectors
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS state_flags JSONB DEFAULT '{"is_citizen": false, "is_guardian": false, "is_protector": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS os_lifelines JSONB DEFAULT '{"battery_exempt": false, "overlay_granted": false, "mic_loc_active": false}'::jsonb,
    ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'PROVISIONAL';

-- Create index for faster lookup on active role flags
CREATE INDEX IF NOT EXISTS profiles_state_flags_idx ON public.profiles USING gin (state_flags);

-- ─────────────────────────────────────────────────────────────
-- 2. SECURE QR PAIRING ENGINE (Anti-Clock Spoofing pgSQL Function)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validate_qr_pairing(
    p_ward_id TEXT,
    p_generated_at BIGINT,
    p_ttl_seconds INTEGER DEFAULT 300
)
RETURNS BOOLEAN AS $$
DECLARE
    db_now_epoch BIGINT;
BEGIN
    -- Extract current Unix epoch from Postgres DB clock (cannot be spoofed by client)
    db_now_epoch := EXTRACT(EPOCH FROM NOW())::BIGINT;

    -- Validate expiration
    IF db_now_epoch > (p_generated_at + p_ttl_seconds) THEN
        RAISE EXCEPTION 'ERR_QR_EXPIRED';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 3. SCHEMA CACHE RESET
-- ─────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
