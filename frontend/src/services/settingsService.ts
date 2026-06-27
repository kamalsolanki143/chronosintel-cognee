export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  organization: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'inactive';
}

export interface NotificationPreferences {
  emailAlerts: boolean;
  weeklyDigest: boolean;
  caseUpdates: boolean;
  reportReady: boolean;
}

const mockUserProfile: UserProfile = {
  name: 'Dr. Sarah Chen',
  email: 'sarah.chen@chronosintel.com',
  role: 'Senior Forensic Investigator',
  avatar: '/avatars/sarah-chen.png',
  organization: 'ChronosIntel Cyber Division',
};

const mockTeamMembers: TeamMember[] = [
  { id: 'TM-001', name: 'Dr. Sarah Chen', email: 'sarah.chen@chronosintel.com', role: 'Senior Forensic Investigator', status: 'active' },
  { id: 'TM-002', name: 'Marcus Rodriguez', email: 'marcus.rodriguez@chronosintel.com', role: 'Compliance Officer', status: 'active' },
  { id: 'TM-003', name: 'Detective James Okafor', email: 'james.okafor@chronosintel.com', role: 'Lead Investigator', status: 'active' },
  { id: 'TM-004', name: 'Lisa Kim', email: 'lisa.kim@chronosintel.com', role: 'Forensic Accountant', status: 'active' },
  { id: 'TM-005', name: 'John Fischer', email: 'john.fischer@chronosintel.com', role: 'Legal Counsel', status: 'active' },
  { id: 'TM-006', name: 'Alex Thompson', email: 'alex.thompson@chronosintel.com', role: 'SOC Analyst', status: 'invited' },
  { id: 'TM-007', name: 'Priya Sharma', email: 'priya.sharma@chronosintel.com', role: 'Data Analyst', status: 'inactive' },
];

const mockNotificationPreferences: NotificationPreferences = {
  emailAlerts: true,
  weeklyDigest: true,
  caseUpdates: true,
  reportReady: true,
};

export async function fetchUserProfile(): Promise<UserProfile> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockUserProfile;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockTeamMembers;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockNotificationPreferences;
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<NotificationPreferences> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return prefs;
}
