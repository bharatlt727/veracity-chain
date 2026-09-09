export type Classification =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "HIGHLY_CONFIDENTIAL"
  | "RESTRICTED_EVIDENCE";

export const CLASSIFICATIONS: Classification[] = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "HIGHLY_CONFIDENTIAL",
  "RESTRICTED_EVIDENCE",
];

export const classificationLevel = (c: Classification): number =>
  CLASSIFICATIONS.indexOf(c) + 1;

export const classificationLabel = (c: Classification): string =>
  c.replace(/_/g, " ");

export const classificationTone = (
  c: Classification,
): "muted" | "accent" | "warning" | "destructive" => {
  switch (c) {
    case "PUBLIC":
    case "INTERNAL":
      return "muted";
    case "CONFIDENTIAL":
      return "accent";
    case "HIGHLY_CONFIDENTIAL":
      return "warning";
    default:
      return "destructive";
  }
};

export const CLEARANCE_LABELS: Record<number, string> = {
  1: "L1 — Public",
  2: "L2 — Internal",
  3: "L3 — Confidential",
  4: "L4 — Highly Confidential",
  5: "L5 — Restricted Evidence",
};

/** SHA-256 fingerprint of a file, computed in the browser before upload. */
export async function sha256OfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256OfText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const shortHash = (hash: string): string =>
  `${hash.slice(0, 4).toUpperCase()}…${hash.slice(-4).toUpperCase()}`;

/* ---- session assurance (three completed authentication levels) ---- */

const KEY = "nexus.assurance";

export type Assurance = { level: number; at: number };

const SESSION_MAX_MS = 30 * 60 * 1000;

export function setAssurance(level: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify({ level, at: Date.now() }));
}

export function getAssurance(): Assurance | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Assurance;
    if (Date.now() - parsed.at > SESSION_MAX_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAssurance() {
  if (typeof window !== "undefined") sessionStorage.removeItem(KEY);
}

export function touchAssurance() {
  const a = getAssurance();
  if (a) setAssurance(a.level);
}

/* ---- passkey (WebAuthn) helpers ---- */

export const passkeySupported = () =>
  typeof window !== "undefined" && !!window.PublicKeyCredential;

const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const b64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export async function registerPasskey(userId: string, displayName: string) {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: rand(32),
      rp: { name: "NEXUS Evidence Platform" },
      user: { id: new TextEncoder().encode(userId), name: displayName, displayName },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: { userVerification: "preferred" },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Passkey registration cancelled");
  return b64(cred.rawId);
}

export async function verifyPasskey(credentialId?: string) {
  const idBytes = credentialId
    ? Uint8Array.from(
        atob(credentialId.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      )
    : undefined;
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: rand(32),
      timeout: 60000,
      userVerification: "preferred",
      ...(idBytes ? { allowCredentials: [{ type: "public-key", id: idBytes }] } : {}),
    },
  })) as PublicKeyCredential | null;
  if (!assertion) throw new Error("Passkey verification cancelled");
  return b64(assertion.rawId);
}

export function deviceLabel() {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : "Linux";
  const browser = /Edg/.test(ua)
    ? "Edge"
    : /Chrome/.test(ua)
      ? "Chrome"
      : /Safari/.test(ua)
        ? "Safari"
        : /Firefox/.test(ua)
          ? "Firefox"
          : "Browser";
  return `${browser} on ${os}`;
}
