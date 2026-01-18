import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { pin } = await req.json();

        if (!pin || pin.length < 4) {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
        }

        // Retrieve data from Redis (ioredis)
        const dataString = await redis.get(`user_data_${pin}`);

        if (!dataString) {
            return NextResponse.json({ success: false, message: 'No backup found for this PIN' });
        }

        const data = JSON.parse(dataString);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Sync Load Error:', error);
        return NextResponse.json({ error: 'Failed to load from cloud' }, { status: 500 });
    }
}
