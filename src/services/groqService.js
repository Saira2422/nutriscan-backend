const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const analyzeFoodImage = async (imageUrl, userContext = {}, filePath = null) => {
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
  if (filePath && fs.existsSync(filePath)) {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'jpeg';
    const mimeMap = { '.jpg': 'jpeg', '.jpeg': 'jpeg', '.png': 'png', '.gif': 'gif', '.webp': 'webp' };
    const mime = mimeMap[path.extname(filePath).toLowerCase()] || 'jpeg';
    imageContent = { type: 'image_url', image_url: { url: `data:image/${mime};base64,${base64Image}` } };
  } else {
    imageContent = { type: 'image_url', image_url: { url: imageUrl } };
  }

  try {
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

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw new Error('AI analysis failed. Please try again.');
  }
};

const generateMotivation = async (userProfile = {}) => {
  const context = userProfile.scanCount
    ? `User has scanned ${userProfile.scanCount} products. `
    : '';

  const prompt = `You are a health and nutrition motivator. Generate a short, encouraging daily health tip or motivation message.
${context}Keep it concise (2-3 sentences max), positive, and actionable. Do not use JSON, just return plain text.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Stay healthy, stay happy!';
  } catch (error) {
    console.error('Groq motivation error:', error.message);
    return 'Every healthy choice you make counts. Keep going!';
  }
};

module.exports = { analyzeFoodImage, generateMotivation };
