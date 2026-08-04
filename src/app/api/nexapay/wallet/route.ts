import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_NEXAPAY_FILE = path.join(process.cwd(), 'data', 'nexapay_local.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLocalNexaPay(): { wallets: Record<string, number>; vouchers: any[] } {
  try {
    ensureDir(FALLBACK_NEXAPAY_FILE);
    if (fs.existsSync(FALLBACK_NEXAPAY_FILE)) {
      const content = fs.readFileSync(FALLBACK_NEXAPAY_FILE, 'utf-8');
      return JSON.parse(content) || { wallets: {}, vouchers: [] };
    }
  } catch (err) {}
  return { wallets: {}, vouchers: [] };
}

function saveLocalNexaPay(data: { wallets: Record<string, number>; vouchers: any[] }) {
  try {
    ensureDir(FALLBACK_NEXAPAY_FILE);
    fs.writeFileSync(FALLBACK_NEXAPAY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get('session') || 'sess_anon_default';

    // 1. Intentar consultar Supabase
    try {
      const { data: walletData } = await supabaseAdmin
        .from('nexapay_wallets')
        .select('*')
        .eq('user_session', session)
        .maybeSingle();

      const { data: vouchersData } = await supabaseAdmin
        .from('nexapay_vouchers')
        .select('*')
        .order('created_at', { ascending: false });

      if (walletData) {
        return NextResponse.json({
          success: true,
          balance: walletData.balance_points || 0,
          vouchers: vouchersData || [],
        });
      }
    } catch (dbErr) {}

    // 2. Fallback local
    const local = readLocalNexaPay();
    const localBalance = local.wallets[session] ?? 500; // Regalo de bienvenida 500 Pts
    return NextResponse.json({
      success: true,
      balance: localBalance,
      vouchers: local.vouchers || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, session = 'sess_anon_default', points = 500, merchantId, merchantName, qrCode } = body;

    const local = readLocalNexaPay();
    if (local.wallets[session] === undefined) {
      local.wallets[session] = 500; // Balance base inicial
    }

    // ACREDITAR PUNTOS POR MINIJUEGO
    if (action === 'award_points') {
      try {
        const { data: rpcRes } = await supabaseAdmin.rpc('nexapay_award_points', {
          p_user_session: session,
          p_points: points,
        });

        if (rpcRes && rpcRes.status === 'success') {
          return NextResponse.json({ success: true, message: `¡Sumaste ${points} Puntos NexaPay!`, balance: rpcRes.new_balance });
        }
      } catch (dbErr) {}

      // Fallback local
      local.wallets[session] = (local.wallets[session] || 0) + points;
      saveLocalNexaPay(local);

      return NextResponse.json({
        success: true,
        message: `🎉 ¡Sumaste ${points} Puntos NexaPay!`,
        balance: local.wallets[session],
      });
    }

    // GENERAR VOUCHER QR DE CANJE
    if (action === 'generate_qr') {
      const currentBalance = local.wallets[session] || 0;
      if (currentBalance < points) {
        return NextResponse.json({ success: false, error: 'Puntos insuficientes para generar el Voucher de canje.' }, { status: 400 });
      }

      const generatedQR = `NX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const newVoucher = {
        id: `vch-${Date.now()}`,
        merchant_id: merchantId || 'comercio-general',
        merchant_name: merchantName || 'Comercio Auspiciante',
        qr_code: generatedQR,
        points_value: points,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };

      try {
        const { data: rpcRes } = await supabaseAdmin.rpc('nexapay_generate_qr_voucher', {
          p_user_session: session,
          p_merchant_id: merchantId || 'comercio-general',
          p_merchant_name: merchantName || 'Comercio Auspiciante',
          p_points_value: points,
        });

        if (rpcRes && rpcRes.status === 'success') {
          return NextResponse.json({ success: true, voucher: rpcRes });
        }
      } catch (dbErr) {}

      // Fallback local
      local.wallets[session] = currentBalance - points;
      local.vouchers = [newVoucher, ...(local.vouchers || [])];
      saveLocalNexaPay(local);

      return NextResponse.json({
        success: true,
        message: `¡Voucher QR generado con éxito!`,
        voucher: newVoucher,
        new_balance: local.wallets[session],
      });
    }

    // VALIDAR CANJE POR PARTE DEL COMERCIANTE
    if (action === 'validate_qr') {
      if (!qrCode) {
        return NextResponse.json({ success: false, error: 'Código QR requerido.' }, { status: 400 });
      }

      try {
        const { data: rpcRes } = await supabaseAdmin.rpc('nexapay_validate_qr_redemption', {
          p_qr_code: qrCode,
          p_merchant_id: merchantId || 'admin-validador',
        });

        if (rpcRes && rpcRes.status === 'success') {
          return NextResponse.json({ success: true, message: rpcRes.message });
        }
      } catch (dbErr) {}

      // Fallback local
      const foundVoucher = (local.vouchers || []).find((v: any) => v.qr_code === qrCode);
      if (!foundVoucher) {
        return NextResponse.json({ success: false, error: 'Código QR no encontrado o inválido.' }, { status: 404 });
      }
      if (foundVoucher.status === 'REDEEMED') {
        return NextResponse.json({ success: false, error: 'Este Voucher QR ya fue canjeado anteriormente.' }, { status: 400 });
      }

      foundVoucher.status = 'REDEEMED';
      saveLocalNexaPay(local);

      return NextResponse.json({
        success: true,
        message: `🎉 ¡Voucher QR #${qrCode} validado exitosamente en el mostrador!`,
        voucher: foundVoucher,
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
