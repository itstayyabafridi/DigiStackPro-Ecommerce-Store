// Safe to use in Proxy and server modules. Never expose environment values in UI errors.
function configuredUrl(value: string | undefined, protocols: string[]) {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol)) return false;
    const placeholder = /^(PROJECT(?:-REF)?|POOLER|PASSWORD)$/i;
    return (
      !placeholder.test(url.hostname) &&
      !/^PROJECT(?:-REF)?\.supabase\.co$/i.test(url.hostname) &&
      !placeholder.test(decodeURIComponent(url.password))
    );
  } catch {
    return false;
  }
}
export function databaseConfigured() {
  return configuredUrl(process.env.DATABASE_URL, ["postgres:", "postgresql:"]);
}
export function authConfigured() {
  return (
    configuredUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, ["http:", "https:"]) &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}
