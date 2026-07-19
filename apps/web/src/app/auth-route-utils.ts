export function getSafeReturnTo(value: string | null): string {
  if (!value) {
    return "/account";
  }

  // Only allow internal paths to prevent open redirects.
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }

  return value;
}

export function getQueryToken(value: string | null): string {
  return value || "";
}