-- ====================================================================
-- NEXAPAY LOYALTY ENGINE: SISTEMA DE PUNTOS Y CANJE QR LOCAL
-- Nexativa News • Adaptado a la Ley de Lealtad Comercial en Argentina
-- ====================================================================

-- 1. TABLA DE BILLETERAS DE PUNTOS (NexaPay Wallets)
CREATE TABLE IF NOT EXISTS nexapay_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_session TEXT UNIQUE NOT NULL, -- ID de sesión anónima o teléfono del usuario
    balance_points INT DEFAULT 0 CHECK (balance_points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA DE VOUCHERS / TICKETS QR DE CANJE EN COMERCIOS
CREATE TABLE IF NOT EXISTS nexapay_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES nexapay_wallets(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL, -- ID del comercio auspiciante (directory_businesses)
    merchant_name TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL, -- Ej: NX-QR-88219
    points_value INT NOT NULL CHECK (points_value > 0),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REDEEMED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '48 hours')
);

-- 3. TABLA DE HISTORIAL DE CANJES VALIDADOS (Auditoría)
CREATE TABLE IF NOT EXISTS nexapay_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID REFERENCES nexapay_vouchers(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL,
    points_redeemed INT NOT NULL,
    validated_by TEXT DEFAULT 'COMERCIANTE',
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. FUNCIÓN RPC: Acreditar Puntos por Jugar (Minijuego / PRODE)
CREATE OR REPLACE FUNCTION nexapay_award_points(
    p_user_session TEXT,
    p_points INT
)
RETURNS JSON AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance INT;
BEGIN
    INSERT INTO nexapay_wallets (user_session, balance_points)
    VALUES (p_user_session, p_points)
    ON CONFLICT (user_session) 
    DO UPDATE SET 
        balance_points = nexapay_wallets.balance_points + EXCLUDED.balance_points,
        updated_at = timezone('utc'::text, now())
    RETURNING id, balance_points INTO v_wallet_id, v_new_balance;

    RETURN json_build_object(
        'status', 'success',
        'wallet_id', v_wallet_id,
        'points_awarded', p_points,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNCIÓN RPC: Generar Voucher QR para Canjear en Local
CREATE OR REPLACE FUNCTION nexapay_generate_qr_voucher(
    p_user_session TEXT,
    p_merchant_id TEXT,
    p_merchant_name TEXT,
    p_points_value INT
)
RETURNS JSON AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance INT;
    v_qr_code TEXT;
    v_voucher_id UUID;
BEGIN
    -- 1. Obtener balance de la Wallet
    SELECT id, balance_points INTO v_wallet_id, v_current_balance
    FROM nexapay_wallets
    WHERE user_session = p_user_session;

    IF NOT FOUND OR v_current_balance < p_points_value THEN
        RETURN json_build_object('status', 'error', 'message', 'Puntos insuficientes para generar el Voucher.');
    END IF;

    -- 2. Descontar puntos de la billetera
    UPDATE nexapay_wallets
    SET balance_points = balance_points - p_points_value,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_wallet_id;

    -- 3. Generar código QR único
    v_qr_code := 'NX-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6));

    -- 4. Insertar Voucher
    INSERT INTO nexapay_vouchers (wallet_id, merchant_id, merchant_name, qr_code, points_value)
    VALUES (v_wallet_id, p_merchant_id, p_merchant_name, v_qr_code, p_points_value)
    RETURNING id INTO v_voucher_id;

    RETURN json_build_object(
        'status', 'success',
        'voucher_id', v_voucher_id,
        'qr_code', v_qr_code,
        'points_redeemed', p_points_value,
        'merchant_name', p_merchant_name,
        'expires_at', (timezone('utc'::text, now()) + interval '48 hours')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN RPC: Validar y Procesar Canje por parte del Comerciante
CREATE OR REPLACE FUNCTION nexapay_validate_qr_redemption(
    p_qr_code TEXT,
    p_merchant_id TEXT
)
RETURNS JSON AS $$
DECLARE
    v_voucher_id UUID;
    v_points INT;
    v_status TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT id, points_value, status, expires_at 
    INTO v_voucher_id, v_points, v_status, v_expires_at
    FROM nexapay_vouchers
    WHERE qr_code = p_qr_code;

    IF NOT FOUND THEN
        RETURN json_build_object('status', 'error', 'message', 'Código QR no válido o inexistente.');
    END IF;

    IF v_status = 'REDEEMED' THEN
        RETURN json_build_object('status', 'error', 'message', 'Este código QR ya fue utilizado anteriormente.');
    END IF;

    IF v_expires_at < timezone('utc'::text, now()) THEN
        UPDATE nexapay_vouchers SET status = 'EXPIRED' WHERE id = v_voucher_id;
        RETURN json_build_object('status', 'error', 'message', 'El código QR ha expirado.');
    END IF;

    -- Marcar como Canjeado
    UPDATE nexapay_vouchers 
    SET status = 'REDEEMED' 
    WHERE id = v_voucher_id;

    -- Registrar Auditoría de Canje
    INSERT INTO nexapay_redemptions (voucher_id, merchant_id, points_redeemed)
    VALUES (v_voucher_id, p_merchant_id, v_points);

    RETURN json_build_object(
        'status', 'success',
        'message', '¡Canje validado exitosamente en mostrador!',
        'points_redeemed', v_points,
        'qr_code', p_qr_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
