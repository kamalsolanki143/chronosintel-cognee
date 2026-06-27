const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDate(date: string): string {
  const d = new Date(date);
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  if (diffWeek < 5) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
  return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-green-500 bg-green-500/10',
    closed: 'text-gray-400 bg-gray-400/10',
    pending: 'text-yellow-500 bg-yellow-500/10',
    archived: 'text-blue-400 bg-blue-400/10',
  };
  return colors[status] || 'text-gray-400 bg-gray-400/10';
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'text-red-500 bg-red-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    low: 'text-green-500 bg-green-500/10',
  };
  return colors[severity] || 'text-gray-400 bg-gray-400/10';
}

export function getEntityColor(type: string): string {
  const colors: Record<string, string> = {
    person: 'text-blue-400 bg-blue-400/10',
    organization: 'text-purple-400 bg-purple-400/10',
    location: 'text-green-400 bg-green-400/10',
    event: 'text-orange-400 bg-orange-400/10',
    document: 'text-yellow-400 bg-yellow-400/10',
    system: 'text-cyan-400 bg-cyan-400/10',
    timestamp: 'text-pink-400 bg-pink-400/10',
  };
  return colors[type] || 'text-gray-400 bg-gray-400/10';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trimEnd() + '...';
}
