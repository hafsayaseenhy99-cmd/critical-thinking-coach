import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 200 });

  try {
    const { model, max_tokens, system, messages } = await req.json();
    const response = await anthropic.messages.create({
      model: model || "claude-sonnet-4-20250514",
      max_tokens: max_tokens || 1000,
      system,
      messages,
    });
    return Response.json(response);
  } catch (error) {
    console.error("Ask error:", error.message);
    return Response.json({ error: "Failed to get response", detail: error.message }, { status: 500 });
  }
};

export const config = {
  path: "/api/ask",
  method: "POST",
};
