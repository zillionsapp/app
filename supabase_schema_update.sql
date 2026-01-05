-- ============================================================================
-- COMMISSION SYSTEM UPDATE SCRIPT
-- Run this on existing databases that already have the invite_codes table
-- ============================================================================

-- ============================================================================
-- COMMISSION SYSTEM TABLES AND FUNCTIONS
-- ============================================================================

-- Commission payments table - tracks actual commission payouts
CREATE TABLE IF NOT EXISTS commission_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_invited_profit NUMERIC NOT NULL DEFAULT 0,
    commission_amount NUMERIC NOT NULL DEFAULT 0, -- 10% of invited profit
    commission_rate NUMERIC NOT NULL DEFAULT 0.10, -- 10%
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission snapshots table - tracks commission calculations over time
CREATE TABLE IF NOT EXISTS commission_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    invited_portfolio_value NUMERIC NOT NULL DEFAULT 0,
    invited_daily_pnl NUMERIC NOT NULL DEFAULT 0,
    commission_earned NUMERIC NOT NULL DEFAULT 0, -- 10% of daily pnl
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_commission_payments_inviter ON commission_payments(inviter_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_invited ON commission_payments(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_period ON commission_payments(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commission_snapshots_inviter ON commission_snapshots(inviter_id);
CREATE INDEX IF NOT EXISTS idx_commission_snapshots_date ON commission_snapshots(snapshot_date);

-- Row Level Security for commission tables
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe for updates)
DROP POLICY IF EXISTS "Users can view their commission payments" ON commission_payments;
DROP POLICY IF EXISTS "Users can view their commission snapshots" ON commission_snapshots;

-- Users can view their own commission payments (as inviter)
CREATE POLICY "Users can view their commission payments" ON commission_payments
    FOR SELECT USING (auth.uid() = inviter_id);

-- Users can view their commission snapshots (as inviter)
CREATE POLICY "Users can view their commission snapshots" ON commission_snapshots
    FOR SELECT USING (auth.uid() = inviter_id);

-- Function to calculate daily commissions for all inviters
CREATE OR REPLACE FUNCTION calculate_daily_commissions(target_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    commission_record RECORD;
    daily_pnl NUMERIC;
    commission_amount NUMERIC;
    inserted_count INTEGER := 0;
BEGIN
    -- Loop through all active invite relationships
    FOR commission_record IN
        SELECT
            ic.created_by as inviter_id,
            ic.used_by as invited_user_id,
            u.email as invited_email
        FROM invite_codes ic
        JOIN auth.users u ON u.id = ic.used_by
        WHERE ic.used_by IS NOT NULL
        AND ic.is_active = true
    LOOP
        -- Get the invited user's daily P&L from portfolio_snapshots
        -- This assumes portfolio_snapshots has daily snapshots with pnl data
        SELECT COALESCE(ps.pnl, 0) INTO daily_pnl
        FROM portfolio_snapshots ps
        WHERE DATE(ps.created_at) = target_date
        ORDER BY ps.created_at DESC
        LIMIT 1;

        -- Calculate 10% commission
        commission_amount := daily_pnl * 0.10;

        -- Only record if there's profit to commission
        IF commission_amount > 0 THEN
            INSERT INTO commission_snapshots (
                inviter_id,
                invited_user_id,
                snapshot_date,
                invited_portfolio_value,
                invited_daily_pnl,
                commission_earned
            ) VALUES (
                commission_record.inviter_id,
                commission_record.invited_user_id,
                target_date,
                0, -- We could calculate this from vault_transactions if needed
                daily_pnl,
                commission_amount
            );
            inserted_count := inserted_count + 1;
        END IF;
    END LOOP;

    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total commissions earned by a user
CREATE OR REPLACE FUNCTION get_user_total_commissions(user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_commission NUMERIC;
BEGIN
    SELECT COALESCE(SUM(commission_earned), 0) INTO total_commission
    FROM commission_snapshots
    WHERE inviter_id = user_id;

    RETURN total_commission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get commission summary for a user
CREATE OR REPLACE FUNCTION get_user_commission_summary(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_earned NUMERIC;
    monthly_earned NUMERIC;
    invited_count BIGINT;
    last_date DATE;
    pending_count BIGINT;
BEGIN
    -- Get total earned
    SELECT COALESCE(SUM(commission_earned), 0) INTO total_earned
    FROM commission_snapshots
    WHERE inviter_id = user_id;

    -- Get monthly earned (last 30 days)
    SELECT COALESCE(SUM(commission_earned), 0) INTO monthly_earned
    FROM commission_snapshots
    WHERE inviter_id = user_id
    AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days';

    -- Get invited users count
    SELECT COUNT(DISTINCT invited_user_id) INTO invited_count
    FROM commission_snapshots
    WHERE inviter_id = user_id;

    -- Get last commission date
    SELECT MAX(snapshot_date) INTO last_date
    FROM commission_snapshots
    WHERE inviter_id = user_id;

    -- Get pending payments count
    SELECT COUNT(*) INTO pending_count
    FROM commission_payments
    WHERE inviter_id = user_id AND status = 'PENDING';

    -- Build result JSON
    result := json_build_object(
        'total_earned', total_earned,
        'invited_users_count', invited_count,
        'last_commission_date', last_date,
        'monthly_earned', monthly_earned,
        'pending_payments', pending_count
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get commission history for a user
CREATE OR REPLACE FUNCTION get_user_commission_history(
    user_id UUID,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    snapshot_date DATE,
    invited_user_email TEXT,
    invited_daily_pnl NUMERIC,
    commission_earned NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.snapshot_date,
        u.email::TEXT,
        cs.invited_daily_pnl,
        cs.commission_earned
    FROM commission_snapshots cs
    JOIN auth.users u ON u.id = cs.invited_user_id
    WHERE cs.inviter_id = user_id
    ORDER BY cs.snapshot_date DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
