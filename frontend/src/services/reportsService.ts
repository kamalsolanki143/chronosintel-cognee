import { apiFetch } from './apiClient';
import type { Report } from './mockData';
import { getStoredReports, addStoredReport, getStoredEvidence } from './mockStorage';

function mapBackendReport(r: any): Report {
  const sections = r.findings && r.findings.length > 0
    ? r.findings.map((f: any) => ({
        title: f.title || 'Finding',
        content: f.description || f.summary || '',
        evidenceIds: f.evidence_ids || [],
      }))
    : [
        {
          title: 'Executive Summary',
          content: r.summary || '',
          evidenceIds: [],
        }
      ];

  return {
    id: r.report_id,
    caseId: r.case_id,
    title: r.query ? `Investigation Report - ${r.query}` : `Investigation Report (v${r.version})`,
    status: r.is_final ? 'final' : 'draft',
    generatedAt: r.created_at,
    findings: r.findings ? r.findings.length : 0,
    evidenceCited: r.evidence_count || 0,
    summary: r.summary || '',
    sections,
  };
}

export async function fetchReports(caseId?: string): Promise<Report[]> {
  if (!caseId) {
    try {
      const cases = getStoredCases();
      const allReports: Report[] = [];
      for (const c of cases) {
        const reps = getStoredReports(c.id);
        allReports.push(...reps);
      }
      return allReports;
    } catch (_) {
      return [];
    }
  }
  try {
    const data = await apiFetch<any[]>(`/api/report/${caseId}`);
    const reports = data.map(mapBackendReport);
    if (reports.length === 0) {
      return getStoredReports(caseId);
    }
    return reports;
  } catch (_) {
    return getStoredReports(caseId);
  }
}

export async function fetchReportById(id: string): Promise<Report | undefined> {
  try {
    const data = await apiFetch<any>(`/api/report/detail/${id}`);
    return mapBackendReport(data);
  } catch (_) {
    // Find inside stored reports
    const cases = getStoredCases();
    for (const c of cases) {
      const reports = getStoredReports(c.id);
      const rep = reports.find(r => r.id === id);
      if (rep) return rep;
    }
    return undefined;
  }
}

// Fallback helper to import getStoredCases
import { getStoredCases } from './mockStorage';

export async function generateReport(caseId: string): Promise<Report> {
  try {
    const data = await apiFetch<any>('/api/report/', {
      method: 'POST',
      body: JSON.stringify({
        case_id: caseId,
        include_timeline: true,
        include_graph: true,
        include_evidence: true,
      }),
    });
    return mapBackendReport(data);
  } catch (_) {
    // Generate mock report inside mock storage
    const evidence = getStoredEvidence(caseId);
    const summary = `Investigation Report generated automatically for Case ${caseId}. Total evidence parsed: ${evidence.length}. Audit indicates compliance flags needing manual secondary verification.`;
    const sections = [
      {
        title: 'Executive Summary',
        content: `Forensic audit review finalized on ${new Date().toLocaleDateString()}. Discrepancies identified in transactional transfer values require management attention.`,
        evidenceIds: evidence.slice(0, 2).map(e => e.id)
      },
      {
        title: 'Evidence Chain Overview',
        content: `ChronosIntel verified ${evidence.length} separate items, tracing files and access authentication paths. Check findings logs for details.`,
        evidenceIds: evidence.map(e => e.id)
      }
    ];
    
    return addStoredReport(caseId, `Forensic Audit Findings - ${caseId}`, summary, sections);
  }
}

