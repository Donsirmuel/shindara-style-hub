const productImageMap = import.meta.glob('../assets/products/*', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/**
 * Resolves product image identifiers to build-safe URLs across local and GitHub Pages deployments.
 */
export function resolveImageUrl(imagePath: string | undefined): string {
  if (!imagePath) {
    return '';
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith('/')) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return `${base}/${imagePath.replace(/^\//, '')}`;
  }

  const normalized = imagePath.replace(/^products\//, '');
  const directMatch = productImageMap[`../assets/products/${normalized}`];

  if (directMatch) {
    return directMatch;
  }

  const fallbackMatch = Object.entries(productImageMap).find(([key]) => key.endsWith(normalized));
  if (fallbackMatch) {
    return fallbackMatch[1];
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/${imagePath.replace(/^\//, '')}`;
}
