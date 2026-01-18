import { NextRequest, NextResponse } from 'next/server';
import { GroqAIService } from '@/services/GroqAIService';

const groqService = new GroqAIService();

export async function POST(req: NextRequest) {
    try {
        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY is missing!");
            return NextResponse.json({ error: 'Server misconfiguration: No API Key' }, { status: 500 });
        }
        console.log("Checking GROQ_API_KEY:", process.env.GROQ_API_KEY ? "Present" : "Missing");

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Check image size
        console.log("Base64 Image Length:", base64Image.length);

        const prompt = `
            Analyze this bank statement image.
            Return a JSON object with:
            1. "debug_summary": A string describing exactly what you see on the page (e.g., "A header with Kotak logo, a summary table, but no list of individual transactions" or "A blank page").
            2. "transactions": An array of extracted transactions.

            The columns in the image are likely: DATE | TRANSACTION DETAILS | CHEQUE/REF | DEBIT | CREDIT | BALANCE.

            For each row in the transaction table, extract:
            - "date" (YYYY-MM-DD).
            - "source" (Clean description).
            - "amount" (Number).
            - "type" ("income" or "expense").
            - "tags" (1-2 keywords).

            If there are NO transactions on this page (only summary/header), return an empty array for transactions, but explain why in "debug_summary".
        `;

        console.log("Sending Prompt to AI...");
        const result = await groqService.processRequest(prompt, base64Image);

        console.log("Raw AI Response:", result);

        let parsedResult;
        try {
            // Robust JSON extraction
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0]);
                console.log("AI Debug Summary:", parsedResult.debug_summary);
            } else {
                throw new Error("No JSON found");
            }
        } catch (e) {
            console.error("JSON Parse Failed:", result);
            parsedResult = { transactions: [] };
        }

        return NextResponse.json(parsedResult);
    } catch (error) {
        console.error('Error extracting data:', error);
        return NextResponse.json(
            { error: 'Failed to process image' },
            { status: 500 }
        );
    }
}
