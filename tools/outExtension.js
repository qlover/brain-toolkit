/**
 *
 * @param {Parameters<import('tsup').Options['outExtension']>[0]} ctx
 * @param {import('tsup').Format} ctx.format
 * @returns {ReturnType<import('tsup').Options['outExtension']>}
 */
export function outExtension({ format }) {
  if (format === 'iife') {
    return { js: '.iife.js' };
  }

  if (format === 'esm') {
    return { js: '.js' };
  }

  return { js: '.cjs' };
}

/**
 *
 * @param {Parameters<import('tsup').Options['outExtension']>[0]} ctx
 * @param {import('tsup').Format} ctx.format
 * @returns {ReturnType<import('tsup').Options['outExtension']>}
 */
export function outExtensionMini({ format }) {
  if (format === 'iife') {
    return { js: '.min.iife.js' };
  }

  if (format === 'esm') {
    return { js: '.js' };
  }

  return { js: '.min.cjs' };
}
