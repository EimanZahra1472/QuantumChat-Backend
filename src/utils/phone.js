/**
 * Normalize phone for storage / lookup.
 * Keeps a leading +, strips other non-digits.
 */
export function normalizePhone(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return hasPlus ? `+${digits}` : digits;
}

export function phoneLookupVariants(raw) {
  const norm = normalizePhone(raw);
  if (!norm) return [];
  const variants = new Set([norm]);
  if (norm.startsWith('+')) variants.add(norm.slice(1));
  else variants.add(`+${norm}`);
  return [...variants];
}

export function isEmailLike(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());
}
