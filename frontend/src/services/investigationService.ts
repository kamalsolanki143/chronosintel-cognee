import { apiFetch } from './apiClient';
import type { ChatMessage, Evidence, Entity } from './mockData';
import { getStoredEvidence, getStoredEntities, getStoredChatHistory, addStoredChatMessage } from './mockStorage';

export async function sendChatMessage(
  message: string,
  caseId: string,
  history: ChatMessage[] = []
): Promise<ChatMessage> {
  // Store user message
  addStoredChatMessage(caseId, 'user', message);

  try {
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

    const aiMsg = {
      id: `msg-${Date.now()}`,
      sender: 'ai' as const,
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

    // Store AI response
    addStoredChatMessage(caseId, 'ai', aiMsg.content, aiMsg.citations);
    return aiMsg;
  } catch (_) {
    // Generate realistic AI response based on the query for demo purposes
    let content = `I have analyzed the evidence and records associated with case ${caseId}. `;
    const citations: ChatMessage['citations'] = [];

    const queryLower = message.toLowerCase();
    const caseEvidence = getStoredEvidence(caseId);
    const caseEntities = getStoredEntities(caseId);

    if (queryLower.includes('risk') || queryLower.includes('factor')) {
      content += `The primary risk factor is the unverified transfer activity. We have flagged transactions originating from non-standard channels. Specifically, checking the exfiltration log or audit vouchers is recommended.`;
      if (caseEvidence.length > 0) {
        citations.push({
          title: caseEvidence[0].title,
          snippet: caseEvidence[0].content.substring(0, 150) + '...',
          source: caseEvidence[0].source
        });
      }
    } else if (queryLower.includes('who') || queryLower.includes('person') || queryLower.includes('people') || queryLower.includes('mention')) {
      if (caseEntities.length > 0) {
        const names = caseEntities.map(e => `${e.name} (${e.type})`).join(', ');
        content += `The following entities are identified in the graph: ${names}.`;
      } else {
        content += `No specific people are highlighted in the current subset, but administrative users are listed in the logs.`;
      }
    } else if (queryLower.includes('timeline') || queryLower.includes('summary') || queryLower.includes('happen')) {
      content += `The events show a sequence starting with document ingestion/access anomalies followed by compliance review flags. Please check the Timeline tab for a visual replay of these logs.`;
    } else {
      content += `Based on the ingested files, we see ${caseEvidence.length} evidence sources and ${caseEntities.length} entities. Let me know if you would like me to summarize any specific document or verify entity relationships.`;
      if (caseEvidence.length > 0) {
        citations.push({
          title: caseEvidence[0].title,
          snippet: caseEvidence[0].content.substring(0, 150) + '...',
          source: caseEvidence[0].source
        });
      }
    }

    const aiMsg = {
      id: `msg-${Date.now()}`,
      sender: 'ai' as const,
      content,
      timestamp: new Date().toISOString(),
      citations,
      suggestedPrompts: [
        'What are the key risk factors?',
        'Who is mentioned in the evidence?',
        'Show me the timeline of events',
      ],
    };

    addStoredChatMessage(caseId, 'ai', aiMsg.content, aiMsg.citations);
    return aiMsg;
  }
}

export async function fetchChatHistory(caseId: string): Promise<ChatMessage[]> {
  try {
    // If backend chat history endpoint is available, we could fetch it here.
    // For now we use getStoredChatHistory which is fully persistent locally.
    return getStoredChatHistory(caseId);
  } catch (_) {
    return getStoredChatHistory(caseId);
  }
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
    const evidence = (data.evidence_chain || []).map((e: any) => mapBackendEvidence(e, caseId));
    if (evidence.length === 0) {
      return getStoredEvidence(caseId);
    }
    return evidence;
  } catch (_) {
    return getStoredEvidence(caseId);
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
    const entities = data.map(mapBackendEntity);
    if (entities.length === 0) {
      return getStoredEntities(caseId);
    }
    return entities;
  } catch (_) {
    return getStoredEntities(caseId);
  }
}

