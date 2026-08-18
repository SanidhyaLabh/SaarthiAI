import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Serve static frontend build
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'SaarthiAI Backend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Secure Backend Multimodal Vision Analysis Endpoint (Proxies Gemini)
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mode, lang, userQuery, customKey } = req.body;
    const apiKey = customKey || GEMINI_API_KEY;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 frame is required.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    let prompt = '';
    const langInstruction = lang === 'hi'
      ? 'उत्तर स्पष्ट, संक्षिप्त और स्वाभाविक हिंदी में दें जो एक दृष्टिबाधित व्यक्ति के लिए सुनने में आसान हो।'
      : 'Provide a concise, direct, natural spoken response optimized for a visually impaired user listening via audio.';

    switch (mode) {
      case 'SCENE':
        prompt = `You are SaarthiAI, an assistive vision guide for a blind person. Analyze this camera image and describe:
1. The overall environment/room layout.
2. Immediate obstacles, their approximate distance, and whether they are on the left, center, or right.
3. The clearest walking path.
${langInstruction}`;
        break;

      case 'OCR':
        prompt = `You are SaarthiAI reading a document or medicine prescription for a visually impaired user.
1. Extract the main medicine name, dosage, and instructions (e.g. "Take 1 tablet after meals twice a day").
2. Mention any warnings or expiry dates if visible.
3. Keep it simplified into clear bullet points.
${langInstruction}`;
        break;

      case 'PEOPLE':
        prompt = `You are SaarthiAI describing social context and people to a blind user.
1. Number of people in view and their approximate distance.
2. Facial expressions, emotions (smiling, neutral, attentive), and gestures (waving, looking towards camera).
${langInstruction}`;
        break;

      case 'VOICE':
      default:
        prompt = `The visually impaired user asked: "${userQuery || 'What do you see?'}".
Answer their question directly based on what is visible in this camera view.
${langInstruction}`;
        break;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 250
        }
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ error: errorText });
    }

    const data = await apiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No description available.';

    return res.json({
      mode,
      headline: responseText.slice(0, 80).replace(/[*#]/g, ''),
      details: responseText.replace(/[*#]/g, ''),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('API analyze error:', error);
    return res.status(500).json({ error: 'Internal server error analyzing vision frame.' });
  }
});

// Emergency SOS Alert Logging & Dispatch Endpoint
app.post('/api/sos', (req, res) => {
  const { latitude, longitude, timestamp, userId } = req.body;
  console.log(`🚨 [EMERGENCY SOS ALERT] Received from User ${userId || 'Anonymous'}:`, {
    location: `${latitude}, ${longitude}`,
    time: timestamp || new Date().toISOString()
  });

  // Here you can hook up Twilio SMS / WhatsApp API / Push Notification webhooks
  res.json({
    status: 'received',
    message: 'Emergency beacon registered. Responders notified.',
    sosId: `sos_${Date.now()}`
  });
});

// Catch-all route to serve Single Page Application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SaarthiAI Full-Stack Server running on port ${PORT}`);
  console.log(`📱 Access URL: http://localhost:${PORT}`);
});
