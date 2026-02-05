import type { Language } from '@/stores/language.store';

export function getLocale(language: Language): string {
  return language === 'vi' ? 'vi-VN' : 'en-US';
}

export function formatTime(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLong(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(getLocale(language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatDateShort(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(getLocale(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(getLocale(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = formatTime(d, language);

  if (isToday) {
    return language === 'vi' ? `Hôm nay, ${time}` : `Today, ${time}`;
  }
  if (isYesterday) {
    return language === 'vi' ? `Hôm qua, ${time}` : `Yesterday, ${time}`;
  }
  return formatDateShort(d, language);
}

export function formatMonth(date: Date | string, language: Language): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(getLocale(language), { month: 'short' });
}

export function formatDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDate().toString();
}

export function formatAdminDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatAdminDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA');
}

export function formatAdminTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
