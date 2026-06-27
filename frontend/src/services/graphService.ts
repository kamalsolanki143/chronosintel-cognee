import { mockGraphData, mockEntities, type GraphNode, type GraphLink } from './mockData';

export async function fetchGraphData(
  caseId: string
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const filteredNodes = mockGraphData.nodes.filter((n) => n.caseId === caseId);
  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = mockGraphData.links.filter(
    (l) => nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
  );

  return { nodes: filteredNodes, links: filteredLinks };
}

export async function fetchNodeDetails(
  nodeId: string
): Promise<GraphNode | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockGraphData.nodes.find((n) => n.id === nodeId);
}
