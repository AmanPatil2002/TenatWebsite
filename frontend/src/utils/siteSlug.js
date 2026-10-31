const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "site";

export const createSiteSlug = (site) => {
  let hash = 14695981039346656037n;
  for (const character of String(site.id)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(character.codePointAt(0))) * 1099511628211n);
  }
  return `${slugify(site.name)}-${hash.toString(36)}`;
};
