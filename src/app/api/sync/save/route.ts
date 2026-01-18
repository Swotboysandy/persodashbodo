import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
    try {
        const { pin, data } = await req.json();

        if (!pin || pin.length < 4) {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
        }

        if (!data) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        // Store data in Vercel KV
        // Key format: 'user_data_<pin>'
        // This is a simple implementation. In production, we'd hash the PIN or use a proper auth system.
        // But for "Pin -> Data", this works perfectly for a personal app.
        // But for "Pin -> Data", this works perfectly for a personal app.
        await redis.set(`user_data_${pin}`, JSON.stringify(data));

        return NextResponse.json({ success: true, message: 'Backup successful' });
    } catch (error) {
        console.error('Sync Save Error:', error);
        return NextResponse.json({ error: 'Failed to save to cloud' }, { status: 500 });
    }
}
