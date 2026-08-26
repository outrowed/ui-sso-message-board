function booleanEnvironment(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be either "true" or "false"`);
}

const pmbProfilesEnabled = booleanEnvironment("PMB_PROFILES_ENABLED", false);
const pmbApiToken = process.env.PMB_API_TOKEN;
if (pmbProfilesEnabled && !pmbApiToken) {
  throw new Error("PMB_API_TOKEN is required when PMB_PROFILES_ENABLED=true");
}

export const config = {
  cookieSecure: booleanEnvironment("COOKIE_SECURE", process.env.NODE_ENV === "production"),
  pmbProfilesEnabled,
  pmbApiToken: pmbApiToken || "",
  pmbApiBaseUrl: process.env.PMB_API_BASE_URL || "https://api.pmb.cs.ui.ac.id",
};
