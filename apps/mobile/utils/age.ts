// Профіль зберігає дату народження (birth_date), щоб вік не «протухав» із часом.
// UI працює з Date на формах і з 'YYYY-MM-DD' рядком на межі API; вік — лише derivation для відображення.

export const MIN_BIRTH_AGE_YEARS = 13;
export const MAX_BIRTH_AGE_YEARS = 120;

// Межі діапазону, у якому дозволено обирати дату народження.
// max — найпізніша дозволена дата (народився не раніше за `today - 13y`).
// min — найраніша дозволена дата (`today - 120y`).
export function getBirthDateBounds(now: Date = new Date()): { min: Date; max: Date } {
  const max = new Date(now.getFullYear() - MIN_BIRTH_AGE_YEARS, now.getMonth(), now.getDate());
  const min = new Date(now.getFullYear() - MAX_BIRTH_AGE_YEARS, now.getMonth(), now.getDate());
  return { min, max };
}

// Вік у повних роках із ISO-дати народження.
export function birthDateToAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const dob = parseBirthDate(birthDate);
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// Серіалізація для payload: бере локальні рік/місяць/день, щоб UTC-офсет
// не зсунув дату на день назад при .toISOString().
export function toBirthDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 'YYYY-MM-DD' з API → Date опівдні локально, щоб рендер у DatePicker
// не з'їдав один день при від'ємному часовому поясі.
export function parseBirthDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}
