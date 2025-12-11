import { NextRequest, NextResponse } from 'next/server';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, contactEmail, timestamp } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    // Create email content
    const emailContent = `
New content report submitted on Wizzmo:

Report Type: ${type}
Description: ${description}
Contact Email: ${contactEmail || 'Not provided'}
Timestamp: ${timestamp}

Please review this report within 24 hours as per our safety guidelines.
    `.trim();

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'hello@wizzmo.app',
        to: ['safety@wizzmo.app'],
        subject: `[REPORT] ${type.toUpperCase()} - Content Moderation Alert`,
        text: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      console.error('Failed to send email:', await emailResponse.text());
      return NextResponse.json(
        { error: 'Failed to send report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}