export const COLLABORATOR_COLORS = [
  "#E85D75",
  "#4B9CF5",
  "#F5A623",
  "#7ED321",
  "#9B59B6",
  "#1ABC9C",
  "#E67E22",
  "#2ECC71",
  "#F1C40F",
  "#3498DB",
];

const COLOR_COUNT = COLLABORATOR_COLORS.length;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUserColor(userId: string): string {
  return COLLABORATOR_COLORS[hashString(userId) % COLOR_COUNT];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatLastActive(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1m ago";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
