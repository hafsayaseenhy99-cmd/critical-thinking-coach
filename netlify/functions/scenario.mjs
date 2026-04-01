import Anthropic from "@anthropic-ai/sdk";

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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200 });
  }

  try {
    const { category, difficulty } = await req.json();
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

    return Response.json({
      category: chosenCategory,
      difficulty: level,
      scenario: scenarioMatch ? scenarioMatch[1].trim() : text,
      question: questionMatch ? questionMatch[1].trim() : "",
    });
  } catch (error) {
    console.error("Scenario generation error:", error.message);
    return Response.json({ error: "Failed to generate scenario", detail: error.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/scenario",
  method: "POST",
};
