
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    try {
        const results = await yahooFinance.search(query);
        return NextResponse.json(results);
    } catch (error) {
        console.error('Error searching symbols:', error);
        return NextResponse.json({ error: 'Failed to search symbols' }, { status: 500 });
    }
}
