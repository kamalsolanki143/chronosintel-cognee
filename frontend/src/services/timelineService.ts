import { apiFetch } from './apiClient';
import type { TimelineEvent, VersionEntry } from './mockData';

function mapBackendTimelineEvent(item: any, caseId: string): TimelineEvent {
  const confidence = item.confidence ?? 1.0;
  const importance: TimelineEvent['importance'] =
    confidence >= 0.8 ? 'critical' : confidence >= 0.6 ? 'high' : 'medium';

  return {
    id: item.event_id,
    caseId,
    title: item.title,
    description: item.description || '',
    timestamp: item.event_time || new Date().toISOString(),
    category: 'action',
    source: item.source_document || 'Knowledge Graph',
    importance,
    evidenceIds: [],
  };
}

function mapVersionToVersionEntry(v: any, caseId: string): VersionEntry {
  return {
    id: v.version_id,
    version: v.version_number,
    caseId: caseId,
    timestamp: v.created_at,
    summary: v.label || `Uploaded evidence snapshot`,
    author: 'AI Investigator',
    changes: v.description ? [v.description] : [`Ingested new evidence (entities: ${v.entity_count}, events: ${v.event_count})`],
  };
}

export async function fetchTimelineEvents(caseId: string): Promise<TimelineEvent[]> {
  try {
    const data = await apiFetch<any>(`/api/timeline/${caseId}`);
    return (data.events || []).map((e: any) => mapBackendTimelineEvent(e, caseId));
  } catch (_) {
    return [];
  }
}

export async function fetchVersionHistory(caseId: string): Promise<VersionEntry[]> {
  try {
    const versions = await apiFetch<any[]>(`/api/memory/${caseId}/versions`);
    return versions.map(v => mapVersionToVersionEntry(v, caseId)).sort((a, b) => b.version - a.version);
  } catch (_) {
    return [];
  }
}
