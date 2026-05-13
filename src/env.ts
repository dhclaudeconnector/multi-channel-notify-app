import 'dotenv/config';

export function env(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value === null ? fallback : value.trim();
}

export function boolEnv(name: string, fallback = false): boolean {
  const value = env(name);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

export function requireAll(names: string[]): boolean {
  return names.every((name) => env(name).length > 0);
}

export function missingEnv(names: string[]): string[] {
  return names.filter((name) => env(name).length === 0);
}
