export const ICONS = {
  delete: '🗑️',
  edit: '✏️',
  close: '✕',
  checkInline: '✓',
  checkBadge: '✅',
  trophy: '🏆',
  volume: '🏋️',
  reps: '🔄',
  time: '⏱️',
  nutrition: '🍎',
  workout: '🏋️',
  profile: '👤',
  history: '📊',
  mealPlans: '📋',
  metrics: '📈',
  calendar: '📅',
  water: '💧',
} as const;

export interface FeelingOption {
  value: number;
  emoji: string;
  label: string;
}

export const FEELING_OPTIONS: readonly FeelingOption[] = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😐', label: 'Bad' },
  { value: 3, emoji: '😊', label: 'OK' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
] as const;
