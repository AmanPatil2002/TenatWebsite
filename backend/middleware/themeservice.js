// services/siteTheme.service.js
const DEFAULT_THEME_KEYS = ['color', 'background', 'sliderHeight', 'sliderWidth'];

/**
 * The defaultTheme JSON is stored as { color, background } (mirrors the `theme` row).
 * A custom theme may only override keys that exist in the default theme.
 * This prevents clients from injecting arbitrary CSS / XSS payloads.
 */
function validateCustomTheme(customTheme, defaultTheme) {
  if (customTheme === null || typeof customTheme !== 'object' || Array.isArray(customTheme)) {
    return { ok: false, message: 'customTheme must be a JSON object' };
  }

  const allowedKeys = Object.keys(defaultTheme || {});
  const providedKeys = Object.keys(customTheme);

  const unknown = providedKeys.filter((k) => !allowedKeys.includes(k));
  if (unknown.length) {
    return {
      ok: false,
      message: `Unknown theme key(s): ${unknown.join(', ')}. Allowed: ${allowedKeys.join(', ')}`,
    };
  }

  // Each value must be a short string (colors, gradients, urls)
  for (const [key, value] of Object.entries(customTheme)) {
    if (typeof value !== 'string') {
      return { ok: false, message: `Theme key "${key}" must be a string` };
    }
    if (value.length > 500) {
      return { ok: false, message: `Theme key "${key}" exceeds 500 characters` };
    }
    // Reject obvious script injection attempts in CSS values
    if (/[<>]|javascript:/i.test(value)) {
      return { ok: false, message: `Theme key "${key}" contains invalid characters` };
    }
  }

  return { ok: true };
}

module.exports = { validateCustomTheme, DEFAULT_THEME_KEYS };