import OpenAI from "openai";
import { NextResponse } from "next/server";
import { tracks } from "@/lib/demo-data";
import type { VibeRequest } from "@/lib/types";

function localRank(req: VibeRequest) {
  return [...tracks]
    .map((track) => {
      let score = 0;
      if (track.activity.includes(req.activity)) score += 45;
      if (track.mood.includes(req.mood.toLowerCase())) score += 28;
      score += Math.max(0, 20 - Math.abs(track.energy - req.energy) / 3);
      if (req.language === "Any" || track.language === req.language) score += 12;
      if (req.region === "Global" || track.region === req.region || track.region === "Global") score += 8;
      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ track }) => track.id);
}

export async function POST(request: Request) {
  const req = (await request.json()) as VibeRequest;
  const fallbackIds = localRank(req);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      trackIds: fallbackIds,
      explanation: `A ${req.mood} ${req.activity} mix at ${req.energy}% energy, balanced around ${req.language === "Any" ? "multiple languages" : req.language}.`
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const catalogue = tracks.map(({ id, title, artist, region, language, genre, mood, activity, energy }) => ({ id, title, artist, region, language, genre, mood, activity, energy }));
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are GlobalBeat's fast music curator. Rank only the supplied catalogue. Respect activity, mood, energy, language and region. Return strict JSON with trackIds (all catalogue ids, best first) and a concise explanation under 30 words."
        },
        {
          role: "user",
          content: JSON.stringify({ request: req, catalogue })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "vibe_queue",
          strict: true,
          schema: {
            type: "object",
            properties: {
              trackIds: { type: "array", items: { type: "string" } },
              explanation: { type: "string" }
            },
            required: ["trackIds", "explanation"],
            additionalProperties: false
          }
        }
      }
    });
    const parsed = JSON.parse(response.output_text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI vibe fallback:", error);
    return NextResponse.json({
      trackIds: fallbackIds,
      explanation: "The instant matching engine built this queue from your activity, mood, energy and language."
    });
  }
}
