const Groq = require('groq-sdk');

const apiKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextClient() {
  const key = apiKeys[currentKeyIndex % apiKeys.length];
  const keyNum = (currentKeyIndex % apiKeys.length) + 1;
  currentKeyIndex++;
  return { client: new Groq({ apiKey: key }), keyNum };
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const analyzeFoodImage = async (imageUrl, userContext = {}, imageBuffer = null, mimeType = 'image/jpeg') => {
  const allergyContext = userContext.allergies?.length
    ? `User allergies: ${userContext.allergies.join(', ')}.`
    : 'No known allergies.';
  const ageContext = userContext.age ? `User age: ${userContext.age}.` : '';

  const prompt = `You are a food product analysis AI. Analyze this food product image and return a JSON response.

Context: ${allergyContext} ${ageContext}

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences):
{
  "productName": "Name of the product",
  "productDescription": "Brief description of the product",
  "productScore": <number 0-100>,
  "productScoreStatus": "<good|moderate|bad>",
  "productScoreColour": "<green|yellow|red>",
  "allIngredients": ["ingredient1", "ingredient2"],
  "goodIngredients": ["healthy ingredient1"],
  "badIngredients": ["unhealthy ingredient1"],
  "allergenWarnings": [
    {
      "ingredient": "allergen name",
      "severity": "<safe|caution|dangerous>",
      "message": "Warning message"
    }
  ],
  "betterAlternatives": ["alternative product 1", "alternative product 2"],
  "nutritionSummary": {
    "calories": "value per serving",
    "protein": "value per serving",
    "fat": "value per serving",
    "carbs": "value per serving",
    "sugar": "value per serving",
    "sodium": "value per serving",
    "fiber": "value per serving",
    "servingSize": "serving size description"
  },
  "recommendation": "One-line advice: avoid, consume in moderation, or good to go",
  "explanation": "Detailed paragraph explaining the analysis"
}

Scoring guide:
- 70-100: good (green) - healthy product
- 50-69: moderate (yellow) - consume in moderation
- 0-49: bad (red) - avoid or limit consumption

Check ingredients against the user's allergies and flag any matches as dangerous allergen warnings.`;

  let imageContent;
  if (imageBuffer) {
    const base64Image = imageBuffer.toString('base64');
    const mime = mimeType || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64Image}`;
    imageContent = { type: 'image_url', image_url: { url: dataUrl } };
  } else {
    imageContent = { type: 'image_url', image_url: { url: imageUrl } };
  }

  const totalAttempts = apiKeys.length * 2;

  for (let i = 0; i < totalAttempts; i++) {
    const { client: groq, keyNum } = getNextClient();
    try {
      console.log(`Attempt ${i + 1}/${totalAttempts} with API key #${keyNum}`);
      const response = await groq.chat.completions.create({
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              imageContent,
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      });

      let content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      console.log('Raw response (first 200 chars):', content.substring(0, 200));

      let cleaned = content.trim();

      // Strip think tags (all variations)
      cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      cleaned = cleaned.replace(/<\/?think>/gi, '').trim();
      cleaned = cleaned.replace(/\n<think>[\s\S]*$/g, '').trim();

      // Strip markdown code fences
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?\s*```\s*$/i, '').trim();

      // Try to extract JSON object from the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      console.log('Cleaned response (first 200 chars):', cleaned.substring(0, 200));

      return JSON.parse(cleaned);
    } catch (error) {
      const isRateLimit = error.status === 429 ||
        error.message?.includes('rate') ||
        error.message?.includes('limit') ||
        error.message?.includes('exhausted') ||
        error.message?.includes('requests');

      console.error(`API key #${keyNum} failed:`, error.message);

      if (isRateLimit && i < totalAttempts - 1) {
        const waitTime = Math.min(2000 * (i + 1), 10000);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      } else if (!isRateLimit) {
        throw error;
      }
    }
  }

  console.error('All attempts exhausted');
  throw new Error('AI service is busy. Please try again in a few seconds.');
};

const generateMotivation = async (userProfile = {}) => {
  const context = userProfile.scanCount
    ? `User has scanned ${userProfile.scanCount} products. `
    : '';

  const prompt = `You are a health and nutrition motivator. Generate a short, encouraging daily health tip or motivation message.
${context}Keep it concise (2-3 sentences max), positive, and actionable. Do not use JSON, just return plain text.`;

  const totalAttempts = apiKeys.length * 2;

  for (let i = 0; i < totalAttempts; i++) {
    const { client: groq, keyNum } = getNextClient();
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || 'Stay healthy, stay happy!';
    } catch (error) {
      const isRateLimit = error.status === 429 ||
        error.message?.includes('rate') ||
        error.message?.includes('limit');
      console.error(`Motivation key #${keyNum} failed:`, error.message);
      if (isRateLimit && i < totalAttempts - 1) {
        await sleep(2000 * (i + 1));
      }
    }
  }

  return 'Every healthy choice you make counts. Keep going!';
};

module.exports = { analyzeFoodImage, generateMotivation };
