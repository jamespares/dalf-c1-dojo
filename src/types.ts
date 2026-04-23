export interface Question {
  type: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: string[];
  answerKey: string;
}

export interface Part1 {
  title: string;
  longDocument: {
    transcript: string;
    questions: Question[];
  };
  shortDocuments: Array<{
    transcript: string;
    questions: Question[];
  }>;
}

export interface Part2 {
  title: string;
  text: string;
  questions: Question[];
}

export interface Part3 {
  title: string;
  domain: string;
  sourceDocuments: string[];
  task1Text: string;
  task2Text: string;
}

export interface Part4 {
  title: string;
  domain: string;
  sourceDocuments: string[];
  task1Text: string;
  task2Questions: string[];
}

export interface ExamContent {
  title: string;
  theme: string;
  part1: Part1;
  part2: Part2;
  part3: Part3;
  part4: Part4;
}

export interface Exam {
  id: string;
  userId: string;
  content: string; // JSON string of ExamContent
  createdAt: number;
}

export interface Attempt {
  id: string;
  userId: string;
  examId: string;
  answers: string; // JSON string
  score?: number;
  feedback?: string; // JSON string from evaluateExamAttempt
  createdAt: number;
}
