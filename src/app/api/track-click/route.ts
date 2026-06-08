import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the Service Role key to bypass RLS 
// and ensure we can insert clicks even if the user isn't logged in.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sponsorId = searchParams.get('sponsor_id');
  const type = searchParams.get('type');
  const targetUrl = searchParams.get('url');

  if (!sponsorId || !type || !targetUrl) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Log the click asynchronously
  try {
    await supabase.from('sponsor_clicks').insert([
      {
        sponsor_id: sponsorId,
        click_type: type,
      }
    ]);
  } catch (error) {
    console.error('Failed to log sponsor click:', error);
    // Continue anyway to not break the redirect
  }

  // Redirect the user to the sponsor's website or instagram
  return NextResponse.redirect(targetUrl);
}
