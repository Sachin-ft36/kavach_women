-- Kavach Telemetry Migration: Add location/telemetry columns to profiles table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add telemetry columns to profiles table (if they don't already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gps_accuracy INTEGER DEFAULT 0;

-- Add responder location columns to alerts table
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS responder_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS responder_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_pulse TIMESTAMPTZ;

-- Create index for fast location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(last_lat, last_lng);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_alerts_last_pulse ON public.alerts(last_pulse);

-- Optional: Create a function to get nearby protectors
CREATE OR REPLACE FUNCTION get_nearby_protectors(center_lat DOUBLE PRECISION, center_lng DOUBLE PRECISION, radius_km DOUBLE PRECISION DEFAULT 5.0)
RETURNS TABLE (
  id TEXT,
  display_name TEXT,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN,
  distance_km DOUBLE PRECISION
)
LANGUAGE SQL
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.last_lat,
    p.last_lng,
    p.last_seen,
    p.is_online,
    (
      6371 * acos(
        cos(radians(center_lat)) * cos(radians(p.last_lat)) *
        cos(radians(p.last_lng) - radians(center_lng)) +
        sin(radians(center_lat)) * sin(radians(p.last_lat))
      )
    ) AS distance_km
  FROM public.profiles p
  WHERE 
    p.role IN ('protector', 'pcr_officer')
    AND p.last_lat IS NOT NULL 
    AND p.last_lng IS NOT NULL
    AND p.is_online = true
    AND p.last_seen > NOW() - INTERVAL '10 minutes'
  HAVING (
      6371 * acos(
        cos(radians(center_lat)) * cos(radians(p.last_lat)) *
        cos(radians(p.last_lng) - radians(center_lng)) +
        sin(radians(center_lat)) * sin(radians(p.last_lat))
      )
    ) <= radius_km
  ORDER BY distance_km ASC
  LIMIT 20;
$$;
