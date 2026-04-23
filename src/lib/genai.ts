import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

const EXAM_GENERATION_PROMPT = `
System Role: You are an expert French language evaluator and an official exam creator for the DALF C1 (Diplôme Approfondi de Langue Française), certified by France Éducation international. Your task is to generate a complete, highly realistic mock exam.

Instructions: 
Generate a DALF C1 mock exam divided into four sections. The content should revolve around complex, contemporary societal themes (e.g., ecology, technology, sociology). You must strictly follow these structural requirements:

Part 1: Compréhension de l'oral (Listening - 25 points)
* Simulated Audio 1 (Long Document): Write a detailed transcript for an 8-minute radio interview, lecture, or conference. Create a 10-question comprehension quiz based on this transcript (a mix of multiple-choice, true/false with justification, and short-answer questions). 
* Simulated Audio 2 (Short Documents): Write transcripts for 3-4 short radio broadcasts (e.g., news flashes, polls, advertisements) totaling no more than 10 minutes of spoken audio. Create 2-3 multiple-choice questions for each snippet. 

Part 2: Compréhension des écrits (Reading - 25 points)
The Text: Write a complex journalistic or literary text presenting ideas or an argument. The text must be between 1,500 and 2,000 words.
The Questions: Generate a 10-to-15 question comprehension quiz. This must require the candidate to read between the lines and draw out implicit meanings. Include multiple-choice questions, short-answer questions, and True/False questions that require the candidate to quote the text to justify their answer.

Part 3: Production écrite (Writing - 25 points)
Provide the candidate with a choice between two domains: "Lettres et sciences humaines" or "Sciences". For the chosen domain, provide the following:
Source Documents: Generate 2 to 3 distinct source texts that share a common theme. Combined, these texts must total exactly 1,000 words.
Task 1 (Synthèse): Instruct the candidate to write a synthesis of the provided documents. The word count must be strictly between 200 and 240 words.
Task 2 (Essai argumenté): Instruct the candidate to write an argumentative essay based on the theme of the documents. The essay must be a minimum of 250 words.

Part 4: Production orale (Speaking - 25 points)
Provide a preparation dossier for the oral exam, allowing the candidate to choose between the Sciences or Humanities domain.
Source Documents: Generate 2 short articles on a highly debatable topic.
* Task 1 (Exposé): Instruct the candidate that they have 1 hour to prepare a clear, structured monologue (introduction, 3-4 main points, conclusion) defending a point of view based on the documents.
* Task 2 (Entretien): Provide 5 challenging, open-ended questions that the "jury" would ask to spark a 15-to-20-minute interactive debate, forcing the candidate to justify their point of view.

Output format: Please output the entire exam content as a JSON object, so it can be rendered dynamically in a frontend application.

The JSON should have the following structure:
{
  "title": "Title of the exam",
  "theme": "Theme of the exam",
  "part1": {
    "title": "Compréhension de l'oral",
    "longDocument": {
      "transcript": "...",
      "questions": [ { "type": "multiple-choice | true-false | short-answer", "question": "...", "options": ["...", "..."], "answerKey": "..." } ]
    },
    "shortDocuments": [
      {
        "transcript": "...",
        "questions": [ { "type": "multiple-choice", "question": "...", "options": ["...", "..."], "answerKey": "..." } ]
      }
    ]
  },
  "part2": {
    "title": "Compréhension des écrits",
    "text": "...",
    "questions": [ { "type": "multiple-choice | true-false | short-answer", "question": "...", "options": ["...", "..."], "answerKey": "..." } ]
  },
  "part3": {
    "title": "Production écrite",
    "domain": "...",
    "sourceDocuments": ["...", "..."],
    "task1Text": "...",
    "task2Text": "..."
  },
  "part4": {
    "title": "Production orale",
    "domain": "...",
    "sourceDocuments": ["...", "..."],
    "task1Text": "...",
    "task2Questions": ["...", "...", "..."]
  }
}
`;

export async function generateMockExam(): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: EXAM_GENERATION_PROMPT,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });
  return response.text || '{}';
}

const MARKING_PROMPT = `
System Role: You are an expert French evaluator for the DALF C1 exam.
You are evaluating a candidate's attempt for a mock DALF C1 exam.

You will be provided with:
1. The original exam content (JSON).
2. The user's answers (JSON) mapped to the sections.

Evaluate their performance very strictly.
List any grammar or vocabulary errors explicitly. Give a score out of 25 for each part, then a total out of 100.
Provide detailed feedback in Markdown format.

Focus especially on:
- Grammar errors in Part 3 (Production écrite) and Part 1/2 short answers.
- Appropriate DALF C1 vocabulary.
- Accuracy of the comprehension answers based on the Answer Keys in the exam JSON.

Return a JSON object in this exact format:
{
  "score": 85,
  "feedback": "# Detailed feedback in markdown\n\n## Errors\n- ...",
  "grammarErrors": ["error 1", "error 2"],
  "vocabErrors": ["error 1", "error 2"]
}
`;

export async function evaluateExamAttempt(examJson: string, userAnswersJson: string): Promise<string> {
  const ai = getGenAI();
  const prompt = `
${MARKING_PROMPT}

EXAM CONTENT:
${examJson}

USER ANSWERS:
${userAnswersJson}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          grammarErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
          vocabErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["score", "feedback", "grammarErrors", "vocabErrors"]
      }
    },
  });
  return response.text || '{}';
}
