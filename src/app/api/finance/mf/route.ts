import { NextResponse } from 'next/server';

// MFapi.in - Free Indian Mutual Fund API
const MF_API_BASE = 'https://api.mfapi.in';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const schemeCode = searchParams.get('schemeCode');

    try {
        if (action === 'search') {
            // Search for mutual funds by name
            if (!query) {
                return NextResponse.json({ error: 'Query is required' }, { status: 400 });
            }

            // Fetch all schemes and filter by query
            const response = await fetch(`${MF_API_BASE}/mf`);
            const allSchemes = await response.json();

            // Filter schemes that match the query
            const filtered = allSchemes.filter((scheme: any) =>
                (scheme.schemeName?.toLowerCase() || '').includes(query.toLowerCase())
            ).slice(0, 20); // Limit to 20 results

            return NextResponse.json(filtered);
        }

        if (action === 'nav') {
            // Get latest NAV for a specific scheme
            if (!schemeCode) {
                return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
            }

            const response = await fetch(`${MF_API_BASE}/mf/${schemeCode}/latest`);
            const data = await response.json();

            return NextResponse.json(data);
        }

        if (action === 'history') {
            // Get historical NAV data
            if (!schemeCode) {
                return NextResponse.json({ error: 'Scheme code is required' }, { status: 400 });
            }

            const response = await fetch(`${MF_API_BASE}/mf/${schemeCode}`);
            const data = await response.json();

            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching mutual fund data:', error);
        return NextResponse.json({ error: 'Failed to fetch mutual fund data' }, { status: 500 });
    }
}
