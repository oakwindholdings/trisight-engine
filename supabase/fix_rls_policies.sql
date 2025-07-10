-- Fix RLS policies for TriSight to allow frontend inserts
-- This script updates the Row Level Security policies to allow the frontend (using anon key) to insert data

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert OHLCV data" ON ohlcv_data;
DROP POLICY IF EXISTS "Authenticated users can update cache status" ON api_cache_status;

-- Create new policies that allow anon users (frontend) to insert/update data
-- OHLCV data table
CREATE POLICY "Allow anon to insert OHLCV data" ON ohlcv_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to update OHLCV data" ON ohlcv_data
    FOR UPDATE USING (true) WITH CHECK (true);

-- API cache status table  
CREATE POLICY "Allow anon to insert cache status" ON api_cache_status
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to update cache status" ON api_cache_status
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to select cache status" ON api_cache_status
    FOR SELECT USING (true);

-- Pattern cache table (for future use)
CREATE POLICY "Allow anon to insert patterns" ON pattern_cache
    FOR INSERT WITH CHECK (true);

-- Trade signals table (for future use)
CREATE POLICY "Allow anon to insert signals" ON trade_signals
    FOR INSERT WITH CHECK (true);

-- Symbol metadata table
CREATE POLICY "Allow anon to insert symbols" ON symbol_metadata
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to update symbols" ON symbol_metadata
    FOR UPDATE USING (true) WITH CHECK (true);

-- Note: These policies are permissive for development. 
-- In production, you should:
-- 1. Use authenticated users instead of anon
-- 2. Add user-specific restrictions
-- 3. Implement proper access control
