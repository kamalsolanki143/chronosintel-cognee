import { apiFetch } from './apiClient';
import type { Report } from './mockData';

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
  if (!caseId) return [];
  try {
    const data = await apiFetch<any[]>(`/api/report/${caseId}`);
    return data.map(mapBackendReport);
  } catch (_) {
    return [];
  }
}

export async function fetchReportById(id: string): Promise<Report | undefined> {
  try {
    const data = await apiFetch<any>(`/api/report/detail/${id}`);
    return mapBackendReport(data);
  } catch (_) {
    return undefined;
  }
}

export async function generateReport(caseId: string): Promise<Report> {
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
}
