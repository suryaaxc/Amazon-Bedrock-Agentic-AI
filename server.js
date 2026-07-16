const express = require('express');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Gemini AI Initialize karo
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Main Webhook Endpoint
app.post('/webhook', async (req, res) => {
    const event = req.headers['x-github-event'];
    console.log(`\n🔥 GitHub Event Received: ${event}`);

    // Response turant 200 OK bhej do taaki GitHub waiting me na rahe
    res.status(200).send('OK');

    // Agar real code push event aaya hai
    if (event === 'push') {
        const commitMessage = req.body.commits?.[0]?.message || 'No commit message found';
        const pusherName = req.body.pusher?.name || 'Someone';
        
        console.log(`📦 Commit Detected from ${pusherName}: "${commitMessage}"`);
        console.log(`🤖 Agentic AI is analyzing the commit message...`);

        try {
            // Gemini AI Agent ko call kar rahe hain message analyze karne ke liye
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `A developer named ${pusherName} just pushed code with this commit message: "${commitMessage}". 
                Act as an AI Senior Developer. Summarize what they probably changed in 1-2 bullet points and give them a quick, encouraging developer compliment. Keep it brief.`,
            });

            console.log(`\n✨ --- AI AGENT RESPONSE ---`);
            console.log(response.text);
            console.log(`----------------------------\n`);

        } catch (error) {
            console.error('❌ AI Agent Analysis Failed:', error.message);
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Webhook Server running on port ${PORT}`));