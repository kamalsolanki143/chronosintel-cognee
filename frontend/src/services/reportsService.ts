import { mockReports, type Report } from './mockData';

export async function fetchReports(caseId?: string): Promise<Report[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  if (caseId) {
    return mockReports.filter((r) => r.caseId === caseId);
  }
  return mockReports;
}

export async function fetchReportById(id: string): Promise<Report | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockReports.find((r) => r.id === id);
}

export async function generateReport(caseId: string): Promise<Report> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const newReport: Report = {
    id: `RPT-${String(mockReports.length + 1).padStart(3, '0')}`,
    caseId,
    title: `Investigation Report - Case ${caseId}`,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    findings: 0,
    evidenceCited: 0,
    summary: 'Auto-generated report based on case evidence and analysis.',
    sections: [
      {
        title: 'Executive Summary',
        content: 'This report summarizes the findings of the investigation.',
        evidenceIds: [],
      },
      {
        title: 'Analysis',
        content: 'Detailed analysis of evidence and entity relationships.',
        evidenceIds: [],
      },
    ],
  };

  return newReport;
}
