import { mockTimelineEvents, mockVersionEntries, type TimelineEvent, type VersionEntry } from './mockData';

export async function fetchTimelineEvents(caseId: string): Promise<TimelineEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockTimelineEvents
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function fetchVersionHistory(caseId: string): Promise<VersionEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockVersionEntries
    .filter((v) => v.caseId === caseId)
    .sort((a, b) => b.version - a.version);
}
