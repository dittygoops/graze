import Groq from 'groq-sdk';
import type { GooglePlacesRestaurant } from './googlePlaces';

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

function normalizeTags(tags: string[]): string[] {
  return tags.map(tag =>
    tag.toLowerCase().trim().replace(/_/g, ' ').replace(/\s+/g, ' ')
  );
}

function extractTagsFromText(text: string): string[] {
  const quoted = text.match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) ?? [];
  if (quoted.length) return normalizeTags(quoted.slice(0, 5));

  const parts = text.replace(/[\[\]]/g, '').split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  return parts.length ? normalizeTags(parts.slice(0, 5)) : ['restaurant'];
}

export async function generateRestaurantTags(restaurant: GooglePlacesRestaurant): Promise<string[]> {
  const client = getGroqClient();
  if (!client) return ['restaurant'];

  try {
    const prompt = `Given a restaurant named "${restaurant.name}" with the following types: ${restaurant.types.join(', ')}, generate 3-5 short tags that describe this restaurant.

Rules:
- Use spaces not underscores (e.g. "fast food" not "fast_food")
- Use the simplest common form (e.g. "pizza" not "pizzeria", "burgers" not "burger joint")
- Lowercase only
- No punctuation

Return ONLY a JSON array of strings. Example: ["italian", "fine dining", "romantic"]`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = completion.choices[0].message.content?.trim() ?? '';

    try {
      const tags = JSON.parse(text);
      if (Array.isArray(tags) && tags.every(t => typeof t === 'string')) return normalizeTags(tags);
    } catch {
      // fall through to text extraction
    }

    return extractTagsFromText(text);
  } catch (e) {
    console.error('Error generating tags with Groq:', e);
    return ['restaurant'];
  }
}
