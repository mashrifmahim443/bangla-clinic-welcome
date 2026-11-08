import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { smsProviderParameters, smsProviderStatus } from "./sms-send";
import { normalizeVerificationPhone } from "./phone-verification";

async function digest(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, "0")).join("");
}

export const sendPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ phone: z.string().transform(normalizeVerificationPhone).pipe(z.string().regex(/^01[3-9]\d{8}$/)) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: auth, error } = await context.supabase.auth.getUser();
    if (error || !auth.user?.email_confirmed_at) return { status: "email_required" };
    const key = process.env["AUTOMAS_SMS_API_KEY"];
    if (!key) return { status: "not_configured" };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await db.from("sms_settings").select("sender_id").eq("id", "automas").maybeSingle();
    if (!settings?.sender_id) return { status: "not_configured" };
    const challenge = crypto.randomUUID();
    // Rejection sampling avoids modulo bias in six-digit codes.
    const random = new Uint32Array(1);
    do { crypto.getRandomValues(random); } while ((random[0] ?? 0) >= 4294000000);
    const code = String((random[0] ?? 0) % 1000000).padStart(6, "0");
    const hash = await digest(`${key}:${context.userId}:${challenge}:${code}`);
    const ipHash = await digest(`${key}:${getRequestHeader("cf-connecting-ip") ?? "unknown"}`);
    const { data: claim, error: claimError } = await db.rpc("claim_phone_verification", { _user: context.userId, _phone: data.phone, _hash: hash, _challenge: challenge, _ip_hash: ipHash });
    if (claimError) return { status: "unavailable" };
    if (claim !== "claimed") return { status: claim ?? "unavailable" };
    try {
      const response = await fetch("https://api.automas.com.bd/smsapiv3", { method: "POST", redirect: "manual", signal: AbortSignal.timeout(30000), body: smsProviderParameters(data.phone, `DiabeCare: আপনার ফোন যাচাইয়ের কোড ${code}। ৫ মিনিটের মধ্যে লিখুন। কোড কাউকে দেবেন না।`, settings.sender_id, key) });
      const payload: unknown = await response.json().catch(() => null);
      return { status: response.ok && smsProviderStatus(payload) === 0 ? "sent" : "send_failed" };
    } catch { return { status: "unknown" }; }
  });

export const verifyPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env["AUTOMAS_SMS_API_KEY"];
    if (!key) return { status: "not_configured" };
    const { data: auth } = await context.supabase.auth.getUser();
    if (!auth.user?.email_confirmed_at) return { status: "email_required" };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: challenge } = await db.from("phone_verification_challenges").select("challenge_id").eq("user_id", context.userId).maybeSingle();
    if (!challenge) return { status: "invalid" };
    const hash = await digest(`${key}:${context.userId}:${challenge.challenge_id}:${data.code}`);
    const { data: result, error } = await db.rpc("consume_phone_verification", { _user: context.userId, _hash: hash, _challenge: challenge.challenge_id });
    return { status: error ? "unavailable" : result ?? "invalid" };
  });