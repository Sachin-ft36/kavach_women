-- 🛰️ KAVACH DYNAMIC GEOSPATIAL SEARCH RPC (Adapted for your existing schema)
-- paste this query directly in your Supabase SQL Editor on top of your existing tables!

-- 1. HIGH-PERFORMANCE GEOSPATIAL SPATIAL INDEXING (GiST)
-- This creates fast index points on your existing last_location & location geography columns
CREATE INDEX IF NOT EXISTS profiles_last_location_gist_idx ON profiles USING gist(last_location);
CREATE INDEX IF NOT EXISTS alerts_location_gist_idx ON alerts USING gist(location);

-- 2. SPATIAL SEARCH RPC FUNCTION: 5KM PROGRESSIVE RADIUS DISCOVERY
-- Uses your exact `profiles` table attributes (id TEXT, last_location GEOGRAPHY, role, is_verified)
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
    longitude DOUBLE PRECISION
) AS $$
DECLARE
    victim_geog GEOGRAPHY;
    found_count INTEGER;
BEGIN
    -- Create geography point representing the victim
    victim_geog := ST_MakePoint(victim_lng, victim_lat)::geography;

    -- Stage 1 Check: Sweep 5km (5000 meters) using existing profiles
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.email,
        p.xp,
        ST_Distance(p.last_location, victim_geog) AS distance_meters,
        ST_Y(p.last_location::geometry) AS latitude,
        ST_X(p.last_location::geometry) AS longitude
    FROM profiles p
    WHERE p.role = 'protector'
      AND p.is_verified = TRUE
      AND p.last_location IS NOT NULL
      -- Checks if within 5km using GiST spatial index on last_location
      AND ST_DWithin(p.last_location, victim_geog, max_radius_meters)
    ORDER BY distance_meters ASC;

    -- Check if we found any protectors in 5km sweep
    GET DIAGNOSTICS found_count = ROW_COUNT;

    -- Stage 2 Check: Sweep 10km (10000 meters) if 5km is empty
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
            ST_X(p.last_location::geometry) AS longitude
        FROM profiles p
        WHERE p.role = 'protector'
          AND p.is_verified = TRUE
          AND p.last_location IS NOT NULL
          AND ST_DWithin(p.last_location, victim_geog, 10000)
        ORDER BY distance_meters ASC;
        
        GET DIAGNOSTICS found_count = ROW_COUNT;
    END IF;

    -- Critical Stage 3 Fallback: If still empty, return the single absolute nearest protector globally
    IF found_count = 0 THEN
        RAISE NOTICE '🛰️ KAVACH DB: Critical! No responders in 10km. Pulling absolute closest active protector...';
        RETURN QUERY
        SELECT 
            p.id,
            p.display_name,
            p.email,
            p.xp,
            ST_Distance(p.last_location, victim_geog) AS distance_meters,
            ST_Y(p.last_location::geometry) AS latitude,
            ST_X(p.last_location::geometry) AS longitude
        FROM profiles p
        WHERE p.role = 'protector'
          AND p.is_verified = TRUE
          AND p.last_location IS NOT NULL
        ORDER BY distance_meters ASC
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. HELPER FUNCTION TO SILENTLY UPDATE PROTECTOR COORDINATES
-- Updates your existing TEXT id and last_location geography columns
CREATE OR REPLACE FUNCTION update_protector_coords(
    p_id TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET last_location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
