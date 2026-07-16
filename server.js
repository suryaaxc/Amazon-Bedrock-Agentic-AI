import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import express from 'express';

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/webhook', async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    console.log(`\n🔥 GitHub Event Received: ${event}`);

    if (event === 'push') {
      const repo = req.body.repository?.full_name; // e.g., "suryaaxc/repo-name"
      const commitSha = req.body.head_commit?.id;
      const pusher = req.body.pusher?.name || 'Unknown';

      if (!repo || !commitSha) {
        console.log('⚠️ Repository info or Commit SHA missing in payload.');
        return res.send('Missing Data');
      }

      console.log(`📦 Commit Detected from ${pusher}: ${commitSha.substring(0, 7)} in ${repo}`);
      console.log('Fetching actual code diff from GitHub API...');

      // GitHub API se single commit details fetch kar rahe hain
      // Note: Agar repo private hai, toh headers me "Authorization": "token YOUR_GITHUB_TOKEN" lagana padega
      const githubUrl = `https://api.github.com/repos/${repo}/commits/${commitSha}`;
      
      const githubResponse = await fetch(githubUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Node-Webhook-Server'
        }
      });

      if (!githubResponse.ok) {
        throw new Error(`GitHub API responded with status ${githubResponse.status}`);
      }

      const commitData = await githubResponse.json();
      
      // Saare files ke diffs ko ek text block me merge kar rahe hain
      let diffData = '';
      commitData.files?.forEach(file => {
        diffData += `\nFile: ${file.filename}\nStatus: ${file.status}\nChanges:\n${file.patch || 'No patch available (maybe binary or large file)'}\n-------------------`;
      });

      if (!diffData || diffData.trim() === '') {
        diffData = 'No line-by-line code changes detected.';
      }

      console.log('🤖 Agentic AI is analyzing the actual code changes...');

      // Gemini 2.5 Flash ko pura code diff bhej rahe hain analysis ke liye
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a Senior Developer. Analyze the following code diff from a GitHub push event. Identify potential bugs, code smell, styling issues, or security flaws, and give a concise constructive feedback:\n\n${diffData}`,
      });

      console.log('\n✨ --- AI CODE DIFF REVIEW ---');
      console.log(response.text);
      console.log('------------------------------');
    }
    
    res.send('OK');
  } catch (error) {
    console.error('❌ AI Agent Diff Analysis Failed:', error.message);
    res.status(500).send('Error');
  }
});

app.listen(5000, () => {
  console.log('🚀 Webhook Server running on port 5000');
});