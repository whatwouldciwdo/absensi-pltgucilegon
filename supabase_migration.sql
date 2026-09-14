-- ================================================
-- Supabase SQL Migration: Absensi Digital
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    location TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create attendances table
CREATE TABLE IF NOT EXISTS attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    signature_url TEXT,
    attended_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure address column exists if table was already created
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS address TEXT;

-- Ensure slug and qr_code_url exist on events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- 3. Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- 4. Policies for public access (unauthenticated users)
-- Public can view active events
CREATE POLICY "Public can read active events"
ON events FOR SELECT
TO anon
USING (is_active = true);

-- Public can insert attendance records
CREATE POLICY "Public can insert attendance"
ON attendances FOR INSERT
TO anon
WITH CHECK (true);

-- 5. Policies for authenticated admin access
-- Admin full CRUD on events
CREATE POLICY "Admin full access events"
ON events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Admin full CRUD on attendances
CREATE POLICY "Admin full access attendance"
ON attendances FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Create storage bucket for signatures
-- NOTE: Run this separately or create via Supabase Dashboard
-- Go to Storage > Create Bucket > Name: "signatures" > Public: Yes

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendances_event_id ON attendances(event_id);
CREATE INDEX IF NOT EXISTS idx_attendances_attended_at ON attendances(attended_at);

-- 8. Initial Sample Event
INSERT INTO events (title, date, time_start, time_end, location, description, is_active)
VALUES (
    'Rapat Koordinasi K3 & Lingkungan UBP Cilegon',
    CURRENT_DATE,
    '09:00:00',
    '12:00:00',
    'Ruang Rapat Integritas Lantai 2',
    'Evaluasi penerapan K3, Sistem Manajemen Mutu & Lingkungan',
    true
);

-- ================================================
-- IMPORTANT: After running this SQL, also do:
-- 1. Go to Storage > Create new bucket "signatures" (set as Public)
-- 2. Create an admin user in Authentication > Users
-- ================================================
