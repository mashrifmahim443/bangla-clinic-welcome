import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { smsProviderParameters, smsProviderStatus, validSmsRecipient } from "./sms-send";
import { smsDeliveryState } from "./sms-history";

export const sendCustomSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { recipient: string; message: string; requestId: string }) => {
    if (!validSmsRecipient(input.recipient)) throw new Error("Invalid recipient");
    if (!input.message.trim() || input.message.trim().length > 1000) throw new Error("Invalid message");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)) throw new Error("Invalid request ID");
    return { ...input, recipient: input.recipient.trim(), message: input.message.trim() };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !isAdmin) throw new Error("Forbidden");
    const key = process.env["AUTOMAS_SMS_API_KEY"];
    if (!key) return { status: "not_configured", providerStatus: null, httpStatus: null };
    const { data: settings, error: settingsError } = await context.supabase.from("sms_settings").select("sender_id").eq("id", "automas").maybeSingle();
    if (settingsError || !settings?.sender_id) return { status: "not_configured", providerStatus: null, httpStatus: null };
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: entry, error: insertError } = await db.from("sms_history").insert({
      request_id: data.requestId, sent_by: context.userId, recipient: data.recipient,
      message_text: data.message, delivery_status: "pending",
    }).select("id").single();
    if (insertError || !entry) {
      if (insertError?.code === "23505") return { status: "already_submitted", providerStatus: null, httpStatus: null };
      return { status: "history_error", providerStatus: null, httpStatus: null };
    }
    const sentAt = new Date().toISOString();
    const { error: timestampError } = await db.from("sms_history").update({ sent_at: sentAt }).eq("id", entry.id);
    if (timestampError) return { status: "history_error", providerStatus: null, httpStatus: null };
    let httpStatus: number | null = null;
    let providerStatus: number | null = null;
    try {
      const response = await fetch("https://api.automas.com.bd/smsapiv3", {
        method: "POST", body: smsProviderParameters(data.recipient, data.message, settings.sender_id, key),
        redirect: "manual", signal: AbortSignal.timeout(30000),
      });
      httpStatus = response.status;
      const payload: unknown = await response.json().catch(() => null);
      providerStatus = smsProviderStatus(payload);
      if (!response.ok) console.error("SMS provider HTTP failure", httpStatus, "code", providerStatus);
    } catch {
      // Never log request/response bodies or thrown fetch errors containing credentials.
      console.error("SMS request result unavailable");
    }
    const delivery = httpStatus !== null && (httpStatus < 200 || httpStatus >= 300) ? "failed" : smsDeliveryState(providerStatus);
    const { error: logError } = await db.from("sms_history").update({ http_status: httpStatus, provider_status: providerStatus,
      delivery_status: delivery, delivery_source: "none", delivery_updated_at: new Date().toISOString() }).eq("id", entry.id);
    return { status: logError ? "history_update_error" : delivery, providerStatus, httpStatus };
  });