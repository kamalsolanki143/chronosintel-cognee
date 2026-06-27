import {
  mockChatMessages,
  mockEvidence,
  mockEntities,
  type ChatMessage,
  type Evidence,
  type Entity,
} from './mockData';

export async function sendChatMessage(
  message: string,
  caseId: string
): Promise<ChatMessage> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const responses: Record<string, ChatMessage> = {
    default: {
      id: `MSG-${Date.now()}`,
      sender: 'ai',
      content: `I've analyzed the available data for case ${caseId}. Based on the evidence collected, I can provide the following insights:\n\n**Key Findings:**\n1. Multiple evidence items indicate a coordinated pattern\n2. Entity relationships suggest connections that warrant further investigation\n3. Timeline analysis reveals critical decision points\n\nWould you like me to dive deeper into any specific area?`,
      timestamp: new Date().toISOString(),
      suggestedPrompts: [
        'Show me the entity relationship graph',
        'What are the key risk factors?',
        'Generate a timeline summary',
      ],
    },
  };

  const response = responses['default'];

  return {
    ...response,
    suggestedPrompts: [
      'Show me the entity relationship graph',
      'What are the key risk factors?',
      'Generate a timeline summary',
    ],
  };
}

export async function fetchChatHistory(caseId: string): Promise<ChatMessage[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockChatMessages.filter((m) => m.sender === 'user' || m.sender === 'ai');
}

export async function fetchEvidence(caseId: string): Promise<Evidence[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockEvidence.filter((e) => e.caseId === caseId);
}

export async function fetchEntities(caseId: string): Promise<Entity[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockEntities.filter((e) => e.caseId === caseId);
}
