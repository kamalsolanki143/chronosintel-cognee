import { apiFetch } from './apiClient';
import type { ChatMessage, Evidence, Entity } from './mockData';

export async function sendChatMessage(
  message: string,
  caseId: string,
  history: ChatMessage[] = []
): Promise<ChatMessage> {
  const backendHistory = history
    .filter(msg => msg.id !== 'welcome') // exclude welcome greeting
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

  const response = await apiFetch<any>('/api/chat/', {
    method: 'POST',
    body: JSON.stringify({
      case_id: caseId,
      message,
      conversation_history: backendHistory,
      max_history: 10
    }),
  });

  return {
    id: `msg-${Date.now()}`,
    sender: 'ai',
    content: response.message,
    timestamp: new Date().toISOString(),
    citations: (response.evidence || []).map((e: any) => ({
      title: e.document_name || 'Evidence Source',
      snippet: e.text_excerpt || '',
      source: e.document_name || 'Source',
    })),
    suggestedPrompts: [
      'Show me the entity relationship graph',
      'What are the key risk factors?',
      'Generate a timeline summary',
    ],
  };
}

export async function fetchChatHistory(caseId: string): Promise<ChatMessage[]> {
  return [
    {
      id: 'welcome',
      sender: 'ai',
      content: `Welcome to the AI Investigation Chat for case ${caseId}. Ask me any questions about the evidence, timeline, or entities.`,
      timestamp: new Date().toISOString(),
      suggestedPrompts: [
        'What are the key risk factors?',
        'Who is mentioned in the evidence?',
        'Show me the timeline of events',
      ],
    },
  ];
}

function mapBackendEvidence(item: any, caseId: string): Evidence {
  const name = item.document_name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  let type: Evidence['type'] = 'document';
  if (['eml', 'msg'].includes(ext)) type = 'email';
  else if (['json', 'xml', 'html'].includes(ext)) type = 'code';
  else if (['log'].includes(ext)) type = 'log';
  else if (['mp4', 'webm'].includes(ext)) type = 'meeting';

  return {
    id: item.id || `ev-${Math.random()}`,
    caseId: caseId,
    title: item.explanation || item.document_name || 'Evidence Item',
    type,
    source: item.document_name || 'Knowledge Graph',
    content: item.text_excerpt || '',
    timestamp: item.timestamp || new Date().toISOString(),
    extracted: item.evidence_type === 'direct',
    entities: item.entity_name ? [item.entity_name] : [],
  };
}

export async function fetchEvidence(caseId: string): Promise<Evidence[]> {
  try {
    const data = await apiFetch<any>(`/api/evidence/${caseId}`);
    return (data.evidence_chain || []).map((e: any) => mapBackendEvidence(e, caseId));
  } catch (_) {
    return [];
  }
}

function mapBackendEntity(item: any): Entity {
  const typeMap: Record<string, Entity['type']> = {
    person: 'person',
    organization: 'organization',
    location: 'location',
    event: 'event',
    document: 'document',
    system: 'system',
    datetime: 'timestamp',
  };

  return {
    id: item.id,
    name: item.name,
    type: typeMap[item.entity_type] || 'person',
    caseId: item.case_id,
    properties: {
      Description: item.description || 'Extracted entity',
      Aliases: (item.aliases || []).join(', ') || 'None',
    },
    mentions: 1,
    firstSeen: item.created_at,
    lastSeen: item.created_at,
  };
}

export async function fetchEntities(caseId: string): Promise<Entity[]> {
  try {
    const data = await apiFetch<any[]>(`/api/memory/${caseId}/entities`);
    return data.map(mapBackendEntity);
  } catch (_) {
    return [];
  }
}
