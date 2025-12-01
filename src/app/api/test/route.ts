import { NextResponse } from 'next/server';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    status: 'API routes are working',
    timestamp: new Date().toISOString(),
    message: 'This confirms Next.js API routing is functional'
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'POST endpoint working',
    timestamp: new Date().toISOString() 
  });
}