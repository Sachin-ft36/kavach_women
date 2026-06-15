-- ============================================================
-- 🛡️ KAVACH SUPABASE COMPLETE MIGRATION SCRIPT
-- Paste this in Supabase SQL Editor and click Run
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. CORE TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    victim_uid TEXT,
    victim_name TEXT,
    status TEXT DEFAULT 'active',
    location GEOGRAPHY(Point, 4326),
    responder_lat DOUBLE PRECISION,
    responder_lng DOUBLE PRECISION,
    last_pulse TIMESTAMPTZ,
    metadata JSONB,
    alert_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_archive (
    id TEXT PRIMARY KEY,
    victim_uid TEXT,
    victim_name TEXT,
    status TEXT,
    location GEOGRAPHY(Point, 4326),
    metadata JSONB,
    alert_timestamp TIMESTAMPTZ,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    alert_id TEXT,
    evidence_type TEXT,
    url TEXT,
    hash TEXT,
    digital_signature TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE — ADD MISSING COLUMNS
-- ─────────────────────────────────────────────────────────────

-- Geospatial primary location (PostGIS Geography Point)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Telemetry columns (written by syncTelemetry in the app)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS gps_accuracy INTEGER DEFAULT 0;

-- Alerts table — responder telemetry columns
ALTER TABLE public.alerts
    ADD COLUMN IF NOT EXISTS responder_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS responder_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS last_pulse TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 2. HIGH-PERFORMANCE GiST SPATIAL INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS profiles_last_location_gist_idx ON public.profiles USING gist(last_location);
CREATE INDEX IF NOT EXISTS alerts_location_gist_idx ON public.alerts USING gist(location);
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles(last_seen);
CREATE INDEX IF NOT EXISTS profiles_role_verified_idx ON public.profiles(role, is_verified);
CREATE INDEX IF NOT EXISTS alerts_status_idx ON public.alerts(status);

-- ─────────────────────────────────────────────────────────────
-- 3. RPC: HELPER — UPDATE PROTECTOR COORDINATES
-- Called by syncTelemetry in locationService.ts
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_protector_coords(
    p_id TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_battery INTEGER DEFAULT 100,
    p_accuracy INTEGER DEFAULT 0,
    p_online BOOLEAN DEFAULT true
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET
        last_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        last_seen = NOW(),
        battery_level = p_battery,
        is_online = p_online,
        gps_accuracy = p_accuracy
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 4. RPC: FIND NEAREST PROTECTORS (Progressive 5km → 10km → Global)
-- Called by ProtectorDashboard / SOS dispatch engine
-- ─────────────────────────────────────────────────────────────

-- Drop old version first (return type changed)
DROP FUNCTION IF EXISTS find_nearest_protectors(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION find_nearest_protectors(
    victim_lat DOUBLE PRECISION,
    victim_lng DOUBLE PRECISION,
    max_radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS TABLE (
    id TEXT,
    display_name TEXT,
    email TEXT,
    xp INTEGER,
    distance_meters DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    battery_level INTEGER,
    is_online BOOLEAN,
    last_seen TIMESTAMPTZ
) AS $$
DECLARE
    victim_geog GEOGRAPHY;
    found_count INTEGER := 0;
BEGIN
    victim_geog := ST_MakePoint(victim_lng, victim_lat)::geography;

    -- Stage 1: Search within requested radius (default 5km)
    RETURN QUERY
    SELECT
        p.id,
        p.display_name,
        p.email,
        p.xp,
        ST_Distance(p.last_location, victim_geog) AS distance_meters,
        ST_Y(p.last_location::geometry) AS latitude,
        ST_X(p.last_location::geometry) AS longitude,
        p.battery_level,
        p.is_online,
        p.last_seen
    FROM public.profiles p
    WHERE
        p.role IN ('protector', 'pcr_officer')
        AND p.is_verified = TRUE
        AND p.last_location IS NOT NULL
        AND p.last_seen > NOW() - INTERVAL '15 minutes'
        AND ST_DWithin(p.last_location, victim_geog, max_radius_meters)
    ORDER BY distance_meters ASC
    LIMIT 20;

    GET DIAGNOSTICS found_count = ROW_COUNT;

    -- Stage 2: Expand to 10km if empty
    IF found_count = 0 THEN
        RAISE NOTICE '🛰️ KAVACH DB: No responders in 5km. Expanding to 10km grid sweep...';
        RETURN QUERY
        SELECT
            p.id,
            p.display_name,
            p.email,
            p.xp,
            ST_Distance(p.last_location, victim_geog) AS distance_meters,
            ST_Y(p.last_location::geometry) AS latitude,
            ST_X(p.last_location::geometry) AS longitude,
            p.battery_level,
            p.is_online,
            p.last_seen
        FROM public.profiles p
        WHERE
            p.role IN ('protector', 'pcr_officer')
            AND p.is_verified = TRUE
            AND p.last_location IS NOT NULL
            AND ST_DWithin(p.last_location, victim_geog, 10000)
        ORDER BY distance_meters ASC
        LIMIT 20;

        GET DIAGNOSTICS found_count = ROW_COUNT;
    END IF;

    -- Stage 3: Critical fallback — return absolute nearest globally
    IF found_count = 0 THEN
        RAISE NOTICE '🛰️ KAVACH DB: Critical! No responders in 10km. Pulling absolute closest protector globally...';
        RETURN QUERY
        SELECT
            p.id,
            p.display_name,
            p.email,
            p.xp,
            ST_Distance(p.last_location, victim_geog) AS distance_meters,
            ST_Y(p.last_location::geometry) AS latitude,
            ST_X(p.last_location::geometry) AS longitude,
            p.battery_level,
            p.is_online,
            p.last_seen
        FROM public.profiles p
        WHERE
            p.role IN ('protector', 'pcr_officer')
            AND p.is_verified = TRUE
            AND p.last_location IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 5. RPC: FIND ACTIVE ALERTS NEAR A POINT
-- For ProtectorDashboard — shows SOS alerts on the map
-- ─────────────────────────────────────────────────────────────

-- Drop old version first (return type changed)
DROP FUNCTION IF EXISTS find_active_alerts_near(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION find_active_alerts_near(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 10000
)
RETURNS TABLE (
    id TEXT,
    victim_uid TEXT,
    victim_name TEXT,
    status TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    alert_timestamp TIMESTAMPTZ,
    metadata JSONB
) AS $$
DECLARE
    center_geog GEOGRAPHY;
BEGIN
    center_geog := ST_MakePoint(center_lng, center_lat)::geography;

    RETURN QUERY
    SELECT
        a.id,
        a.victim_uid,
        a.victim_name,
        a.status,
        ST_Y(a.location::geometry) AS latitude,
        ST_X(a.location::geometry) AS longitude,
        ST_Distance(a.location, center_geog) AS distance_meters,
        a.alert_timestamp,
        a.metadata
    FROM public.alerts a
    WHERE
        a.status IN ('active', 'responding')
        AND a.location IS NOT NULL
        AND ST_DWithin(a.location, center_geog, radius_meters)
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS) — Keep data secure
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Protectors can read all active alerts
DROP POLICY IF EXISTS "protectors_read_alerts" ON public.alerts;
CREATE POLICY "protectors_read_alerts"
ON public.alerts FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only victim can insert their own alert
DROP POLICY IF EXISTS "victims_insert_alert" ON public.alerts;
CREATE POLICY "victims_insert_alert"
ON public.alerts FOR INSERT
WITH CHECK (auth.uid()::text = victim_uid);

-- ─────────────────────────────────────────────────────────────
-- 7. RELOAD SCHEMA CACHE
-- ─────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
