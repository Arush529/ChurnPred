import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { CHURN_SYSTEM_PROMPT, generateDiagnosticResponse } from '../../src/lib/churnKnowledgeBase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        let dynamicContext = "";
        if (context.page === 'single' && context.profile) {
          dynamicContext = `\n[LIVE SCREEN CONTEXT - SINGLE SUBSCRIBER ANALYZER]
- Predicted Churn Probability: ${context.prob !== null ? Math.round(context.prob * 100) + '%' : 'Awaiting inputs'}
- Contract: ${context.profile.Contract || 'None'}
- Tenure: ${context.profile.tenure || 0} months
- Monthly Charges: $${context.profile.MonthlyCharges || 0}
- Internet Service: ${context.profile.InternetService || 'None'}
- Online Security: ${context.profile.OnlineSecurity || 'None'}
- Tech Support: ${context.profile.TechSupport || 'None'}
- Payment Method: ${context.profile.PaymentMethod || 'None'}
- Inspected ID: ${context.inspectedId || 'Single Profile'}`;
        } else if (context.page === 'batch' && context.cohortStats) {
          dynamicContext = `\n[LIVE SCREEN CONTEXT - BATCH COHORT SCORING]
- Scored Customers: ${context.cohortStats.totalCount || 0}
- High Flight-Risk Volume: ${context.cohortStats.highRiskCount || 0} (${context.cohortStats.highRiskPct || 0}%)
- Cohort Mean Churn: ${context.cohortStats.avgChurnPct || 0}%
- Total ARR Flight Loss: $${Number(context.cohortStats.totalLoss || 0).toLocaleString()}`;
        }

        // Format history for context
        const conversationHistory = history
          .slice(-6)
          .map(m => `${m.sender === 'user' ? 'User' : 'ChurnPred AI'}: ${m.text}`)
          .join('\n');

        const prompt = `${CHURN_SYSTEM_PROMPT}
${dynamicContext}

Recent Conversation:
${conversationHistory}

User: ${message}
ChurnPred AI:`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        return res.json({
          reply: response.text,
          engine: 'gemini-2.5-flash'
        });
      } catch (geminiErr) {
        console.warn('[Gemini API] Fallback to built-in diagnostic engine due to:', geminiErr.message);
        // Fallback gracefully to built-in knowledge base
        const reply = generateDiagnosticResponse(message, context);
        return res.json({
          reply,
          engine: 'local-diagnostic',
          fallbackReason: geminiErr.message
        });
      }
    }

    // Zero-config execution using built-in diagnostic knowledge engine
    const reply = generateDiagnosticResponse(message, context);
    return res.json({
      reply,
      engine: 'local-diagnostic'
    });

  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Internal server error while processing question' });
  }
});

export default router;
