import crypto from "crypto";

export function sha256Json(obj: unknown) {
  const s = JSON.stringify(obj, Object.keys(obj as any).sort());
  return crypto.createHash("sha256").update(s).digest("hex");
}
