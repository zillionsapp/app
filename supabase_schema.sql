-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255) UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Create index on created_by for user's invite codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);

-- Create index on used_by for tracking usage
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON invite_codes(used_by);

-- Row Level Security (RLS) policies
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invite codes they created
CREATE POLICY "Users can view their own invite codes" ON invite_codes
    FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can create invite codes
CREATE POLICY "Users can create invite codes" ON invite_codes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own invite codes (e.g., deactivate)
CREATE POLICY "Users can update their own invite codes" ON invite_codes
    FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Allow anyone to check if a code exists and is active (for registration)
CREATE POLICY "Anyone can check invite code validity" ON invite_codes
    FOR SELECT USING (is_active = true);

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN := TRUE;
BEGIN
    WHILE code_exists LOOP
        -- Generate a random 8-character alphanumeric code
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = new_code) INTO code_exists;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can register (has valid invite or is first user)
CREATE OR REPLACE FUNCTION can_user_register(invite_code_param TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    user_count INTEGER;
    code_valid BOOLEAN := FALSE;
BEGIN
    -- Check total user count
    SELECT COUNT(*) INTO user_count FROM auth.users;

    -- If no users exist, allow registration (first user)
    IF user_count = 0 THEN
        RETURN TRUE;
    END IF;

    -- If invite code provided, check if it's valid and unused
    IF invite_code_param IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM invite_codes
            WHERE code = invite_code_param
            AND is_active = true
            AND used_by IS NULL
        ) INTO code_valid;
    END IF;

    RETURN code_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use an invite code
CREATE OR REPLACE FUNCTION use_invite_code(invite_code_param TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    code_exists BOOLEAN := FALSE;
BEGIN
    -- Check if code exists and is available
    SELECT EXISTS(
        SELECT 1 FROM invite_codes
        WHERE code = invite_code_param
        AND is_active = true
        AND used_by IS NULL
    ) INTO code_exists;

    IF code_exists THEN
        -- Mark code as used
        UPDATE invite_codes
        SET used_by = user_id, used_at = NOW()
        WHERE code = invite_code_param;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
