// Public, non-secret addresses of outside services. Keys never go here (site_content is publicly readable).
export type Integrations = {
  jitsi_base: string; bmdc_verify: string; whatsapp_base: string;
  payment_provider: string; payment_base: string; payment_merchant: string;
  email_sender: string; email_provider: string;
};
export const INTEGRATIONS_KEY = "integrations";
export const defaultIntegrations: Integrations = {
  jitsi_base: "https://meet.jit.si", bmdc_verify: "https://verify.bmdc.org.bd/", whatsapp_base: "https://wa.me",
  payment_provider: "", payment_base: "", payment_merchant: "", email_sender: "", email_provider: "",
};
export function withDefaults(saved: Partial<Integrations> | null | undefined): Integrations {
  const out = { ...defaultIntegrations };
  for (const k of Object.keys(out) as (keyof Integrations)[]) { const v = saved?.[k]; if (typeof v === "string" && v.trim()) out[k] = v.trim(); }
  return out;
}
export function integrationUrlError(v: string) {
  if (!v.trim()) return false;
  try { return new URL(v).protocol !== "https:"; } catch { return true; }
}
export const joinUrl = (base: string, path: string) => base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
