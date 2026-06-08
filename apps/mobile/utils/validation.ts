type Rule = (value: string) => string | null;

export const required = (label: string): Rule => (v) =>
  v.trim() ? null : `${label} is required`;

export const minLength = (label: string, min: number): Rule => (v) =>
  v.trim().length >= min ? null : `${label} must be at least ${min} characters`;

export const isEmail = (): Rule => (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Please enter a valid email';

export const minNumber = (label: string, min: number): Rule => (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return `${label} must be a number`;
  return n >= min ? null : `${label} must be at least ${min}`;
};

export const maxNumber = (label: string, max: number): Rule => (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return `${label} must be a number`;
  return n <= max ? null : `${label} must be at most ${max}`;
};

export const positiveInteger = (label: string): Rule => (v) => {
  const n = parseInt(v, 10);
  if (isNaN(n)) return `${label} must be a number`;
  return n >= 1 ? null : `${label} must be at least 1`;
};

export const optionalMinNumber = (label: string, min: number): Rule => (v) => {
  if (!v.trim()) return null;
  const n = parseFloat(v);
  if (isNaN(n)) return `${label} must be a number`;
  return n >= min ? null : `${label} must be at least ${min}`;
};

export function validateFields(
  checks: Array<{ value: string; rules: Rule[] }>
): string | null {
  for (const { value, rules } of checks) {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
  }
  return null;
}

export function validateFieldsMap(
  checks: Array<{ key: string; value: string; rules: Rule[] }>
): Record<string, string> | null {
  const errors: Record<string, string> = {};
  for (const { key, value, rules } of checks) {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        errors[key] = error;
        break;
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}
