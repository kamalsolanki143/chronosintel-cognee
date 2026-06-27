export interface Case {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'pending' | 'archived';
  severity: 'critical' | 'high' | 'medium' | 'low';
  sourceTypes: string[];
  entities: number;
  evidence: number;
  events: number;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  riskScore: number;
  tags: string[];
}

export interface Evidence {
  id: string;
  caseId: string;
  title: string;
  type: 'email' | 'chat' | 'document' | 'log' | 'meeting' | 'code' | 'other';
  source: string;
  content: string;
  timestamp: string;
  extracted: boolean;
  entities: string[];
  fileSize?: string;
}

export interface Entity {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'location' | 'event' | 'document' | 'system' | 'timestamp';
  caseId: string;
  properties: Record<string, string>;
  mentions: number;
  firstSeen: string;
  lastSeen: string;
}

export interface GraphNode extends Entity {
  x?: number;
  y?: number;
  connections: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
  strength: number;
  label: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'communication' | 'action' | 'decision' | 'incident' | 'update' | 'review';
  source: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  evidenceIds: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  citations?: { title: string; snippet: string; source: string }[];
  suggestedPrompts?: string[];
}

export interface CaseUpdate {
  id: string;
  caseId: string;
  type: 'evidence_added' | 'entity_discovered' | 'status_change' | 'note_added' | 'report_generated';
  description: string;
  timestamp: string;
  user: string;
}

export interface VersionEntry {
  id: string;
  caseId: string;
  version: number;
  timestamp: string;
  changes: string[];
  author: string;
  summary: string;
}

export interface Report {
  id: string;
  caseId: string;
  title: string;
  status: 'draft' | 'final' | 'review';
  generatedAt: string;
  findings: number;
  evidenceCited: number;
  summary: string;
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  content: string;
  evidenceIds: string[];
}

export interface DashboardMetrics {
  activeCases: number;
  totalEntities: number;
  totalEvidence: number;
  avgRiskScore: number;
  recentActivity: number;
  casesByStatus: { status: string; count: number }[];
  evidenceByType: { type: string; count: number }[];
  weeklyActivity: { day: string; cases: number; evidence: number }[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  caseId: string;
  caseTitle: string;
}

export interface UserNotification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  message: string;
  timestamp: string;
  read: boolean;
}

export const mockCases: Case[] = [
  {
    id: 'CASE-001',
    title: 'Project Aurora Data Breach Investigation',
    description: 'Investigation into unauthorized access and exfiltration of sensitive customer data from Project Aurora systems. Initial indicators suggest a sophisticated APT group leveraging compromised credentials.',
    status: 'active',
    severity: 'critical',
    sourceTypes: ['Logs', 'Network Traffic', 'Email'],
    entities: 8,
    evidence: 24,
    events: 15,
    assignee: 'Dr. Sarah Chen',
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: '2025-06-25T14:22:00Z',
    riskScore: 94,
    tags: ['data-breach', 'apt', 'credentials', 'customer-data'],
  },
  {
    id: 'CASE-002',
    title: 'Q4 Financial Compliance Review',
    description: 'Quarterly compliance audit reviewing financial transactions, reporting accuracy, and regulatory adherence across international subsidiaries.',
    status: 'active',
    severity: 'high',
    sourceTypes: ['Documents', 'Financial Records', 'Meetings'],
    entities: 12,
    evidence: 45,
    events: 22,
    assignee: 'Marcus Rodriguez',
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: '2025-06-26T10:15:00Z',
    riskScore: 78,
    tags: ['compliance', 'finance', 'audit', 'regulatory'],
  },
  {
    id: 'CASE-003',
    title: 'Insider Threat - Employee #4731',
    description: 'Suspicious behavior pattern detected from employee Michael Torres. Unusual database access patterns and large data transfers occurring during off-hours.',
    status: 'active',
    severity: 'high',
    sourceTypes: ['Logs', 'Access Records', 'Chat'],
    entities: 5,
    evidence: 18,
    events: 11,
    assignee: 'Detective James Okafor',
    createdAt: '2025-04-15T11:30:00Z',
    updatedAt: '2025-06-24T16:45:00Z',
    riskScore: 85,
    tags: ['insider-threat', 'data-exfiltration', 'employee'],
  },
  {
    id: 'CASE-004',
    title: 'Supply Chain Vendor Risk Assessment',
    description: 'Comprehensive risk assessment of third-party vendors with access to critical infrastructure. Evaluating security postures of 15 high-privilege vendors.',
    status: 'pending',
    severity: 'medium',
    sourceTypes: ['Documents', 'Interviews', 'Security Reports'],
    entities: 15,
    evidence: 32,
    events: 8,
    assignee: 'Dr. Sarah Chen',
    createdAt: '2025-05-20T13:00:00Z',
    updatedAt: '2025-06-20T09:30:00Z',
    riskScore: 62,
    tags: ['supply-chain', 'vendor-risk', 'third-party'],
  },
  {
    id: 'CASE-005',
    title: 'Legacy System Migration - Security Audit',
    description: 'Security audit of legacy mainframe systems being migrated to cloud infrastructure. Identified 47 security gaps requiring remediation before cutover.',
    status: 'closed',
    severity: 'medium',
    sourceTypes: ['Logs', 'System Configs', 'Code'],
    entities: 9,
    evidence: 56,
    events: 30,
    assignee: 'Marcus Rodriguez',
    createdAt: '2024-11-01T07:00:00Z',
    updatedAt: '2025-04-10T17:00:00Z',
    riskScore: 45,
    tags: ['migration', 'legacy', 'cloud', 'remediated'],
  },
  {
    id: 'CASE-006',
    title: 'Whistleblower Report - Procurement Irregularities',
    description: 'Investigation into alleged kickback scheme in the procurement department. Anonymous whistleblower provided documentation of irregular payment patterns.',
    status: 'active',
    severity: 'critical',
    sourceTypes: ['Email', 'Financial Records', 'Chat', 'Documents'],
    entities: 11,
    evidence: 38,
    events: 19,
    assignee: 'Detective James Okafor',
    createdAt: '2025-02-20T10:00:00Z',
    updatedAt: '2025-06-26T08:00:00Z',
    riskScore: 91,
    tags: ['whistleblower', 'procurement', 'fraud', 'kickback'],
  },
  {
    id: 'CASE-007',
    title: 'Social Engineering Campaign Analysis',
    description: 'Analysis of a targeted social engineering campaign against executive leadership. 12 phishing attempts identified over a 3-week period.',
    status: 'archived',
    severity: 'low',
    sourceTypes: ['Email', 'Logs'],
    entities: 4,
    evidence: 15,
    events: 7,
    assignee: 'Dr. Sarah Chen',
    createdAt: '2024-09-10T14:00:00Z',
    updatedAt: '2025-01-05T12:00:00Z',
    riskScore: 28,
    tags: ['social-engineering', 'phishing', 'executive'],
  },
];

export const mockEvidence: Evidence[] = [
  {
    id: 'EVD-001',
    caseId: 'CASE-001',
    title: 'Suspicious Login Attempts Log - Aurora DB',
    type: 'log',
    source: 'AWS CloudTrail',
    content: 'Multiple failed login attempts from IP 185.220.101.x targeting Aurora production database. Event IDs: AUR-8452 through AUR-8491. Geodata suggests origin in Eastern Europe. Pattern consistent with credential stuffing attack.',
    timestamp: '2025-06-20T02:15:00Z',
    extracted: true,
    entities: ['IP-185.220.101', 'Aurora-DB-Prod', 'AWS-CloudTrail'],
    fileSize: '2.4 MB',
  },
  {
    id: 'EVD-002',
    caseId: 'CASE-001',
    title: 'Data Exfiltration Network Traffic Capture',
    type: 'log',
    source: 'Network IDS Alert',
    content: 'Unusual outbound data transfer detected from Aurora application server to external IP 91.234.56.78. 2.3TB of data transferred between 01:00-03:00 UTC. Protocol analysis indicates encrypted tunnel using custom SSL implementation.',
    timestamp: '2025-06-20T03:00:00Z',
    extracted: true,
    entities: ['IP-91.234.56.78', 'Aurora-App-Server', 'Encrypted-Tunnel'],
    fileSize: '156 KB',
  },
  {
    id: 'EVD-003',
    caseId: 'CASE-001',
    title: 'Compromised Credential Alert - Admin Account',
    type: 'email',
    source: 'SIEM Alert System',
    content: 'Alert: Admin account "j.grant@chronosintel.com" detected on dark web marketplace. Credentials appear to have been harvested within the last 72 hours. Account has elevated privileges across Aurora production systems.',
    timestamp: '2025-06-19T18:30:00Z',
    extracted: true,
    entities: ['j.grant@chronosintel.com', 'SIEM-System', 'Dark-Web-Market'],
    fileSize: '12 KB',
  },
  {
    id: 'EVD-004',
    caseId: 'CASE-001',
    title: 'Incident Response Chat - Initial Triage',
    type: 'chat',
    source: 'Slack - #incident-response',
    content: 'Snippet of IR channel conversation between SOC analysts during initial breach detection. Discussing scope, affected systems, and containment strategy. Key decision: Isolate Aurora production environment at 03:15 UTC.',
    timestamp: '2025-06-20T03:15:00Z',
    extracted: true,
    entities: ['SOC-Team', 'Slack-IR', 'Aurora-Prod'],
    fileSize: '45 KB',
  },
  {
    id: 'EVD-005',
    caseId: 'CASE-001',
    title: 'Access Review - Privileged Accounts Report',
    type: 'document',
    source: 'IAM Policy Engine',
    content: 'Comprehensive access review report generated post-incident. Identifies 23 privileged accounts with access to Aurora systems. 5 accounts show anomalous access patterns in the 30 days preceding the breach.',
    timestamp: '2025-06-21T09:00:00Z',
    extracted: false,
    entities: ['IAM-System', 'Privileged-Access', 'Aurora-Systems'],
    fileSize: '890 KB',
  },
  {
    id: 'EVD-006',
    caseId: 'CASE-002',
    title: 'Q4 Financial Statement - EMEA Region',
    type: 'document',
    source: 'Oracle Financials',
    content: 'Quarterly financial statement for EMEA region showing $12.4M in revenue with $3.2M in operating expenses. Anomalies identified in subsidiary reporting from Zurich office. Revenue discrepancies of approximately $450K.',
    timestamp: '2025-01-15T14:00:00Z',
    extracted: true,
    entities: ['EMEA-Region', 'Zurich-Office', 'Oracle-Financials'],
    fileSize: '3.1 MB',
  },
  {
    id: 'EVD-007',
    caseId: 'CASE-002',
    title: 'Compliance Meeting Minutes - Feb 2025',
    type: 'meeting',
    source: 'Teams Transcript',
    content: 'Meeting minutes from compliance review session. Attendees: M. Rodriguez, L. Kim, J. Fischer. Discussed findings from Q4 audit, identified 8 non-compliance items requiring remediation. Decision to engage external auditor for Zurich subsidiary review.',
    timestamp: '2025-02-10T10:00:00Z',
    extracted: true,
    entities: ['M-Rodriguez', 'L-Kim', 'J-Fischer', 'Zurich-Subsidiary'],
    fileSize: '28 KB',
  },
  {
    id: 'EVD-008',
    caseId: 'CASE-002',
    title: 'Intercompany Transaction Log - Q4',
    type: 'log',
    source: 'SAP ERP',
    content: 'Detailed intercompany transaction log for Q4 FY2024. 1,247 transactions totaling $8.9M. 32 flagged transactions with missing documentation. Primary concerns: transfer pricing anomalies between US and Singapore entities.',
    timestamp: '2025-01-05T08:00:00Z',
    extracted: true,
    entities: ['SAP-ERP', 'US-Entity', 'Singapore-Entity'],
    fileSize: '4.7 MB',
  },
  {
    id: 'EVD-009',
    caseId: 'CASE-002',
    title: 'Regulatory Filing - SEC Form 10-Q Draft',
    type: 'document',
    source: 'Legal Department',
    content: 'Draft SEC Form 10-Q filing for Q4 2024. Contains financial disclosures, risk factors, and management discussion. Legal review flagged potential material weakness in internal controls over financial reporting.',
    timestamp: '2025-01-20T16:30:00Z',
    extracted: false,
    entities: ['SEC', 'Legal-Dept', 'Financial-Reporting'],
    fileSize: '2.1 MB',
  },
  {
    id: 'EVD-010',
    caseId: 'CASE-003',
    title: 'Database Access Log - Off Hours Query Pattern',
    type: 'log',
    source: 'SQL Server Audit',
    content: 'Employee #4731 (Michael Torres) executed 847 database queries between 11PM-4AM over the past 2 weeks. Queries targeted customer PII tables. Volume is 500% above baseline for this role. No JIRA ticket references found.',
    timestamp: '2025-06-22T23:15:00Z',
    extracted: true,
    entities: ['Michael-Torres', 'SQL-Server', 'Customer-PII'],
    fileSize: '890 KB',
  },
  {
    id: 'EVD-011',
    caseId: 'CASE-003',
    title: 'Email Correspondence - Torres to External Domain',
    type: 'email',
    source: 'Exchange Online',
    content: 'Email chain between Michael Torres and "data-analytics@datamining.co" discussing potential "consulting opportunities." Attachments include sample database exports. External domain registered 3 days before first email.',
    timestamp: '2025-06-20T14:30:00Z',
    extracted: true,
    entities: ['Michael-Torres', 'DataMining-Co', 'Exchange-Online'],
    fileSize: '156 KB',
  },
  {
    id: 'EVD-012',
    caseId: 'CASE-003',
    title: 'USB Device Installation Log',
    type: 'log',
    source: 'Endpoint Protection',
    content: 'Previously unknown USB storage device (S/N: USBA-7F3A2C1) connected to workstation WK-4731 on 2025-06-18. 23 GB of data written to device between 2:15AM-2:45AM. Device manufacturer: unknown.',
    timestamp: '2025-06-18T02:15:00Z',
    extracted: true,
    entities: ['Michael-Torres', 'WK-4731', 'USB-7F3A2C1'],
    fileSize: '45 KB',
  },
  {
    id: 'EVD-013',
    caseId: 'CASE-004',
    title: 'Vendor Security Assessment - DataStream Inc',
    type: 'document',
    source: 'Vendor Portal',
    content: 'Security assessment questionnaire completed by DataStream Inc. Responses indicate inadequate encryption standards, lack of incident response plan, and unpatched critical vulnerabilities. Overall security score: 42/100.',
    timestamp: '2025-06-01T11:00:00Z',
    extracted: true,
    entities: ['DataStream-Inc', 'Vendor-Portal'],
    fileSize: '2.8 MB',
  },
  {
    id: 'EVD-014',
    caseId: 'CASE-006',
    title: 'Anomalous Payment Pattern - Vendor #8821',
    type: 'document',
    source: 'AP System',
    content: 'Payment analysis reveals 47 payments totaling $890K to vendor #8821 (ConsulTech Solutions) over 6 months. No competitive bidding documentation. Payments approved by S. Reynolds, Director of Procurement. Vendor address matches personal residence of Reynolds.',
    timestamp: '2025-05-15T09:00:00Z',
    extracted: true,
    entities: ['S-Reynolds', 'ConsulTech-Solutions', 'AP-System'],
    fileSize: '1.2 MB',
  },
  {
    id: 'EVD-015',
    caseId: 'CASE-006',
    title: 'Whistleblower Anonymous Email',
    type: 'email',
    source: 'Secure Drop',
    content: 'Anonymous submission via Secure Drop: "I have evidence that S. Reynolds has been accepting kickbacks from ConsulTech Solutions. They have been inflating invoices and splitting payments to avoid detection. I have attached supporting documents showing the pattern."',
    timestamp: '2025-04-28T22:00:00Z',
    extracted: true,
    entities: ['Secure-Drop', 'S-Reynolds', 'ConsulTech-Solutions'],
    fileSize: '8 KB',
  },
  {
    id: 'EVD-016',
    caseId: 'CASE-006',
    title: 'Chat Log - Reynolds & ConsulTech Contact',
    type: 'chat',
    source: 'Teams Chat Export',
    content: 'Private chat messages between S. Reynolds and T. Harrison (ConsulTech CEO). Messages discuss "splitting the deal into smaller pieces" and "keeping it off the books." Reference to "the usual 15%" commission structure.',
    timestamp: '2025-04-10T15:30:00Z',
    extracted: true,
    entities: ['S-Reynolds', 'T-Harrison', 'ConsulTech-Solutions', 'Teams'],
    fileSize: '234 KB',
  },
];

export const mockEntities: Entity[] = [
  {
    id: 'ENT-001',
    name: 'Dr. Sarah Chen',
    type: 'person',
    caseId: 'CASE-001',
    properties: { title: 'Senior Forensic Investigator', department: 'Cyber Forensics', clearance: 'Top Secret' },
    mentions: 47,
    firstSeen: '2025-01-10T08:30:00Z',
    lastSeen: '2025-06-25T14:22:00Z',
  },
  {
    id: 'ENT-002',
    name: 'Aurora Production Database',
    type: 'system',
    caseId: 'CASE-001',
    properties: { type: 'PostgreSQL 15', environment: 'Production', location: 'AWS us-east-1' },
    mentions: 89,
    firstSeen: '2025-01-10T08:30:00Z',
    lastSeen: '2025-06-25T14:22:00Z',
  },
  {
    id: 'ENT-003',
    name: 'Unknown APT Group - TA-447',
    type: 'organization',
    caseId: 'CASE-001',
    properties: { origin: 'Eastern Europe', method: 'Credential Stuffing', motivation: 'Data Theft' },
    mentions: 23,
    firstSeen: '2025-06-20T02:15:00Z',
    lastSeen: '2025-06-25T14:22:00Z',
  },
  {
    id: 'ENT-004',
    name: 'IP Range 185.220.101.0/24',
    type: 'location',
    caseId: 'CASE-001',
    properties: { type: 'IP Range', origin: 'Eastern Europe', isp: 'Unknown' },
    mentions: 15,
    firstSeen: '2025-06-20T02:15:00Z',
    lastSeen: '2025-06-21T03:00:00Z',
  },
  {
    id: 'ENT-005',
    name: 'Marcus Rodriguez',
    type: 'person',
    caseId: 'CASE-002',
    properties: { title: 'Compliance Officer', department: 'Risk & Compliance', clearance: 'Level 4' },
    mentions: 34,
    firstSeen: '2025-03-01T09:00:00Z',
    lastSeen: '2025-06-26T10:15:00Z',
  },
  {
    id: 'ENT-006',
    name: 'Zurich Subsidiary',
    type: 'organization',
    caseId: 'CASE-002',
    properties: { region: 'EMEA', founded: '2018', entity_type: 'Wholly Owned Subsidiary' },
    mentions: 28,
    firstSeen: '2025-01-15T14:00:00Z',
    lastSeen: '2025-06-26T10:15:00Z',
  },
  {
    id: 'ENT-007',
    name: 'Michael Torres',
    type: 'person',
    caseId: 'CASE-003',
    properties: { title: 'Senior Data Analyst', department: 'Data Engineering', employee_id: '4731' },
    mentions: 56,
    firstSeen: '2025-04-15T11:30:00Z',
    lastSeen: '2025-06-24T16:45:00Z',
  },
  {
    id: 'ENT-008',
    name: 'ConsulTech Solutions',
    type: 'organization',
    caseId: 'CASE-006',
    properties: { vendor_id: '8821', status: 'Under Investigation', category: 'IT Services' },
    mentions: 31,
    firstSeen: '2025-04-28T22:00:00Z',
    lastSeen: '2025-06-26T08:00:00Z',
  },
  {
    id: 'ENT-009',
    name: 'S. Reynolds',
    type: 'person',
    caseId: 'CASE-006',
    properties: { title: 'Director of Procurement', department: 'Procurement', employee_id: '2188' },
    mentions: 42,
    firstSeen: '2025-04-10T15:30:00Z',
    lastSeen: '2025-06-26T08:00:00Z',
  },
  {
    id: 'ENT-010',
    name: 'June 2025 Data Breach Incident',
    type: 'event',
    caseId: 'CASE-001',
    properties: { date: '2025-06-20', impact: 'Critical', type: 'Data Exfiltration' },
    mentions: 67,
    firstSeen: '2025-06-20T02:15:00Z',
    lastSeen: '2025-06-25T14:22:00Z',
  },
  {
    id: 'ENT-011',
    name: 'Q4 2024 Audit Findings Report',
    type: 'document',
    caseId: 'CASE-002',
    properties: { type: 'Audit Report', status: 'Draft', pages: '47' },
    mentions: 19,
    firstSeen: '2025-01-20T16:30:00Z',
    lastSeen: '2025-06-26T10:15:00Z',
  },
  {
    id: 'ENT-012',
    name: 'DataStream Inc',
    type: 'organization',
    caseId: 'CASE-004',
    properties: { vendor_id: '3341', risk_score: '42/100', category: 'Cloud Services' },
    mentions: 12,
    firstSeen: '2025-06-01T11:00:00Z',
    lastSeen: '2025-06-20T09:30:00Z',
  },
  {
    id: 'ENT-013',
    name: 'SOC Analysis Platform',
    type: 'system',
    caseId: 'CASE-001',
    properties: { vendor: 'Splunk', version: '9.0', integration: 'SIEM' },
    mentions: 25,
    firstSeen: '2025-01-10T08:30:00Z',
    lastSeen: '2025-06-25T14:22:00Z',
  },
  {
    id: 'ENT-014',
    name: 'Detective James Okafor',
    type: 'person',
    caseId: 'CASE-006',
    properties: { title: 'Lead Investigator', department: 'Forensic Investigations', badge: 'DI-4472' },
    mentions: 38,
    firstSeen: '2025-02-20T10:00:00Z',
    lastSeen: '2025-06-26T08:00:00Z',
  },
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 'TLE-001',
    caseId: 'CASE-001',
    title: 'Initial Breach Detection',
    description: 'SOC team detected anomalous database activity on Aurora production systems. Automated alert triggered by CloudTrail anomaly detection.',
    timestamp: '2025-06-20T02:15:00Z',
    category: 'incident',
    source: 'CloudTrail Alert',
    importance: 'critical',
    evidenceIds: ['EVD-001', 'EVD-002'],
  },
  {
    id: 'TLE-002',
    caseId: 'CASE-001',
    title: 'Containment Strategy Decision',
    description: 'Incident Response team decided to isolate Aurora production environment. All external access revoked pending investigation.',
    timestamp: '2025-06-20T03:15:00Z',
    category: 'decision',
    source: 'IR Team Lead',
    importance: 'critical',
    evidenceIds: ['EVD-004'],
  },
  {
    id: 'TLE-003',
    caseId: 'CASE-001',
    title: 'Dark Web Credential Discovery',
    description: 'SIEM system flagged compromised admin credentials on dark web marketplaces. Credentials belonged to j.grant@chronosintel.com.',
    timestamp: '2025-06-19T18:30:00Z',
    category: 'incident',
    source: 'SIEM Alert',
    importance: 'high',
    evidenceIds: ['EVD-003'],
  },
  {
    id: 'TLE-004',
    caseId: 'CASE-001',
    title: 'Data Exfiltration Confirmed',
    description: 'Network analysis confirmed 2.3TB of data exfiltrated to external IP 91.234.56.78 between 01:00-03:00 UTC.',
    timestamp: '2025-06-20T03:00:00Z',
    category: 'incident',
    source: 'Network Forensics',
    importance: 'critical',
    evidenceIds: ['EVD-002'],
  },
  {
    id: 'TLE-005',
    caseId: 'CASE-002',
    title: 'Q4 Audit Kickoff Meeting',
    description: 'Initial kickoff meeting for Q4 financial compliance review. Scope defined covering EMEA, APAC, and Americas regions.',
    timestamp: '2025-03-01T09:00:00Z',
    category: 'communication',
    source: 'Teams Meeting',
    importance: 'medium',
    evidenceIds: ['EVD-007'],
  },
  {
    id: 'TLE-006',
    caseId: 'CASE-002',
    title: 'Zurich Subsidiary Anomaly Identified',
    description: 'Analysts identified $450K revenue discrepancy in Zurich subsidiary reporting. Flagged for further investigation.',
    timestamp: '2025-01-20T14:00:00Z',
    category: 'incident',
    source: 'Financial Analysis',
    importance: 'high',
    evidenceIds: ['EVD-006'],
  },
  {
    id: 'TLE-007',
    caseId: 'CASE-003',
    title: 'Anomalous Database Access Pattern Detected',
    description: 'Security analytics flagged unusual query pattern from employee #4731 during off-hours targeting customer PII tables.',
    timestamp: '2025-06-22T23:15:00Z',
    category: 'incident',
    source: 'Security Analytics',
    importance: 'critical',
    evidenceIds: ['EVD-010'],
  },
  {
    id: 'TLE-008',
    caseId: 'CASE-003',
    title: 'Torres Interview Scheduled',
    description: 'HR and Security scheduled preliminary interview with Michael Torres regarding unusual work patterns.',
    timestamp: '2025-06-25T09:00:00Z',
    category: 'action',
    source: 'HR Department',
    importance: 'high',
    evidenceIds: ['EVD-010', 'EVD-011'],
  },
  {
    id: 'TLE-009',
    caseId: 'CASE-006',
    title: 'Whistleblower Submission Received',
    description: 'Anonymous submission received via Secure Drop alleging procurement fraud involving S. Reynolds and ConsulTech Solutions.',
    timestamp: '2025-04-28T22:00:00Z',
    category: 'incident',
    source: 'Secure Drop',
    importance: 'critical',
    evidenceIds: ['EVD-015'],
  },
  {
    id: 'TLE-010',
    caseId: 'CASE-006',
    title: 'Payment Pattern Analysis Completed',
    description: 'Forensic accounting completed analysis of payment patterns. Identified $890K in suspicious payments to ConsulTech Solutions.',
    timestamp: '2025-05-20T16:00:00Z',
    category: 'review',
    source: 'Forensic Accounting',
    importance: 'high',
    evidenceIds: ['EVD-014', 'EVD-016'],
  },
  {
    id: 'TLE-011',
    caseId: 'CASE-006',
    title: 'Search Warrant Approved',
    description: 'Court approved search warrant for ConsulTech Solutions offices and S. Reynolds personal devices.',
    timestamp: '2025-06-15T11:00:00Z',
    category: 'action',
    source: 'Legal Department',
    importance: 'critical',
    evidenceIds: [],
  },
  {
    id: 'TLE-012',
    caseId: 'CASE-004',
    title: 'Vendor Risk Scoring Completed',
    description: 'Initial risk scoring for all 15 high-privilege vendors completed. 3 vendors scored below acceptable threshold.',
    timestamp: '2025-06-10T14:00:00Z',
    category: 'review',
    source: 'Risk Assessment Team',
    importance: 'medium',
    evidenceIds: ['EVD-013'],
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'MSG-001',
    sender: 'user',
    content: 'Can you analyze the initial breach timeline for Project Aurora? I need to understand the sequence of events.',
    timestamp: '2025-06-25T10:00:00Z',
  },
  {
    id: 'MSG-002',
    sender: 'ai',
    content: 'Based on the evidence collected, here is the breach timeline for Project Aurora:\n\n1. **June 19, 18:30 UTC** - Compromised credentials detected on dark web (j.grant@chronosintel.com)\n2. **June 20, 02:15 UTC** - First anomalous login attempts from IP range 185.220.101.0/24\n3. **June 20, 01:00-03:00 UTC** - Data exfiltration of 2.3TB to external IP 91.234.56.78\n4. **June 20, 03:15 UTC** - Incident response team isolates Aurora production environment\n\nThe attack appears to be a coordinated credential-stuffing attack followed by targeted data exfiltration. The threat actor had prior knowledge of system architecture.',
    timestamp: '2025-06-25T10:00:05Z',
    citations: [
      { title: 'Suspicious Login Attempts Log', snippet: 'Multiple failed login attempts from IP 185.220.101.x', source: 'EVD-001' },
      { title: 'Data Exfiltration Traffic Capture', snippet: '2.3TB transferred to external IP', source: 'EVD-002' },
      { title: 'Compromised Credential Alert', snippet: 'Admin account found on dark web', source: 'EVD-003' },
    ],
    suggestedPrompts: ['What was the containment strategy?', 'Who had privileged access?', 'Show me the affected systems'],
  },
  {
    id: 'MSG-003',
    sender: 'user',
    content: 'What was the containment strategy and how effective was it?',
    timestamp: '2025-06-25T10:05:00Z',
  },
  {
    id: 'MSG-004',
    sender: 'ai',
    content: 'The containment strategy involved:\n\n**Immediate Actions (03:15 UTC):**\n- Complete isolation of Aurora production environment from external networks\n- Revocation of all privileged account access\n- Initiation of forensic image capture for all affected systems\n\n**Effectiveness Assessment:**\nThe isolation action successfully prevented further data exfiltration. However, the 45-minute gap between initial detection (02:15) and containment (03:00) allowed the full exfiltration of 2.3TB of data. The incident response playbook was followed correctly, but detection latency needs improvement.\n\n**Recommendations:**\n- Implement real-time anomaly detection for large data transfers\n- Reduce MTTD (Mean Time to Detect) through enhanced monitoring\n- Deploy automated containment triggers for credential-stuffing patterns',
    timestamp: '2025-06-25T10:05:05Z',
    citations: [
      { title: 'Incident Response Chat Log', snippet: 'Isolation decision at 03:15 UTC', source: 'EVD-004' },
      { title: 'Access Review Report', snippet: '23 privileged accounts identified', source: 'EVD-005' },
    ],
    suggestedPrompts: ['What about the insider threat case?', 'Show me network traffic analysis', 'Compare with industry response benchmarks'],
  },
  {
    id: 'MSG-005',
    sender: 'user',
    content: 'Compare the insider threat case #4731 with the Aurora breach - any common indicators?',
    timestamp: '2025-06-25T10:15:00Z',
  },
  {
    id: 'MSG-006',
    sender: 'ai',
    content: '**Cross-Case Analysis: CASE-001 vs CASE-003**\n\n**Common Indicators:**\n1. Both involved off-hours access patterns (11PM-4AM for Torres, 1AM-3AM for APT)\n2. Both targeted database systems containing sensitive data\n3. Both used encryption to mask data transfer activity\n\n**Distinctive Patterns:**\n- CASE-001: External threat actor using compromised credentials (credential stuffing)\n- CASE-003: Internal actor with legitimate access abusing privileges (insider threat)\n- CASE-001: 2.3TB exfiltrated in single event vs. CASE-003: 23GB over multiple sessions\n\n**Risk Assessment:**\nWhile the Aurora breach represents greater data loss volume, the insider threat poses a higher long-term risk due to the employee\'s continued legitimate access and knowledge of security controls.',
    timestamp: '2025-06-25T10:15:08Z',
    citations: [
      { title: 'Database Access Log - Torres', snippet: '847 queries during off-hours', source: 'EVD-010' },
      { title: 'Data Exfiltration Network Capture', snippet: '2.3TB transferred to external IP', source: 'EVD-002' },
    ],
    suggestedPrompts: ['What about the procurement case?', 'Show me the entity relationship graph', 'Generate a risk report'],
  },
  {
    id: 'MSG-007',
    sender: 'user',
    content: 'Generate a summary of the procurement irregularities case for the legal team.',
    timestamp: '2025-06-25T10:30:00Z',
  },
  {
    id: 'MSG-008',
    sender: 'ai',
    content: '**Case Summary: Procurement Irregularities (CASE-006)**\n\n**Status:** Active Investigation\n**Lead Investigator:** Detective James Okafor\n\n**Key Findings:**\n1. **Suspicious Payments:** $890K paid to ConsulTech Solutions (Vendor #8821) over 6 months without competitive bidding\n2. **Conflict of Interest:** Vendor address matches personal residence of S. Reynolds, Director of Procurement\n3. **Kickback Scheme:** Chat evidence reveals discussions of "15% commission" and "splitting deals"\n4. **Whistleblower:** Anonymous submission provided corroborating documentation\n\n**Evidence Summary:**\n- 38 evidence items collected\n- 11 entities identified\n- Chat logs, financial records, and email correspondence\n\n**Next Steps:**\n- Search warrant executed on June 15\n- Forensic analysis of Reynolds\' devices pending\n- Grand jury subpoena issued for ConsulTech financial records\n\n**Risk Score: 91/100 (Critical)**',
    timestamp: '2025-06-25T10:30:10Z',
    citations: [
      { title: 'Anomalous Payment Pattern', snippet: '47 payments totaling $890K', source: 'EVD-014' },
      { title: 'Whistleblower Email', snippet: 'Allegations of kickback scheme', source: 'EVD-015' },
      { title: 'Chat Log - Reynolds & ConsulTech', snippet: 'Discussions of commission structure', source: 'EVD-016' },
    ],
    suggestedPrompts: ['Draft a formal report', 'Schedule a case review', 'Update the entity graph'],
  },
];

export const mockCaseUpdates: CaseUpdate[] = [
  { id: 'UPD-001', caseId: 'CASE-001', type: 'evidence_added', description: '24 new evidence items added from network forensics analysis', timestamp: '2025-06-25T14:22:00Z', user: 'Dr. Sarah Chen' },
  { id: 'UPD-002', caseId: 'CASE-001', type: 'entity_discovered', description: 'New threat actor profile created: TA-447 (Eastern Europe APT group)', timestamp: '2025-06-24T09:00:00Z', user: 'Dr. Sarah Chen' },
  { id: 'UPD-003', caseId: 'CASE-001', type: 'status_change', description: 'Case escalated to Critical priority following data exfiltration confirmation', timestamp: '2025-06-20T03:30:00Z', user: 'SOC Lead' },
  { id: 'UPD-004', caseId: 'CASE-002', type: 'evidence_added', description: 'Financial records from Singapore subsidiary received for review', timestamp: '2025-06-22T11:00:00Z', user: 'Marcus Rodriguez' },
  { id: 'UPD-005', caseId: 'CASE-002', type: 'note_added', description: 'Preliminary findings indicate transfer pricing irregularities need deeper audit', timestamp: '2025-06-20T15:00:00Z', user: 'Marcus Rodriguez' },
  { id: 'UPD-006', caseId: 'CASE-003', type: 'evidence_added', description: 'USB device forensic analysis complete - 23GB of customer data found', timestamp: '2025-06-24T16:45:00Z', user: 'Detective James Okafor' },
  { id: 'UPD-007', caseId: 'CASE-003', type: 'status_change', description: 'Case status updated - Torres placed on administrative leave pending investigation', timestamp: '2025-06-23T08:00:00Z', user: 'HR Director' },
  { id: 'UPD-008', caseId: 'CASE-006', type: 'evidence_added', description: 'Bank records obtained showing offshore accounts linked to ConsulTech', timestamp: '2025-06-25T09:30:00Z', user: 'Detective James Okafor' },
  { id: 'UPD-009', caseId: 'CASE-006', type: 'report_generated', description: 'Interim investigation report generated for District Attorney review', timestamp: '2025-06-24T17:00:00Z', user: 'Detective James Okafor' },
  { id: 'UPD-010', caseId: 'CASE-004', type: 'note_added', description: 'Vendor remediation deadlines extended to Q3 2025 for critical findings', timestamp: '2025-06-20T09:30:00Z', user: 'Dr. Sarah Chen' },
  { id: 'UPD-011', caseId: 'CASE-005', type: 'status_change', description: 'Case closed - all security gaps remediated and migration completed', timestamp: '2025-04-10T17:00:00Z', user: 'Marcus Rodriguez' },
  { id: 'UPD-012', caseId: 'CASE-002', type: 'entity_discovered', description: 'New entity: Zurich Subsidiary - Financial reporting anomalies identified', timestamp: '2025-01-20T14:00:00Z', user: 'Marcus Rodriguez' },
];

export const mockVersionEntries: VersionEntry[] = [
  { id: 'VER-001', caseId: 'CASE-001', version: 1, timestamp: '2025-06-20T04:00:00Z', changes: ['Initial case created', 'Evidence items EVD-001 through EVD-005 added', 'Preliminary timeline established'], author: 'Dr. Sarah Chen', summary: 'Case creation and initial evidence intake' },
  { id: 'VER-002', caseId: 'CASE-001', version: 2, timestamp: '2025-06-21T10:00:00Z', changes: ['Added EVD-006 through EVD-010', 'Network forensics analysis completed', 'Threat actor profile created'], author: 'Dr. Sarah Chen', summary: 'Network forensics and threat actor identification' },
  { id: 'VER-003', caseId: 'CASE-001', version: 3, timestamp: '2025-06-25T14:22:00Z', changes: ['Full evidence catalog completed (24 items)', 'Entity relationship graph updated', 'Interim report draft generated'], author: 'Dr. Sarah Chen', summary: 'Evidence catalog finalization and report generation' },
  { id: 'VER-004', caseId: 'CASE-006', version: 1, timestamp: '2025-04-28T22:30:00Z', changes: ['Case opened based on whistleblower submission', 'Initial evidence intake from Secure Drop', 'S. Reynolds flagged as person of interest'], author: 'Detective James Okafor', summary: 'Case initiation from whistleblower report' },
  { id: 'VER-005', caseId: 'CASE-006', version: 2, timestamp: '2025-06-15T12:00:00Z', changes: ['Search warrant executed', 'Bank records obtained', 'Chat log analysis completed', 'Grand jury subpoena issued'], author: 'Detective James Okafor', summary: 'Evidence collection and legal proceedings' },
];

export const mockReports: Report[] = [
  {
    id: 'RPT-001',
    caseId: 'CASE-001',
    title: 'Project Aurora Breach - Interim Investigation Report',
    status: 'draft',
    generatedAt: '2025-06-25T14:00:00Z',
    findings: 12,
    evidenceCited: 24,
    summary: 'Interim report detailing the Project Aurora data breach investigation. Covers breach timeline, affected systems, data exfiltration analysis, and initial attribution to APT group TA-447.',
    sections: [
      { title: 'Executive Summary', content: 'On June 20, 2025, ChronosIntel detected unauthorized access to its Aurora production database. Investigation revealed a sophisticated credential-stuffing attack leading to exfiltration of 2.3TB of customer data. The threat actor has been identified as APT group TA-447, operating from Eastern Europe.', evidenceIds: ['EVD-001', 'EVD-002', 'EVD-003'] },
      { title: 'Breach Timeline', content: 'The breach unfolded over approximately 3 hours. Initial compromise occurred via compromised admin credentials detected on dark web marketplaces 6 hours prior to active exploitation.', evidenceIds: ['EVD-001', 'EVD-002', 'EVD-004'] },
      { title: 'Affected Systems', content: 'Primary affected system: Aurora Production Database (PostgreSQL 15). Secondary impact: Customer-facing application servers (12 instances). No evidence of lateral movement to other environments.', evidenceIds: ['EVD-005'] },
      { title: 'Data Exfiltration Analysis', content: '2.3TB of data exfiltrated to IP 91.234.56.78 via encrypted tunnel. Data includes customer PII, financial records, and proprietary algorithm implementations.', evidenceIds: ['EVD-002'] },
      { title: 'Attribution', content: 'Tactics, techniques, and procedures (TTPs) consistent with APT group TA-447. Previous campaigns attributed to this group include the GlobalTech breach (2024) and the EuroBank incident (2023).', evidenceIds: [] },
    ],
  },
  {
    id: 'RPT-002',
    caseId: 'CASE-006',
    title: 'Procurement Fraud Investigation - Status Report for DA',
    status: 'final',
    generatedAt: '2025-06-24T16:00:00Z',
    findings: 8,
    evidenceCited: 38,
    summary: 'Final status report for the District Attorney regarding the procurement fraud investigation involving S. Reynolds and ConsulTech Solutions. Includes evidence of kickback scheme, payment analysis, and recommended charges.',
    sections: [
      { title: 'Investigation Overview', content: 'Investigation initiated April 28, 2025 following anonymous whistleblower submission. Target: S. Reynolds, Director of Procurement, and ConsulTech Solutions (Vendor #8821).', evidenceIds: ['EVD-015'] },
      { title: 'Findings', content: 'Evidence reveals systematic kickback scheme involving inflated invoices, contract splitting, and offshore payments. Total fraudulent payments: $890K over 6 months.', evidenceIds: ['EVD-014', 'EVD-016'] },
      { title: 'Recommended Charges', content: 'Recommended charges include: Conspiracy to Commit Wire Fraud (18 U.S.C. § 1349), Commercial Bribery, Money Laundering (18 U.S.C. § 1956), and False Statements.', evidenceIds: ['EVD-014', 'EVD-016'] },
    ],
  },
  {
    id: 'RPT-003',
    caseId: 'CASE-003',
    title: 'Insider Threat Assessment - Employee #4731',
    status: 'review',
    generatedAt: '2025-06-25T10:00:00Z',
    findings: 6,
    evidenceCited: 18,
    summary: 'Insider threat assessment for Michael Torres (Employee #4731). Analysis of data access patterns, communications with external entities, and evidence of data exfiltration via USB device.',
    sections: [
      { title: 'Behavioral Analysis', content: 'Pattern of concerning behaviors identified over 3-month period: declining performance reviews, expressed dissatisfaction with compensation, unusual interest in data access permissions.', evidenceIds: [] },
      { title: 'Technical Evidence', content: 'Database query logs show 847 queries during off-hours targeting customer PII. 23GB of data copied to unauthorized USB device. Email communications with potential competitor.', evidenceIds: ['EVD-010', 'EVD-011', 'EVD-012'] },
      { title: 'Risk Assessment', content: 'HIGH RISK - Employee has demonstrated intent and capability to exfiltrate sensitive data. Recommended actions: immediate suspension, device seizure, and criminal referral.', evidenceIds: ['EVD-010', 'EVD-012'] },
    ],
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  activeCases: 4,
  totalEntities: 84,
  totalEvidence: 232,
  avgRiskScore: 69,
  recentActivity: 28,
  casesByStatus: [
    { status: 'active', count: 4 },
    { status: 'pending', count: 1 },
    { status: 'closed', count: 1 },
    { status: 'archived', count: 1 },
  ],
  evidenceByType: [
    { type: 'email', count: 48 },
    { type: 'log', count: 72 },
    { type: 'document', count: 56 },
    { type: 'chat', count: 34 },
    { type: 'meeting', count: 12 },
    { type: 'code', count: 8 },
    { type: 'other', count: 2 },
  ],
  weeklyActivity: [
    { day: 'Mon', cases: 3, evidence: 12 },
    { day: 'Tue', cases: 5, evidence: 18 },
    { day: 'Wed', cases: 2, evidence: 8 },
    { day: 'Thu', cases: 7, evidence: 24 },
    { day: 'Fri', cases: 4, evidence: 15 },
    { day: 'Sat', cases: 1, evidence: 3 },
    { day: 'Sun', cases: 1, evidence: 2 },
  ],
};

export const mockActivityItems: ActivityItem[] = [
  { id: 'ACT-001', type: 'evidence_added', description: '24 new evidence items added to Project Aurora case', timestamp: '2025-06-25T14:22:00Z', caseId: 'CASE-001', caseTitle: 'Project Aurora Data Breach' },
  { id: 'ACT-002', type: 'entity_discovered', description: 'New entity: TA-447 (APT Group) linked to Aurora breach', timestamp: '2025-06-24T09:00:00Z', caseId: 'CASE-001', caseTitle: 'Project Aurora Data Breach' },
  { id: 'ACT-003', type: 'report_generated', description: 'Interim report generated for procurement fraud case', timestamp: '2025-06-24T17:00:00Z', caseId: 'CASE-006', caseTitle: 'Procurement Irregularities' },
  { id: 'ACT-004', type: 'evidence_added', description: 'Bank records obtained for ConsulTech investigation', timestamp: '2025-06-25T09:30:00Z', caseId: 'CASE-006', caseTitle: 'Procurement Irregularities' },
  { id: 'ACT-005', type: 'status_change', description: 'Torres placed on administrative leave', timestamp: '2025-06-23T08:00:00Z', caseId: 'CASE-003', caseTitle: 'Insider Threat - Employee #4731' },
  { id: 'ACT-006', type: 'evidence_added', description: 'USB forensic analysis completed for Torres case', timestamp: '2025-06-24T16:45:00Z', caseId: 'CASE-003', caseTitle: 'Insider Threat - Employee #4731' },
  { id: 'ACT-007', type: 'note_added', description: 'Transfer pricing findings documented in compliance case', timestamp: '2025-06-20T15:00:00Z', caseId: 'CASE-002', caseTitle: 'Q4 Financial Compliance Review' },
  { id: 'ACT-008', type: 'evidence_added', description: 'Singapore subsidiary financial records uploaded', timestamp: '2025-06-22T11:00:00Z', caseId: 'CASE-002', caseTitle: 'Q4 Financial Compliance Review' },
  { id: 'ACT-009', type: 'status_change', description: 'Aurora case escalated to critical priority', timestamp: '2025-06-20T03:30:00Z', caseId: 'CASE-001', caseTitle: 'Project Aurora Data Breach' },
  { id: 'ACT-010', type: 'case_created', description: 'Vendor risk assessment case opened', timestamp: '2025-05-20T13:00:00Z', caseId: 'CASE-004', caseTitle: 'Supply Chain Vendor Risk Assessment' },
  { id: 'ACT-011', type: 'report_generated', description: 'Insider threat assessment report ready for review', timestamp: '2025-06-25T10:00:00Z', caseId: 'CASE-003', caseTitle: 'Insider Threat - Employee #4731' },
  { id: 'ACT-012', type: 'note_added', description: 'Vendor remediation deadlines extended to Q3', timestamp: '2025-06-20T09:30:00Z', caseId: 'CASE-004', caseTitle: 'Supply Chain Vendor Risk Assessment' },
];

export const mockNotifications: UserNotification[] = [
  { id: 'NOT-001', type: 'alert', message: 'Critical: New evidence linked to Project Aurora breach', timestamp: '2025-06-25T14:22:00Z', read: false },
  { id: 'NOT-002', type: 'success', message: 'Procurement fraud report generated successfully', timestamp: '2025-06-24T17:00:00Z', read: false },
  { id: 'NOT-003', type: 'warning', message: 'Insider threat case requires immediate review', timestamp: '2025-06-24T16:45:00Z', read: false },
  { id: 'NOT-004', type: 'info', message: 'Q4 compliance review approaching deadline', timestamp: '2025-06-26T10:15:00Z', read: true },
  { id: 'NOT-005', type: 'alert', message: 'Search warrant executed - case evidence updated', timestamp: '2025-06-15T12:00:00Z', read: true },
  { id: 'NOT-006', type: 'info', message: 'Weekly case review scheduled for Friday 3PM', timestamp: '2025-06-26T08:00:00Z', read: false },
];

export const mockGraphData: { nodes: GraphNode[]; links: GraphLink[] } = {
  nodes: [
    {
      id: 'ENT-001', name: 'Dr. Sarah Chen', type: 'person', caseId: 'CASE-001',
      properties: { title: 'Senior Forensic Investigator' }, mentions: 47, firstSeen: '2025-01-10T08:30:00Z', lastSeen: '2025-06-25T14:22:00Z',
      connections: ['ENT-002', 'ENT-003', 'ENT-010', 'ENT-013'],
    },
    {
      id: 'ENT-002', name: 'Aurora Production DB', type: 'system', caseId: 'CASE-001',
      properties: { type: 'PostgreSQL 15', environment: 'Production' }, mentions: 89, firstSeen: '2025-01-10T08:30:00Z', lastSeen: '2025-06-25T14:22:00Z',
      connections: ['ENT-003', 'ENT-004', 'ENT-010'],
    },
    {
      id: 'ENT-003', name: 'APT Group TA-447', type: 'organization', caseId: 'CASE-001',
      properties: { origin: 'Eastern Europe' }, mentions: 23, firstSeen: '2025-06-20T02:15:00Z', lastSeen: '2025-06-25T14:22:00Z',
      connections: ['ENT-002', 'ENT-004', 'ENT-010'],
    },
    {
      id: 'ENT-004', name: 'IP Range 185.220.101.0/24', type: 'location', caseId: 'CASE-001',
      properties: { type: 'IP Range', origin: 'Eastern Europe' }, mentions: 15, firstSeen: '2025-06-20T02:15:00Z', lastSeen: '2025-06-21T03:00:00Z',
      connections: ['ENT-003', 'ENT-002'],
    },
    {
      id: 'ENT-010', name: 'June 2025 Data Breach', type: 'event', caseId: 'CASE-001',
      properties: { date: '2025-06-20', impact: 'Critical' }, mentions: 67, firstSeen: '2025-06-20T02:15:00Z', lastSeen: '2025-06-25T14:22:00Z',
      connections: ['ENT-001', 'ENT-002', 'ENT-003'],
    },
    {
      id: 'ENT-013', name: 'SOC Analysis Platform', type: 'system', caseId: 'CASE-001',
      properties: { vendor: 'Splunk', version: '9.0' }, mentions: 25, firstSeen: '2025-01-10T08:30:00Z', lastSeen: '2025-06-25T14:22:00Z',
      connections: ['ENT-001'],
    },
    {
      id: 'ENT-005', name: 'Marcus Rodriguez', type: 'person', caseId: 'CASE-002',
      properties: { title: 'Compliance Officer' }, mentions: 34, firstSeen: '2025-03-01T09:00:00Z', lastSeen: '2025-06-26T10:15:00Z',
      connections: ['ENT-006', 'ENT-011'],
    },
    {
      id: 'ENT-006', name: 'Zurich Subsidiary', type: 'organization', caseId: 'CASE-002',
      properties: { region: 'EMEA' }, mentions: 28, firstSeen: '2025-01-15T14:00:00Z', lastSeen: '2025-06-26T10:15:00Z',
      connections: ['ENT-005', 'ENT-011'],
    },
    {
      id: 'ENT-011', name: 'Q4 2024 Audit Findings', type: 'document', caseId: 'CASE-002',
      properties: { type: 'Audit Report', status: 'Draft' }, mentions: 19, firstSeen: '2025-01-20T16:30:00Z', lastSeen: '2025-06-26T10:15:00Z',
      connections: ['ENT-005', 'ENT-006'],
    },
    {
      id: 'ENT-007', name: 'Michael Torres', type: 'person', caseId: 'CASE-003',
      properties: { title: 'Senior Data Analyst' }, mentions: 56, firstSeen: '2025-04-15T11:30:00Z', lastSeen: '2025-06-24T16:45:00Z',
      connections: [],
    },
    {
      id: 'ENT-008', name: 'ConsulTech Solutions', type: 'organization', caseId: 'CASE-006',
      properties: { vendor_id: '8821' }, mentions: 31, firstSeen: '2025-04-28T22:00:00Z', lastSeen: '2025-06-26T08:00:00Z',
      connections: ['ENT-009', 'ENT-014'],
    },
    {
      id: 'ENT-009', name: 'S. Reynolds', type: 'person', caseId: 'CASE-006',
      properties: { title: 'Director of Procurement' }, mentions: 42, firstSeen: '2025-04-10T15:30:00Z', lastSeen: '2025-06-26T08:00:00Z',
      connections: ['ENT-008', 'ENT-014'],
    },
    {
      id: 'ENT-014', name: 'Detective James Okafor', type: 'person', caseId: 'CASE-006',
      properties: { title: 'Lead Investigator' }, mentions: 38, firstSeen: '2025-02-20T10:00:00Z', lastSeen: '2025-06-26T08:00:00Z',
      connections: ['ENT-008', 'ENT-009'],
    },
  ],
  links: [
    { source: 'ENT-001', target: 'ENT-002', type: 'investigates', strength: 0.9, label: 'investigates' },
    { source: 'ENT-001', target: 'ENT-003', type: 'identified', strength: 0.8, label: 'identified' },
    { source: 'ENT-001', target: 'ENT-010', type: 'leading', strength: 0.95, label: 'lead investigator' },
    { source: 'ENT-002', target: 'ENT-003', type: 'targeted_by', strength: 0.9, label: 'targeted by' },
    { source: 'ENT-002', target: 'ENT-004', type: 'accessed_from', strength: 0.85, label: 'accessed from' },
    { source: 'ENT-002', target: 'ENT-010', type: 'involved_in', strength: 0.7, label: 'involved in' },
    { source: 'ENT-003', target: 'ENT-004', type: 'uses', strength: 0.75, label: 'uses infrastructure' },
    { source: 'ENT-003', target: 'ENT-010', type: 'responsible_for', strength: 0.9, label: 'responsible for' },
    { source: 'ENT-004', target: 'ENT-010', type: 'source_of', strength: 0.6, label: 'source of attack' },
    { source: 'ENT-001', target: 'ENT-013', type: 'uses', strength: 0.5, label: 'uses tool' },
    { source: 'ENT-005', target: 'ENT-006', type: 'audits', strength: 0.85, label: 'audits' },
    { source: 'ENT-005', target: 'ENT-011', type: 'authored', strength: 0.8, label: 'authored' },
    { source: 'ENT-006', target: 'ENT-011', type: 'related_to', strength: 0.7, label: 'related to' },
    { source: 'ENT-008', target: 'ENT-009', type: 'colludes_with', strength: 0.95, label: 'colludes with' },
    { source: 'ENT-008', target: 'ENT-014', type: 'investigated_by', strength: 0.85, label: 'investigated by' },
    { source: 'ENT-009', target: 'ENT-014', type: 'investigated_by', strength: 0.9, label: 'investigated by' },
  ],
};
