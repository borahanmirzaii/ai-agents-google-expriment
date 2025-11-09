import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

/**
 * Chat with the AI assistant
 */
export async function chatWithAssistant(
  messages: Array<{ role: string; content: string }>,
  context?: {
    userId?: string;
    recentNotes?: unknown[];
    pillarData?: unknown;
  }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Build context-aware prompt
    let systemPrompt = `You are a personal AI assistant helping with life management and self-improvement.
The user is tracking 8 pillars: Health, Finance, Career, Relationships, Mental Well-being, Learning, Recreation, and Contribution.`;

    if (context?.recentNotes && Array.isArray(context.recentNotes)) {
      systemPrompt += `\n\nRecent user notes: ${JSON.stringify(
        context.recentNotes.slice(0, 5)
      )}`;
    }

    if (context?.pillarData) {
      systemPrompt += `\n\nCurrent pillar progress: ${JSON.stringify(
        context.pillarData
      )}`;
    }

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'm here to help you with your life management and self-improvement journey across all 8 pillars.",
            },
          ],
        },
        ...messages.slice(0, -1).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
  } catch (error) {
    console.error("Error chatting with assistant:", error);
    throw new Error("Failed to get response from AI assistant");
  }
}

/**
 * Analyze note content and extract metadata
 */
export async function analyzeNoteContent(content: string): Promise<{
  summary?: string;
  topics: string[];
  categories: string[];
  sentiment?: "positive" | "neutral" | "negative";
  entities: {
    people: string[];
    dates: string[];
    places: string[];
    tasks: string[];
  };
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze the following note content and extract:
1. A brief summary (1-2 sentences)
2. Main topics (3-5 keywords)
3. Categories (e.g., work, personal, health, finance)
4. Sentiment (positive, neutral, or negative)
5. Entities: people mentioned, dates, places, and any tasks/action items

Note content: ${content}

Return the response as JSON with this structure:
{
  "summary": "...",
  "topics": ["topic1", "topic2"],
  "categories": ["category1"],
  "sentiment": "positive|neutral|negative",
  "entities": {
    "people": [],
    "dates": [],
    "places": [],
    "tasks": []
  }
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      topics: [],
      categories: [],
      entities: {
        people: [],
        dates: [],
        places: [],
        tasks: [],
      },
    };
  } catch (error) {
    console.error("Error analyzing note content:", error);
    return {
      topics: [],
      categories: [],
      entities: {
        people: [],
        dates: [],
        places: [],
        tasks: [],
      },
    };
  }
}

/**
 * Generate personalized insights based on user data
 */
export async function generateInsights(userData: {
  notes: unknown[];
  tasks: unknown[];
  pillars: unknown;
}): Promise<{
  insights: string[];
  recommendations: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Analyze this user's activity and progress across 8 life pillars.
Generate 3-5 key insights and actionable recommendations.

User Data: ${JSON.stringify(userData, null, 2)}

Format your response as JSON with: { "insights": [], "recommendations": [] }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      insights: [],
      recommendations: [],
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      insights: [],
      recommendations: [],
    };
  }
}
