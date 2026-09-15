/**
 * Resolve a static asset path that is safe under any hosting base path
 * (GitHub Pages project site, Vercel root, Docker, local dev).
 * Use this instead of hardcoding a leading-slash path like "/images/…".
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}