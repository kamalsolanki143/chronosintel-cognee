import { mockCases, mockCaseUpdates, type Case, type CaseUpdate } from './mockData';

export async function fetchCases(): Promise<Case[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockCases;
}

export async function fetchCaseById(id: string): Promise<Case | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCases.find((c) => c.id === id);
}

export async function fetchCaseUpdates(caseId: string): Promise<CaseUpdate[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockCaseUpdates.filter((u) => u.caseId === caseId);
}
