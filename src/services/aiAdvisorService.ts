import { apiClient, unwrap } from './api/client';

export interface StudyPlanStep {
  stepOrder: number;
  actionTitle: string;
  description: string;
  timeframe: string;
}

export interface AiAdvisorResponse {
  studentId: number;
  studentName: string;
  gpa: number;
  academicStatus: 'GOOD' | 'EXCELLENT' | 'WARNING' | string;
  learningStyle: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  studyPlan: StudyPlanStep[];
  aiAdviceSummary: string;
}

export const getMyAiAdvisorAnalysis = async (): Promise<AiAdvisorResponse> =>
  unwrap(apiClient.get('/ai/advisor/my-analysis'));

export const askAiAdvisor = async (customQuery: string, studentId?: number): Promise<AiAdvisorResponse> =>
  unwrap(apiClient.post('/ai/advisor/ask', { customQuery, studentId }));

export const chatWithHikari = async (prompt: string): Promise<{ reply: string }> =>
  unwrap(apiClient.post('/ai/advisor/chat', { prompt }));

// ===== AI Personalization Preferences =====
export interface UserAiPreference {
  id?: number;
  preferredName?: string;
  toneStyle?: string;
  responseLength?: string;
  personalContext?: string;
}

export const getMyAiPreference = async (): Promise<UserAiPreference> =>
  unwrap(apiClient.get('/api/v1/ai/preferences'));

export const updateMyAiPreference = async (data: UserAiPreference): Promise<UserAiPreference> =>
  unwrap(apiClient.put('/api/v1/ai/preferences', data));

// ===== Spring AI RAG Knowledge Base =====
export interface RagQueryRequest {
  classId?: number;
  query: string;
}

export interface RagQueryResponse {
  answer: string;
  sources?: string[];
}

export const queryRagMaterials = async (request: RagQueryRequest): Promise<RagQueryResponse> =>
  unwrap(apiClient.post('/api/v1/ai/rag/query', request));