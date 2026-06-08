/** sec → "M:SS" — for set durations and countdown timers */
export function formatSeconds(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/** ms → "HH:MM:SS" — for active-workout elapsed display */
export function formatHMS(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** sec → "90s" or "2m 30s" (for values > 120s) — for rest time display */
export function formatRestTime(sec: number): string {
  if (sec <= 120) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** sec → "1h 30m" or "45m" — for duration picker labels */
export function formatDurationSecs(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Date | string → locale "HH:MM" — for log timestamps */
export function formatClockTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/** "HH:mm:ss" | "HH:mm" → "HH:mm" — for plan time suggestions */
export function formatTimeSuggestion(time: string | null | undefined): string {
  if (!time) return '';
  if (time.includes(':')) {
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
  }
  return time;
}
