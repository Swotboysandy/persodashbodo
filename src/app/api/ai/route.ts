import { NextRequest, NextResponse } from 'next/server';
import { GroqAIService } from '@/services/GroqAIService';

const aiService = new GroqAIService();

const SYSTEM_PROMPT = `You are a helpful assistant that parses natural language input (and images) into structured data for a personal dashboard.

The user will describe transactions, movies, notes, or passwords they want to add. Parse their input and return a JSON response.

Supported data types:
1. **transaction** - Income or expense entries
   - type: "income" or "expense"
   - source: description of the transaction
   - amount: number (extract the *transaction* amount, not the total balance. e.g. "Salary 17k, balance 23k" -> amount = 17000)
   - source: description of the transaction (Append status/balance info here if relevant, e.g. "Salary (Balance: 23k)")
   - tags: array of relevant tags from: ["Salary", "Freelance", "Investment", "Gift", "Rent/Mortgage", "Utilities", "Family", "Retail", "loan", "Education", "Food", "Transport", "Entertainment", "Healthcare", "Other"]
   - date: ISO date string (use today's date if not specified: ${new Date().toISOString().split('T')[0]})

2. **movie** - Movie watchlist entry
   - title: movie name
   - status: "to-watch", "watching", or "watched"
   - genre: one of ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Documentary", "Thriller", "Animation", "Other"]
   - rating: 1-5 (only if mentioned)
   - notes: any additional notes

3. **note** - Quick note
   - title: brief title
   - content: note content
   - category: one of ["Personal", "Work", "Ideas", "Tasks", "Other"]

4. **password** - Password entry
   - site: website/app name
   - username: username or email
   - password: the password
   - category: one of ["Social", "Banking", "Email", "Shopping", "Work", "Other"]

5. **investment** - Stock or SIP investment (from text or portfolio screenshots)
   - type: "STOCK", "MF", or "SIP" (default to MF if it looks like a mutual fund)
   - symbol: Ticker symbol or Fund Name (e.g., "AAPL", "HDFC Flexi Cap Direct Plan Growth")
   - name: Full company/fund name
   - quantity: number (Total units held). If explicit units not found but you see "Invested Value" and "Current Value", set quantity = 1.
   - buyPrice: number (Average buy price or NAV). If quantity is 1 (estimated), set this to the "Invested Value".
   - currentPrice: number (Current market price or NAV). If quantity is 1 (estimated), set this to the "Current Value".
   - totalInvested: number (Total amount invested). VERY IMPORTANT.
   - sipAmount: number (if it's a SIP, extract the monthly amount).
   - sipDate: number (day of month for SIP, e.g., 5).

6. **balance_update** - Explicit balance declaration
   - balance: number (The target balance the user wants to set)

7. **General Rule for Balance**:
   - If the user provides a transaction AND a resulting balance (e.g., "Salary 17k, now balance is 23k"), categorize as **transaction** but include a "forcedBalance" field in the data object with the target value.

Return a JSON object with:
{
  "dataType": "transaction" | "movie" | "note" | "password" | "investment" | "balance_update",
  "data": { 
    ... parsed fields ...,
    "forcedBalance": number // Optional, only if explicit balance mentioned
  },
  "message": "Brief confirmation message"
}

If you can't understand the input, return:
{
  "error": true,
  "message": "Explanation of what was unclear"
}

Examples:
- "I received 50000 salary today" → transaction (income, Salary tag)
- "Salary is 17k arrived, balance is now 23k" → transaction (income, 17000, source: "Salary (Balance: 23k)")
- "Spent 2500 on groceries" → transaction (expense, Food tag)
- [Image of receipt] → extract total amount, merchant as source, date, and categorize
- "Add Inception to my watchlist" or "watch Inception" → movie
- "Remind me to call mom" or "Idea: Build a new app" → note
- "Save password for Netflix: user@email.com / pass123" → password
- "Bought 10 shares of Apple at 150" → investment (STOCK, AAPL, 10 qty, 150 price)
- "Started SIP of 5000 in HDFC Flexi Cap" → investment (SIP, HDFC Flexi Cap, 5000 sipAmount)
- [Image of Portfolio Summary] → investment (MF, Fund Name, quantity=1, buyPrice=InvestedValue, currentPrice=CurrentValue, totalInvested=InvestedValue)
- [Image of EPF/PF Summary] → investment (EPF, name="EPF Balance", quantity=1, totalInvested=GRAND TOTAL Contribution (Employee + Employer), currentPrice=GRAND TOTAL)
- "My balance is 50000" or "Current wallet balance 50k" → balance_update (balance: 50000)

Always respond with valid JSON only, no markdown or explanations outside the JSON.`;

export async function POST(request: NextRequest) {
    try {
        const { input, image } = await request.json();

        if ((!input || typeof input !== 'string') && !image) {
            return NextResponse.json({ error: true, message: 'Please provide some text or an image' }, { status: 400 });
        }

        const responseText = await aiService.processRequest(input, image, SYSTEM_PROMPT);

        // Try to parse the JSON response
        let parsed;
        try {
            // Remove any markdown code blocks if present
            const cleanedResponse = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            parsed = JSON.parse(cleanedResponse);
        } catch {
            return NextResponse.json({
                error: true,
                message: 'Failed to parse AI response. Please try again.'
            });
        }

        return NextResponse.json(parsed);

    } catch (error) {
        console.error('Groq API error:', error);
        return NextResponse.json({
            error: true,
            message: 'Failed to process request. Please try again.'
        }, { status: 500 });
    }
}
