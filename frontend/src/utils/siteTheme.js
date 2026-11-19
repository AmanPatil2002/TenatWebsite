export const buildSiteTheme = (background, color, themeResponse) => {
  const config =
    themeResponse?.effectiveTheme ??
    (themeResponse?.activeTheme === "custom"
      ? themeResponse.customTheme
      : null) ??
    themeResponse?.defaultTheme ??
    themeResponse?.config ??
    themeResponse;
  const resolvedBackground =
    config?.background || config?.backgroundColor || background;
  const resolvedColor = config?.color || config?.textColor || color;
  const primaryColor = config?.primaryColor || resolvedColor;
  const headerBackground =
    config?.headerBackground ||
    config?.headerBg ||
    `color-mix(in srgb, ${resolvedColor} 6%, ${resolvedBackground})`;
  const footerBackground =
    config?.footerBackground ||
    config?.footerBg ||
    `color-mix(in srgb, ${resolvedColor} 10%, ${resolvedBackground})`;

  return {
    background: resolvedBackground,
    color: resolvedColor,
    textColor: resolvedColor,
    primaryColor,
    secondaryColor: config?.secondaryColor || primaryColor,
    headerBg: headerBackground,
    headerBackground,
    footerBg: footerBackground,
    footerBackground,
    buttonBackground: config?.buttonBackground || primaryColor,
    buttonTextColor: config?.buttonTextColor || resolvedBackground,
    fontFamily: config?.fontFamily,
    borderRadius: config?.borderRadius,
    border: `color-mix(in srgb, ${resolvedColor} 18%, transparent)`,
    muted: `color-mix(in srgb, ${resolvedColor} 70%, transparent)`,
    hover: `color-mix(in srgb, ${resolvedColor} 12%, transparent)`,
  };
};
