const fs = require('fs');
const path = require('path');

const targetDir = 'D:/SUITE BOLICHES-NEXORAPAY';

console.log('Creando estructura ultra-ligera en:', targetDir);

// Crear directorios
const dirs = [
  targetDir,
  path.join(targetDir, 'wallet'),
  path.join(targetDir, 'pos'),
  path.join(targetDir, 'dashboard'),
  path.join(targetDir, 'stock_nora'),
  path.join(targetDir, 'db'),
  path.join(targetDir, 'assets'),
  path.join(targetDir, 'assets/sounds'),
  path.join(targetDir, 'assets/icons')
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log('Directorio creado:', d);
  }
});

// =========================================================================
// 1. ESQUEMA SQL PARA SUPABASE / POSTGRESQL (db/schema.sql)
// =========================================================================
const sqlSchema = `-- ========================================================================
-- 👑 NEXORA CLUB & CARRIBAR - CLOSED LOOP FINTECH ENGINE
-- ========================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE BILLETERAS DE CLIENTES (WALLETS)
CREATE TABLE IF NOT EXISTS club_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_personal TEXT UNIQUE NOT NULL, -- Ej: 'NEX-CLUB-7821'
    nombre_cliente TEXT NOT NULL,
    telefono_whatsapp TEXT NOT NULL,
    dni_opcional TEXT,
    saldo DECIMAL(12, 2) DEFAULT 0.00 CHECK (saldo >= 0),
    puntos_recompensa INT DEFAULT 0,
    estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'bloqueado', 'vip')),
    creado_el TIMESTAMP WITH TIME ZONE DEFAULT now(),
    actualizado_el TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. TABLA DE PUNTOS DE VENTA (BARRAS Y CARRIBAR)
CREATE TABLE IF NOT EXISTS club_puntos_venta (
    id TEXT PRIMARY KEY, -- 'barra_principal', 'barra_vip', 'carribar_exterior', 'caja_recargas'
    nombre TEXT NOT NULL,
    sector TEXT CHECK (sector IN ('boliche', 'carribar', 'acceso')),
    responsable_caja TEXT,
    activo BOOLEAN DEFAULT true
);

INSERT INTO club_puntos_venta (id, nombre, sector) VALUES
('caja_recargas_1', 'Caja Recargas Entrada', 'acceso'),
('barra_principal', 'Barra Central Boliche', 'boliche'),
('barra_vip', 'Barra Sector VIP', 'boliche'),
('carribar_exterior', 'Carribar Exterior (Hamburguesas & Minutas)', 'carribar')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA DE PRODUCTOS & MENÚ RÁPIDO
CREATE TABLE IF NOT EXISTS club_productos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT CHECK (categoria IN ('tragos', 'cervezas', 'comidas', 'sin_alcohol', 'combos')),
    precio DECIMAL(10, 2) NOT NULL,
    sector_venta TEXT DEFAULT 'ambos' CHECK (sector_venta IN ('boliche', 'carribar', 'ambos')),
    icono TEXT DEFAULT '🍹',
    stock_actual INT DEFAULT 100,
    alerta_stock_min INT DEFAULT 15,
    activo BOOLEAN DEFAULT true
);

-- Inserción inicial de productos
INSERT INTO club_productos (id, nombre, categoria, precio, sector_venta, icono, stock_actual) VALUES
('fernet_branca', 'Fernet Branca con Coca', 'tragos', 4500.00, 'boliche', '🥃', 200),
('gin_tonic', 'Gin Tonic con Pepino/Frutos', 'tragos', 5000.00, 'boliche', '🍸', 150),
('cerveza_lata', 'Cerveza Lata 473cc', 'cervezas', 2800.00, 'ambos', '🍺', 350),
('cerveza_tirada', 'Pinta Cerveza Tirada', 'cervezas', 3200.00, 'ambos', '🍻', 120),
('vodka_speed', 'Vodka con Speed', 'tragos', 4200.00, 'boliche', '🍹', 180),
('gaseosa_agua', 'Gaseosa 500cc / Agua', 'sin_alcohol', 1800.00, 'ambos', '🥤', 250),
('burger_completa', 'Hamburguesa Completa con Fritas', 'comidas', 5500.00, 'carribar', '🍔', 100),
('lomito_especial', 'Lomito Especial Completo', 'comidas', 6800.00, 'carribar', '🥪', 80),
('cono_papas', 'Cono de Papas Fritas con Cheddar', 'comidas', 3000.00, 'carribar', '🍟', 150),
('combo_after', 'Combo After: Burger + Cerveza', 'combos', 7500.00, 'carribar', '👑', 60)
ON CONFLICT (id) DO NOTHING;

-- 4. TABLA DE TRANSACCIONES & CONSUMOS
CREATE TABLE IF NOT EXISTS club_transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id_personal TEXT REFERENCES club_wallets(id_personal) ON DELETE CASCADE,
    punto_venta_id TEXT REFERENCES club_puntos_venta(id),
    tipo TEXT CHECK (tipo IN ('carga_saldo', 'consumo_barra', 'consumo_carribar', 'premio_dj', 'reembolso')),
    monto DECIMAL(12, 2) NOT NULL,
    saldo_anterior DECIMAL(12, 2) NOT NULL,
    saldo_posterior DECIMAL(12, 2) NOT NULL,
    detalle_items JSONB, -- Lista de items comprados
    operador_cajero TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. TABLA DE PREMIOS EN VIVO / GAMIFICACIÓN (DJ & PANTALLA)
CREATE TABLE IF NOT EXISTS club_premios_vivo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id_personal TEXT REFERENCES club_wallets(id_personal),
    titulo_premio TEXT NOT NULL,
    monto_credito DECIMAL(10, 2) NOT NULL,
    motivo TEXT, -- Ej: 'Meta de Baile', 'Sorteo DJ 03:30', 'Consumidor VIP'
    otorgado_por TEXT DEFAULT 'DJ / Master Control',
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. RPC ATÓMICO: PROCESAR CONSUMO EN BARRA O CARRIBAR
CREATE OR REPLACE FUNCTION club_procesar_consumo(
    p_id_personal TEXT,
    p_monto DECIMAL,
    p_punto_venta TEXT,
    p_detalle_items JSONB,
    p_cajero TEXT
)
RETURNS JSON AS $$
DECLARE
    v_wallet RECORD;
    v_nuevo_saldo DECIMAL;
BEGIN
    -- 1. Bloquear y obtener Wallet
    SELECT * INTO v_wallet FROM club_wallets WHERE id_personal = p_id_personal FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Wallet no encontrada');
    END IF;

    IF v_wallet.estado != 'activo' AND v_wallet.estado != 'vip' THEN
        RETURN json_build_object('success', false, 'error', 'La Wallet se encuentra bloqueada');
    END IF;

    IF v_wallet.saldo < p_monto THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Saldo insuficiente. Saldo actual: $' || v_wallet.saldo,
            'saldo_actual', v_wallet.saldo
        );
    END IF;

    -- 2. Calcular nuevo saldo
    v_nuevo_saldo := v_wallet.saldo - p_monto;

    -- 3. Actualizar Saldo
    UPDATE club_wallets 
    SET saldo = v_nuevo_saldo, actualizado_el = now()
    WHERE id_personal = p_id_personal;

    -- 4. Registrar Transacción
    INSERT INTO club_transacciones (
        wallet_id_personal, punto_venta_id, tipo, 
        monto, saldo_anterior, saldo_posterior, detalle_items, operador_cajero
    ) VALUES (
        p_id_personal, p_punto_venta, 
        CASE WHEN p_punto_venta = 'carribar_exterior' THEN 'consumo_carribar' ELSE 'consumo_barra' END,
        p_monto, v_wallet.saldo, v_nuevo_saldo, p_detalle_items, p_cajero
    );

    RETURN json_build_object(
        'success', true,
        'id_personal', p_id_personal,
        'nombre_cliente', v_wallet.nombre_cliente,
        'monto_debitado', p_monto,
        'nuevo_saldo', v_nuevo_saldo,
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql;

-- 7. RPC ATÓMICO: CARGAR SALDO EN CAJA O PREMIAR DESDE EL DASHBOARD
CREATE OR REPLACE FUNCTION club_cargar_saldo(
    p_id_personal TEXT,
    p_monto DECIMAL,
    p_tipo TEXT, -- 'carga_saldo' o 'premio_dj'
    p_cajero_o_dj TEXT,
    p_motivo TEXT DEFAULT 'Carga en efectivo / Transferencia'
)
RETURNS JSON AS $$
DECLARE
    v_wallet RECORD;
    v_nuevo_saldo DECIMAL;
BEGIN
    SELECT * INTO v_wallet FROM club_wallets WHERE id_personal = p_id_personal FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Wallet no encontrada');
    END IF;

    v_nuevo_saldo := v_wallet.saldo + p_monto;

    UPDATE club_wallets 
    SET saldo = v_nuevo_saldo, actualizado_el = now()
    WHERE id_personal = p_id_personal;

    INSERT INTO club_transacciones (
        wallet_id_personal, punto_venta_id, tipo, 
        monto, saldo_anterior, saldo_posterior, operador_cajero, detalle_items
    ) VALUES (
        p_id_personal, 'caja_recargas_1', p_tipo,
        p_monto, v_wallet.saldo, v_nuevo_saldo, p_cajero_o_dj, 
        json_build_object('motivo', p_motivo)
    );

    IF p_tipo = 'premio_dj' THEN
        INSERT INTO club_premios_vivo (wallet_id_personal, titulo_premio, monto_credito, motivo, otorgado_por)
        VALUES (p_id_personal, 'Premio en Vivo', p_monto, p_motivo, p_cajero_o_dj);
    END IF;

    RETURN json_build_object(
        'success', true,
        'id_personal', p_id_personal,
        'nombre_cliente', v_wallet.nombre_cliente,
        'monto_cargado', p_monto,
        'nuevo_saldo', v_nuevo_saldo
    );
END;
$$ LANGUAGE plpgsql;
`;

fs.writeFileSync(path.join(targetDir, 'db', 'schema.sql'), sqlSchema, 'utf-8');
console.log('Esquema SQL creado en db/schema.sql');
