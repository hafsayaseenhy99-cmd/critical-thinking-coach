const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk").default;

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic();

const CATEGORIES = [
  "Social Issues",
  "Ethical Dilemmas",
  "Politics",
  "Technology",
  "Economics",
  "Cultural Debates",
];

const DIFFICULTY_DESCRIPTIONS = {
  1: "straightforward with clear stakeholders and obvious trade-offs, suitable for beginners",
  2: "moderately complex with multiple valid perspectives and some hidden assumptions",
  3: "complex with systemic factors, historical context, and competing values that require nuanced analysis",
  4: "highly complex with global implications, deep philosophical tensions, intersecting systems, and no easy answers",
};

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

app.post("/api/scenario", async (req, res) => {
  try {
    const { category, difficulty } = req.body;
    const chosenCategory =
      category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const level = difficulty || 1;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Generate a real-world scenario for critical thinking practice.

Category: ${chosenCategory}
Difficulty: Level ${level} — ${DIFFICULTY_DESCRIPTIONS[level]}

Provide:
1. A brief, vivid scenario (3-5 sentences) presenting a real-world situation with genuine tension or complexity
2. A thought-provoking opening question to get the user thinking

Format your response as:
SCENARIO: [the scenario]
QUESTION: [the opening question]

Do NOT include any opinions or suggested answers. The scenario should feel real and current.`,
        },
      ],
    });

    const text = response.content[0].text;
    const scenarioMatch = text.match(/SCENARIO:\s*([\s\S]*?)(?=QUESTION:)/);
    const questionMatch = text.match(/QUESTION:\s*([\s\S]*?)$/);

    res.json({
      category: chosenCategory,
      difficulty: level,
      scenario: scenarioMatch ? scenarioMatch[1].trim() : text,
      question: questionMatch ? questionMatch[1].trim() : "",
    });
  } catch (error) {
    console.error("Scenario generation error:", error.message);
    res.status(500).json({ error: "Failed to generate scenario" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, scenario, difficulty } = req.body;

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

    res.json({ response: response.content[0].text });
  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Failed to get response" });
  }
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const { messages, scenario, difficulty } = req.body;

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

    res.json({ evaluation });
  } catch (error) {
    console.error("Evaluation error:", error.message);
    res.status(500).json({ error: "Failed to evaluate" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
