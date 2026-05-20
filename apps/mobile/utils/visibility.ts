import { VisibilityType } from '@athlo/shared';

export const VISIBILITY_ICONS = {
  private: '🔒',
  public: '🌐',
  friends: '👥',
} as const;

export const VISIBILITY_LABELS: Record<number, string> = {
  1: `${VISIBILITY_ICONS.private} Private`,
  2: `${VISIBILITY_ICONS.public} Public`,
  3: `${VISIBILITY_ICONS.friends} Friends Only`,
};

export const VISIBILITY_ENUM_TO_ID: Record<VisibilityType, number> = {
  [VisibilityType.PRIVATE]: 1,
  [VisibilityType.PUBLIC]: 2,
  [VisibilityType.FRIENDS_ONLY]: 3,
};

export interface VisibilityOption {
  value: VisibilityType;
  label: string;
  icon: string;
}

export const VISIBILITY_OPTIONS: readonly VisibilityOption[] = [
  { value: VisibilityType.PUBLIC, label: 'Public', icon: VISIBILITY_ICONS.public },
  { value: VisibilityType.FRIENDS_ONLY, label: 'Friends', icon: VISIBILITY_ICONS.friends },
  { value: VisibilityType.PRIVATE, label: 'Private', icon: VISIBILITY_ICONS.private },
] as const;

export function getVisibilityLabel(id: number): string {
  return VISIBILITY_LABELS[id] ?? VISIBILITY_LABELS[1];
}

export function getVisibilityIcon(id: number): string {
  if (id === 2) return VISIBILITY_ICONS.public;
  if (id === 3) return VISIBILITY_ICONS.friends;
  return VISIBILITY_ICONS.private;
}
