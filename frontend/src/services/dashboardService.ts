import {
  mockDashboardMetrics,
  mockActivityItems,
  mockCaseUpdates,
  type DashboardMetrics,
  type ActivityItem,
  type CaseUpdate,
} from './mockData';

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockDashboardMetrics;
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockActivityItems;
}

export async function fetchLatestUpdates(): Promise<CaseUpdate[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return mockCaseUpdates;
}
