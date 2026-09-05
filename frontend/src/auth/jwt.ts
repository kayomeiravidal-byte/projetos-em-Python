export interface JwtClaims {
  sub: number;
  orgId: number;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function decodeClaims(token: string): JwtClaims | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(base64UrlDecode(payload)) as JwtClaims;
  } catch {
    return null;
  }
}
