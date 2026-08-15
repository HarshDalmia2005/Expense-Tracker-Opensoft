import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const scanReceipt = async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image) {
            return res.status(400).json({ message: 'Image data is required' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

        const prompt = `You are an expert receipt/bill scanner. Analyze this receipt image and extract the following information. Return ONLY a valid JSON object with these fields:

{
  "amount": <total amount as a number, no currency symbol>,
  "description": "<store name or brief description of the purchase>",
  "date": "<date in YYYY-MM-DD format, use today's date if not visible>",
  "category": "<one of: Food, Shopping, Housing, Transport, Entertainment, Utilities, Healthcare, Education, Travel, Other>",
  "paymentMethod": "<one of: Credit Card, Debit Card, Cash, Online Transfer, Mobile Wallet - guess based on receipt context if not clear>",
  "confidence": <confidence score 0-100>
}

Rules:
- For amount, use the TOTAL/GRAND TOTAL, not subtotals
- For category, choose the most appropriate one based on the store/items
- If you cannot read something clearly, make your best guess and lower the confidence score
- Return ONLY the JSON object, no other text or markdown formatting`;

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: mimeType || 'image/jpeg',
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        let text = response.text();

        // Clean up the response - remove markdown code blocks if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse OCR response:', text);
            return res.status(422).json({
                message: 'Could not extract data from the receipt. Please try a clearer image.',
                rawResponse: text,
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                amount: String(parsedData.amount || ''),
                description: parsedData.description || '',
                date: parsedData.date || new Date().toISOString().split('T')[0],
                category: parsedData.category || 'Other',
                paymentMethod: parsedData.paymentMethod || 'Cash',
                confidence: parsedData.confidence || 50,
            },
        });
    } catch (error) {
        console.error('OCR error:', error.message);

        if (error.message?.includes('API_KEY')) {
            return res.status(500).json({ message: 'AI service is not configured. Please add GEMINI_API_KEY to your environment variables.' });
        }

        return res.status(500).json({ message: 'Failed to scan receipt. Please try again.' });
    }
};
