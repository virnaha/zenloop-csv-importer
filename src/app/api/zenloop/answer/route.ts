import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZENLOOP_API_URL || 'https://api.zenloop.com';
const API_USER = process.env.ZENLOOP_API_USER || '';
const API_PASSWORD = process.env.ZENLOOP_API_PASSWORD || '';

export async function POST(request: NextRequest) {
  try {
    const { surveyHashId, answer } = await request.json();

    if (!surveyHashId || !answer) {
      return NextResponse.json(
        { error: 'Missing surveyHashId or answer' },
        { status: 400 }
      );
    }

    const basicAuth = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');

    const response = await fetch(
      `${API_URL}/csv_answers_importer/surveys/${surveyHashId}/answers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify(answer),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `zenloop API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error posting answer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
