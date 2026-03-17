export interface IUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: string;
}

export interface ISubject {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  chaptersCount?: number;
  createdAt: string;
}

export interface IChapter {
  _id: string;
  subjectId: string;
  title: string;
  description: string;
  storyContent: string;
  highYieldNotes: string;
  order: number;
  estimatedReadTime: number;
  createdAt: string;
}

export type ExamType = "NEET_PG" | "INI_CET" | "UPSC_CMO";

export interface IQuestion {
  _id: string;
  chapterId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examType: ExamType;
  year: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface IHighYieldTopic {
  _id: string;
  chapterId: string;
  title: string;
  description: string;
  keyPoints: string[];
  questions: IQuestion[];
}

export interface IUserProgress {
  _id: string;
  userId: string;
  chapterId: string;
  storyCompleted: boolean;
  quizScore?: number;
  questionsAttempted: number;
  questionsCorrect: number;
  lastAccessedAt: string;
}

export interface QuizState {
  questions: IQuestion[];
  currentIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  score: number;
  timeLeft: number;
  isComplete: boolean;
  answers: { questionId: string; selected: number; correct: boolean }[];
}
