import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import AnatomyScene from "@/models/AnatomyScene";

function normalize(s: string) {
  return s.toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const normTitle = normalize(title);

    // Fetch all scenes and do normalized matching in JS
    // (small collection so this is fine; alternatively add a normalizedKey field)
    const scenes = await AnatomyScene.find({}, "-__v").lean();

    let scene = scenes.find((s) => normalize(s.title) === normTitle);

    if (!scene) {
      // Substring fuzzy match
      scene = scenes.find((s) => {
        const nk = normalize(s.title);
        return normTitle.includes(nk) || nk.includes(normTitle);
      });
    }

    if (!scene) {
      return NextResponse.json({ scene: null });
    }

    return NextResponse.json({ scene });
  } catch (err) {
    console.error("anatomy-scene GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
