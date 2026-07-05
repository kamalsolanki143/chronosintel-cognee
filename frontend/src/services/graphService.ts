import { apiFetch } from './apiClient';
import type { GraphNode, GraphLink } from './mockData';

export async function fetchGraphData(
  caseId: string
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  try {
    const data = await apiFetch<any>(`/api/graph/${caseId}`);
    
    const typeMap: Record<string, any> = {
      person: 'person',
      organization: 'organization',
      location: 'location',
      event: 'event',
      document: 'document',
      system: 'system',
      datetime: 'timestamp',
    };

    const nodes: GraphNode[] = (data.nodes || []).map((n: any) => ({
      id: n.id,
      name: n.label,
      type: typeMap[n.type] || 'person',
      caseId: caseId,
      properties: n.attributes || {},
      mentions: n.attributes?.mentions || 1,
      firstSeen: n.attributes?.firstSeen || new Date().toISOString(),
      lastSeen: n.attributes?.lastSeen || new Date().toISOString(),
      connections: [],
    }));

    const links: GraphLink[] = (data.edges || []).map((e: any) => ({
      source: e.source,
      target: e.target,
      type: e.label,
      strength: e.weight || 1.0,
      label: e.label,
    }));

    return { nodes, links };
  } catch (_) {
    return { nodes: [], links: [] };
  }
}

export async function fetchNodeDetails(
  nodeId: string
): Promise<GraphNode | undefined> {
  // Nodes are fetched in bulk with fetchGraphData, but we can look it up or return dummy.
  return undefined;
}
