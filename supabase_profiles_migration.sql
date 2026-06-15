-- ============================================================
-- 🛡️ KAVACH PROFILES SCHEMA — Safe ALTER TABLE Version
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- 1. PostGIS extension (needed for last_location geography)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create profiles table IF it doesn't exist yet
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    display_name TEXT,
    email TEXT,
    phone_number TEXT,
    photo_url TEXT,
    role TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_registered BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    last_location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add ALL missing columns safely (won't fail if column exists)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS phone_number TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS dob DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('female', 'male', NULL)),
    ADD COLUMN IF NOT EXISTS aadhaar_mask TEXT,
    ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT,
    ADD COLUMN IF NOT EXISTS badge_id TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_no TEXT,
    ADD COLUMN IF NOT EXISTS rank TEXT,
    ADD COLUMN IF NOT EXISTS thana_name TEXT,
    ADD COLUMN IF NOT EXISTS is_on_duty BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_registered BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_location GEOGRAPHY(Point, 4326),
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS battery_level INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS gps_accuracy INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. GiST Spatial Index for fast geospatial queries
CREATE INDEX IF NOT EXISTS profiles_last_location_gist_idx ON public.profiles USING gist(last_location);
CREATE INDEX IF NOT EXISTS profiles_role_verified_idx ON public.profiles(role, is_verified);
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON public.profiles(last_seen);

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();

-- 6. RLS Policies (safe DROP + CREATE pattern)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read protector profiles (for radar/map discovery)
DROP POLICY IF EXISTS "Allow public select for active protectors" ON profiles;
CREATE POLICY "Allow public select for active protectors"
ON profiles FOR SELECT
USING (role = 'protector' OR auth.uid()::text = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
CREATE POLICY "Allow users to insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Admins & super_cell have full access
DROP POLICY IF EXISTS "Allow admin full access" ON profiles;
CREATE POLICY "Allow admin full access"
ON profiles FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()::text
          AND (role = 'admin' OR role = 'super_cell')
    )
);

-- 7. Reload schema cache
NOTIFY pgrst, 'reload schema';
