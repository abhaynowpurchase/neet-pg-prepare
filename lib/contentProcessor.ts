export interface GeneratedQuestion {
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  examType: "NEET_PG" | "INI_CET" | "UPSC_CMO";
}

export interface GeneratedHighYieldTopic {
  title: string;
  description: string;
  keyPoints: string[];
}

export interface ProcessedContent {
  questions: GeneratedQuestion[];
  highYieldTopics: GeneratedHighYieldTopic[];
}

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch(GROQ_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";

  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** Used by the 24h scheduler — generates mixed questions + high-yield topics */
export async function processChapterContent(
  chapterTitle: string,
  subjectName: string,
  searchContext: string
): Promise<ProcessedContent> {
  const system = `You are an expert NEET PG medical educator. Generate high-quality MCQ questions and high-yield study points for NEET PG aspirants. Respond with valid JSON only — no markdown, no extra text.`;

  const prompt = `
Topic: "${chapterTitle}" (Subject: ${subjectName})
Web search context:
${searchContext}

Return JSON with this exact structure:
{
  "questions": [
    {
      "question": "Clinical vignette question...",
      "options": ["A. Option", "B. Option", "C. Option", "D. Option"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation...",
      "difficulty": "medium",
      "examType": "NEET_PG"
    }
  ],
  "highYieldTopics": [
    {
      "title": "Topic name",
      "description": "One-line clinical relevance",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}

Rules:
- 8 questions total: 4 NEET_PG, 2 INI_CET, 2 UPSC_CMO
- 3 easy, 3 medium, 2 hard
- Clinical vignette style (NEET PG pattern)
- 3 high-yield topics with 4-6 key points each
- correctAnswer = 0-based index
- Raw JSON only`;

  const json = await groqChat(system, prompt);
  const parsed: ProcessedContent = JSON.parse(json);

  if (!Array.isArray(parsed.questions) || !Array.isArray(parsed.highYieldTopics)) {
    throw new Error("Invalid structure from AI");
  }
  return parsed;
}

export type ExamType = "NEET_PG" | "INI_CET" | "UPSC_CMO";

const EXAM_CONTEXT: Record<ExamType, string> = {
  NEET_PG: "NEET PG (National Eligibility cum Entrance Test Postgraduate) — single best answer MCQs, clinical vignette style, tests applied clinical knowledge, 200 questions in 3.5 hours. Recent years: 2019, 2020, 2021, 2022, 2023, 2024.",
  INI_CET: "INI-CET (Institute of National Importance Combined Entrance Test) — AIIMS-style, single best answer, more research-oriented, challenging conceptual questions, tests deeper understanding beyond rote learning. Recent years: 2021, 2022, 2023, 2024.",
  UPSC_CMO: "UPSC CMS/CMO (Combined Medical Services / Central Medical Officer) — UPSC format, mix of factual recall and clinical application, emphasises community medicine, public health, preventive medicine, national health programs. Recent years: 2019, 2020, 2021, 2022, 2023.",
};

/** Used by the PYQ bulk fetcher — generates authentic exam-specific past-year style questions */
export async function generatePYQBatch(
  chapterTitle: string,
  subjectName: string,
  examType: ExamType,
  pageContent: string,
  count = 10
): Promise<GeneratedQuestion[]> {
  const system = `You are a senior medical examiner with 20 years of experience setting questions for ${examType.replace("_", " ")}. You have deep knowledge of the actual question patterns, difficulty levels, and topics tested in this exam. Generate questions that closely match real past-year questions. Respond with valid JSON only.`;

  const prompt = `
Exam: ${EXAM_CONTEXT[examType]}
Chapter: "${chapterTitle}"
Subject: ${subjectName}

Web-sourced reference material:
${pageContent || "(use your knowledge of this exam's actual past year questions)"}

Generate exactly ${count} authentic past-year style MCQ questions for ${examType.replace("_", " ")} on this chapter.

Return a JSON array (no wrapper object):
[
  {
    "question": "A 45-year-old male presents with...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": 1,
    "explanation": "The correct answer is B because... The key concept being tested is...",
    "difficulty": "medium",
    "examType": "${examType}"
  }
]

Strict rules:
- Questions MUST be authentic ${examType.replace("_", " ")} style and pattern
- Clinical vignette format wherever possible
- Options must start with A., B., C., D.
- correctAnswer = 0-based index (0=A, 1=B, 2=C, 3=D)
- Explanation must be detailed (mention mechanism, classic associations, NEET PG recall points)
- Mix of difficulty: ${Math.ceil(count * 0.3)} easy, ${Math.ceil(count * 0.4)} medium, ${Math.floor(count * 0.3)} hard
- Each question must test a DIFFERENT concept within the chapter
- Raw JSON array only, no markdown`;

  const json = await groqChat(system, prompt);

  // Handle both array and wrapped object responses
  let parsed: GeneratedQuestion[];
  const trimmed = json.trim();

  if (trimmed.startsWith("[")) {
    parsed = JSON.parse(trimmed);
  } else {
    const wrapper = JSON.parse(trimmed);
    parsed = wrapper.questions ?? wrapper;
  }

  if (!Array.isArray(parsed)) throw new Error("Expected array of questions");
  return parsed;
}
