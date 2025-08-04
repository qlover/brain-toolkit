/**
 *
 * @param {Parameters<import('tsup').Options['outExtension']>[0]} ctx
 * @param {import('tsup').NormalizedOptions} ctx.options
 * @param {import('tsup').Format} ctx.format
 * @param {string} ctx.pkgType
 * @returns {ReturnType<import('tsup').Options['outExtension']>}
 */
export function outExtension({ options, format, pkgType }) {
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
 * @param {import('tsup').NormalizedOptions} ctx.options
 * @param {import('tsup').Format} ctx.format
 * @param {string} ctx.pkgType
 * @returns {ReturnType<import('tsup').Options['outExtension']>}
 */
export function outExtensionMini({ options, format, pkgType }) {
  if (format === 'iife') {
    return { js: '.min.iife.js' };
  }

  if (format === 'esm') {
    return { js: '.js' };
  }

  return { js: '.min.cjs' };
}
