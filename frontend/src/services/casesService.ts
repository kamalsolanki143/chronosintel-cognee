import { apiFetch } from './apiClient';
import type { Case, CaseUpdate } from './mockData';
import { getStoredCases, addStoredCase } from './mockStorage';

function mapBackendCase(backendCase: any, memoryData?: any): Case {
  const statusMap: Record<string, Case['status']> = {
    created: 'pending',
    ingesting: 'active',
    building_graph: 'active',
    ready: 'active',
    investigating: 'active',
    closed: 'closed',
  };

  return {
    id: backendCase.id,
    title: backendCase.title,
    description: backendCase.description || '',
    status: statusMap[backendCase.status] || 'active',
    severity: backendCase.metadata?.severity || 'medium',
    sourceTypes: backendCase.metadata?.sourceTypes || ['document'],
    entities: memoryData ? memoryData.entity_count : (backendCase.entity_count || 0),
    evidence: memoryData ? (memoryData.relationship_count || memoryData.document_count) : (backendCase.relationship_count || backendCase.document_count || 0),
    events: memoryData ? memoryData.event_count : (backendCase.event_count || 0),
    assignee: backendCase.investigator || 'Dr. Sarah Chen',
    createdAt: backendCase.created_at,
    updatedAt: backendCase.updated_at,
    riskScore: backendCase.metadata?.riskScore || 65,
    tags: backendCase.tags || [],
  };
}

function mapVersionToCaseUpdate(v: any, caseId: string): CaseUpdate {
  return {
    id: v.version_id,
    caseId: caseId,
    type: 'evidence_added',
    timestamp: v.created_at,
    description: v.description || v.label || `Case updated to Version ${v.version_number}`,
    user: 'AI Investigator',
  };
}

export async function fetchCases(): Promise<Case[]> {
  try {
    const data = await apiFetch<{ cases: any[] }>('/api/investigation/cases');
    if (!data || !data.cases || data.cases.length === 0) {
      return getStoredCases();
    }
    const mapped = await Promise.all(data.cases.map(async (c) => {
      try {
        const memory = await apiFetch<any>(`/api/memory/${c.id}`);
        return mapBackendCase(c, memory);
      } catch (_) {
        return mapBackendCase(c);
      }
    }));
    return mapped;
  } catch (_) {
    return getStoredCases();
  }
}

export async function fetchCaseById(id: string): Promise<Case | undefined> {
  try {
    const caseData = await apiFetch<any>(`/api/investigation/cases/${id}`);
    const memory = await apiFetch<any>(`/api/memory/${id}`);
    return mapBackendCase(caseData, memory);
  } catch (err) {
    console.warn("fetchCaseById failed, using stored cases fallback:", err);
    return getStoredCases().find(c => c.id === id);
  }
}

export async function fetchCaseUpdates(caseId: string): Promise<CaseUpdate[]> {
  try {
    const versions = await apiFetch<any[]>(`/api/memory/${caseId}/versions`);
    if (!versions || versions.length === 0) {
      return getStoredTimelineEvents(caseId) as unknown as CaseUpdate[];
    }
    return versions.map(v => mapVersionToCaseUpdate(v, caseId));
  } catch (_) {
    // Return mock updates mapped from timeline events
    const events = getStoredTimelineEvents(caseId);
    return events.map((ev, idx) => ({
      id: `upd-${ev.id}`,
      caseId,
      type: ev.category === 'incident' ? 'entity_discovered' : 'evidence_added',
      description: ev.description,
      timestamp: ev.timestamp,
      user: ev.source
    }));
  }
}

// Fallback helper to import events
import { getStoredTimelineEvents } from './mockStorage';

export async function createCase(title: string, description: string, investigator: string): Promise<Case> {
  try {
    const res = await apiFetch<any>('/api/investigation/cases', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description,
        investigator,
      }),
    });
    return mapBackendCase(res);
  } catch (_) {
    return addStoredCase(title, description, investigator);
  }
}
