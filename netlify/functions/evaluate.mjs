import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT_EVALUATOR = `You are a critical thinking evaluator. Analyze the user's reasoning throughout the conversation and provide an evaluation.

You MUST respond with ONLY valid JSON in this exact format:
{
  "score": <number 1-10>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["area1", "area2", "area3"],
  "summary": "A 2-3 sentence overall assessment of their critical thinking"
}

Evaluate based on:
- Logical consistency and coherence
- Consideration of multiple perspectives
- Quality of evidence and reasoning
- Awareness of assumptions and biases
- Depth of analysis
- Ability to handle counterarguments
- Nuance and intellectual humility

Be fair but rigorous. A score of 7+ means genuinely strong critical thinking.`;

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200 });
  }

  try {
    const { messages, scenario, difficulty } = await req.json();

    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: SYSTEM_PROMPT_EVALUATOR,
      messages: [
        {
          role: "user",
          content: `Evaluate the user's critical thinking in this conversation.

Scenario: "${scenario}"
Difficulty Level: ${difficulty}

Conversation:
${conversationText}

Remember: respond with ONLY valid JSON.`,
        },
      ],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return Response.json({ evaluation });
  } catch (error) {
    console.error("Evaluation error:", error.message);
    return Response.json({ error: "Failed to evaluate" }, { status: 500 });
  }
};

export const config = {
  path: "/api/evaluate",
  method: "POST",
};
