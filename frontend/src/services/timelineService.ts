import { apiFetch } from './apiClient';
import type { TimelineEvent, VersionEntry } from './mockData';
import { getStoredTimelineEvents, getStoredEvidence } from './mockStorage';

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
    const events = (data.events || []).map((e: any) => mapBackendTimelineEvent(e, caseId));
    if (events.length === 0) {
      return getStoredTimelineEvents(caseId);
    }
    return events;
  } catch (_) {
    return getStoredTimelineEvents(caseId);
  }
}

export async function fetchVersionHistory(caseId: string): Promise<VersionEntry[]> {
  try {
    const versions = await apiFetch<any[]>(`/api/memory/${caseId}/versions`);
    if (!versions || versions.length === 0) {
      return generateMockVersions(caseId);
    }
    return versions.map(v => mapVersionToVersionEntry(v, caseId)).sort((a, b) => b.version - a.version);
  } catch (_) {
    return generateMockVersions(caseId);
  }
}

function generateMockVersions(caseId: string): VersionEntry[] {
  const evidence = getStoredEvidence(caseId);
  const versions: VersionEntry[] = [];
  
  // Create one version per evidence item
  evidence.forEach((ev, idx) => {
    const verNum = evidence.length - idx;
    versions.push({
      id: `ver-${caseId}-${verNum}`,
      caseId,
      version: verNum,
      timestamp: ev.timestamp,
      author: 'AI Investigator',
      summary: `Ingested: ${ev.title}`,
      changes: [
        `Processed source document: ${ev.source}`,
        `Extracted related entities and events`,
        `Updated knowledge graph structure`
      ]
    });
  });

  if (versions.length === 0) {
    // Return a default initial version if no evidence exists yet
    return [
      {
        id: `ver-${caseId}-1`,
        caseId,
        version: 1,
        timestamp: new Date().toISOString(),
        author: 'System',
        summary: 'Case Initialized',
        changes: ['Created empty investigation case workspace']
      }
    ];
  }

  return versions;
}

