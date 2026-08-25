function booleanEnvironment(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be either "true" or "false"`);
}

export const config = {
  cookieSecure: booleanEnvironment("COOKIE_SECURE", process.env.NODE_ENV === "production"),
};
