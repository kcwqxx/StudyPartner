export interface RecitationUnitData {
  title: string;
  sourceText: string;
  keywords: string[];
  recitationType: "free" | "qa" | "fill-blank";
  difficulty: number;
  estimatedMinutes: number;
}

export interface LLMRecitationResponse {
  score: number;
  passed: boolean;
  missing_keywords: string[];
  feedback: string;
  next_action: "review" | "next" | "repeat";
}

export interface LLMGenerateUnitsResponse {
  units: RecitationUnitData[];
}

export interface AgentSettingsData {
  persona: string;
  strictness: string;
  hintLevel: string;
  feedbackLength: string;
  language: string;
}

export interface ModelSettingsData {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalUnits: number;
  masteredUnits: number;
  learningUnits: number;
  mistakesCount: number;
  todayTasks: number;
  completedToday: number;
}
