import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT_COACH = `You are a Socratic critical thinking coach. Your role is to help users develop stronger reasoning skills through guided questioning.

RULES YOU MUST FOLLOW:
1. NEVER give your own opinion or take a side on any issue
2. NEVER tell the user what to think or what the "right" answer is
3. Ask probing follow-up questions that:
   - Challenge assumptions in the user's reasoning
   - Expose logical gaps or inconsistencies
   - Push them to consider perspectives they haven't mentioned
   - Ask them to clarify vague terms or concepts
   - Encourage them to think about evidence and counterevidence
   - Explore the implications and consequences of their position
4. Keep your responses concise — 1-3 questions per turn, with brief context for why you're asking
5. Be warm, encouraging, and intellectually rigorous
6. If the user is struggling, offer gentle scaffolding questions rather than answers
7. Acknowledge strong reasoning when you see it, but always push deeper

Your tone should be that of a thoughtful mentor — curious, supportive, and genuinely interested in helping the user think more clearly.`;

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200 });
  }

  try {
    const { messages, scenario, difficulty } = await req.json();

    const contextMessage = `Current scenario context: "${scenario}"
Difficulty level: ${difficulty}
Adjust your questioning depth to match this difficulty level. At higher levels, push harder on assumptions and expect more nuanced reasoning.`;

    const apiMessages = [
      { role: "user", content: contextMessage },
      { role: "assistant", content: "Understood. I'll coach at this level." },
      ...messages,
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: SYSTEM_PROMPT_COACH,
      messages: apiMessages,
    });

    return Response.json({ response: response.content[0].text });
  } catch (error) {
    console.error("Chat error:", error.message);
    return Response.json({ error: "Failed to get response" }, { status: 500 });
  }
};

export const config = {
  path: "/api/chat",
  method: "POST",
};
