import { format } from 'date-fns';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'HH:mm:ss');
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'yyyy-MM-dd');
};

export const renderProgressBar = (current: number, total: number, width: number = 20): string => {
  if (total === 0) return `[${' '.repeat(width)}] 0%`;
  const percent = Math.min(1, Math.max(0, current / total));
  const filledChars = Math.round(width * percent);
  const emptyChars = width - filledChars;
  const bar = '▓'.repeat(filledChars) + '░'.repeat(emptyChars);
  return `[${bar}] ${Math.round(percent * 100)}%`;
};
