import type { Case, Evidence, Entity, TimelineEvent, GraphNode, GraphLink, Report, ChatMessage } from './mockData';
import { mockCases, mockEvidence, mockGraphData, mockActivityItems } from './mockData';

// Helper to check if localStorage is available
const isBrowser = typeof window !== 'undefined';

function getSessionData<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch (_) {
    return defaultValue;
  }
}

function setSessionData<T>(key: string, value: T): void {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize cases
export function getStoredCases(): Case[] {
  return getSessionData<Case[]>('chronos_cases', mockCases);
}

export function addStoredCase(title: string, description: string, investigator: string): Case {
  const cases = getStoredCases();
  const newId = `CASE-00${cases.length + 1}`;
  const newCase: Case = {
    id: newId,
    title,
    description,
    status: 'active',
    severity: 'high',
    sourceTypes: ['PDF Document', 'Email', 'Logs'],
    entities: 4,
    evidence: 1,
    events: 3,
    assignee: investigator || 'Dr. Sarah Chen',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    riskScore: 75,
    tags: ['uploaded', 'document-analysis'],
  };
  cases.unshift(newCase);
  setSessionData('chronos_cases', cases);
  
  // Seed initial data for this new case
  seedCaseData(newId, title);
  
  return newCase;
}

export function updateCaseStats(caseId: string, stats: { entities: number; evidence: number; events: number }) {
  const cases = getStoredCases();
  const idx = cases.findIndex(c => c.id === caseId);
  if (idx !== -1) {
    cases[idx] = {
      ...cases[idx],
      ...stats,
      updatedAt: new Date().toISOString(),
    };
    setSessionData('chronos_cases', cases);
  }
}

// Initialize Evidence
export function getStoredEvidence(caseId: string): Evidence[] {
  const allEvidence = getSessionData<Evidence[]>('chronos_evidence', mockEvidence);
  return allEvidence.filter(e => e.caseId === caseId);
}

export function addStoredEvidence(caseId: string, title: string, type: Evidence['type'], source: string, content: string): Evidence {
  const allEvidence = getSessionData<Evidence[]>('chronos_evidence', mockEvidence);
  const newEvidence: Evidence = {
    id: `EVD-${String(allEvidence.length + 1).padStart(3, '0')}`,
    caseId,
    title,
    type,
    source,
    content,
    timestamp: new Date().toISOString(),
    extracted: true,
    entities: [],
    fileSize: '1.2 MB'
  };
  allEvidence.unshift(newEvidence);
  setSessionData('chronos_evidence', allEvidence);
  
  // Update case counts
  const caseEvidence = allEvidence.filter(e => e.caseId === caseId);
  const caseEntities = getStoredEntities(caseId);
  const caseEvents = getStoredTimelineEvents(caseId);
  updateCaseStats(caseId, {
    evidence: caseEvidence.length,
    entities: caseEntities.length,
    events: caseEvents.length
  });

  return newEvidence;
}

// Initialize Entities
export function getStoredEntities(caseId: string): Entity[] {
  const defaultEntities = mockGraphData.nodes.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type,
    caseId: n.caseId,
    properties: n.properties,
    mentions: n.mentions,
    firstSeen: n.firstSeen,
    lastSeen: n.lastSeen
  }));
  const allEntities = getSessionData<Entity[]>('chronos_entities', defaultEntities);
  return allEntities.filter(e => e.caseId === caseId);
}

// Initialize Timeline Events
export function getStoredTimelineEvents(caseId: string): TimelineEvent[] {
  // Extract default timeline events from mock data or generate some
  const allEvents = getSessionData<TimelineEvent[]>('chronos_timeline_events', defaultTimelineEvents);
  return allEvents.filter(e => e.caseId === caseId);
}

// Initialize Graph Data
export function getStoredGraphData(caseId: string): { nodes: GraphNode[]; links: GraphLink[] } {
  const allNodes = getSessionData<GraphNode[]>('chronos_graph_nodes', mockGraphData.nodes);
  const allLinks = getSessionData<GraphLink[]>('chronos_graph_links', mockGraphData.links);
  
  return {
    nodes: allNodes.filter(n => n.caseId === caseId),
    links: allLinks.filter(l => {
      const nodeIds = new Set(allNodes.filter(n => n.caseId === caseId).map(n => n.id));
      return nodeIds.has(l.source) && nodeIds.has(l.target);
    })
  };
}

// Initialize Reports
export function getStoredReports(caseId: string): Report[] {
  const allReports = getSessionData<Report[]>('chronos_reports', initialReports);
  return allReports.filter(r => r.caseId === caseId);
}

export function addStoredReport(caseId: string, title: string, summary: string, sections: Report['sections']): Report {
  const allReports = getSessionData<Report[]>('chronos_reports', initialReports);
  const newReport: Report = {
    id: `REP-${String(allReports.length + 1).padStart(3, '0')}`,
    caseId,
    title,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    findings: sections.length,
    evidenceCited: getStoredEvidence(caseId).length,
    summary,
    sections
  };
  allReports.unshift(newReport);
  setSessionData('chronos_reports', allReports);
  return newReport;
}

// Initialize Chat History
export function getStoredChatHistory(caseId: string): ChatMessage[] {
  const allHistory = getSessionData<Record<string, ChatMessage[]>>('chronos_chat_history', {});
  if (!allHistory[caseId]) {
    allHistory[caseId] = [
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
      }
    ];
    setSessionData('chronos_chat_history', allHistory);
  }
  return allHistory[caseId];
}

export function addStoredChatMessage(caseId: string, sender: 'user' | 'ai', content: string, citations?: ChatMessage['citations']): ChatMessage {
  const allHistory = getSessionData<Record<string, ChatMessage[]>>('chronos_chat_history', {});
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    sender,
    content,
    timestamp: new Date().toISOString(),
    citations,
    suggestedPrompts: sender === 'ai' ? [
      'Show me the entity relationship graph',
      'What are the key risk factors?',
      'Generate a timeline summary',
    ] : undefined
  };
  if (!allHistory[caseId]) {
    allHistory[caseId] = [];
  }
  allHistory[caseId].push(newMessage);
  setSessionData('chronos_chat_history', allHistory);
  return newMessage;
}

// Seed helper for new uploaded cases
function seedCaseData(caseId: string, documentTitle: string) {
  const cleanTitle = documentTitle.replace(/\.[^/.]+$/, ""); // strip extension
  
  // Add Evidence item representing the uploaded document
  const allEvidence = getSessionData<Evidence[]>('chronos_evidence', mockEvidence);
  const docId = `EVD-${String(allEvidence.length + 1).padStart(3, '0')}`;
  const docEvidence: Evidence = {
    id: docId,
    caseId,
    title: documentTitle,
    type: 'document',
    source: documentTitle,
    content: `Forensic audit content extracted from uploaded file: ${documentTitle}.\nInitial scan reveals multiple financial transactions, audit summaries, and email trails related to regional operations. Verification check shows discrepancies in international accounts transfer records.`,
    timestamp: new Date().toISOString(),
    extracted: true,
    entities: [`ENT-${caseId}-01`, `ENT-${caseId}-02`],
    fileSize: '3.4 MB'
  };
  allEvidence.unshift(docEvidence);
  setSessionData('chronos_evidence', allEvidence);

  // Add 2 more pieces of supporting evidence
  const emailId = `EVD-${String(allEvidence.length + 2).padStart(3, '0')}`;
  const emailEvidence: Evidence = {
    id: emailId,
    caseId,
    title: 'FW: Urgent verification of transfer records',
    type: 'email',
    source: 'Outlook Exchange Server',
    content: `From: compliance@chronosintel.com\nTo: finance-team@chronosintel.com\nSubject: FW: Urgent verification of transfer records\n\nAll, please review the attached document ${documentTitle} immediately. We need to verify if the $150,000 transaction listed on page 4 has been authorized.`,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    extracted: true,
    entities: [`ENT-${caseId}-01`],
    fileSize: '45 KB'
  };
  allEvidence.unshift(emailEvidence);

  const logId = `EVD-${String(allEvidence.length + 3).padStart(3, '0')}`;
  const logEvidence: Evidence = {
    id: logId,
    caseId,
    title: 'Access logs - File Server',
    type: 'log',
    source: 'Active Directory Logs',
    content: `User "finance_user_02" accessed path /shares/finance/transfers/${documentTitle} outside normal working hours (23:14:02 UTC). File download size 3.4MB. Source IP: 192.168.4.12.`,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    extracted: true,
    entities: [`ENT-${caseId}-03`],
    fileSize: '12 KB'
  };
  allEvidence.unshift(logEvidence);
  setSessionData('chronos_evidence', allEvidence);

  // Add Entities
  const allEntities = getSessionData<Entity[]>('chronos_entities', []);
  const entities: Entity[] = [
    {
      id: `ENT-${caseId}-01`,
      name: 'Johnathan Archer',
      type: 'person',
      caseId,
      properties: { Title: 'Regional VP Finance', Status: 'Under Investigation' },
      mentions: 5,
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date().toISOString()
    },
    {
      id: `ENT-${caseId}-02`,
      name: 'Chronos Corp European Branch',
      type: 'organization',
      caseId,
      properties: { Location: 'Zurich, Switzerland', Type: 'Subsidiary Office' },
      mentions: 8,
      firstSeen: new Date(Date.now() - 86400000).toISOString(),
      lastSeen: new Date().toISOString()
    },
    {
      id: `ENT-${caseId}-03`,
      name: 'IP 192.168.4.12',
      type: 'system',
      caseId,
      properties: { Owner: 'Finance Subnet Client', Location: 'VPN Gateway' },
      mentions: 3,
      firstSeen: new Date(Date.now() - 7200000).toISOString(),
      lastSeen: new Date().toISOString()
    },
    {
      id: `ENT-${caseId}-04`,
      name: 'Transfer Transaction $150,000',
      type: 'event',
      caseId,
      properties: { Amount: '$150,000 USD', Status: 'Unverified' },
      mentions: 4,
      firstSeen: new Date(Date.now() - 3600000).toISOString(),
      lastSeen: new Date().toISOString()
    }
  ];
  allEntities.push(...entities);
  setSessionData('chronos_entities', allEntities);

  // Add Timeline Events
  const allEvents = getSessionData<TimelineEvent[]>('chronos_timeline_events', defaultTimelineEvents);
  const events: TimelineEvent[] = [
    {
      id: `EVT-${caseId}-01`,
      caseId,
      title: 'Off-hours file download',
      description: `User account accessed and downloaded ${documentTitle} at 23:14 UTC from IP 192.168.4.12.`,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      category: 'incident',
      source: 'Active Directory Logs',
      importance: 'high',
      evidenceIds: [logId]
    },
    {
      id: `EVT-${caseId}-02`,
      caseId,
      title: 'Compliance email alert',
      description: 'Compliance officer flags unverified transaction of $150,000 mentioned in transfer records.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      category: 'communication',
      source: 'Outlook Exchange Server',
      importance: 'medium',
      evidenceIds: [emailId]
    },
    {
      id: `EVT-${caseId}-03`,
      caseId,
      title: 'Evidence analysis initiated',
      description: `Forensic audit report ${documentTitle} was uploaded to ChronosIntel. Entity extraction complete.`,
      timestamp: new Date().toISOString(),
      category: 'action',
      source: 'ChronosIntel Ingestion',
      importance: 'high',
      evidenceIds: [docId]
    }
  ];
  allEvents.push(...events);
  setSessionData('chronos_timeline_events', allEvents);

  // Add Graph Nodes & Links
  const allNodes = getSessionData<GraphNode[]>('chronos_graph_nodes', mockGraphData.nodes);
  const allLinks = getSessionData<GraphLink[]>('chronos_graph_links', mockGraphData.links);

  const newNodes: GraphNode[] = entities.map(e => ({
    ...e,
    connections: []
  }));
  
  newNodes[0].connections = [`ENT-${caseId}-02`, `ENT-${caseId}-04`];
  newNodes[1].connections = [`ENT-${caseId}-01`];
  newNodes[2].connections = [`ENT-${caseId}-01`];
  newNodes[3].connections = [`ENT-${caseId}-01`, `ENT-${caseId}-02`];

  const newLinks: GraphLink[] = [
    { source: `ENT-${caseId}-01`, target: `ENT-${caseId}-02`, type: 'employed_by', strength: 0.9, label: 'employed by' },
    { source: `ENT-${caseId}-03`, target: `ENT-${caseId}-01`, type: 'authenticated_as', strength: 0.8, label: 'authenticated as' },
    { source: `ENT-${caseId}-01`, target: `ENT-${caseId}-04`, type: 'authorized', strength: 0.85, label: 'authorized' },
    { source: `ENT-${caseId}-04`, target: `ENT-${caseId}-02`, type: 'transferred_to', strength: 0.95, label: 'transferred to' }
  ];

  allNodes.push(...newNodes);
  allLinks.push(...newLinks);
  setSessionData('chronos_graph_nodes', allNodes);
  setSessionData('chronos_graph_links', allLinks);

  // Add initial draft report
  const allReports = getSessionData<Report[]>('chronos_reports', initialReports);
  const report: Report = {
    id: `REP-${String(allReports.length + 1).padStart(3, '0')}`,
    caseId,
    title: `Forensic Analysis Report: ${cleanTitle}`,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    findings: 2,
    evidenceCited: 3,
    summary: `This report contains forensic analysis findings extracted from the uploaded document "${documentTitle}" and related communication/access logs. Key concerns center around an unauthorized transaction of $150,000 authorized by Johnathan Archer to a European branch subsidiary.`,
    sections: [
      {
        title: 'Background and Timeline',
        content: `Audit files were downloaded during off-hours on ${new Date().toLocaleDateString()} at 23:14 UTC, triggering an automated threat alert. Compliance teams flagged an unverified transaction shortly after.`,
        evidenceIds: [logId, emailId]
      },
      {
        title: 'Key Findings and Suspect Activity',
        content: 'Review of the transfer logs indicates that Regional VP of Finance Johnathan Archer authorized a transfer of $150,000 USD to the Zurich European Branch. No corresponding authorization records were found in the accounting ERP system.',
        evidenceIds: [docId]
      }
    ]
  };
  allReports.unshift(report);
  setSessionData('chronos_reports', allReports);

  // Update Case stats
  updateCaseStats(caseId, {
    evidence: 3,
    entities: 4,
    events: 3
  });
}

// Default lists
const defaultTimelineEvents: TimelineEvent[] = [
  {
    id: 'EVT-001', caseId: 'CASE-001', title: 'Dark Web Leak Detected',
    description: 'Admin credentials found on dark web marketplace. Account belonged to Senior Database Administrator.',
    timestamp: '2025-06-19T18:30:00Z', category: 'incident', source: 'SIEM Alert', importance: 'critical',
    evidenceIds: ['EVD-003'],
  },
  {
    id: 'EVT-002', caseId: 'CASE-001', title: 'Suspicious Database Access',
    description: '40 failed login attempts from Eastern European IP address range targeting Aurora production DB.',
    timestamp: '2025-06-20T02:15:00Z', category: 'action', source: 'Database Logs', importance: 'high',
    evidenceIds: ['EVD-001'],
  },
  {
    id: 'EVT-003', caseId: 'CASE-001', title: 'Data Exfiltration Initiated',
    description: 'Unusual outbound data transfer of 2.3TB to external IP 91.234.56.78.',
    timestamp: '2025-06-20T03:00:00Z', category: 'incident', source: 'IDS Netflow', importance: 'critical',
    evidenceIds: ['EVD-002'],
  },
  {
    id: 'EVT-004', caseId: 'CASE-001', title: 'SOC Incident Escalation',
    description: 'Breach confirmed. Case opened by SOC team lead and escalated to critical priority.',
    timestamp: '2025-06-20T03:30:00Z', category: 'decision', source: 'Incident Response Channel', importance: 'high',
    evidenceIds: ['EVD-004'],
  },
  {
    id: 'EVT-005', caseId: 'CASE-001', title: 'Credential Revocation',
    description: 'Compromised admin credentials disabled. Active sessions killed across the fleet.',
    timestamp: '2025-06-20T04:00:00Z', category: 'update', source: 'Active Directory Logs', importance: 'medium',
    evidenceIds: [],
  },
  {
    id: 'EVT-006', caseId: 'CASE-002', title: 'Singapore Transfer Query',
    description: 'Compliance auditor flagged transfer of $5M from Singapore entity to offshore account.',
    timestamp: '2025-06-22T11:00:00Z', category: 'review', source: 'Audit Ledger', importance: 'high',
    evidenceIds: [],
  },
  {
    id: 'EVT-007', caseId: 'CASE-003', title: 'Off-hours database access',
    description: 'Torres logged in at 02:44 AM and downloaded customer lists.',
    timestamp: '2025-06-24T16:45:00Z', category: 'incident', source: 'Access Gateway', importance: 'high',
    evidenceIds: [],
  },
];

const initialReports: Report[] = [
  {
    id: 'REP-001',
    caseId: 'CASE-001',
    title: 'Aurora Breach - Initial Findings Report',
    status: 'review',
    generatedAt: '2025-06-21T09:00:00Z',
    findings: 4,
    evidenceCited: 4,
    summary: 'This report compiles initial findings on the Project Aurora breach. Compromised database administrator credentials were used to bypass perimeter controls, resulting in the exfiltration of approximately 2.3TB of customer data.',
    sections: [
      {
        title: 'Executive Summary',
        content: 'Project Aurora production database was accessed by unauthorized parties on June 20, 2025. Data exfiltration occurred over a two-hour window before containment was established. Perimeter controls failed to flag the dark web credential compromise in time.',
        evidenceIds: ['EVD-002', 'EVD-003']
      },
      {
        title: 'Breach Vector and Access Log Analysis',
        content: 'Failed login logs suggest that attackers attempted credential stuffing prior to utilizing valid DBA credentials. Active Directory logs confirm login from non-standard IP ranges.',
        evidenceIds: ['EVD-001', 'EVD-003']
      }
    ]
  },
  {
    id: 'REP-002',
    caseId: 'CASE-002',
    title: 'Singapore Subsidiary Transaction Audit Report',
    status: 'draft',
    generatedAt: '2025-06-24T17:00:00Z',
    findings: 2,
    evidenceCited: 2,
    summary: 'Audit of Q4 compliance transactions inside Singapore subsidiary. Identified irregular documentation and unverified fund transfers to off-shore entities.',
    sections: [
      {
        title: 'Findings Overview',
        content: 'Transfer vouchers for transaction series SG-9921 were missing proper secondary signatures. Audit trail points to manual entry overrides.',
        evidenceIds: []
      }
    ]
  }
];
