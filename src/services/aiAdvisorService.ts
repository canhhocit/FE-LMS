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