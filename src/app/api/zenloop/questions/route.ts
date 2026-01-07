import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.ZENLOOP_API_URL || 'https://api.zenloop.com';
const API_USER = process.env.ZENLOOP_API_USER || '';
const API_PASSWORD = process.env.ZENLOOP_API_PASSWORD || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyHashId = searchParams.get('surveyHashId');

    if (!surveyHashId) {
      return NextResponse.json(
        { error: 'Missing surveyHashId parameter' },
        { status: 400 }
      );
    }

    const basicAuth = Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64');

    const response = await fetch(
      `${API_URL}/csv_answers_importer/surveys/${surveyHashId}/additional_questions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
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
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
